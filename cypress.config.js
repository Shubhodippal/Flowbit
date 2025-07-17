const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(_on, _config) {
      // implement node event listeners here
    },
  },
  env: {
    apiUrl: 'http://localhost:3001',
    testUser: {
      email: 'admin@logisticsco.com',
      password: 'password123',
      customerId: 'logisticsco'
    },
    testUserB: {
      email: 'admin@retailgmbh.com', 
      password: 'password123',
      customerId: 'retailgmbh'
    }
  }
})
