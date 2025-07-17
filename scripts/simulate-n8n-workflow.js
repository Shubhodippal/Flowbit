// Quick n8n workflow simulator for demo purposes
// This script simulates what n8n should do when a ticket is created

const axios = require('axios');

const simulateN8nWorkflow = async (ticketId) => {
  try {
    console.log(`🤖 Simulating n8n workflow for ticket: ${ticketId}`);
    
    // Wait 5 seconds to simulate processing
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Send callback to webhook
    const callbackData = {
      ticketId: ticketId,
      status: 'in-progress',
      workflowStatus: 'completed',
      workflowResult: {
        success: true,
        message: 'Ticket processed by n8n automation workflow',
        processedBy: 'n8n-automation',
        timestamp: new Date().toISOString()
      },
      executionId: `simulation-${Date.now()}`
    };

    const response = await axios.post('http://localhost:3001/webhook/ticket-done', callbackData, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'flowbit-webhook-secret-2025'
      }
    });

    console.log('✅ Workflow callback sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send workflow callback:', error.message);
    throw error;
  }
};

// If called directly with ticket ID
if (process.argv[2]) {
  simulateN8nWorkflow(process.argv[2])
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { simulateN8nWorkflow };
