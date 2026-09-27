import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  assignmentsTable,
  problemsTable,
  topicsTable,
  practiceAssignmentsTable,
  practiceAssignmentProblemsTable,
  practiceAssignmentAnswersTable,
  feedbackMessagesTable,
} from "@workspace/db";
import {
  GeneratePracticeAssignmentBody,
  GeneratePracticeAssignmentResponse,
  GetPracticeAssignmentResponse,
  ListPracticeAssignmentsResponseItem,
  SavePracticeAssignmentAnswerBody,
  SubmitPracticeAssignmentResponse,
  PostFeedbackMessageBody,
  PostFeedbackMessageResponse,
  GetFeedbackMessagesResponseItem,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { gradeAnswer } from "../lib/grading";
import { getUserId } from "../lib/userId";
import { recordTopicResult, logActivity } from "../lib/profile";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

// Collapses a prompt to a comparable key so we can deterministically reject any
// generated problem that duplicates a graded or prior-practice prompt.
function normalizePrompt(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9$+\-=/^().]/g, "")
    .trim();
}

type GeneratedProblem = {
  topicSlug: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  hint?: string;
};

function randomizedAlgebraProblem(topicTitle: string): GeneratedProblem {
  const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
  const topic = topicTitle.toLowerCase();

  if (/simplif|propert|distribut|like terms/.test(topic)) {
    const a = int(2, 7);
    const b = int(1, 6);
    const c = int(1, 8);
    return {
      topicSlug: "",
      prompt: `Simplify $${a}(${b}x+${c})-x$.`,
      correctAnswer: `${a * b - 1}x+${a * c}`,
      explanation: `Distribute and combine like terms: $${a}(${b}x+${c})-x=${a * b}x+${a * c}-x=${a * b - 1}x+${a * c}$.`,
      hint: "Distribute first, then combine the terms containing $x$.",
    };
  }
  if (/order of operations|^expressions?$|evaluat/.test(topic)) {
    const coefficient = int(2, 8);
    const value = int(2, 7);
    const constant = int(1, 9);
    return {
      topicSlug: "",
      prompt: `Evaluate $${coefficient}(${value}+${constant})-${value}$.`,
      correctAnswer: String(coefficient * (value + constant) - value),
      explanation: `Evaluate the parentheses first: $${coefficient}(${value + constant})-${value}=${coefficient * (value + constant)}-${value}=${coefficient * (value + constant) - value}$.`,
      hint: "Use the order of operations, starting inside the parentheses.",
    };
  }
  if (/real number|operation/.test(topic)) {
    const a = int(-12, 12);
    const b = int(2, 9);
    return {
      topicSlug: "",
      prompt: `Evaluate $${a}-(-${b})$.`,
      correctAnswer: String(a + b),
      explanation: `Subtracting a negative is adding: $${a}-(-${b})=${a}+${b}=${a + b}$.`,
      hint: "Rewrite subtraction of a negative as addition.",
    };
  }
  if (/inequalit/.test(topic)) {
    const a = int(2, 6);
    const solution = int(-6, 6);
    const constant = a * solution;
    return {
      topicSlug: "",
      prompt: `Solve $${a}x < ${constant}$.`,
      correctAnswer: `x < ${solution}`,
      explanation: `Divide both sides by the positive number ${a}: $x<${solution}$.`,
      hint: "Isolate $x$; the inequality direction stays the same when dividing by a positive number.",
    };
  }
  if (/ratio|proportion|percent/.test(topic)) {
    const percent = int(10, 50);
    const whole = int(2, 9) * 10;
    return {
      topicSlug: "",
      prompt: `Find ${percent}% of ${whole}.`,
      correctAnswer: String((percent * whole) / 100),
      explanation: `${percent}% is ${percent}/100, so $(${percent}/100)(${whole})=${(percent * whole) / 100}$.`,
      hint: "Convert the percent to a decimal or fraction and multiply by the whole.",
    };
  }
  if (/literal equation|formula/.test(topic)) {
    return {
      topicSlug: "",
      prompt: `Solve $d=rt$ for $t$.`,
      correctAnswer: "t=d/r",
      explanation: `Divide both sides by $r$ (assuming $r\\ne0$): $t=d/r$.`,
      hint: "Undo multiplication by $r$ by dividing both sides by $r$.",
    };
  }
  if (/systems? of linear inequalit/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "For the system $y>x-1$ and $y<5-x$, is $(0,2)$ a solution?",
      correctAnswer: "Yes",
      explanation: "The point satisfies both inequalities: $2>0-1$ and $2<5-0$, so it is in the overlap.",
      hint: "Test the point in both inequalities; it must satisfy both to be in the solution region.",
    };
  }
  if (/absolute|compound/.test(topic)) {
    const center = int(-5, 5);
    const radius = int(2, 6);
    const distanceExpression = center < 0 ? `x+${-center}` : `x-${center}`;
    return {
      topicSlug: "",
      prompt: `Solve $|${distanceExpression}|\\le ${radius}$.`,
      correctAnswer: `${center - radius} \\le x \\le ${center + radius}`,
      explanation: `A distance of at most ${radius} from ${center} means $${center}-${radius}\\le x\\le${center}+${radius}$, or $${center - radius}\\le x\\le${center + radius}$.`,
      hint: "Rewrite the absolute value inequality as a compound inequality around its center.",
    };
  }
  if (/function|relation|domain/.test(topic) && !/linear|slope|graph/.test(topic)) {
    const a = int(2, 7);
    const b = int(-8, 8);
    const x = int(-5, 5);
    return {
      topicSlug: "",
      prompt: `If $f(x)=${a}x${b < 0 ? b : `+${b}`} $, find $f(${x})$.`,
      correctAnswer: String(a * x + b),
      explanation: `Substitute ${x} for $x$: $f(${x})=${a}(${x})${b < 0 ? b : `+${b}`}=${a * x + b}$.`,
      hint: "Substitute the input everywhere the variable appears.",
    };
  }
  if (/slope|linear|graph|rate of change|line/.test(topic)) {
    const x1 = int(-4, 2);
    const run = int(2, 5);
    const slope = int(-4, 4) || 2;
    const y1 = int(-5, 5);
    return {
      topicSlug: "",
      prompt: `Find the slope of the line through $(${x1},${y1})$ and $(${x1 + run},${y1 + slope * run})$.`,
      correctAnswer: String(slope),
      explanation: `Use rise over run: $m=(${y1 + slope * run}-${y1})/(${x1 + run}-${x1})=${slope * run}/${run}=${slope}$.`,
      hint: "Calculate the change in $y$ divided by the change in $x$.",
    };
  }
  if (/system/.test(topic)) {
    const x = int(-4, 5);
    const y = int(-4, 5);
    if (/graph/.test(topic)) {
      return {
        topicSlug: "",
        prompt: `Find the intersection of $y=2x+1$ and $y=-x+7$.`,
        correctAnswer: "(2,5)",
        explanation: `Set the equations equal: $2x+1=-x+7$, so $x=2$ and then $y=5$. The intersection is $(2,5)$.`,
        hint: "At the intersection, both equations have the same $y$-value.",
      };
    }
    const a = int(2, 5);
    const b = int(2, 5);
    return {
      topicSlug: "",
      prompt: `Solve the system $x+y=${x + y}$ and $${a}x-${b}y=${a * x - b * y}$.`,
      correctAnswer: `x=${x}, y=${y}`,
      explanation: `The values $x=${x}$ and $y=${y}$ satisfy both equations, so the solution is $(${x},${y})$.`,
      hint: "Use substitution or elimination, then check the ordered pair in both equations.",
    };
  }
  if (/quadratic.*graph|graph.*quadratic/.test(topic)) {
    const h = int(-4, 4);
    const k = int(-5, 5);
    const vertexExpression = h < 0 ? `x+${-h}` : `x-${h}`;
    return {
      topicSlug: "",
      prompt: `State the vertex of $y=(${vertexExpression})^2+${k}$.`,
      correctAnswer: `(${h}, ${k})`,
      explanation: `Vertex form is $y=(x-h)^2+k$, so the vertex is $(${h},${k})$.`,
      hint: "Read $(h,k)$ directly from vertex form.",
    };
  }
  if (/scientific notation/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Write 4,500,000 in scientific notation.",
      correctAnswer: "4.5×10^6",
      explanation: "Move the decimal six places left to get a number from 1 to 10: $4.5\\times10^6$.",
      hint: "Move the decimal point until the leading number is at least 1 and less than 10.",
    };
  }
  if (/exponent|exponential/.test(topic)) {
    const base = int(2, 5);
    const m = int(2, 5);
    const n = int(1, 4);
    return {
      topicSlug: "",
      prompt: `Simplify $${base}^{${m}}\\cdot${base}^{${n}}$.`,
      correctAnswer: `${base}^${m + n}`,
      explanation: `When multiplying powers with the same base, add exponents: $${base}^{${m}}\\cdot${base}^{${n}}=${base}^{${m + n}}$.`,
      hint: "For equal bases, add the exponents.",
    };
  }
  if (/polynomial|special product/.test(topic)) {
    if (/special product/.test(topic)) {
      const a = int(2, 7);
      return {
        topicSlug: "",
        prompt: `Expand $(x+${a})^2$.`,
        correctAnswer: `x^2+${2 * a}x+${a * a}`,
        explanation: `Use $(x+a)^2=x^2+2ax+a^2$: $(x+${a})^2=x^2+${2 * a}x+${a * a}$.`,
        hint: "Use the square-of-a-sum pattern, including its middle term.",
      };
    }
    const a = int(2, 6);
    const b = int(1, 6);
    const middle = a - b;
    return {
      topicSlug: "",
      prompt: `Expand $(x+${a})(x-${b})$.`,
      correctAnswer: `x^2${middle < 0 ? middle : `+${middle}`}x-${a * b}`,
      explanation: `Multiply each term: $(x+${a})(x-${b})=x^2-${b}x+${a}x-${a * b}=x^2${middle < 0 ? middle : `+${middle}`}x-${a * b}$.`,
      hint: "Use distribution (or FOIL), then combine like terms.",
    };
  }
  if (/completing the square|quadratic formula/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Solve $x^2-5x+6=0$ using the quadratic formula.",
      correctAnswer: "x=2 or x=3",
      explanation: `Here $a=1$, $b=-5$, and $c=6$. The formula gives $x=(5\\pm\\sqrt{25-24})/2$, so $x=3$ or $x=2$.`,
      hint: "Identify $a$, $b$, and $c$, then substitute them into the quadratic formula.",
    };
  }
  if (/factoring: gcf|factoring gcf|grouping/.test(topic)) {
    const a = int(2, 7);
    const b = int(1, 6);
    return {
      topicSlug: "",
      prompt: `Factor $${a}x^2+${a * b}x$.`,
      correctAnswer: `${a}x(x+${b})`,
      explanation: `The greatest common factor is $${a}x$, so $${a}x^2+${a * b}x=${a}x(x+${b})$.`,
      hint: "Factor out the greatest common factor shared by every term.",
    };
  }
  if (/factor|quadratic|zero|root/.test(topic)) {
    const a = int(2, 7);
    const b = int(1, 7);
    const middle = a - b;
    return {
      topicSlug: "",
      prompt: `Solve $x^2${middle < 0 ? middle : `+${middle}`}x-${a * b}=0$ by factoring.`,
      correctAnswer: `-${a}, ${b}`,
      explanation: `Factor as $(x+${a})(x-${b})=0$. The zero-product property gives $x=-${a}$ or $x=${b}$.`,
      hint: "Find two numbers whose product is the constant term and whose sum is the coefficient of $x$.",
    };
  }
  if (/radical|pythagorean/.test(topic)) {
    const n = int(2, 8);
    if (/pythagorean/.test(topic)) {
      return {
        topicSlug: "",
        prompt: `A right triangle has legs ${n} and ${n + 1}. Find the hypotenuse.`,
        correctAnswer: `\\sqrt{${n * n + (n + 1) * (n + 1)}}`,
        explanation: `By the Pythagorean theorem, $c^2=${n}^2+${n + 1}^2=${n * n + (n + 1) * (n + 1)}$, so $c=\\sqrt{${n * n + (n + 1) * (n + 1)}}$.`,
        hint: "Use $a^2+b^2=c^2$ and take the positive square root.",
      };
    }
    return {
      topicSlug: "",
      prompt: `Simplify $\\sqrt{${n * n * 2}}$.`,
      correctAnswer: `${n}\\sqrt{2}`,
      explanation: `$\\sqrt{${n * n * 2}}=\\sqrt{${n * n}\\cdot2}=${n}\\sqrt2$.`,
      hint: "Factor out the greatest perfect-square factor.",
    };
  }
  if (/rational expression/.test(topic)) {
    const a = int(2, 8);
    return {
      topicSlug: "",
      prompt: `For $\\frac{x+${a}}{x-${a}}$, state the value excluded from the domain.`,
      correctAnswer: String(a),
      explanation: `The denominator is zero when $x-${a}=0$, so $x=${a}$ is excluded.`,
      hint: "Set the denominator equal to zero.",
    };
  }
  if (/slope-intercept/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Write the equation of a line with slope 3 and $y$-intercept $-2$.",
      correctAnswer: "y=3x-2",
      explanation: "Slope-intercept form is $y=mx+b$. Substitute $m=3$ and $b=-2$ to get $y=3x-2$.",
      hint: "Use $y=mx+b$ and identify the given slope and intercept.",
    };
  }
  if (/point-slope/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Write the line with slope 2 through $(1,4)$ in point-slope form.",
      correctAnswer: "y-4=2(x-1)",
      explanation: "Use $y-y_1=m(x-x_1)$ with $m=2$ and $(x_1,y_1)=(1,4)$.",
      hint: "Substitute the given slope and point into point-slope form.",
    };
  }
  if (/standard form/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Rewrite $y=2x+3$ in standard form $Ax+By=C$.",
      correctAnswer: "2x-y=-3",
      explanation: "Move the variable terms to one side: $2x-y=-3$.",
      hint: "Collect the variable terms on one side and the constant on the other.",
    };
  }
  if (/parallel|perpendicular/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "A line has slope 3. What is the slope of a line perpendicular to it?",
      correctAnswer: "-1/3",
      explanation: "Perpendicular nonvertical lines have slopes that are negative reciprocals, so the slope is $-1/3$.",
      hint: "Take the negative reciprocal of the given slope.",
    };
  }
  if (/linear model|scatter/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "A linear model is $y=4x+7$. What does its slope represent as $x$ increases by 1?",
      correctAnswer: "y increases by 4",
      explanation: "The slope is 4, so the model's output increases by 4 units for each 1-unit increase in input.",
      hint: "Interpret the slope as the change in output for a one-unit increase in input.",
    };
  }
  if (/equation/.test(topic)) {
    if (/multi-step/.test(topic)) {
      return {
        topicSlug: "",
        prompt: "Solve $3(2x-1)+4=25$.",
        correctAnswer: "x=4",
        explanation: `Distribute and combine: $6x+1=25$, so $6x=24$ and $x=4$.`,
        hint: "Distribute first, simplify, then isolate the variable.",
      };
    }
    const solution = int(-8, 8);
    const a = int(2, 7);
    const b = int(1, 9);
    return {
      topicSlug: "",
      prompt: `Solve $${a}x+${b}=${a * solution + b}$.`,
      correctAnswer: `x=${solution}`,
      explanation: `Subtract ${b} from both sides and divide by ${a}: $${a}x=${a * solution}$, so $x=${solution}$.`,
      hint: "Undo addition first, then undo multiplication.",
    };
  }
  if (/capstone/.test(topic)) {
    return {
      topicSlug: "",
      prompt: "Solve $3x-7=11$ and check the solution.",
      correctAnswer: "x=6",
      explanation: `Add 7 to both sides and divide by 3 to get $x=6$. Checking gives $3(6)-7=11$.`,
      hint: "Use inverse operations, then substitute your result into the original equation.",
    };
  }
  throw new Error(`Cannot generate an Algebra 1 fallback for topic "${topicTitle}".`);
}

// Builds a fresh practice version of a graded assignment. The generator is
// given the real graded prompts (to NEVER reproduce) and the user's prior
// practice prompts for this assignment (to avoid repeats), while mirroring the
// source's kind, topic mix, and problem count.
async function generateProblems(opts: {
  sourceTitle: string;
  kind: string;
  weekNumber: number;
  topics: Array<{ slug: string; title: string }>;
  gradedPrompts: string[];
  priorPrompts: string[];
  count: number;
}): Promise<GeneratedProblem[]> {
  const system = [
    "You are an Algebra 1 instructor authoring a FRESH practice version of a graded assignment.",
    "Produce brand-new problems that test the SAME concepts and difficulty as the graded set, but are clearly different problems (different numbers, scenarios, framing).",
    "CRITICAL RULES:",
    "1. NEVER reproduce, paraphrase, or trivially re-number any of the graded problems provided. They must not overlap.",
    "2. NEVER repeat any of the prior practice problems provided.",
    "3. Each problem must belong to exactly one of the allowed topics (use its slug).",
    "4. Like the graded set, answers should be concise mathematical expressions, values, intervals, roots, function properties, or identities. Some may be short numeric answers. Keep correctAnswer short, never multi-paragraph.",
    "5. Use $...$ for inline LaTeX in prompts/explanations where helpful.",
    "6. Provide a one-line hint that nudges without giving the answer away.",
    'Respond as strict JSON: {"problems": [{"topicSlug": string, "prompt": string, "correctAnswer": string, "explanation": string, "hint": string}]}.',
  ].join("\n");

  const user = JSON.stringify({
    assignment: opts.sourceTitle,
    kind: opts.kind,
    weekNumber: opts.weekNumber,
    problemCount: opts.count,
    allowedTopics: opts.topics,
    gradedProblemsDoNotReproduce: opts.gradedPrompts,
    priorPracticeProblemsDoNotRepeat: opts.priorPrompts,
  });

  const out = await chatJson<{ problems: GeneratedProblem[] }>(system, user);
  const problems = Array.isArray(out.problems) ? out.problems : [];
  return problems.slice(0, opts.count);
}

// POST /practice-assignments — generate a fresh practice version.
router.post("/practice-assignments", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = GeneratePracticeAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { sourceAssignmentId } = parsed.data;

  const [source] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, sourceAssignmentId));
  if (!source) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }

  // The graded problems (with their topics) define the blueprint.
  const gradedProblems = await db
    .select({
      prompt: problemsTable.prompt,
      topicId: problemsTable.topicId,
      topicSlug: topicsTable.slug,
      topicTitle: topicsTable.title,
    })
    .from(problemsTable)
    .leftJoin(topicsTable, eq(problemsTable.topicId, topicsTable.id))
    .where(eq(problemsTable.assignmentId, sourceAssignmentId))
    .orderBy(asc(problemsTable.position));

  if (gradedProblems.length === 0) {
    res.status(400).json({ error: "source assignment has no problems" });
    return;
  }

  const topicMap = new Map<string, { slug: string; title: string }>();
  for (const g of gradedProblems) {
    if (g.topicSlug) topicMap.set(g.topicSlug, { slug: g.topicSlug, title: g.topicTitle ?? g.topicSlug });
  }

  // Prior practice prompts for this user+source. We fetch ALL of them for the
  // deterministic exclusion set; only the most recent are sent to the LLM as a
  // hint to keep the request bounded.
  const priorRows = await db
    .select({ prompt: practiceAssignmentProblemsTable.prompt })
    .from(practiceAssignmentProblemsTable)
    .innerJoin(
      practiceAssignmentsTable,
      eq(practiceAssignmentProblemsTable.practiceAssignmentId, practiceAssignmentsTable.id),
    )
    .where(
      and(
        eq(practiceAssignmentsTable.userId, userId),
        eq(practiceAssignmentsTable.sourceAssignmentId, sourceAssignmentId),
      ),
    )
    .orderBy(desc(practiceAssignmentProblemsTable.id));

  // Deterministic no-overlap guarantee: any generated problem whose normalized
  // prompt collides with a graded prompt, a prior practice prompt, or another
  // problem in this same batch is rejected — we never trust the LLM alone.
  const gradedPromptList = gradedProblems.map((g) => g.prompt);
  const priorPromptList = priorRows.map((p) => p.prompt);
  const seenKeys = new Set<string>(
    [...gradedPromptList, ...priorPromptList].map(normalizePrompt).filter(Boolean),
  );

  // Resolve topic ids for storing problems.
  const allTopics = await db.select().from(topicsTable);
  const slugToId = new Map(allTopics.map((t) => [t.slug, { id: t.id, title: t.title }]));

  let llmProblems: GeneratedProblem[] = [];
  try {
    llmProblems = await generateProblems({
      sourceTitle: source.title,
      kind: source.kind,
      weekNumber: source.weekNumber,
      topics: Array.from(topicMap.values()),
      gradedPrompts: gradedPromptList,
      priorPrompts: priorPromptList.slice(0, 40),
      count: gradedProblems.length,
    });
  } catch (err) {
    req.log.error({ err }, "practice generation failed");
  }

  // Keep only genuinely fresh problems.
  const generated: GeneratedProblem[] = [];
  for (const gp of llmProblems) {
    const key = normalizePrompt(gp.prompt);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    generated.push(gp);
  }

  // Fallback: if generation produced too few unique problems, synthesize fresh
  // randomized Algebra 1 problems for the exact requested topic, each checked against the same exclusion set, so
  // the user always receives a full, non-repeating practice set.
  if (generated.length < gradedProblems.length) {
    for (let i = generated.length; i < gradedProblems.length; i++) {
      const g = gradedProblems[i]!;
      for (let tries = 0; tries < 25; tries++) {
        const topicTitle = g.topicTitle ?? "";
        let fallback: GeneratedProblem;
        try {
          fallback = randomizedAlgebraProblem(topicTitle);
        } catch (err) {
          req.log.error({ err, topicTitle }, "topic-appropriate Algebra 1 fallback unavailable");
          res.status(503).json({
            error: `could not generate a practice problem for topic "${topicTitle || "unknown"}"`,
          });
          return;
        }
        const prompt = `Practice (${g.topicTitle ?? "Functions"}): ${fallback.prompt}`;
        const key = normalizePrompt(prompt);
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        generated.push({
          topicSlug: g.topicSlug ?? Array.from(topicMap.keys())[0] ?? "",
          prompt,
          correctAnswer: fallback.correctAnswer,
          explanation: fallback.explanation,
          hint: fallback.hint,
        });
        break;
      }
    }
  }

  if (generated.length < gradedProblems.length) {
    res.status(503).json({ error: "could not generate a full, topic-appropriate practice set" });
    return;
  }

  const [created] = await db
    .insert(practiceAssignmentsTable)
    .values({
      userId,
      sourceAssignmentId,
      kind: source.kind,
      title: `Practice — ${source.title}`,
      weekNumber: source.weekNumber,
      status: "in_progress",
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "failed to create" });
    return;
  }

  const fallbackTopicId = gradedProblems[0]!.topicId;
  let position = 1;
  for (const gp of generated) {
    const resolved = slugToId.get(gp.topicSlug);
    const topicId = resolved?.id ?? fallbackTopicId;
    await db.insert(practiceAssignmentProblemsTable).values({
      practiceAssignmentId: created.id,
      topicId,
      position: position++,
      prompt: gp.prompt,
      correctAnswer: gp.correctAnswer,
      explanation: gp.explanation,
      hint: gp.hint ?? null,
      difficulty: 3.0,
    });
  }

  await logActivity({
    userId,
    kind: "practice_generated",
    refId: created.id,
    detail: source.title,
  });

  const detail = await loadDetail(created.id, userId);
  if (!detail) {
    res.status(500).json({ error: "failed to load" });
    return;
  }
  res.json(GeneratePracticeAssignmentResponse.parse(detail));
});

async function loadDetail(id: number, userId: string) {
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) return null;

  const [source] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, pa.sourceAssignmentId));

  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      position: practiceAssignmentProblemsTable.position,
      prompt: practiceAssignmentProblemsTable.prompt,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
      hint: practiceAssignmentProblemsTable.hint,
      difficulty: practiceAssignmentProblemsTable.difficulty,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  const submitted = pa.status === "submitted";

  return {
    id: pa.id,
    sourceAssignmentId: pa.sourceAssignmentId,
    kind: pa.kind as "homework" | "test" | "midterm" | "final",
    title: pa.title,
    weekNumber: pa.weekNumber,
    status: pa.status as "in_progress" | "submitted",
    scorePercent: pa.scorePercent,
    instructions: source?.instructions ?? null,
    problems: problems.map((p) => ({
      id: p.id,
      position: p.position,
      prompt: p.prompt,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
      hint: p.hint ?? null,
      difficulty: p.difficulty,
    })),
    answers: problems.map((p) => {
      const a = byProblem.get(p.id);
      return {
        problemId: p.id,
        answer: a?.answer ?? "",
        correct: a?.correct ?? null,
        score: a?.score ?? null,
        feedback: a?.feedback ?? null,
        whatWasRight: a?.whatWasRight ?? null,
        whatToFix: a?.whatToFix ?? null,
        conceptTip: a?.conceptTip ?? null,
        // Only reveal canonical answer/explanation after submission.
        correctAnswer: submitted ? p.correctAnswer : null,
        explanation: submitted ? p.explanation : null,
      };
    }),
  };
}

// GET /practice-assignments?sourceAssignmentId=
router.get("/practice-assignments", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const sourceRaw = req.query.sourceAssignmentId;
  const sourceId = sourceRaw != null ? parseInt(String(sourceRaw), 10) : null;

  const where =
    sourceId != null && Number.isFinite(sourceId)
      ? and(
          eq(practiceAssignmentsTable.userId, userId),
          eq(practiceAssignmentsTable.sourceAssignmentId, sourceId),
        )
      : eq(practiceAssignmentsTable.userId, userId);

  const rows = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(where)
    .orderBy(desc(practiceAssignmentsTable.id));

  const result = await Promise.all(
    rows.map(async (r) => {
      const cnt = await db
        .select({ id: practiceAssignmentProblemsTable.id })
        .from(practiceAssignmentProblemsTable)
        .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, r.id));
      return {
        id: r.id,
        sourceAssignmentId: r.sourceAssignmentId,
        kind: r.kind as "homework" | "test" | "midterm" | "final",
        title: r.title,
        weekNumber: r.weekNumber,
        status: r.status as "in_progress" | "submitted",
        scorePercent: r.scorePercent,
        problemCount: cnt.length,
        createdAt: r.startedAt.toISOString(),
      };
    }),
  );
  res.json(result.map((r) => ListPracticeAssignmentsResponseItem.parse(r)));
});

// GET /practice-assignments/:id
router.get("/practice-assignments/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const detail = await loadDetail(id, userId);
  if (!detail) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(GetPracticeAssignmentResponse.parse(detail));
});

// PUT /practice-assignments/:id/answer
router.put("/practice-assignments/:id/answer", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const parsed = SavePracticeAssignmentAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (pa.status !== "in_progress") {
    res.status(400).json({ error: "already submitted" });
    return;
  }
  const { problemId, answer } = parsed.data;
  const [problem] = await db
    .select()
    .from(practiceAssignmentProblemsTable)
    .where(
      and(
        eq(practiceAssignmentProblemsTable.id, problemId),
        eq(practiceAssignmentProblemsTable.practiceAssignmentId, id),
      ),
    );
  if (!problem) {
    res.status(404).json({ error: "problem not found" });
    return;
  }
  const [existing] = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(
      and(
        eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
        eq(practiceAssignmentAnswersTable.problemId, problemId),
      ),
    );
  if (existing) {
    await db
      .update(practiceAssignmentAnswersTable)
      .set({ answer, updatedAt: new Date() })
      .where(eq(practiceAssignmentAnswersTable.id, existing.id));
  } else {
    await db.insert(practiceAssignmentAnswersTable).values({
      practiceAssignmentId: id,
      problemId,
      answer,
    });
  }
  res.json({ ok: true });
});

type RichFeedback = {
  whatWasRight: string;
  whatToFix: string;
  conceptTip: string;
  feedback: string;
};

async function richFeedbackFor(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  topicTitle: string;
}): Promise<RichFeedback> {
  try {
    const out = await chatJson<RichFeedback>(
      [
        "You are an encouraging, surgically precise Algebra 1 tutor giving feedback on ONE practice problem.",
        "Be specific to THIS student's answer — quote what they wrote, name the exact step that went right or wrong, and tie it to the underlying concept.",
        "Use $...$ for inline LaTeX. Keep each field tight and concrete (no fluff).",
        'Respond as strict JSON: {"whatWasRight": string, "whatToFix": string, "conceptTip": string, "feedback": string} where "feedback" is a 2-4 sentence markdown paragraph that ties it together and motivates the next attempt.',
      ].join("\n"),
      JSON.stringify({
        topic: opts.topicTitle,
        prompt: opts.prompt,
        correctAnswer: opts.correctAnswer,
        studentAnswer: opts.userAnswer,
        wasMarkedCorrect: opts.correct,
        canonicalExplanation: opts.explanation,
      }),
    );
    return {
      whatWasRight: out.whatWasRight || (opts.correct ? "You reached a correct result." : ""),
      whatToFix: out.whatToFix || (opts.correct ? "" : "Revisit the formula structure."),
      conceptTip: out.conceptTip || "",
      feedback: out.feedback || opts.explanation,
    };
  } catch {
    return {
      whatWasRight: opts.correct ? "You reached a correct result." : "",
      whatToFix: opts.correct ? "" : "Check the formula structure against the explanation.",
      conceptTip: "",
      feedback: opts.explanation,
    };
  }
}

// Reconstructs the submit result from already-graded, stored answers — used to
// make re-submission idempotent without re-grading or re-logging.
async function loadSubmittedResult(id: number) {
  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  let score = 0;
  const perProblem = problems.map((p) => {
    const a = byProblem.get(p.id);
    if (a?.correct) score += 1;
    return {
      problemId: p.id,
      correct: a?.correct ?? false,
      score: a?.score ?? 0,
      userAnswer: a?.answer ?? "",
      correctAnswer: p.correctAnswer,
      explanation: p.explanation,
      feedback: a?.feedback ?? "",
      whatWasRight: a?.whatWasRight ?? null,
      whatToFix: a?.whatToFix ?? null,
      conceptTip: a?.conceptTip ?? null,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
    };
  });

  const total = problems.length;
  return {
    id,
    score,
    total,
    percent: total === 0 ? 0 : (score / total) * 100,
    overallFeedback: null as string | null,
    perProblem,
  };
}

// POST /practice-assignments/:id/submit
router.post("/practice-assignments/:id/submit", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }

  // Idempotent: never re-grade an already-submitted set. Re-grading would
  // re-run recordTopicResult + logActivity and inflate the per-user profile and
  // readiness signals. Return the stored result instead.
  if (pa.status !== "in_progress") {
    res.json(SubmitPracticeAssignmentResponse.parse(await loadSubmittedResult(id)));
    return;
  }

  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      prompt: practiceAssignmentProblemsTable.prompt,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  const perProblem = [];
  let score = 0;
  for (const p of problems) {
    const a = byProblem.get(p.id);
    const userAnswer = a?.answer ?? "";
    const graded = await gradeAnswer({
      prompt: p.prompt,
      correctAnswer: p.correctAnswer,
      userAnswer,
    });
    const numericScore = graded.correct ? 1 : 0;
    if (graded.correct) score += 1;

    const rich = await richFeedbackFor({
      prompt: p.prompt,
      correctAnswer: p.correctAnswer,
      userAnswer,
      correct: graded.correct,
      explanation: graded.explanation || p.explanation,
      topicTitle: p.topicTitle ?? "Algebra 1",
    });

    // Persist the answer row with feedback (create if missing).
    if (a) {
      await db
        .update(practiceAssignmentAnswersTable)
        .set({
          correct: graded.correct,
          score: numericScore,
          feedback: rich.feedback,
          whatWasRight: rich.whatWasRight,
          whatToFix: rich.whatToFix,
          conceptTip: rich.conceptTip,
          gradedAt: new Date(),
        })
        .where(eq(practiceAssignmentAnswersTable.id, a.id));
    } else {
      await db.insert(practiceAssignmentAnswersTable).values({
        practiceAssignmentId: id,
        problemId: p.id,
        answer: userAnswer,
        correct: graded.correct,
        score: numericScore,
        feedback: rich.feedback,
        whatWasRight: rich.whatWasRight,
        whatToFix: rich.whatToFix,
        conceptTip: rich.conceptTip,
        gradedAt: new Date(),
      });
    }

    // Update the evolving per-topic profile + activity log.
    await recordTopicResult({
      userId,
      topicId: p.topicId,
      correct: graded.correct,
      score: numericScore,
    });
    await logActivity({
      userId,
      kind: "practice_problem_graded",
      refId: id,
      topicId: p.topicId,
      score: numericScore,
    });

    perProblem.push({
      problemId: p.id,
      correct: graded.correct,
      score: numericScore,
      userAnswer,
      correctAnswer: p.correctAnswer,
      explanation: graded.explanation || p.explanation,
      feedback: rich.feedback,
      whatWasRight: rich.whatWasRight || null,
      whatToFix: rich.whatToFix || null,
      conceptTip: rich.conceptTip || null,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
    });
  }

  const total = problems.length;
  const percent = total === 0 ? 0 : (score / total) * 100;
  await db
    .update(practiceAssignmentsTable)
    .set({ status: "submitted", submittedAt: new Date(), scorePercent: percent })
    .where(eq(practiceAssignmentsTable.id, id));

  await logActivity({
    userId,
    kind: "practice_submitted",
    refId: id,
    score: percent / 100,
    detail: pa.title,
  });

  let overallFeedback: string | null = null;
  try {
    const out = await chatJson<{ summary: string }>(
      "You are a motivating Algebra 1 tutor. Given a student's practice results, write a 2-3 sentence encouraging summary that names their strongest algebra topic and the single most important skill to drill before the graded version. Use $...$ for any LaTeX. Respond as strict JSON: {\"summary\": string}.",
      JSON.stringify({
        title: pa.title,
        percent: Math.round(percent),
        perProblem: perProblem.map((p) => ({
          topic: p.topicTitle,
          correct: p.correct,
        })),
      }),
    );
    overallFeedback = out.summary || null;
  } catch {
    overallFeedback = null;
  }

  res.json(
    SubmitPracticeAssignmentResponse.parse({
      id,
      score,
      total,
      percent,
      overallFeedback,
      perProblem,
    }),
  );
});

// GET /practice-assignments/:id/dialogue
router.get("/practice-assignments/:id/dialogue", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const rows = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.practiceAssignmentId, id))
    .orderBy(asc(feedbackMessagesTable.id));
  res.json(
    rows.map((m) =>
      GetFeedbackMessagesResponseItem.parse({
        id: m.id,
        role: m.role as "user" | "tutor",
        content: m.content,
        problemId: m.problemId,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  );
});

// POST /practice-assignments/:id/dialogue — ask a follow-up about the feedback.
router.post("/practice-assignments/:id/dialogue", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const parsed = PostFeedbackMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { problemId, message } = parsed.data;

  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }

  // Ground the dialogue in the specific problem + the student's graded answer.
  let context = "";
  if (problemId != null) {
    const [problem] = await db
      .select()
      .from(practiceAssignmentProblemsTable)
      .where(
        and(
          eq(practiceAssignmentProblemsTable.id, problemId),
          eq(practiceAssignmentProblemsTable.practiceAssignmentId, id),
        ),
      );
    const [answer] = await db
      .select()
      .from(practiceAssignmentAnswersTable)
      .where(
        and(
          eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
          eq(practiceAssignmentAnswersTable.problemId, problemId),
        ),
      );
    if (problem) {
      context = JSON.stringify({
        prompt: problem.prompt,
        correctAnswer: problem.correctAnswer,
        explanation: problem.explanation,
        studentAnswer: answer?.answer ?? "",
        wasCorrect: answer?.correct ?? null,
        priorFeedback: answer?.feedback ?? "",
      });
    }
  }

  // Recent thread for continuity (same scope).
  const history = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.practiceAssignmentId, id))
    .orderBy(desc(feedbackMessagesTable.id))
    .limit(10);
  const recent = history
    .reverse()
    .filter((m) => (problemId == null ? m.problemId == null : m.problemId === problemId))
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");

  // Store the student's message.
  await db.insert(feedbackMessagesTable).values({
    userId,
    practiceAssignmentId: id,
    problemId: problemId ?? null,
    role: "user",
    content: message,
  });

  let reply = "";
  try {
    reply = (
      await chatJson<{ reply: string }>(
        [
          "You are a patient Algebra 1 tutor continuing a conversation about feedback on a practice problem.",
          "Answer the student's question directly and concretely, referencing their actual answer and the problem when relevant. Use $...$ for LaTeX. Keep it to a few sentences unless they ask for a full worked solution.",
          'Respond as strict JSON: {"reply": string}.',
        ].join("\n"),
        JSON.stringify({
          problemContext: context || "(general question about this practice assignment)",
          conversationSoFar: recent,
          studentQuestion: message,
        }),
      )
    ).reply;
  } catch (err) {
    req.log.error({ err }, "feedback dialogue failed");
    reply = "Sorry — I had trouble generating a reply. Please try asking again.";
  }

  const [stored] = await db
    .insert(feedbackMessagesTable)
    .values({
      userId,
      practiceAssignmentId: id,
      problemId: problemId ?? null,
      role: "tutor",
      content: reply,
    })
    .returning();

  await logActivity({ userId, kind: "feedback_dialogue", refId: id });

  res.json(
    PostFeedbackMessageResponse.parse({
      id: stored!.id,
      role: "tutor",
      content: reply,
      problemId: problemId ?? null,
      createdAt: stored!.createdAt.toISOString(),
    }),
  );
});

export default router;
