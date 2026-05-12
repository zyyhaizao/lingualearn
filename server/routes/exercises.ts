import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/lesson/:lessonId', async (req: Request, res: Response) => {
  try {
    const { lessonId } = req.params;
    const result = await pool.query(
      `SELECT exercise_id, exercise_type, question, options, points,
              hint, explanation, difficulty_level, time_limit_seconds
       FROM lingualearn_exercises
       WHERE lesson_id = $1
       ORDER BY difficulty_level, exercise_id`,
      [lessonId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { exerciseId, userAnswer, timeTakenSeconds } = req.body;

    const exerciseResult = await pool.query(
      `SELECT correct_answer, points FROM lingualearn_exercises WHERE exercise_id = $1`,
      [exerciseId]
    );

    if (exerciseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const correctAnswer = exerciseResult.rows[0].correct_answer;
    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    const xpEarned = isCorrect ? exerciseResult.rows[0].points : 0;

    const result = await pool.query(
      `INSERT INTO lingualearn_user_exercise_results
       (user_id, exercise_id, user_answer, is_correct, time_taken_seconds, xp_earned)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, exerciseId, userAnswer, isCorrect, timeTakenSeconds || 0, xpEarned]
    );

    if (isCorrect && xpEarned > 0) {
      await pool.query(
        `UPDATE lingualearn_users
         SET experience_points = experience_points + $1,
             total_points = total_points + $1
         WHERE user_id = $2`,
        [xpEarned, req.userId]
      );
    }

    res.json({
      ...result.rows[0],
      isCorrect,
      correctAnswer: isCorrect ? null : correctAnswer
    });
  } catch (error) {
    console.error('Submit exercise error:', error);
    res.status(500).json({ error: 'Failed to submit exercise' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, exerciseType, question, correctAnswer, options, points, hint, explanation, difficultyLevel, timeLimitSeconds } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_exercises
       (lesson_id, exercise_type, question, correct_answer, options, points, hint, explanation, difficulty_level, time_limit_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [lessonId, exerciseType, question, correctAnswer, options, points || 5, hint, explanation, difficultyLevel || 1, timeLimitSeconds]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

export default router;
