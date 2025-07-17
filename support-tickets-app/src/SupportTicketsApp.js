import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Configure axios
const api = axios.create({
  baseURL: API_URL,
});

// Add token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const SupportTicketsApp = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: ''
  });

  const priorityColors = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error'
  };

  const statusColors = {
    open: 'primary',
    'in-progress': 'warning',
    resolved: 'success',
    closed: 'default'
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/tickets');
      setTickets(response.data.tickets || []);
      setError('');
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await api.post('/api/tickets', payload);
      
      setOpenDialog(false);
      resetForm();
      fetchTickets();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(err.response?.data?.error || 'Failed to create ticket');
    }
  };

  const handleUpdateTicket = async () => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await api.put(`/api/tickets/${editingTicket._id}`, payload);
      
      setOpenDialog(false);
      setEditingTicket(null);
      resetForm();
      fetchTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError(err.response?.data?.error || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) {
      return;
    }

    try {
      await api.delete(`/api/tickets/${ticketId}`);
      fetchTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError(err.response?.data?.error || 'Failed to delete ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await api.put(`/api/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const openEditDialog = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      tags: ticket.tags?.join(', ') || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      tags: ''
    });
  };

  const getWorkflowStatusChip = (ticket) => {
    if (!ticket.workflowStatus || ticket.workflowStatus === 'pending') {
      return null;
    }

    const colors = {
      processing: 'info',
      completed: 'success',
      failed: 'error'
    };

    return (
      <Chip
        label={`Workflow: ${ticket.workflowStatus}`}
        color={colors[ticket.workflowStatus] || 'default'}
        size="small"
        sx={{ ml: 1 }}
      />
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Support Tickets
          </Typography>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchTickets} sx={{ mr: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              data-testid="new-ticket-button"
            >
              New Ticket
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {tickets.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="h6" align="center" color="text.secondary">
                No tickets found. Create your first ticket to get started!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {tickets.map((ticket) => (
              <Grid item xs={12} md={6} lg={4} key={ticket._id}>
                <Card data-testid={`ticket-card-${ticket._id}`}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                        {ticket.title}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openEditDialog(ticket)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteTicket(ticket._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {ticket.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip
                        label={ticket.status}
                        color={statusColors[ticket.status]}
                        size="small"
                      />
                      <Chip
                        label={ticket.priority}
                        color={priorityColors[ticket.priority]}
                        size="small"
                      />
                      {getWorkflowStatusChip(ticket)}
                    </Box>

                    {ticket.tags && ticket.tags.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {ticket.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    )}

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </Typography>
                    
                    {ticket.createdBy && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        By: {ticket.createdBy.name}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={ticket.status}
                        label="Status"
                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        data-testid={`ticket-status-select-${ticket._id}`}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
          </DialogTitle>
          <DialogContent data-testid="ticket-dialog">
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
              data-testid="ticket-title-input"
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
              data-testid="ticket-description-input"
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                data-testid="ticket-priority-select"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Tags (comma separated)"
              fullWidth
              variant="outlined"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              helperText="Enter tags separated by commas"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={editingTicket ? handleUpdateTicket : handleCreateTicket}
              variant="contained"
              data-testid="ticket-submit-button"
            >
              {editingTicket ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default SupportTicketsApp;
