import './config/env.js';
import app from './app.js';
import { connectDB } from './db/connect.js';

connectDB()
    .then(() => {
        console.log('Connected to the database');
        const PORT = process.env.SERVER_PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to connect to the database:', error);
        process.exit(1);
    });
