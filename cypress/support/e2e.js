// cypress/support  Cypress.on('uncaught:exception', (_err, _runnable) => {e2e.js

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log to reduce noise
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global error handling
Cypress.on('uncaught:exception', (err, _runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that might be from the application
  if (err.message.includes('ResizeObserver') || 
      err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Wait for application to be ready
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
  
  // Wait for application to be ready
  cy.visit('/', { failOnStatusCode: false });
  cy.get('body', { timeout: 10000 }).should('be.visible');
});
