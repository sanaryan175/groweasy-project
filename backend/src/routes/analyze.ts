import { Router, Request, Response } from 'express';
import { analyzeColumns } from '../services/column-mapper';

const analyzeRouter = Router();

analyzeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { headers, sampleRows } = req.body;

    if (!Array.isArray(headers) || headers.length === 0) {
      res.status(400).json({ error: 'No headers provided' });
      return;
    }

    const analysis = await analyzeColumns(headers, sampleRows || []);

    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Column analysis failed: ' + (err as Error).message });
  }
});

export { analyzeRouter };
