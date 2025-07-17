import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentTickets, setRecentTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent tickets
        const ticketsResponse = await axios.get('/api/tickets?limit=5');
        setRecentTickets(ticketsResponse.data.tickets || []);

        // If admin, fetch stats
        if (user?.role === 'Admin') {
          try {
            const statsResponse = await axios.get('/admin/dashboard-stats');
            setStats(statsResponse.data);
          } catch (statsError) {
            console.warn('Failed to fetch admin stats:', statsError);
          }
        }
        
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.role]);

  if (loading) return <LoadingSpinner />;

  return (
    <Container maxWidth="lg" data-testid="dashboard-content">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Flowbit, {user?.name}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Tenant Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tenant Information
                </Typography>
                <Typography variant="body1">
                  <strong>Organization:</strong> {user?.customerId}
                </Typography>
                <Typography variant="body1">
                  <strong>Role:</strong> <Chip label={user?.role} color="primary" size="small" />
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Admin Stats */}
          {user?.role === 'Admin' && stats && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Statistics
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Users:</strong> {stats.totalUsers}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Tickets:</strong> {stats.totalTickets}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Open Tickets:</strong> {stats.openTickets}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* Recent Tickets */}
          {recentTickets.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Support Tickets
                  </Typography>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Created</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentTickets.map((ticket) => (
                        <TableRow key={ticket._id}>
                          <TableCell>{ticket._id.slice(-6)}</TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell>
                            <Chip 
                              label={ticket.status} 
                              color={ticket.status === 'Open' ? 'error' : 
                                     ticket.status === 'In Progress' ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={ticket.priority} 
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* System Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Multi-tenant application with micro-frontend architecture.
                  Each tenant has isolated data and customized application screens.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="API Connected" color="success" size="small" sx={{ mr: 1 }} />
                  <Chip label="Tenant Isolated" color="info" size="small" sx={{ mr: 1 }} />
                  <Chip label="n8n Integration Ready" color="warning" size="small" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard;
