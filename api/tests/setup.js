const mongoose = require('mongoose');

// Setup function to run before all tests
beforeAll(async () => {
  // Ensure we have a clean test database connection
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit-test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}, 30000); // 30 second timeout

// Cleanup function to run after all tests
afterAll(async () => {
  // Clean up test data and close connection
  if (mongoose.connection.readyState !== 0) {
    try {
      // Clean up the test database
      await mongoose.connection.db.dropDatabase();
      
      // Close the connection
      await mongoose.connection.close();
      
      // Force close any remaining connections
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  }
}, 30000); // 30 second timeout
