const express = require('express');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/auth');
const { triggerN8nWorkflow } = require('../services/n8nService');
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
      title: { $regex: /^(E2E Test|Test Ticket)/ } 
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

    const User = require('../models/User');
    
    // Check if test users already exist
    const existingUser = await User.findOne({ email: 'admin@logisticsco.com' });
    if (existingUser) {
      return res.json({ message: 'Test users already exist' });
    }
    
    // Create test users if they don't exist
    const testUsers = [
      {
        email: 'admin@logisticsco.com',
        password: 'password123',
        name: 'John Smith',
        role: 'Admin',
        customerId: 'logisticsco'
      },
      {
        email: 'admin@retailgmbh.com',
        password: 'password123',
        name: 'Maria Schmidt',
        role: 'Admin',
        customerId: 'retailgmbh'
      }
    ];
    
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
    }
    
    res.json({ message: 'Test users created successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Database seeding failed' });
  }
});

// POST /api/test/workflow/:ticketId - Manually trigger workflow simulation for testing
router.post('/workflow/:ticketId', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Test endpoints only available in test/development mode' });
    }

    const { ticketId } = req.params;
    const axios = require('axios');
    
    console.log(`🧪 Manual workflow test triggered for ticket: ${ticketId}`);
    
    const callbackData = {
      ticketId: ticketId,
      status: 'in-progress',
      workflowStatus: 'completed',
      workflowResult: {
        success: true,
        message: 'Ticket processed by n8n automation workflow (test trigger)',
        processedBy: 'manual-test-trigger',
        timestamp: new Date().toISOString()
      },
      executionId: `test-${Date.now()}`
    };

    await axios.post('http://api:3001/webhook/ticket-done', callbackData, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'flowbit-webhook-secret-2025'
      }
    });
    
    res.json({ 
      success: true, 
      message: 'Workflow simulation triggered successfully',
      ticketId: ticketId
    });
    
  } catch (error) {
    console.error('Test workflow trigger error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/test/create-ticket - Create test ticket without auth
router.post('/create-ticket', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Test endpoints only available in test/development mode' });
    }

    const { title, description, priority, customerId } = req.body;

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@test.com' });
    if (!testUser) {
      testUser = new User({
        email: 'test@test.com',
        name: 'Test User',
        password: 'test123',
        customerId: customerId || 'logisticsco'
      });
      await testUser.save();
    }

    // Create ticket
    const ticket = new Ticket({
      title: title || 'Test Ticket',
      description: description || 'Test ticket for workflow testing',
      priority: priority || 'medium',
      customerId: customerId || 'logisticsco',
      status: 'open',
      createdBy: testUser._id
    });

    await ticket.save();

    // Trigger n8n workflow
    console.log('🎯 Triggering n8n workflow for test ticket:', ticket._id);
    const workflowResult = await triggerN8nWorkflow({
      ticketId: ticket._id.toString(),
      customerId: ticket.customerId,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority
    });

    res.json({
      message: 'Test ticket created and workflow triggered',
      ticket: {
        id: ticket._id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        customerId: ticket.customerId
      },
      workflow: workflowResult
    });
  } catch (error) {
    console.error('Test ticket creation error:', error);
    res.status(500).json({ error: 'Test ticket creation failed' });
  }
});

// GET /api/test/get-ticket/:id - Get ticket by ID without auth
router.get('/get-ticket/:id', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'Test endpoints only available in test/development mode' });
    }

    const ticket = await Ticket.findById(req.params.id).populate('createdBy', 'name email');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      id: ticket._id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customerId: ticket.customerId,
      createdBy: ticket.createdBy,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      workflowId: ticket.workflowId
    });
  } catch (error) {
    console.error('Test ticket get error:', error);
    res.status(500).json({ error: 'Failed to get ticket' });
  }
});

module.exports = router;
