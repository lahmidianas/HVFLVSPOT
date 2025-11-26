import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import systemAuthRoutes from './routes/systemAuth.js';
import paymentRoutes from './routes/payment.js';
import notificationRoutes from './routes/notifications.js';
import ticketingRoutes from './routes/ticketing/index.js';
import organizerRoutes from './routes/organizer/events.js';
import { EventSearchController } from './controllers/event/EventSearchController.js';
import { EventRecommendationController } from './controllers/event/EventRecommendationController.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize controllers
const eventSearchController = new EventSearchController();
const eventRecommendationController = new EventRecommendationController();

// Configure CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/auth', systemAuthRoutes);
app.use('/payment', paymentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/tickets', ticketingRoutes);
app.use('/organizer/events', organizerRoutes);

// Event API routes
app.get('/events/search', (req, res) => eventSearchController.searchEvents(req, res));
app.get('/events/recommended', (req, res) => eventRecommendationController.getRecommendedEvents(req, res));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`CORS enabled for: http://localhost:5173`);
});