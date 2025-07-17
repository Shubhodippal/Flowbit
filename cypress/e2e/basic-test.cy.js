describe('Basic Application Test', () => {
  it('should load the application and show login page', () => {
    cy.visit('/')
    
    // Check if we can access the login page
    cy.contains('Flowbit Login', { timeout: 10000 })
    
    // Check for basic login elements using our test IDs
    cy.get('[data-testid="email-input"]').should('be.visible')
    cy.get('[data-testid="password-input"]').should('be.visible')
    cy.get('[data-testid="login-button"]').should('be.visible')
  })

  it('should check API health', () => {
    cy.request('http://localhost:3001/health')
      .its('status')
      .should('eq', 200)
  })
})
