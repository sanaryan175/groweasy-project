import { Router, Request, Response } from 'express';
import { extractInBatches } from '../services/ai-extractor';
import type { ColumnMapping } from '../types/column-mapping';

const processRouter = Router();

processRouter.post('/', async (req: Request, res: Response) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: 'No rows provided for processing' });
    return;
  }

  const defaultBatchSize = parseInt(process.env.GROQ_BATCH_SIZE || '50', 10);
  const defaultConcurrency = parseInt(process.env.GROQ_CONCURRENCY || '5', 10);
  const batchSize = req.body.batchSize ?? defaultBatchSize;
  const concurrency = req.body.concurrency ?? defaultConcurrency;
  const mappings: ColumnMapping[] | undefined = req.body.mappings;

  res.setHeader('Content-Type', 'application/x-ndjson');

  try {
    const result = await extractInBatches(
      rows,
      batchSize,
      (imported, skipped, total) => {
        res.write(JSON.stringify({ type: 'progress', imported, skipped, total }) + '\n');
      },
      concurrency,
      mappings
    );

    res.write(JSON.stringify({ type: 'done', imported: result.imported, skipped: result.skipped }) + '\n');
  } catch (err) {
    res.write(JSON.stringify({ type: 'error', message: 'AI processing failed: ' + (err as Error).message }) + '\n');
  }

  res.end();
});

export { processRouter };
