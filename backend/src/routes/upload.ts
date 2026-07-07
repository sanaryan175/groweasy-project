import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV } from '../services/csv-parser';

const uploadRouter = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

uploadRouter.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const content = req.file.buffer.toString('utf-8');
    const parsed = parseCSV(content);

    if (parsed.totalRows === 0) {
      res.status(400).json({ error: 'CSV file is empty or has no data rows' });
      return;
    }

    res.json({
      filename: req.file.originalname,
      size: req.file.size,
      headers: parsed.headers,
      rows: parsed.rows.slice(0, 20),
      totalRows: parsed.totalRows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse CSV: ' + (err as Error).message });
  }
});

export { uploadRouter };
