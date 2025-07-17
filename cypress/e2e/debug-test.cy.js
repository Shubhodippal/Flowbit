describe('Debug Application Test', () => {
  it('should show what content is actually loaded', () => {
    cy.visit('/')
    
    // Wait for page to load properly using should() instead of wait()
    cy.get('body').should('be.visible')
    
    // Check if we can see any content at all
    cy.get('body').then(($body) => {
      const text = $body.text()
      cy.log('Page content:', text)
      expect(text.length).to.be.greaterThan(0)
    })
    
    // Check if there are any form elements
    cy.get('input').should('have.length.greaterThan', 0)
  })
})
