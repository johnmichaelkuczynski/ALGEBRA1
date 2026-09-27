import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  topicsTable,
  practiceSessionsTable,
  practiceProblemsTable,
  practiceAttemptsTable,
} from "@workspace/db";
import {
  StartPracticeSessionBody,
  StartPracticeSessionResponse,
  NextPracticeProblemBody,
  NextPracticeProblemResponse,
  GradePracticeAnswerBody,
  GradePracticeAnswerResponse,
} from "@workspace/api-zod";
import { chatJson } from "../lib/ai";
import { getUserId } from "../lib/userId";
import { gradeAnswer } from "../lib/grading";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

function algebraFallbackProblem(topicTitle: string, difficulty: number): {
  prompt: string;
  correctAnswer: string;
  explanation: string;
} {
  const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
  const topic = topicTitle.toLowerCase();
  if (/systems? of linear inequalit/.test(topic)) {
    return {
      prompt: "For the system $y>x-1$ and $y<5-x$, is $(0,2)$ a solution?",
      correctAnswer: "Yes",
      explanation: "The point satisfies both inequalities: $2>0-1$ and $2<5-0$, so it is in the overlap.",
    };
  }
  if (/inequalit/.test(topic)) {
    const coefficient = Math.max(2, Math.round(difficulty));
    const solution = int(-6, 6);
    return {
      prompt: `Solve $${coefficient}x<${coefficient * solution}$.`,
      correctAnswer: `x<${solution}`,
      explanation: `Divide both sides by the positive number ${coefficient}: $x<${solution}$.`,
    };
  }
  if (/absolute|compound/.test(topic)) {
    const center = int(-5, 5);
    const radius = int(2, 5);
    const distanceExpression = center < 0 ? `x+${-center}` : `x-${center}`;
    return {
      prompt: `Solve $|${distanceExpression}|\\le${radius}$.`,
      correctAnswer: `${center - radius}<=x<=${center + radius}`,
      explanation: `A distance of at most ${radius} from ${center} means $${center - radius}\\le x\\le${center + radius}$.`,
    };
  }
  if (/system/.test(topic)) {
    const x = int(-4, 5);
    const y = int(-4, 5);
    if (/graph/.test(topic)) {
      return {
        prompt: "Find the intersection of $y=2x+1$ and $y=-x+7$.",
        correctAnswer: "(2,5)",
        explanation: `Set the equations equal: $2x+1=-x+7$, so $x=2$ and then $y=5$. The intersection is $(2,5)$.`,
      };
    }
    return {
      prompt: `Solve the system $x+y=${x + y}$ and $2x-y=${2 * x - y}$.`,
      correctAnswer: `x=${x}, y=${y}`,
      explanation: `Substitution or elimination gives $x=${x}$ and $y=${y}$; both values satisfy the two equations.`,
    };
  }
  if (/ratio|proportion|percent/.test(topic)) {
    const percent = int(10, 50);
    const whole = int(2, 9) * 10;
    return {
      prompt: `Find ${percent}% of ${whole}.`,
      correctAnswer: String((percent * whole) / 100),
      explanation: `${percent}% is ${percent}/100, so ${percent}% of ${whole} is ${(percent * whole) / 100}.`,
    };
  }
  if (/scientific notation/.test(topic)) {
    return {
      prompt: "Write 4,500,000 in scientific notation.",
      correctAnswer: "4.5×10^6",
      explanation: "Move the decimal six places left to get a number from 1 to 10: $4.5\\times10^6$.",
    };
  }
  if (/exponent|scientific notation/.test(topic)) {
    const base = int(2, 5);
    const exponent = int(2, 5);
    return {
      prompt: `Simplify $${base}^${exponent}\\cdot${base}^2$.`,
      correctAnswer: `${base}^${exponent + 2}`,
      explanation: `For powers with the same base, add exponents: $${base}^${exponent}\\cdot${base}^2=${base}^${exponent + 2}$.`,
    };
  }
  if (/quadratic.*graph|graph.*quadratic/.test(topic)) {
    const h = int(-4, 4);
    const k = int(-5, 5);
    const vertexExpression = h < 0 ? `x+${-h}` : `x-${h}`;
    return {
      prompt: `State the vertex of $y=(${vertexExpression})^2+${k}$.`,
      correctAnswer: `(${h},${k})`,
      explanation: `The function is in vertex form, so its vertex is $(${h},${k})$.`,
    };
  }
  if (/quadratic formula|completing the square/.test(topic)) {
    return {
      prompt: "Solve $x^2-5x+6=0$ using the quadratic formula.",
      correctAnswer: "x=2 or x=3",
      explanation: `Substitute $a=1$, $b=-5$, $c=6$ in the quadratic formula to get $x=(5\\pm1)/2$, so $x=2$ or $x=3$.`,
    };
  }
  if (/quadratic|factor|polynomial|zero|root/.test(topic)) {
    if (/factoring trinomial/.test(topic)) {
      return {
        prompt: "Factor $x^2-5x+6$.",
        correctAnswer: "(x-2)(x-3)",
        explanation: "$x^2-5x+6=(x-2)(x-3)$ because $-2\\cdot-3=6$ and $-2+(-3)=-5$.",
      };
    }
    return {
      prompt: "Solve $x^2-5x+6=0$ by factoring.",
      correctAnswer: "x=2 or x=3",
      explanation: `Factor: $(x-2)(x-3)=0$. The zero-product property gives $x=2$ or $x=3$.`,
    };
  }
  if (/special product/.test(topic)) {
    return {
      prompt: "Expand $(x+4)^2$.",
      correctAnswer: "x^2+8x+16",
      explanation: "Use $(a+b)^2=a^2+2ab+b^2$: $(x+4)^2=x^2+8x+16$.",
    };
  }
  if (/factoring: gcf|factoring gcf|grouping/.test(topic)) {
    return {
      prompt: "Factor $6x^2+18x$.",
      correctAnswer: "6x(x+3)",
      explanation: "The greatest common factor is $6x$, so $6x^2+18x=6x(x+3)$.",
    };
  }
  if (/radical|pythagorean/.test(topic)) {
    if (/pythagorean/.test(topic)) {
      return {
        prompt: "A right triangle has legs 3 and 4. Find its hypotenuse.",
        correctAnswer: "5",
        explanation: "By the Pythagorean theorem, $c^2=3^2+4^2=25$, so the positive hypotenuse is $c=5$.",
      };
    }
    return {
      prompt: "Simplify $\\sqrt{72}$.",
      correctAnswer: "6√2",
      explanation: "$\\sqrt{72}=\\sqrt{36\\cdot2}=6\\sqrt2$.",
    };
  }
  if (/rational expression/.test(topic)) {
    const a = int(2, 8);
    return {
      prompt: `For $\\frac{x+1}{x-${a}}$, what value is excluded from the domain?`,
      correctAnswer: String(a),
      explanation: `The denominator is zero when $x=${a}$, so that value is excluded.`,
    };
  }
  if (/slope-intercept/.test(topic)) {
    return {
      prompt: "Write the equation of a line with slope 3 and $y$-intercept $-2$.",
      correctAnswer: "y=3x-2",
      explanation: "Slope-intercept form is $y=mx+b$. Substitute $m=3$ and $b=-2$ to get $y=3x-2$.",
    };
  }
  if (/point-slope/.test(topic)) {
    return {
      prompt: "Write the line with slope 2 through $(1,4)$ in point-slope form.",
      correctAnswer: "y-4=2(x-1)",
      explanation: "Use $y-y_1=m(x-x_1)$ with $m=2$ and $(x_1,y_1)=(1,4)$.",
    };
  }
  if (/standard form/.test(topic)) {
    return {
      prompt: "Rewrite $y=2x+3$ in standard form $Ax+By=C$.",
      correctAnswer: "2x-y=-3",
      explanation: "Move the variable terms to one side: $2x-y=-3$.",
    };
  }
  if (/parallel|perpendicular/.test(topic)) {
    return {
      prompt: "A line has slope 3. What is the slope of a line perpendicular to it?",
      correctAnswer: "-1/3",
      explanation: "Perpendicular nonvertical lines have slopes that are negative reciprocals, so the slope is $-1/3$.",
    };
  }
  if (/linear model|scatter/.test(topic)) {
    return {
      prompt: "A linear model is $y=4x+7$. What does its slope represent as $x$ increases by 1?",
      correctAnswer: "y increases by 4",
      explanation: "The slope is 4, so the model's output increases by 4 units for each 1-unit increase in input.",
    };
  }
  if (/slope|linear|graph|rate of change|line/.test(topic)) {
    const slope = int(1, 5) * (Math.random() < 0.5 ? -1 : 1);
    const run = int(2, 5);
    return {
      prompt: `Find the slope between $(0,1)$ and $(${run},${1 + slope * run})$.`,
      correctAnswer: String(slope),
      explanation: `Slope is rise over run: $(${1 + slope * run}-1)/(${run}-0)=${slope * run}/${run}=${slope}$.`,
    };
  }
  if (/simplif|propert|distribut|like terms/.test(topic)) {
    const a = int(2, 7);
    const b = int(1, 6);
    return {
      prompt: `Simplify $${a}(x+${b})-x$.`,
      correctAnswer: `${a - 1}x+${a * b}`,
      explanation: `Distribute and combine like terms: $${a}x+${a * b}-x=${a - 1}x+${a * b}$.`,
    };
  }
  if (/expression|real number|operation/.test(topic)) {
    const a = int(2, 8);
    const b = int(2, 7);
    return {
      prompt: `Evaluate $${a}(${b}+3)-${b}$.`,
      correctAnswer: String(a * (b + 3) - b),
      explanation: `Evaluate the parentheses, then multiply and subtract: $${a}(${b + 3})-${b}=${a * (b + 3) - b}$.`,
    };
  }
  if (/function|relation|domain/.test(topic)) {
    const coefficient = int(2, 6);
    const input = int(2, 8);
    return {
      prompt: `If $f(x)=${coefficient}x+1$, find $f(${input})$.`,
      correctAnswer: String(coefficient * input + 1),
      explanation: `Substitute ${input} for $x$: $f(${input})=${coefficient}(${input})+1=${coefficient * input + 1}$.`,
    };
  }
  if (/equation|formula/.test(topic)) {
    if (/literal equation|formula/.test(topic)) {
      return {
        prompt: "Solve $d=rt$ for $t$.",
        correctAnswer: "t=d/r",
        explanation: "Divide both sides by $r$ (assuming $r\\ne0$) to obtain $t=d/r$.",
      };
    }
    if (/multi-step/.test(topic)) {
      return {
        prompt: "Solve $3(2x-1)+4=25$.",
        correctAnswer: "x=4",
        explanation: "Distribute and combine: $6x+1=25$, so $6x=24$ and $x=4$.",
      };
    }
    const coefficient = Math.max(2, Math.round(difficulty));
    const solution = int(-8, 8);
    return {
      prompt: `Solve $${coefficient}x+2=${coefficient * solution + 2}$.`,
      correctAnswer: `x=${solution}`,
      explanation: `Subtract 2 from both sides and divide by ${coefficient}, giving $x=${solution}$.`,
    };
  }
  if (/capstone/.test(topic)) {
    return {
      prompt: "Solve $3x-7=11$ and check the solution.",
      correctAnswer: "x=6",
      explanation: "Add 7 to both sides and divide by 3 to get $x=6$. Checking gives $3(6)-7=11$.",
    };
  }
  throw new Error(`Cannot generate an Algebra 1 fallback for topic "${topicTitle}".`);
}

async function pickTopicId(
  weekNumber: number | null | undefined,
  preferred: number | null | undefined,
  focusOnWeaknesses: boolean,
): Promise<{ id: number; title: string; weekNumber: number }> {
  if (preferred != null) {
    const [t] = await db.select().from(topicsTable).where(eq(topicsTable.id, preferred));
    if (t) return { id: t.id, title: t.title, weekNumber: t.weekNumber };
  }
  const candidates = weekNumber
    ? await db.select().from(topicsTable).where(eq(topicsTable.weekNumber, weekNumber))
    : await db.select().from(topicsTable);

  if (focusOnWeaknesses) {
    const stats = await db.execute(sql`
      select topic_id, count(*)::int as n, avg(case when correct then 1.0 else 0.0 end) as acc
      from practice_attempts group by topic_id
    `);
    const byId = new Map<number, { n: number; acc: number }>();
    for (const r of stats.rows as Array<{ topic_id: number; n: number; acc: number }>) {
      byId.set(Number(r.topic_id), { n: Number(r.n), acc: Number(r.acc) });
    }
    // weight = (1 - accuracy) + small bonus for low-attempted topics
    const scored = candidates.map((t) => {
      const s = byId.get(t.id);
      const acc = s?.acc ?? 0.5;
      const n = s?.n ?? 0;
      const weight = (1 - acc) * 2 + (n < 3 ? 1 : 0) + Math.random() * 0.3;
      return { t, weight };
    });
    scored.sort((a, b) => b.weight - a.weight);
    const choice = scored[0]?.t ?? candidates[Math.floor(Math.random() * candidates.length)]!;
    return { id: choice.id, title: choice.title, weekNumber: choice.weekNumber };
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)]!;
  return { id: choice.id, title: choice.title, weekNumber: choice.weekNumber };
}

router.post("/practice/sessions", async (req, res): Promise<void> => {
  const parsed = StartPracticeSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { weekNumber, topicId, tutorEnabled, focusOnWeaknesses, initialDifficulty } =
    parsed.data;
  const startDifficulty =
    typeof initialDifficulty === "number" && !Number.isNaN(initialDifficulty)
      ? Math.max(1, Math.min(5, initialDifficulty))
      : 2.0;
  const [created] = await db
    .insert(practiceSessionsTable)
    .values({
      userId: getUserId(req) || null,
      weekNumber: weekNumber ?? null,
      topicId: topicId ?? null,
      tutorEnabled,
      focusOnWeaknesses: focusOnWeaknesses ?? true,
      difficulty: startDifficulty,
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "failed" });
    return;
  }
  res.json(
    StartPracticeSessionResponse.parse({
      id: created.id,
      tutorEnabled: created.tutorEnabled,
      difficulty: created.difficulty,
      weekNumber: created.weekNumber,
      topicId: created.topicId,
      focusOnWeaknesses: created.focusOnWeaknesses,
    }),
  );
});

router.post("/practice/sessions/:sessionId/next", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  const parsed = NextPracticeProblemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [session] = await db
    .select()
    .from(practiceSessionsTable)
    .where(
      and(
        eq(practiceSessionsTable.id, sessionId),
        eq(practiceSessionsTable.userId, getUserId(req)),
      ),
    );
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }

  const topic = await pickTopicId(
    session.weekNumber,
    parsed.data.topicId ?? session.topicId,
    session.focusOnWeaknesses,
  );

  const lastProblems = await db
    .select({ prompt: practiceProblemsTable.prompt })
    .from(practiceProblemsTable)
    .where(
      and(
        eq(practiceProblemsTable.sessionId, sessionId),
        eq(practiceProblemsTable.topicId, topic.id),
      ),
    )
    .orderBy(desc(practiceProblemsTable.id))
    .limit(3);

  const difficulty = Math.max(1, Math.min(5, session.difficulty));
  const difficultyLabel =
    difficulty <= 1.7
      ? "very easy"
      : difficulty <= 2.5
      ? "easy"
      : difficulty <= 3.3
      ? "medium"
      : difficulty <= 4.1
      ? "hard"
      : "challenging";

  const userRequest = parsed.data.request?.trim() || "";
  let generated: { prompt: string; correctAnswer: string; explanation: string };
  try {
    generated = await chatJson<{
      prompt: string;
      correctAnswer: string;
      explanation: string;
    }>(
      `You generate a single Algebra 1 practice problem. It MUST directly assess the requested topic "${topic.title}" at "${difficultyLabel}" difficulty (${difficulty.toFixed(
        1,
      )}/5). Use an age-appropriate Algebra 1 skill: expressions, equations, inequalities, functions, linear graphs, systems, exponents, polynomials, factoring, quadratics, or radicals, as appropriate to the topic title. Do not use unrelated topics. Use $...$ for inline LaTeX where helpful. The answer must be a short string. Respond as strict JSON: {"prompt": string, "correctAnswer": string, "explanation": string}. Avoid these recent prompts: ${JSON.stringify(
        lastProblems.map((p) => p.prompt),
      )}.`,
      userRequest || `Generate a new ${difficultyLabel} problem on ${topic.title}.`,
    );
  } catch {
    try {
      generated = algebraFallbackProblem(topic.title, difficulty);
    } catch (fallbackError) {
      req.log.error({ err: fallbackError }, "topic-appropriate Algebra 1 fallback unavailable");
      res.status(503).json({ error: `could not generate a problem for topic "${topic.title}"` });
      return;
    }
  }

  const [stored] = await db
    .insert(practiceProblemsTable)
    .values({
      sessionId,
      topicId: topic.id,
      prompt: generated.prompt,
      correctAnswer: generated.correctAnswer,
      explanation: generated.explanation,
      difficulty,
    })
    .returning();
  if (!stored) {
    res.status(500).json({ error: "failed" });
    return;
  }

  res.json(
    NextPracticeProblemResponse.parse({
      id: stored.id,
      prompt: stored.prompt,
      topicId: topic.id,
      topicTitle: topic.title,
      difficulty,
    }),
  );
});

router.post("/practice/sessions/:sessionId/grade", async (req, res): Promise<void> => {
  const sessionId = parseIdParam(req.params.sessionId);
  const parsed = GradePracticeAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { problemId, answer, trace } = parsed.data;
  const [session] = await db
    .select()
    .from(practiceSessionsTable)
    .where(
      and(
        eq(practiceSessionsTable.id, sessionId),
        eq(practiceSessionsTable.userId, getUserId(req)),
      ),
    );
  if (!session) {
    res.status(404).json({ error: "session not found" });
    return;
  }
  const [problem] = await db
    .select()
    .from(practiceProblemsTable)
    .where(
      and(
        eq(practiceProblemsTable.id, problemId),
        eq(practiceProblemsTable.sessionId, sessionId),
      ),
    );
  if (!problem) {
    res.status(404).json({ error: "problem not found in this session" });
    return;
  }

  const graded = await gradeAnswer({
    prompt: problem.prompt,
    correctAnswer: problem.correctAnswer,
    userAnswer: answer,
  });

  await db.insert(practiceAttemptsTable).values({
    userId: getUserId(req) || null,
    sessionId,
    problemId,
    topicId: problem.topicId,
    answer,
    correct: graded.correct,
    difficulty: problem.difficulty,
    trace,
  });

  const delta = graded.correct ? 0.4 : -0.5;
  const newDifficulty = Math.max(1, Math.min(5, session.difficulty + delta));
  await db
    .update(practiceSessionsTable)
    .set({ difficulty: newDifficulty })
    .where(eq(practiceSessionsTable.id, sessionId));

  let tutorTip: string | null = null;
  if (session.tutorEnabled && !graded.correct) {
    try {
      tutorTip = (
        await chatJson<{ tip: string }>(
          "You are a kind, concise Algebra 1 tutor. Given a problem, the correct answer, and the student's wrong attempt, give ONE focused next-step tip about the exact Algebra 1 skill involved (2 sentences max). Respond as strict JSON: {\"tip\": string}.",
          JSON.stringify({
            prompt: problem.prompt,
            correctAnswer: problem.correctAnswer,
            studentAnswer: answer,
          }),
        )
      ).tip;
    } catch {
      tutorTip = null;
    }
  }

  res.json(
    GradePracticeAnswerResponse.parse({
      problemId,
      correct: graded.correct,
      correctAnswer: problem.correctAnswer,
      explanation: graded.explanation || problem.explanation,
      newDifficulty,
      tutorTip,
    }),
  );
});

export default router;
