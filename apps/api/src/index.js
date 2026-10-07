/**
 * xNovit Backend API
 * Every place shown to a user must come from a real data source (build brief, section 0.7).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'xnovit-api' });
});


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
