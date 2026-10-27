import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { handleApiRequest } from './src/server/apiHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API route middleware
app.use('/api', async (req, res, next) => {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      res.status(404).json({ error: 'API route not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// Serve static frontend assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`IMovies server running on port ${PORT}`);
});
