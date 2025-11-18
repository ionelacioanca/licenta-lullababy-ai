import express from 'express';
import bodyParser from 'body-parser';
import userRouter from './routes/userRoutes.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import authRouter from './routes/userRoutes.js';
import babyRouter from './routes/babyRoutes.js';
import soundRouter from './routes/soundRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import growthRouter from './routes/growthRoutes.js';
import auth from './middleware/authMiddleware.js';
import cors from 'cors';

dotenv.config(); 
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

app.use('/api', authRouter);
app.use('/api', babyRouter);
app.use('/api/sounds', soundRouter);
app.use('/api', chatbotRoutes);
app.use('/api/growth', growthRouter);
console.log('Chatbot routes registered at /api');
console.log('Growth routes registered at /api/growth');
app.get('/api/private', auth, (req, res) => {
    res.json({ message: 'This is a private route' });
});
app.use('/users', userRouter);


async function main() {
    await connectDB(); 
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Server accessible at:`);
        console.log(`  - http://localhost:${PORT}`);
    console.log(`  - http://192.168.1.10:${PORT} (WiFi)`);
    });
}

main().catch(err => console.error("Eroare la pornirea aplicației:", err));
