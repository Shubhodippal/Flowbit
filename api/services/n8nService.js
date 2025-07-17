const axios = require('axios');

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;

const triggerN8nWorkflow = async (ticketData) => {
  try {
    const webhookUrl = `${N8N_URL}/webhook/flowbit-ticket`;
    
    const payload = {
      ticketId: ticketData.ticketId,
      customerId: ticketData.customerId,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      timestamp: new Date().toISOString(),
      callbackUrl: process.env.WEBHOOK_CALLBACK_URL || 'http://api:3001/webhook/ticket-done'
    };

    console.log('Triggering n8n workflow:', webhookUrl, payload);

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY })
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('n8n workflow triggered successfully:', response.data);
    return {
      success: true,
      executionId: response.data?.executionId || 'unknown',
      data: response.data
    };
  } catch (error) {
    console.error('Failed to trigger n8n workflow:', error.message);
    if (error.response) {
      console.error('n8n response:', error.response.status, error.response.data);
    }
    
    throw new Error(`n8n workflow trigger failed: ${error.message}`);
  }
};

const getWorkflowStatus = async (executionId) => {
  try {
    const response = await axios.get(`${N8N_URL}/api/v1/executions/${executionId}`, {
      headers: {
        ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY })
      }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to get workflow status:', error.message);
    throw new Error(`Failed to get workflow status: ${error.message}`);
  }
};

module.exports = {
  triggerN8nWorkflow,
  getWorkflowStatus
};
