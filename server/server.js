import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import apiRoutes from './routes/api.js';

import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 5000;

// Socket.io integration for video feed
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('candidate_frame', (data) => {
    // Expected data: { candidateId, name, role, duration, flags, frame (base64 string) }
    // Broadcast to all admins (everyone else)
    socket.broadcast.emit('live_frame', { ...data, socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
    socket.broadcast.emit('candidate_disconnected', { socketId: socket.id });
  });
});

// Middleware
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: '🚀 VyorAI API is running',
    healthCheck: '/api/health',
    version: '1.0.0'
  });
});

app.use('/api', apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: err.message });
  }
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  console.log('🔄 Connecting to MongoDB...');
  console.log('📍 URI exists:', !!process.env.MONGODB_URI);
  await connectDB();
  console.log('🌐 Server initializing...');
  // Only start the server if not running as a Vercel function
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    server.listen(PORT, () => {
      console.log(`🚀 VyorAI Server running on http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
    });
  }
};

startServer();

export default server;
