describe('Flowbit Smoke Test: Basic UI and Navigation', () => {
  
  it('should load the login page and display basic elements', () => {
    cy.visit('/login');
    
    // Check that login form elements are present
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
    
    // Check that demo account buttons are present
    cy.contains('LogisticsCo Admin').should('be.visible');
    cy.contains('RetailGmbH Admin').should('be.visible');
  });

  it('should attempt login and show appropriate feedback', () => {
    cy.visit('/login');
    
    // Try logging in with demo credentials
    cy.contains('LogisticsCo Admin').click();
    
    // Verify email was filled
    cy.get('[data-testid="email-input"] input').should('have.value', 'admin@logisticsco.com');
    cy.get('[data-testid="password-input"] input').should('have.value', 'password123');
    
    // Click login button
    cy.get('[data-testid="login-button"]').click();
    
    // Wait for either success (redirect) or error message
    cy.url({ timeout: 10000 }).then((url) => {
      if (url.includes('/dashboard')) {
        cy.log('Login successful');
        cy.get('[data-testid="user-menu"]').should('be.visible');
      } else {
        cy.log('Login failed, checking for error message');
        cy.get('[data-testid="error-message"]').should('be.visible');
      }
    });
  });

  it('should handle navigation elements properly', () => {
    cy.visit('/');
    // This should redirect to login if not authenticated, or stay at root if authenticated
    cy.url({ timeout: 10000 }).should('satisfy', (url) => {
      return url.includes('/login') || url === 'http://localhost:3000/';
    });
  });

  it('should have responsive design elements', () => {
    cy.visit('/login');
    
    // Test mobile viewport
    cy.viewport('iphone-x');
    cy.get('[data-testid="login-button"]').should('be.visible');
    
    // Test desktop viewport
    cy.viewport(1280, 720);
    cy.get('[data-testid="login-button"]').should('be.visible');
  });
});
