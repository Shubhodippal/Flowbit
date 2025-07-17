describe('Flowbit Smoke Test: Login → Create Ticket → Status Updates', () => {
  let authToken;
  
  before(() => {
    // Seed test data before running tests
    cy.seedTestData();
  });

  beforeEach(() => {
    // Get auth token for cleanup
    cy.apiLogin().then((token) => {
      authToken = token;
    });
  });

  after(() => {
    // Cleanup test data after all tests
    if (authToken) {
      cy.cleanupTestData(authToken);
    }
  });

  it('should complete the full workflow: login → create ticket → verify status updates', () => {
    // Step 1: Login
    cy.login('testUser');
    
    // Verify we're on the dashboard
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="dashboard-content"]', { timeout: 10000 }).should('be.visible');
    
    // Verify user information is displayed
    cy.get('[data-testid="user-menu"]').should('contain.text', 'Admin');
    cy.get('[data-testid="tenant-info"]').should('contain.text', 'LogisticsCo');

    // Step 2: Navigate to Support Tickets
    cy.get('[data-testid="nav-support-tickets"]')
      .should('be.visible')
      .click();
    
    // Wait for micro-frontend to load
    cy.get('[data-testid="support-tickets-container"]', { timeout: 15000 })
      .should('be.visible');

    // Step 3: Create a new ticket
    const ticketData = {
      title: `E2E Test Ticket ${Date.now()}`,
      description: 'This ticket is created by Cypress E2E test to verify the full workflow including n8n integration.',
      priority: 'high'
    };
    
    cy.createTicket(ticketData);
    
    // Verify ticket appears in the list
    cy.get('[data-testid="tickets-list"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', ticketData.title);
    
    // Verify initial status is 'open'
    cy.contains('[data-testid="ticket-row"]', ticketData.title)
      .within(() => {
        cy.get('[data-testid="ticket-status"]')
          .should('contain.text', 'open');
        cy.get('[data-testid="ticket-priority"]')
          .should('contain.text', 'high');
      });

    // Step 4: Wait for n8n workflow to process and update status
    // This tests the full integration: Flowbit → n8n → webhook callback → UI update
    cy.waitForTicketStatusUpdate(ticketData.title, 'in-progress', 45000);
    
    // Step 5: Verify the workflow completed
    cy.contains('[data-testid="ticket-row"]', ticketData.title)
      .within(() => {
        // Check that status has been updated by n8n workflow
        cy.get('[data-testid="ticket-status"]')
          .should('not.contain.text', 'open')
          .and('contain.text', 'in-progress');
        
        // Check workflow status indicator
        cy.get('[data-testid="workflow-status"]', { timeout: 5000 })
          .should('contain.text', 'completed');
      });

    // Step 6: Verify ticket details show workflow information
    cy.contains('[data-testid="ticket-row"]', ticketData.title).click();
    
    cy.get('[data-testid="ticket-details"]', { timeout: 10000 })
      .should('be.visible');
    
    // Check for workflow-generated comments
    cy.get('[data-testid="ticket-comments"]')
      .should('contain.text', 'Workflow completed');
    
    // Verify audit trail
    cy.get('[data-testid="audit-trail"]')
      .should('be.visible')
      .and('contain.text', 'Ticket created')
      .and('contain.text', 'Status updated');

    // Step 7: Test tenant isolation by trying to access different tenant
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();
    
    // Login as different tenant
    cy.login('testUserB');
    
    // Navigate to support tickets
    cy.get('[data-testid="nav-support-tickets"]').click();
    
    // Verify the ticket from previous tenant is not visible
    cy.get('[data-testid="tickets-list"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.contain.text', ticketData.title);
    
    cy.get('[data-testid="tenant-info"]').should('contain.text', 'RetailGmbH');
  });

  it('should handle authentication and authorization correctly', () => {
    // Test invalid login
    cy.visit('/login');
    
    cy.get('[data-testid="email-input"]')
      .clear()
      .type('invalid@example.com');
    
    cy.get('[data-testid="password-input"]')
      .clear()
      .type('wrongpassword');
    
    cy.get('[data-testid="login-button"]').click();
    
    // Should show error message
    cy.get('[data-testid="error-message"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'Invalid credentials');
    
    // Should still be on login page
    cy.url().should('include', '/login');
    
    // Test successful login
    cy.login('testUser');
    cy.url().should('include', '/dashboard');
  });

  it('should verify responsive design and accessibility', () => {
    cy.login('testUser');
    
    // Test mobile viewport
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu-button"]', { timeout: 5000 }).should('be.visible');
    
    // Test tablet viewport
    cy.viewport('ipad-2');
    cy.get('[data-testid="nav-support-tickets"]').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="sidebar"]').should('be.visible');
    
    // Basic accessibility checks
    cy.get('main').should('have.attr', 'role', 'main');
    cy.get('[data-testid="nav-support-tickets"]').should('have.attr', 'aria-label');
  });

  it('should verify error handling and loading states', () => {
    cy.login('testUser');
    
    // Test loading states
    cy.get('[data-testid="nav-support-tickets"]').click();
    
    // Should show loading spinner initially
    cy.get('[data-testid="loading-spinner"]', { timeout: 2000 }).should('be.visible');
    
    // Should load content eventually
    cy.get('[data-testid="support-tickets-container"]', { timeout: 15000 })
      .should('be.visible');
    
    // Test error handling by trying to access non-existent ticket
    cy.visit('/tickets/invalid-ticket-id');
    cy.get('[data-testid="error-message"]', { timeout: 5000 })
      .should('be.visible')
      .and('contain.text', 'not found');
  });
});
