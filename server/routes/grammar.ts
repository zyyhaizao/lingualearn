import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { languageId, difficulty } = req.query;
    let query = `
      SELECT g.grammar_id, g.rule_name, g.explanation, g.examples,
             g.usage_notes, g.difficulty_level, g.related_grammar_ids, l.language_name
      FROM lingualearn_grammar g
      JOIN lingualearn_languages l ON g.language_id = l.language_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` AND g.language_id = $${params.length}`;
    }
    if (difficulty) {
      params.push(parseInt(difficulty as string));
      query += ` AND g.difficulty_level = $${params.length}`;
    }

    query += ' ORDER BY g.difficulty_level, g.rule_name';
    query += ' LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get grammar error:', error);
    res.status(500).json({ error: 'Failed to fetch grammar' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT g.grammar_id, g.rule_name, g.explanation, g.examples,
              g.usage_notes, g.difficulty_level, g.related_grammar_ids, l.language_name
       FROM lingualearn_grammar g
       JOIN lingualearn_languages l ON g.language_id = l.language_id
       WHERE g.grammar_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grammar rule not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get grammar error:', error);
    res.status(500).json({ error: 'Failed to fetch grammar' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { languageId, ruleName, explanation, examples, usageNotes, difficultyLevel, relatedGrammarIds } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_grammar
       (language_id, rule_name, explanation, examples, usage_notes, difficulty_level, related_grammar_ids)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [languageId, ruleName, explanation, examples, usageNotes, difficultyLevel || 1, relatedGrammarIds]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create grammar error:', error);
    res.status(500).json({ error: 'Failed to create grammar rule' });
  }
});

export default router;
