import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import { connectDatabase } from './config/database';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import inquiryRoutes from './routes/inquiryRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authRoutes from './routes/authRoutes';
import siteRoutes from './routes/siteRoutes';
import emailRoutes from './routes/emailRoutes';
import { errorHandler } from './middleware/errorHandler';
import { initializeApp, getApps, cert } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://elecrtistore.github.io',
      'http://127.0.0.1:4173',
      'http://localhost:4173',
      'http://127.0.0.1:5000',
      'http://localhost:5000'
    ],
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: [
    'https://elecrtistore.github.io',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://127.0.0.1:5000',
    'http://localhost:5000'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://electrishop-80dd6.firebaseio.com', 'https://identitytoolkit.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    }
  }
}));
app.use(express.json({ limit: '100kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Try service account file (path from env or common locations)
const svcPathFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const candidatePaths: string[] = [];
if (svcPathFromEnv) candidatePaths.push(path.resolve(svcPathFromEnv));
candidatePaths.push(path.resolve(__dirname, '..', '..', 'firebase-service-account.json'));
candidatePaths.push(path.resolve(__dirname, '..', '..', 'serviceAccountKey.json'));
candidatePaths.push(path.resolve(__dirname, '..', 'serviceAccountKey.json'));

let serviceAccount: any = null;
for (const p of candidatePaths) {
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      serviceAccount = JSON.parse(raw);
      console.log('Loaded Firebase service account from', p);
      break;
    }
  } catch (e) {
    // ignore parse/read errors and try next
  }
}

if (getApps().length === 0) {
  if (serviceAccount) {
    initializeApp({ credential: cert(serviceAccount) });
    console.log('firebase-admin initialized using service account file');
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      } as any)
    });
    console.log('firebase-admin initialized using env FIREBASE_PRIVATE_KEY');
  } else {
    console.warn('No Firebase credentials found; initializing with default credentials');
    try {
      initializeApp();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.warn('firebase-admin default initialization failed:', errMsg);
    }
  }
}

app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/email', emailRoutes);
app.use(errorHandler);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
});

const port = process.env.PORT || 5000;

connectDatabase(process.env.MONGODB_URI || '')
  .then(() => {
    server.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed', error);
    process.exit(1);
  });
