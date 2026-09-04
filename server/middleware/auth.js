const jwt = require('jwt-simple');

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.decode(token, secret);
    
    req.userId = decoded.userId;
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = auth;
