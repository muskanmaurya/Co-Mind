import express from 'express';
import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import notesRoutes from './src/routes/notes.routes.js';
import sharedRoutes from './src/routes/shared.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import morgan from 'morgan';

const app = express();
dotenv.config();

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