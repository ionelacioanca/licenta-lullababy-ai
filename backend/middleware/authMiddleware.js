import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; 

    if (!token) return res.status(401).json({ message: 'Access denied' });
    
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

export default auth;
