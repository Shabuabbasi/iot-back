import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import wasteRoutes from './routes/waste.routes.js';
import taskRoutes from './routes/task.routes.js';
import userRoutes from './routes/user.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import supportRoutes from './routes/support.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store io in app for access in controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to handle raw binary image data from ESP32
app.use(express.raw({ 
  type: 'image/*', 
  limit: '50mb' 
}));

// Middleware to capture raw body for image uploads
app.use((req, res, next) => {
  if (req.is('image/*')) {
    req.rawBody = req.body;
  }
  next();
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  socket.on("join", (role) => {
    socket.join(role);
    console.log(`Socket ${socket.id} joined room: ${role}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is healthy' });
});

// Start the server
const PORT = process.env.PORT || 5000;  
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
}); 