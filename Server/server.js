import express from 'express';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './src/config/database.js';
import authRoutes from './src/routes/auth.routes.js';
import notesRoutes from './src/routes/notes.routes.js';
import sharedRoutes from './src/routes/shared.routes.js';
import dashboardRoutes from './src/routes/dashboard.routes.js';
import noteModel from './src/models/notes.model.js';
import userModel from './src/models/user.model.js';
import morgan from 'morgan';
import cors from 'cors';


const app = express();
const httpServer = createServer(app);
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

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
    },
});

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-note', async (payload = {}) => {
        try {
            const { noteId, userEmail, token } = payload;
            if (!noteId || !userEmail || !token) {
                socket.emit('collab-error', { message: 'Missing collaboration credentials' });
                return;
            }

            if (!process.env.JWT_SECRET) {
                socket.emit('collab-error', { message: 'Realtime auth misconfigured' });
                return;
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            let decodedEmail = String(decoded?.email || '').toLowerCase().trim();
            const requestedEmail = String(userEmail || '').toLowerCase().trim();

            if (!decodedEmail && decoded?.userId) {
                const tokenUser = await userModel.findById(decoded.userId).select('email').lean();
                decodedEmail = String(tokenUser?.email || '').toLowerCase().trim();
            }

            if (!decoded?.userId || !decodedEmail || decodedEmail !== requestedEmail) {
                socket.emit('collab-error', { message: 'Realtime identity verification failed' });
                return;
            }

            const note = await noteModel.findById(noteId).select('userId collaborators').lean();
            if (!note) {
                socket.emit('collab-error', { message: 'Note not found for collaboration' });
                return;
            }

            const isOwner = note.userId?.toString() === decoded.userId;
            const collaborator = Array.isArray(note.collaborators)
                ? note.collaborators.find((entry) => String(entry.email || '').toLowerCase().trim() === requestedEmail)
                : null;
            const canRead = isOwner || Boolean(collaborator);
            const canEdit = isOwner || collaborator?.role === 'editor';

            if (!canRead) {
                socket.emit('collab-error', { message: 'Access denied for this note room' });
                return;
            }

            socket.join(noteId);
            socket.data.noteId = noteId;
            socket.data.userEmail = requestedEmail;
            socket.data.canEdit = canEdit;

            socket.emit('collab-authorized', {
                noteId,
                canEdit,
                role: isOwner ? 'owner' : collaborator?.role || 'viewer',
            });

            console.log(`User ${socket.id} joined note room: ${noteId} (${requestedEmail})`);
        } catch (error) {
            socket.emit('collab-error', { message: 'Unable to join note room' });
        }
    });

    socket.on('edit-note', (data) => {
        if (!data?.noteId || socket.data.noteId !== data.noteId) return;
        if (!socket.data.canEdit) {
            socket.emit('collab-error', { message: 'Read-only collaborators cannot edit this note' });
            return;
        }

        socket.to(data.noteId).emit('note-updated', {
            content: data.content,
            title: data.title,
            senderEmail: socket.data.userEmail,
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const port = process.env.PORT || 8000;
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

        httpServer.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();