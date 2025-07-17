const express = require('express');
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');
const path = require('path');
const fs = require('fs');

// Load registry.json from the correct path
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
      return res.status(404).json({ error: 'Tenant configuration not found' });
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

module.exports = router;
