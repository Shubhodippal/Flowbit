const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

// Global test variables
let tenantAAdmin, tenantBAdmin, tenantAToken, tenantBToken;

describe('Tenant Isolation Tests', () => {
  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Ticket.deleteMany({});

    // Create test users for different tenants
    tenantAAdmin = new User({
      email: 'admin-a@logisticsco.com',
      password: 'password123',
      name: 'Admin A',
      role: 'Admin',
      customerId: 'logisticsco'
    });
    await tenantAAdmin.save();

    tenantBAdmin = new User({
      email: 'admin-b@retailgmbh.com',
      password: 'password123',
      name: 'Admin B',
      role: 'Admin',
      customerId: 'retailgmbh'
    });
    await tenantBAdmin.save();

    // Login to get tokens
    const loginA = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-a@logisticsco.com',
        password: 'password123'
      });
    tenantAToken = loginA.body.accessToken;

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin-b@retailgmbh.com',
        password: 'password123'
      });
    tenantBToken = loginB.body.accessToken;
  });

  test('Admin from Tenant A cannot read Tenant B data', async () => {
    // Create a ticket for Tenant B
    const ticketB = new Ticket({
      title: 'Tenant B Ticket',
      description: 'This is a confidential ticket for Tenant B',
      customerId: 'retailgmbh',
      createdBy: tenantBAdmin._id
    });
    await ticketB.save();

    // Create a user for Tenant B
    const userB = new User({
      email: 'user-b@retailgmbh.com',
      password: 'password123',
      name: 'User B',
      role: 'User',
      customerId: 'retailgmbh'
    });
    await userB.save();

    // Try to access Tenant B's tickets using Tenant A's admin token
    const ticketsResponse = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(ticketsResponse.status).toBe(200);
    expect(ticketsResponse.body.tickets).toHaveLength(0); // Should not see Tenant B's tickets
    
    // Also try to access the specific ticket by ID
    const directAccess = await request(app)
      .get(`/api/tickets/${ticketB._id}`)
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(directAccess.status).toBe(404); // Should not find the ticket

    // Try to access Tenant B's users
    const usersResponse = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(usersResponse.status).toBe(200);
    // Should only see users from Tenant A (tenantAAdmin)
    expect(usersResponse.body.every(user => user.customerId === 'logisticsco')).toBe(true);
    expect(usersResponse.body.find(user => user._id === userB._id.toString())).toBeUndefined();
  });

  test('Admin from Tenant B cannot read Tenant A data', async () => {
    // Create a ticket for Tenant A
    const ticketA = new Ticket({
      title: 'Tenant A Ticket',
      description: 'This is a confidential ticket for Tenant A',
      customerId: 'logisticsco',
      createdBy: tenantAAdmin._id
    });
    await ticketA.save();

    // Try to access Tenant A's tickets using Tenant B's admin token
    const response = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantBToken}`);

    expect(response.status).toBe(200);
    expect(response.body.tickets).toHaveLength(0); // Should not see Tenant A's tickets
  });

  test('Each tenant can only see their own tickets', async () => {
    // Create tickets for both tenants
    const ticketA = new Ticket({
      title: 'Tenant A Ticket',
      description: 'Ticket for Tenant A',
      customerId: 'logisticsco',
      createdBy: tenantAAdmin._id
    });
    await ticketA.save();

    const ticketB = new Ticket({
      title: 'Tenant B Ticket',
      description: 'Ticket for Tenant B',
      customerId: 'retailgmbh',
      createdBy: tenantBAdmin._id
    });
    await ticketB.save();

    // Tenant A should only see their ticket
    const responseA = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(responseA.status).toBe(200);
    expect(responseA.body.tickets).toHaveLength(1);
    expect(responseA.body.tickets[0].customerId).toBe('logisticsco');

    // Tenant B should only see their ticket
    const responseB = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${tenantBToken}`);

    expect(responseB.status).toBe(200);
    expect(responseB.body.tickets).toHaveLength(1);
    expect(responseB.body.tickets[0].customerId).toBe('retailgmbh');
  });
});

describe('RBAC Tests', () => {
  test('Non-admin users cannot access admin routes', async () => {
    // Create a regular user
    const user = new User({
      email: 'user@logisticsco.com',
      password: 'password123',
      name: 'Regular User',
      role: 'User',
      customerId: 'logisticsco'
    });
    await user.save();

    // Login as regular user
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@logisticsco.com',
        password: 'password123'
      });

    const userToken = login.body.accessToken;

    // Try to access admin route (user list) - should be forbidden
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Admin role required');
  });

  test('Regular user cannot access admin routes', async () => {
    // Create a regular user for Tenant A
    const regularUser = new User({
      email: 'user-a@logisticsco.com',
      password: 'password123',
      name: 'Regular User A',
      role: 'User',
      customerId: 'logisticsco'
    });
    await regularUser.save();

    // Login as regular user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user-a@logisticsco.com',
        password: 'password123'
      });
    const userToken = loginResponse.body.accessToken;

    // Try to access admin-only route
    const adminResponse = await request(app)
      .get('/admin/dashboard-stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(adminResponse.status).toBe(403);
    expect(adminResponse.body.error).toContain('Admin role required');
  });

  test('Admin can access admin routes for their tenant only', async () => {
    // Clean up any existing tickets first
    await Ticket.deleteMany({});
    
    // Create some test data for Tenant A
    const ticketA = new Ticket({
      title: 'Tenant A Test Ticket',
      description: 'Test ticket for admin stats',
      customerId: 'logisticsco',
      createdBy: tenantAAdmin._id
    });
    await ticketA.save();

    // Access admin route with Tenant A admin
    const adminResponse = await request(app)
      .get('/admin/dashboard-stats')
      .set('Authorization', `Bearer ${tenantAToken}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body).toHaveProperty('totalUsers');
    expect(adminResponse.body).toHaveProperty('totalTickets');
    expect(adminResponse.body.totalTickets).toBe(1); // Only Tenant A's ticket
  });
});
