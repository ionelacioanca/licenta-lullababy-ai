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
import calendarRouter from './routes/calendarRoutes.js';
import journalRouter from './routes/journalRoutes.js';
import linkRequestRouter from './routes/linkRequestRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import alertRouter from './routes/alertRoutes.js';
import sleepEventRouter from './routes/sleepEventRoutes.js';
import auth from './middleware/authMiddleware.js';
import cors from 'cors';
import emailService from './services/emailService.js';
import { startEventCheckScheduler } from './services/calendarNotificationService.js';

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
app.use('/api/calendar', calendarRouter);
app.use('/api/journal', journalRouter);
app.use('/api/link-request', linkRequestRouter);
app.use('/api/messages', messageRouter);
app.use('/api/alerts', alertRouter);
app.use('/api/sleep-events', sleepEventRouter);
console.log('Chatbot routes registered at /api');
console.log('Growth routes registered at /api/growth');
console.log('Calendar routes registered at /api/calendar');
console.log('Journal routes registered at /api/journal');
console.log('Link request routes registered at /api/link-request');
console.log('Message routes registered at /api/messages');
console.log('Alert routes registered at /api/alerts');
console.log('Sleep event routes registered at /api/sleep-events');
app.get('/api/private', auth, (req, res) => {
    res.json({ message: 'This is a private route' });
});
app.use('/users', userRouter);


async function main() {
    try {
        await connectDB();
        
        // Verify email service connection
        await emailService.verifyConnection();
        
        // Start calendar notification scheduler
        startEventCheckScheduler();
        
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Server accessible at:`);
            console.log(`  - http://localhost:${PORT}`);
            console.log(`  - http://192.168.1.20:${PORT} (WiFi)`);
        });

        server.on('error', (err) => {
            console.error('Server error:', err);
        });
    } catch (err) {
        console.error("Error starting application:", err);
        process.exit(1);
    }
}

main();
