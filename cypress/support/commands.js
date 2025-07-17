// cypress/support/commands.js

// Custom command for login
Cypress.Commands.add('login', (userType = 'testUser') => {
  const user = Cypress.env(userType);
  
  cy.visit('/login');
  cy.get('[data-testid="email-input"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(user.email);
  
  cy.get('[data-testid="password-input"]')
    .should('be.visible')
    .clear()
    .type(user.password);
  
  cy.get('[data-testid="login-button"]')
    .should('be.visible')
    .click();
  
  // Wait for redirect to dashboard
  cy.url({ timeout: 15000 }).should('include', '/dashboard');
  cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible');
});

// Custom command for creating a ticket
Cypress.Commands.add('createTicket', (ticketData = {}) => {
  const defaultTicket = {
    title: `Test Ticket ${Date.now()}`,
    description: 'This is a test ticket created by Cypress',
    priority: 'medium'
  };
  
  const ticket = { ...defaultTicket, ...ticketData };
  
  // Navigate to support tickets
  cy.get('[data-testid="nav-support-tickets"]', { timeout: 10000 })
    .should('be.visible')
    .click();
  
  // Wait for micro-frontend to load
  cy.get('[data-testid="create-ticket-button"]', { timeout: 15000 })
    .should('be.visible')
    .click();
  
  // Fill out ticket form
  cy.get('[data-testid="ticket-title-input"]', { timeout: 10000 })
    .should('be.visible')
    .clear()
    .type(ticket.title);
  
  cy.get('[data-testid="ticket-description-input"]')
    .should('be.visible')
    .clear()
    .type(ticket.description);
  
  cy.get('[data-testid="ticket-priority-select"]')
    .should('be.visible')
    .click();
  
  cy.get(`[data-value="${ticket.priority}"]`)
    .should('be.visible')
    .click();
  
  // Submit the form
  cy.get('[data-testid="submit-ticket-button"]')
    .should('be.visible')
    .click();
  
  // Wait for success message or redirect
  cy.get('[data-testid="ticket-success-message"]', { timeout: 10000 })
    .should('be.visible');
  
  return cy.wrap(ticket);
});

// Custom command for waiting for ticket status update
Cypress.Commands.add('waitForTicketStatusUpdate', (ticketTitle, expectedStatus, timeout = 30000) => {
  cy.get('[data-testid="tickets-list"]', { timeout: 10000 }).should('be.visible');
  
  // Look for the specific ticket and wait for status update
  cy.contains('[data-testid="ticket-row"]', ticketTitle, { timeout })
    .within(() => {
      cy.get('[data-testid="ticket-status"]')
        .should('contain.text', expectedStatus);
    });
});

// Custom command for API login (for setup/teardown)
Cypress.Commands.add('apiLogin', (userType = 'testUser') => {
  const user = Cypress.env(userType);
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      email: user.email,
      password: user.password
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
    return response.body.token;
  });
});

// Custom command for seeding test data via API
Cypress.Commands.add('seedTestData', () => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/seed`,
    failOnStatusCode: false
  });
});

// Custom command for cleaning up test data
Cypress.Commands.add('cleanupTestData', (token) => {
  return cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/api/test/cleanup`,
    headers: {
      Authorization: `Bearer ${token}`
    },
    failOnStatusCode: false
  });
});
