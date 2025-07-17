import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get('/admin/dashboard-stats')
      .then(res => {
        setStats(res.data);
        setError(null);
      })
      .catch(err => {
        setError(err.response?.data?.error || err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!stats) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Tenant Stats</Typography>
        <Divider sx={{ my: 1 }} />
        <Typography>Total Users: {stats.totalUsers}</Typography>
        <Typography>Total Tickets: {stats.totalTickets}</Typography>
        <Typography>Open Tickets: {stats.openTickets}</Typography>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Recent Activity</Typography>
        <Divider sx={{ my: 1 }} />
        <List>
          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((log, idx) => (
              <ListItem key={log._id || idx} alignItems="flex-start">
                <ListItemText
                  primary={log.action + (log.resourceType ? ` (${log.resourceType})` : '')}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {log.userId?.name || 'System'}
                      </Typography>
                      {` — ${new Date(log.createdAt).toLocaleString()}`}
                      <br />
                      {log.details && typeof log.details === 'object' ? JSON.stringify(log.details) : ''}
                    </>
                  }
                />
              </ListItem>
            ))
          ) : (
            <Typography color="text.secondary">No recent activity.</Typography>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
