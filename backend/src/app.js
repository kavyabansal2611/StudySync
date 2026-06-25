import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import { limiter } from './middlewares/limiter.js';
app.use(limiter);

import corsMiddleware from './middlewares/cors.js';
app.use(corsMiddleware);

app.get('/api/status', (req, res) => {
    res.send('Hello, World!');
});

import { verifyJWT } from './middlewares/auth.js';

import authRouter from './routes/auth.routes.js';
import taskRouter from './routes/task.routes.js';
import noteRouter from './routes/note.routes.js';
import eventRouter from './routes/event.routes.js';

app.use('/api/auth', authRouter);
app.use('/api/tasks', verifyJWT, taskRouter);
app.use('/api/notes', verifyJWT, noteRouter);
app.use('/api/events', verifyJWT, eventRouter);

app.use((err, req, res, next) => {
    const statusCode = err?.statusCode || 500;
    const message = err?.message || 'Internal server error';

    res.status(statusCode).json({ message });
});

app.use((req, res) => {
    res.status(404)
        .json(
            { message: "Route not found" }
        )
});

export default app;
