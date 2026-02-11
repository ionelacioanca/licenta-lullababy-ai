import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) {
        console.log('🔒 Auth: No token provided');
        return res.status(401).json({ message: 'Access denied' });
    }
    
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log('🔓 Auth: Token decoded:', { userId: decode._id || decode.id, email: decode.email });
        req.user = decode;
        next();
    } catch (error) {
        console.log('❌ Auth: Invalid token:', error.message);
        res.status(400).json({ message: 'Invalid token' });
    }
};

export default auth;
