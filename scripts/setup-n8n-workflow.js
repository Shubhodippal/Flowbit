#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'password';

async function setupN8nWorkflow() {
  try {
    console.log('🔧 Setting up n8n workflow for Flowbit...');
    
    // Read the workflow file
    const workflowPath = path.join(__dirname, '../n8n-workflows/flowbit-ticket-workflow.json');
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    // Create Basic Auth header
    const auth = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    };

    console.log('📡 Connecting to n8n instance...');
    
    // Check if n8n is available
    try {
      await axios.get(`${N8N_URL}/healthz`, { headers });
      console.log('✅ n8n instance is healthy');
    } catch (error) {
      console.log('⚠️ n8n health check failed, but continuing...');
    }

    // Import the workflow
    console.log('📥 Importing workflow...');
    const importResponse = await axios.post(`${N8N_URL}/api/v1/workflows`, workflowData, { headers });
    
    if (importResponse.status === 201) {
      console.log('✅ Workflow imported successfully');
      console.log(`   Workflow ID: ${importResponse.data.id}`);
      
      // Activate the workflow
      console.log('🚀 Activating workflow...');
      const activateResponse = await axios.patch(
        `${N8N_URL}/api/v1/workflows/${importResponse.data.id}`,
        { active: true },
        { headers }
      );
      
      if (activateResponse.status === 200) {
        console.log('✅ Workflow activated successfully');
        console.log('🎯 Webhook URL: http://localhost:5678/webhook/flowbit-ticket');
        console.log('');
        console.log('🔍 Test the workflow:');
        console.log('   curl -X POST http://localhost:5678/webhook/flowbit-ticket \\');
        console.log('     -H "Content-Type: application/json" \\');
        console.log('     -d \'{"ticketId":"test-123","customerId":"TEST001","title":"Test ticket","priority":"high","callbackUrl":"http://api:3001/webhook/ticket-done"}\'');
      } else {
        console.log('❌ Failed to activate workflow');
      }
    } else {
      console.log('❌ Failed to import workflow');
    }
    
  } catch (error) {
    console.error('❌ Error setting up n8n workflow:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    console.log('');
    console.log('📝 Manual setup instructions:');
    console.log('1. Open http://localhost:5678 in your browser');
    console.log('2. Login with admin/password');
    console.log('3. Click "Import" and select the workflow file:');
    console.log('   n8n-workflows/flowbit-ticket-workflow.json');
    console.log('4. Activate the workflow using the toggle switch');
    
    process.exit(1);
  }
}

async function testWorkflow() {
  try {
    console.log('🧪 Testing n8n workflow...');
    
    const testPayload = {
      ticketId: 'test-' + Date.now(),
      customerId: 'TEST001',
      title: 'Test ticket from setup script',
      description: 'Testing n8n integration',
      priority: 'medium',
      callbackUrl: 'http://api:3001/webhook/ticket-done'
    };
    
    const response = await axios.post(`${N8N_URL}/webhook/flowbit-ticket`, testPayload, {
      timeout: 15000
    });
    
    console.log('✅ Workflow test successful');
    console.log('   Response:', response.data);
    
  } catch (error) {
    console.log('⚠️ Workflow test failed (this is expected if the workflow is not set up yet)');
    console.log('   Error:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-only')) {
    await testWorkflow();
  } else {
    await setupN8nWorkflow();
    
    // Wait a moment for the workflow to be ready
    console.log('⏳ Waiting for workflow to be ready...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testWorkflow();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setupN8nWorkflow, testWorkflow };
