import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../routes/auth.routes.js';

const app = express();
app.set('trust proxy', true);
app.use('/auth',authRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import { limiter } from './middlewares/limiter.js';
app.use(limiter);

import corsMiddleware from './middlewares/cors.js';
app.use(corsMiddleware);

// Define your routes here
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

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