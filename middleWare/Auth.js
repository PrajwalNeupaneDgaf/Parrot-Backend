const jwt = require('jsonwebtoken');

const Auth = async (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: 'Authentication token missing. Please login.',
            });
        }

        // Verifying the Token
        const data = jwt.verify(token, process.env.SECRET);
        req.user = data;
        next();
    } catch (error) {
        const message =
            error.name === 'TokenExpiredError'
                ? 'Token has expired. Please login again.'
                : 'Invalid token. Please login again.';
        return res.status(401).json({ message });
    }
};

module.exports = Auth;
