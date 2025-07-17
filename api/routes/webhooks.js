const express = require('express');
const Ticket = require('../models/Ticket');
const { verifyWebhookSecret } = require('../services/webhookService');
const router = express.Router();

// POST /webhook/ticket-done
router.post('/ticket-done', async (req, res) => {
  try {
    // Verify webhook secret
    const isValid = verifyWebhookSecret(req.headers['x-webhook-secret']);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }

    const { ticketId, status, workflowResult, executionId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }

    // Find and update ticket
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Update ticket status based on workflow result
    const updates = {
      workflowStatus: 'completed',
      workflowId: executionId || ticket.workflowId
    };

    if (status) {
      updates.status = status;
    } else {
      // Default status update based on workflow result
      updates.status = workflowResult?.success ? 'in-progress' : 'open';
    }

    // Add workflow result as a comment
    if (workflowResult) {
      ticket.comments.push({
        text: `Workflow completed: ${workflowResult.message || 'Processing completed'}`,
        author: null, // System comment
        createdAt: new Date()
      });
    }

    Object.assign(ticket, updates);
    await ticket.save();

    console.log(`Webhook processed for ticket ${ticketId}: status=${updates.status}, workflowStatus=${updates.workflowStatus}`);

    res.json({ 
      success: true, 
      message: 'Ticket updated successfully',
      ticketId,
      status: updates.status
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /webhook/n8n-test (for testing)
router.post('/n8n-test', (req, res) => {
  console.log('n8n test webhook received:', req.body);
  res.json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

module.exports = router;
