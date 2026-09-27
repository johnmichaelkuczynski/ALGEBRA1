import { db, topicsTable, lecturesTable, assignmentsTable, problemsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";
import { ASSIGNMENTS, LESSONS } from "./algebraCourse";

const weekForIndex = (index: number): number => index < 7 ? 1 : index < 14 ? 2 : index < 21 ? 3 : 4;
const expectedSlugs = LESSONS.map(([slug]) => slug).sort().join(",");
const expectedAssignments = ASSIGNMENTS.map(({ title }) => title).sort().join(",");

// This one-time course replacement is deliberate: the owner chose to erase old
// course progress rather than display Precalculus results as Algebra 1 results.
// Keep the clear and reseed in one transaction so no mixed course can be served.
export async function seedIfEmpty(): Promise<void> {
  await db.transaction(async (tx) => {
    const existing = await tx.execute(sql`select slug from topics order by slug`);
    const assignments = await tx.execute(sql`select title from assignments order by title`);
    const slugs = (existing.rows as Array<{ slug: string }>).map((row) => row.slug).sort().join(",");
    const titles = (assignments.rows as Array<{ title: string }>).map((row) => row.title).sort().join(",");

    if (slugs === expectedSlugs && titles === expectedAssignments) return;

    if (existing.rows.length || assignments.rows.length) {
      // Child records with topic/assignment references must be removed before
      // topics. Answers, feedback and generated problems cascade with parents.
      await tx.execute(sql`delete from activity_log`);
      await tx.execute(sql`delete from user_topic_stats`);
      await tx.execute(sql`delete from practice_assignments`);
      await tx.execute(sql`delete from practice_sessions`);
      await tx.execute(sql`delete from assignments`);
      await tx.execute(sql`delete from topics`);
      logger.info("Old course material and course-specific progress removed for Algebra 1");
    }

    const topicIds: number[] = [];
    for (const [index, [slug, title, blurb, body]] of LESSONS.entries()) {
      const weekNumber = weekForIndex(index);
      const [topic] = await tx.insert(topicsTable).values({
        slug, title, blurb, weekNumber, position: index,
      }).returning();
      if (!topic) throw new Error("Unable to create Algebra 1 topic");
      topicIds.push(topic.id);
      await tx.insert(lecturesTable).values({
        topicId: topic.id, weekNumber,
        title: `${weekNumber}.${index - [0, 0, 7, 14, 21][weekNumber]! + 1} ${title}`,
        body,
      });
    }

    for (const [position, assignment] of ASSIGNMENTS.entries()) {
      const { problems, ...details } = assignment;
      const [created] = await tx.insert(assignmentsTable).values({ ...details, position }).returning();
      if (!created) throw new Error("Unable to create Algebra 1 assignment");
      for (const [index, problem] of problems.entries()) {
        const topicId = topicIds[problem.lesson];
        if (!topicId) throw new Error(`Unknown Algebra 1 lesson index: ${problem.lesson}`);
        await tx.insert(problemsTable).values({
          assignmentId: created.id, topicId, position: index,
          prompt: problem.prompt, correctAnswer: problem.correctAnswer,
          explanation: problem.correctAnswer, hint: null,
        });
      }
    }
    logger.info({ topics: LESSONS.length, assignments: ASSIGNMENTS.length }, "Algebra 1 course seeded");
  });
}