import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, screens } = useAuth();

  return (
    <Container maxWidth="lg" data-testid="dashboard-content">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to Flowbit, {user?.name}!
        </Typography>
        
        <Grid container spacing={3}>
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
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Available Applications
                </Typography>
                {screens.map((screen) => (
                  <Box key={screen.id} sx={{ mb: 1 }}>
                    <Chip 
                      label={screen.name} 
                      variant="outlined" 
                      color="secondary"
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
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
