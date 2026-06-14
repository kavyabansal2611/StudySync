import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define your routes here
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

export default app;