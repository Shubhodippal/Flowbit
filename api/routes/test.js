const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// POST /api/test/setup - Setup test data
router.post('/setup', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Test endpoints only available in test/development mode' });
    }

    // Clean existing test data
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Ticket.deleteMany({ title: { $regex: /^E2E Test/ } });
    await AuditLog.deleteMany({ action: { $regex: /^test_/ } });

    res.json({ message: 'Test setup completed' });
  } catch (error) {
    console.error('Test setup error:', error);
    res.status(500).json({ error: 'Test setup failed' });
  }
});

// DELETE /api/test/cleanup - Cleanup test data
router.delete('/cleanup', authMiddleware, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Test endpoints only available in test/development mode' });
    }

    // Clean test data for current tenant only
    const deleted = await Ticket.deleteMany({ 
      customerId: req.customerId,
      title: { $regex: /^(E2E Test|Test Ticket|Cypress Test)/ } 
    });

    await AuditLog.deleteMany({ 
      customerId: req.customerId,
      action: { $regex: /^test_/ }
    });

    res.json({ 
      message: 'Test cleanup completed',
      deletedTickets: deleted.deletedCount
    });
  } catch (error) {
    console.error('Test cleanup error:', error);
    res.status(500).json({ error: 'Test cleanup failed' });
  }
});

// POST /api/seed - Seed database with test data
router.post('/seed', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Seed endpoint not available in production' });
    }

    // Run the seed script
    require('../../seed');
    
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Database seeding failed' });
  }
});

module.exports = router;
