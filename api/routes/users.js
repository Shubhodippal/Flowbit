const express = require('express');
const { authMiddleware, tenantMiddleware, adminMiddleware } = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');
const path = require('path');
const fs = require('fs');

// Load registry.json from the root directory
let registry;
try {
  const registryPath = path.join(__dirname, '../../registry.json');
  registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
} catch (error) {
  console.error('Could not load registry.json:', error.message);
  // Fallback registry configuration
  registry = {
    tenants: {
      logisticsco: {
        name: "LogisticsCo",
        customerId: "logisticsco",
        screens: [
          {
            id: "support-tickets",
            name: "Support Tickets",
            url: "http://localhost:3002/remoteEntry.js",
            scope: "supportTicketsApp",
            module: "./SupportTicketsApp"
          }
        ]
      },
      retailgmbh: {
        name: "RetailGmbH",
        customerId: "retailgmbh",
        screens: [
          {
            id: "support-tickets",
            name: "Support Tickets",
            url: "http://localhost:3002/remoteEntry.js",
            scope: "supportTicketsApp",
            module: "./SupportTicketsApp"
          }
        ]
      },
      "INTEGRATION-TEST": {
        name: "Integration Test Tenant",
        customerId: "INTEGRATION-TEST",
        screens: [
          {
            id: "support-tickets",
            name: "Support Tickets",
            url: "http://localhost:3002/remoteEntry.js",
            scope: "supportTicketsApp",
            module: "./SupportTicketsApp"
          }
        ]
      }
    }
  };
}
const User = require('../models/User');
const router = express.Router();

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user,
      customerId: req.customerId
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/me/screens
router.get('/me/screens', authMiddleware, async (req, res) => {
  try {
    const tenant = registry.tenants[req.customerId];
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant configuration not found',
        requestedTenant: req.customerId,
        availableTenants: Object.keys(registry.tenants)
      });
    }

    res.json({
      screens: tenant.screens,
      tenantName: tenant.name
    });
  } catch (error) {
    console.error('Get screens error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users (Admin only)
router.get('/', 
  authMiddleware, 
  adminMiddleware,
  tenantMiddleware,
  auditMiddleware('list_users', 'user'),
  async (req, res) => {
    try {
      // Admin can see all users in their tenant
      const users = await User.find(req.tenantFilter).select('-password');
      res.json(users);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Admin-only routes with /admin prefix
router.get('/dashboard-stats', 
  authMiddleware, 
  adminMiddleware,
  tenantMiddleware,
  auditMiddleware('view_admin_stats', 'admin'),
  async (req, res) => {
    try {
      const Ticket = require('../models/Ticket');
      const AuditLog = require('../models/AuditLog');

      const stats = {
        totalUsers: await User.countDocuments(req.tenantFilter),
        totalTickets: await Ticket.countDocuments(req.tenantFilter),
        openTickets: await Ticket.countDocuments({ ...req.tenantFilter, status: 'open' }),
        recentActivity: await AuditLog.find(req.tenantFilter)
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('userId', 'name email')
      };

      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/audit-logs', 
  authMiddleware, 
  adminMiddleware,
  tenantMiddleware,
  auditMiddleware('view_audit_logs', 'admin'),
  async (req, res) => {
    try {
      const AuditLog = require('../models/AuditLog');
      const { page = 1, limit = 50 } = req.query;

      const logs = await AuditLog.find(req.tenantFilter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await AuditLog.countDocuments(req.tenantFilter);

      res.json({
        logs,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Audit logs error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
