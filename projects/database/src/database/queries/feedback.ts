import Feedback from "../../elo-types/Feedback";
import Database from "../Database";

export async function insertFeedback(
  db: Database,
  userId: string | undefined,
  feedback: Feedback,
  now = new Date(),
) {
  const pgClient = await db.PgClient();

  await pgClient.query(
    `
      INSERT INTO feedback (
        time_,
        user_id,
        version_,
        content
      ) VALUES (
        $1,
        $2,
        $3,
        $4
      )
    `,
    [
      now.toISOString(),
      userId,
      1,
      feedback,
    ],
  );
}
