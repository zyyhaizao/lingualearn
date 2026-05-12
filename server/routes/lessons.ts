import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT l.lesson_id, l.lesson_name, l.lesson_order, l.lesson_type,
              l.duration_minutes, l.difficulty_score, l.xp_reward, l.is_locked,
              c.course_name, c.course_id
       FROM lingualearn_lessons l
       JOIN lingualearn_courses c ON l.course_id = c.course_id
       WHERE l.lesson_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

router.get('/:id/exercises', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT exercise_id, exercise_type, question, options, points,
              hint, explanation, difficulty_level, time_limit_seconds
       FROM lingualearn_exercises
       WHERE lesson_id = $1
       ORDER BY difficulty_level, exercise_id`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

router.get('/:id/vocabulary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.vocab_id, v.word, v.pronunciation, v.translation,
              v.part_of_speech, v.example_sentences, v.audio_url, v.image_url,
              v.difficulty_level, v.tags
       FROM lingualearn_vocabulary v
       JOIN lingualearn_courses c ON v.language_id = c.language_id
       JOIN lingualearn_lessons l ON l.course_id = c.course_id
       WHERE l.lesson_id = $1
       ORDER BY v.difficulty_level, v.word`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

router.get('/:id/grammar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.grammar_id, g.rule_name, g.explanation, g.examples,
              g.usage_notes, g.difficulty_level
       FROM lingualearn_grammar g
       JOIN lingualearn_courses c ON g.language_id = c.language_id
       JOIN lingualearn_lessons l ON l.course_id = c.course_id
       WHERE l.lesson_id = $1
       ORDER BY g.difficulty_level`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get grammar error:', error);
    res.status(500).json({ error: 'Failed to fetch grammar' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, lessonName, lessonOrder, lessonType, content, durationMinutes, difficultyScore, xpReward } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_lessons 
       (course_id, lesson_name, lesson_order, lesson_type, content, duration_minutes, difficulty_score, xp_reward)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [courseId, lessonName, lessonOrder, lessonType, content, durationMinutes || 15, difficultyScore || 1, xpReward || 10]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

export default router;
