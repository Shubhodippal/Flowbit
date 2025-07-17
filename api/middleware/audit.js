const AuditLog = require('../models/AuditLog');

const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400 && req.user) {
        AuditLog.create({
          action,
          userId: req.user._id,
          customerId: req.user.customerId,
          resourceType,
          resourceId: req.params.id || 'unknown',
          details: {
            method: req.method,
            url: req.originalUrl,
            body: req.method !== 'GET' ? req.body : undefined
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(err => console.error('Audit log error:', err));
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = auditMiddleware;
