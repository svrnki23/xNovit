/**
 * xNovit Backend API
 * Trip planning, AI-powered stops, weather, rewards.
 * Set OPENAI_API_KEY in .env for AI features; otherwise uses fallback logic.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { tripsRouter } from './routes/trips.js';
import { stopsRouter } from './routes/stops.js';
import { emergencyRouter } from './routes/emergency.js';
import { rewardsRouter } from './routes/rewards.js';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xnovit-api' });
});

app.use('/api/trips', tripsRouter);
app.use('/api/stops', stopsRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/rewards', rewardsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`xNovit API running at http://localhost:${port}`);
    if (port !== DEFAULT_PORT) {
      console.log(`(Port ${DEFAULT_PORT} was in use. iOS app will try both 3000 and 3001 automatically.)`);
    }
    if (!process.env.OPENAI_API_KEY) {
      console.log('No OPENAI_API_KEY set — using fallback (non-AI) trip and stop generation.');
    }
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === DEFAULT_PORT && DEFAULT_PORT < 3010) {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      throw err;
    }
  });
}

startServer(DEFAULT_PORT);
