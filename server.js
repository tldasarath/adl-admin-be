// server.js

import express from 'express';
import cors from 'cors';
import env from 'dotenv';
import connectDB from './config/connectDb.js';
import adminroute from './route/admin/indexRoute.js';
import morgan from 'morgan';
import path from "path";
import { fileURLToPath } from "url";  // ⭐ Required for __dirname fix
import publicRoute from './route/public/indexRoute.js';

// Fix __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(morgan("dev"));

// Connect DB
connectDB();

app.use(cors({
  origin: ['http://localhost:5173','http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


env.config();

// Routes
app.use('/public/v1', publicRoute);
app.use('/api/v1/admin', adminroute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
