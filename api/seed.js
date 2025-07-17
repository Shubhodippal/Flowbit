const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Ticket = require('./models/Ticket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowbit';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Cleared existing data');

    // Create LogisticsCo users
    const logisticsAdmin = new User({
      email: 'admin@logisticsco.com',
      password: 'password123',
      name: 'John Smith',
      role: 'Admin',
      customerId: 'logisticsco'
    });
    await logisticsAdmin.save();

    const logisticsUser = new User({
      email: 'user@logisticsco.com',
      password: 'password123',
      name: 'Alice Johnson',
      role: 'User',
      customerId: 'logisticsco'
    });
    await logisticsUser.save();

    // Create RetailGmbH users
    const retailAdmin = new User({
      email: 'admin@retailgmbh.com',
      password: 'password123',
      name: 'Maria Schmidt',
      role: 'Admin',
      customerId: 'retailgmbh'
    });
    await retailAdmin.save();

    const retailUser = new User({
      email: 'user@retailgmbh.com',
      password: 'password123',
      name: 'Hans Mueller',
      role: 'User',
      customerId: 'retailgmbh'
    });
    await retailUser.save();

    console.log('Created users');

    // Create sample tickets for LogisticsCo
    const logisticsTickets = [
      {
        title: 'Shipment Tracking Issue',
        description: 'Customer cannot track their shipment with tracking number ABC123',
        priority: 'high',
        status: 'open',
        customerId: 'logisticsco',
        createdBy: logisticsUser._id,
        tags: ['tracking', 'customer-issue']
      },
      {
        title: 'Delivery Delay Notification',
        description: 'Need to notify customers about weather-related delivery delays',
        priority: 'medium',
        status: 'in-progress',
        customerId: 'logisticsco',
        createdBy: logisticsAdmin._id,
        tags: ['delivery', 'weather', 'notification']
      },
      {
        title: 'Route Optimization Request',
        description: 'Optimize delivery routes for the Northeast region to reduce costs',
        priority: 'low',
        status: 'open',
        customerId: 'logisticsco',
        createdBy: logisticsAdmin._id,
        tags: ['optimization', 'cost-reduction', 'northeast']
      }
    ];

    for (const ticketData of logisticsTickets) {
      const ticket = new Ticket(ticketData);
      await ticket.save();
    }

    // Create sample tickets for RetailGmbH
    const retailTickets = [
      {
        title: 'Inventory Management System Bug',
        description: 'The inventory system is showing incorrect stock levels for product SKU-456',
        priority: 'critical',
        status: 'open',
        customerId: 'retailgmbh',
        createdBy: retailUser._id,
        tags: ['inventory', 'bug', 'critical']
      },
      {
        title: 'Customer Refund Process',
        description: 'Customer requesting refund for order #789. Product was damaged during shipping.',
        priority: 'medium',
        status: 'in-progress',
        customerId: 'retailgmbh',
        createdBy: retailAdmin._id,
        tags: ['refund', 'damaged-product', 'customer-service']
      },
      {
        title: 'New POS System Training',
        description: 'Schedule training sessions for staff on the new point-of-sale system',
        priority: 'low',
        status: 'resolved',
        customerId: 'retailgmbh',
        createdBy: retailAdmin._id,
        tags: ['training', 'pos-system', 'staff']
      }
    ];

    for (const ticketData of retailTickets) {
      const ticket = new Ticket(ticketData);
      await ticket.save();
    }

    console.log('Created sample tickets');

    console.log('\\n=== SEED DATA SUMMARY ===');
    console.log('\\nUsers created:');
    console.log('LogisticsCo:');
    console.log('  Admin: admin@logisticsco.com / password123');
    console.log('  User:  user@logisticsco.com / password123');
    console.log('\\nRetailGmbH:');
    console.log('  Admin: admin@retailgmbh.com / password123');
    console.log('  User:  user@retailgmbh.com / password123');
    
    console.log('\\nTickets created:');
    console.log(`  LogisticsCo: ${logisticsTickets.length} tickets`);
    console.log(`  RetailGmbH: ${retailTickets.length} tickets`);
    
    console.log('\\n=== READY TO TEST ===');
    console.log('You can now login with any of the above credentials to test tenant isolation!');

  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\\nDisconnected from MongoDB');
    if (require.main === module) {
      process.exit(0);
    }
  }
};

// Export the function for use as a module
module.exports = seedData;

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedData();
}
