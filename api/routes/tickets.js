const express = require('express');
const Joi = require('joi');
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');
const auditMiddleware = require('../middleware/audit');
const Ticket = require('../models/Ticket');
const { triggerN8nWorkflow } = require('../services/n8nService');
const router = express.Router();

// Validation schemas
const createTicketSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  tags: Joi.array().items(Joi.string()).optional()
});

const updateTicketSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  description: Joi.string().min(10).optional(),
  status: Joi.string().valid('open', 'in-progress', 'resolved', 'closed').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assignedTo: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// GET /api/tickets
router.get('/', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('list_tickets', 'ticket'),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, priority } = req.query;
      const filter = { ...req.tenantFilter };
      
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      const tickets = await Ticket.find(filter)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Ticket.countDocuments(filter);

      res.json({
        tickets,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/tickets/:id
router.get('/:id', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('view_ticket', 'ticket'),
  async (req, res) => {
    try {
      const ticket = await Ticket.findOne({ 
        _id: req.params.id, 
        ...req.tenantFilter 
      })
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .populate('comments.author', 'name email');

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/tickets
router.post('/', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('create_ticket', 'ticket'),
  async (req, res) => {
    try {
      const { error, value } = createTicketSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const ticket = new Ticket({
        ...value,
        customerId: req.customerId,
        createdBy: req.user._id
      });

      await ticket.save();
      await ticket.populate('createdBy', 'name email');

      // Trigger n8n workflow
      try {
        const workflowResult = await triggerN8nWorkflow({
          ticketId: ticket._id.toString(),
          customerId: req.customerId,
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority
        });

        if (workflowResult && workflowResult.executionId) {
          ticket.workflowId = workflowResult.executionId;
          ticket.workflowStatus = 'processing';
          await ticket.save();
        }
      } catch (workflowError) {
        console.error('Workflow trigger error:', workflowError);
        // Don't fail ticket creation if workflow fails
      }

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// PUT /api/tickets/:id
router.put('/:id', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('update_ticket', 'ticket'),
  async (req, res) => {
    try {
      const { error, value } = updateTicketSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const ticket = await Ticket.findOneAndUpdate(
        { _id: req.params.id, ...req.tenantFilter },
        value,
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json(ticket);
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/tickets/:id
router.delete('/:id', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('delete_ticket', 'ticket'),
  async (req, res) => {
    try {
      const ticket = await Ticket.findOneAndDelete({ 
        _id: req.params.id, 
        ...req.tenantFilter 
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      res.json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// POST /api/tickets/:id/comments
router.post('/:id/comments', 
  authMiddleware, 
  tenantMiddleware,
  auditMiddleware('add_comment', 'ticket'),
  async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim().length < 1) {
        return res.status(400).json({ error: 'Comment text is required' });
      }

      const ticket = await Ticket.findOne({ 
        _id: req.params.id, 
        ...req.tenantFilter 
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      ticket.comments.push({
        text: text.trim(),
        author: req.user._id,
        createdAt: new Date()
      });

      await ticket.save();
      await ticket.populate('comments.author', 'name email');

      res.json(ticket);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;
