#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_USER = process.env.N8N_BASIC_AUTH_USER || 'admin';
const N8N_PASSWORD = process.env.N8N_BASIC_AUTH_PASSWORD || 'password';

async function waitForN8n(maxAttempts = 30) {
  console.log('⏳ Waiting for n8n to be ready...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${N8N_URL}/`, { timeout: 5000 });
      console.log('✅ n8n is ready!');
      return true;
    } catch (error) {
      console.log(`   Attempt ${i + 1}/${maxAttempts} - n8n not ready yet...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  throw new Error('n8n failed to start within expected time');
}

async function setupN8nWorkflow() {
  try {
    console.log('🚀 Setting up n8n workflow for Flowbit...');
    
    // Wait for n8n to be ready
    await waitForN8n();
    
    // Read the workflow file
    const workflowPath = path.join(__dirname, '../n8n-workflows/flowbit-ticket-workflow.json');
    
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`Workflow file not found: ${workflowPath}`);
    }
    
    const workflowData = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));
    
    console.log('📁 Loaded workflow definition');
    console.log('📡 Attempting to create and activate workflow...');
    
    // For n8n with basic auth, we need to try different approaches
    const authHeader = Buffer.from(`${N8N_USER}:${N8N_PASSWORD}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json'
    };

    // First, try to check if n8n needs setup
    try {
      console.log('🔍 Checking n8n setup status...');
      const setupStatus = await axios.get(`${N8N_URL}/rest/login`, { 
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 
      });
      console.log('📊 n8n setup status:', setupStatus.status);
    } catch (setupError) {
      console.log('🔧 n8n might need initial setup or different auth approach');
    }

    // Try to get existing workflows first
    let apiEndpoint = '/rest/workflows';
    try {
      const existingWorkflows = await axios.get(`${N8N_URL}${apiEndpoint}`, { headers });
      console.log(`📋 Found ${existingWorkflows.data.length} existing workflows`);
      
      // Check if our workflow already exists
      const existingWorkflow = existingWorkflows.data.find(w => 
        w.name === 'Flowbit Ticket Processing Workflow' || 
        (w.nodes && w.nodes.some(n => n.parameters?.path === 'flowbit-ticket'))
      );
      
      if (existingWorkflow) {
        console.log(`🔄 Found existing workflow: ${existingWorkflow.name} (ID: ${existingWorkflow.id})`);
        
        // Activate if not active
        if (!existingWorkflow.active) {
          await axios.patch(`${N8N_URL}${apiEndpoint}/${existingWorkflow.id}`, 
            { active: true }, 
            { headers }
          );
          console.log('✅ Activated existing workflow');
        } else {
          console.log('✅ Workflow is already active');
        }
        
        // Test the webhook
        await testWebhook();
        return;
      }
    } catch (error) {
      console.log('⚠️ Could not check existing workflows via REST API');
      console.log('💡 Trying alternative approach or setup may be needed');
      
      // Try alternative API paths
      const altPaths = ['/api/v1/workflows', '/workflows'];
      for (const path of altPaths) {
        try {
          console.log(`🔍 Trying alternative endpoint: ${path}`);
          await axios.get(`${N8N_URL}${path}`, { headers });
          apiEndpoint = path;
          console.log(`✅ Found working endpoint: ${path}`);
          break;
        } catch (altError) {
          console.log(`   ❌ ${path} failed`);
        }
      }
    }

    // Create new workflow
    try {
      const createResponse = await axios.post(`${N8N_URL}${apiEndpoint}`, workflowData, { headers });
      const workflowId = createResponse.data.id;
      console.log(`✅ Created workflow with ID: ${workflowId}`);
      
      // Activate the workflow
      await axios.patch(`${N8N_URL}${apiEndpoint}/${workflowId}`, 
        { active: true }, 
        { headers }
      );
      console.log('✅ Activated workflow successfully');
      
      // Test the webhook
      await testWebhook();
      
    } catch (createError) {
      console.error('❌ Failed to create workflow:', createError.response?.data || createError.message);
      throw createError;
    }
    
  } catch (error) {
    console.error('❌ n8n setup failed:', error.message);
    console.log('\n📝 Manual setup instructions:');
    console.log('1. Open http://localhost:5678 in your browser');
    console.log('2. Login with admin/password');
    console.log('3. Click "Import" and select the workflow file:');
    console.log('   n8n-workflows/flowbit-ticket-workflow.json');
    console.log('4. Activate the workflow using the toggle switch');
    console.log('\n💡 The application will work with webhook callbacks even without active workflow');
  }
}

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook endpoint...');
    
    const testPayload = {
      ticketId: 'test-' + Date.now(),
      customerId: 'test-tenant',
      title: 'Test Ticket',
      description: 'Testing n8n workflow setup',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      callbackUrl: 'http://api:3001/webhook/ticket-done'
    };
    
    await axios.post(`${N8N_URL}/webhook/flowbit-ticket`, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Webhook test successful!');
    console.log('🎉 n8n workflow is fully operational!');
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ Webhook endpoint not found - workflow may need manual activation');
    } else {
      console.log('⚠️ Webhook test failed:', error.message);
    }
  }
}

// Allow running directly or as module
if (require.main === module) {
  console.log('🔧 Starting n8n workflow setup...');
  setupN8nWorkflow().catch(error => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupN8nWorkflow, testWebhook };
