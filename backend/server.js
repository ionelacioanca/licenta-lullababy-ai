import express from 'express';
import bodyParser from 'body-parser';
import userRouter from './routes/userRoutes.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import authRouter from './routes/userRoutes.js';
import babyRouter from './routes/babyRoutes.js';
import auth from './middleware/authMiddleware.js';
import cors from 'cors';

dotenv.config(); 
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

app.use('/api', authRouter);
app.use('/api', babyRouter);
app.get('/api/private', auth, (req, res) => {
    res.json({ message: 'This is a private route' });
});
app.use('/users', userRouter);


async function main() {
    await connectDB(); 
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

main().catch(err => console.error("Eroare la pornirea aplicației:", err));
