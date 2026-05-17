import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import notesRoutes from './src/routes/notes.routes.js';
import sharedRoutes from './src/routes/shared.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import morgan from 'morgan';
import cors from 'cors';


const app = express();
dotenv.config();

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser tools (Postman/curl) and configured frontend origins
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS blocked for this origin'));
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
}));

app.use(express.json()); // Middleware to parse JSON bodies
app.use(morgan('dev')); // Logging middleware for development

const port = process.env.PORT || 5000;
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/shared', sharedRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.send('Hello World! from Co-Mind Server');
})

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();