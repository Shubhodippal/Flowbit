const request = require('supertest');
const app = require('../server');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('./setup'); // This sets up the test database connection

describe('n8n Workflow Integration', () => {
  let token, user, ticketId;

  beforeAll(async () => {
    // Create test user
    user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      customerId: 'TEST001',
      role: 'User'
    });
    await user.save();

    // Generate JWT token
    token = jwt.sign(
      { 
        userId: user._id, 
        customerId: user.customerId,
        role: user.role 
      },
      process.env.JWT_SECRET || 'test-secret'
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Ticket.deleteMany({});
  });

  beforeEach(async () => {
    await Ticket.deleteMany({});
  });

  describe('POST /api/tickets - n8n Workflow Trigger', () => {
    it('should create ticket and trigger n8n workflow', async () => {
      const ticketData = {
        title: 'Test workflow ticket',
        description: 'Testing n8n workflow integration',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(ticketData.title);
      expect(response.body.customerId).toBe(user.customerId);
      
      // Check if workflow fields are set
      expect(response.body).toHaveProperty('workflowStatus');
      
      ticketId = response.body._id;
    });

    it('should handle workflow trigger failure gracefully', async () => {
      // This test ensures ticket creation still works even if n8n is down
      const ticketData = {
        title: 'Test ticket without workflow',
        description: 'Testing graceful failure handling',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${token}`)
        .send(ticketData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe(ticketData.title);
    });
  });

  describe('POST /webhook/ticket-done - Workflow Callback', () => {
    beforeEach(async () => {
      // Create a test ticket
      const ticket = new Ticket({
        title: 'Test callback ticket',
        description: 'Testing webhook callback',
        priority: 'medium',
        customerId: user.customerId,
        createdBy: user._id,
        workflowStatus: 'processing'
      });
      await ticket.save();
      ticketId = ticket._id.toString();
    });

    it('should update ticket status via webhook with valid secret', async () => {
      const webhookData = {
        ticketId: ticketId,
        status: 'in-progress',
        workflowResult: {
          success: true,
          message: 'Workflow completed successfully'
        },
        executionId: 'test-execution-123'
      };

      const response = await request(app)
        .post('/webhook/ticket-done')
        .set('x-webhook-secret', process.env.WEBHOOK_SECRET || 'flowbit-webhook-secret-2025')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.ticketId).toBe(ticketId);

      // Verify ticket was updated
      const updatedTicket = await Ticket.findById(ticketId);
      expect(updatedTicket.status).toBe('in-progress');
      expect(updatedTicket.workflowStatus).toBe('completed');
      expect(updatedTicket.workflowId).toBe('test-execution-123');
      expect(updatedTicket.comments).toHaveLength(1);
      expect(updatedTicket.comments[0].text).toContain('Workflow completed');
    });

    it('should reject webhook with invalid secret', async () => {
      const webhookData = {
        ticketId: ticketId,
        status: 'in-progress'
      };

      await request(app)
        .post('/webhook/ticket-done')
        .set('x-webhook-secret', 'invalid-secret')
        .send(webhookData)
        .expect(401);

      // Verify ticket was NOT updated
      const ticket = await Ticket.findById(ticketId);
      expect(ticket.status).toBe('open'); // Should remain unchanged
    });

    it('should handle missing ticket gracefully', async () => {
      const webhookData = {
        ticketId: '507f1f77bcf86cd799439011', // Non-existent ID
        status: 'in-progress'
      };

      await request(app)
        .post('/webhook/ticket-done')
        .set('x-webhook-secret', process.env.WEBHOOK_SECRET || 'flowbit-webhook-secret-2025')
        .send(webhookData)
        .expect(404);
    });

    it('should require ticketId in webhook payload', async () => {
      const webhookData = {
        status: 'in-progress'
        // Missing ticketId
      };

      await request(app)
        .post('/webhook/ticket-done')
        .set('x-webhook-secret', process.env.WEBHOOK_SECRET || 'flowbit-webhook-secret-2025')
        .send(webhookData)
        .expect(400);
    });
  });

  describe('n8n Test Webhook', () => {
    it('should accept test webhook calls', async () => {
      const testData = {
        message: 'Test from n8n',
        timestamp: new Date().toISOString()
      };

      const response = await request(app)
        .post('/webhook/n8n-test')
        .send(testData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Test webhook received');
    });
  });
});
