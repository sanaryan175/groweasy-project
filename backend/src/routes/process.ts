import { Router, Request, Response } from 'express';
import { extractInBatches } from '../services/ai-extractor';

const processRouter = Router();

processRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'No rows provided for processing' });
      return;
    }

    const batchSize = req.body.batchSize || 10;
    const result = await extractInBatches(rows, batchSize);

    res.json({
      imported: result.imported,
      skipped: result.skipped,
      totalImported: result.imported.length,
      totalSkipped: result.skipped.length,
      totalRows: rows.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'AI processing failed: ' + (err as Error).message });
  }
});

export { processRouter };
