const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Authenticate JWT and attach user info to req.user
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Authorize by role(s)
exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role))
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
    next();
};