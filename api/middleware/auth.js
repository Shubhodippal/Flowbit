const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type. Access token required.' });
    }
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user inactive.' });
    }

    req.user = user;
    req.customerId = user.customerId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        code: 'TOKEN_EXPIRED' 
      });
    }
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const tenantMiddleware = (req, res, next) => {
  // Add tenant isolation check
  req.tenantFilter = { customerId: req.customerId };
  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  tenantMiddleware
};
