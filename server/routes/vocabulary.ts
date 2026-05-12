import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { languageId, difficulty, search } = req.query;
    let query = `
      SELECT v.vocab_id, v.word, v.pronunciation, v.translation,
             v.part_of_speech, v.example_sentences, v.audio_url, v.image_url,
             v.difficulty_level, v.tags, v.frequency_rank, l.language_name
      FROM lingualearn_vocabulary v
      JOIN lingualearn_languages l ON v.language_id = l.language_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` AND v.language_id = $${params.length}`;
    }
    if (difficulty) {
      params.push(parseInt(difficulty as string));
      query += ` AND v.difficulty_level = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (v.word ILIKE $${params.length} OR v.translation ILIKE $${params.length})`;
    }

    query += ' ORDER BY v.difficulty_level, v.frequency_rank NULLS LAST, v.word';
    query += ' LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.vocab_id, v.word, v.pronunciation, v.translation,
              v.part_of_speech, v.example_sentences, v.audio_url, v.image_url,
              v.difficulty_level, v.tags, v.frequency_rank, l.language_name
       FROM lingualearn_vocabulary v
       JOIN lingualearn_languages l ON v.language_id = l.language_id
       WHERE v.vocab_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

router.get('/flashcards/:languageId', async (req: Request, res: Response) => {
  try {
    const { languageId } = req.params;
    const { count = 20, difficulty } = req.query;

    let query = `
      SELECT v.vocab_id, v.word, v.pronunciation, v.translation,
             v.part_of_speech, v.example_sentences, v.audio_url, v.image_url,
             v.difficulty_level
      FROM lingualearn_vocabulary v
      WHERE v.language_id = $1
    `;
    const params: any[] = [languageId];

    if (difficulty) {
      params.push(parseInt(difficulty as string));
      query += ` AND v.difficulty_level = $${params.length}`;
    }

    query += ' ORDER BY RANDOM() LIMIT $' + (params.length + 1);
    params.push(parseInt(count as string));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get flashcards error:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { languageId, word, pronunciation, translation, partOfSpeech, exampleSentences, audioUrl, imageUrl, difficultyLevel, tags } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_vocabulary
       (language_id, word, pronunciation, translation, part_of_speech, example_sentences, audio_url, image_url, difficulty_level, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [languageId, word, pronunciation, translation, partOfSpeech, exampleSentences, audioUrl, imageUrl, difficultyLevel || 1, tags]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create vocabulary error:', error);
    res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

export default router;
