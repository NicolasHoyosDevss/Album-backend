import cors from 'cors';
import express from 'express';
import albumRoutes from './routes/albumRoutes.js';
import { AppError } from './services/albumService.js';

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(['http://localhost:5173', ...configuredOrigins]);

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
}));

app.use(express.json());
app.use('/api', albumRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  const isKnownError = error instanceof AppError;
  const statusCode = isKnownError ? error.statusCode : 500;
  const message = isKnownError ? error.message : 'Internal server error';

  if (!isKnownError) {
    console.error(error);
  }

  res.status(statusCode).json({ error: message });
});

export default app;