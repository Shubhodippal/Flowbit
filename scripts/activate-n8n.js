#!/usr/bin/env node

console.log('🚀 Starting n8n activation script...');

const { exec } = require('child_process');
const axios = require('axios');

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';

async function activateWorkflowViaCLI() {
  console.log('🔄 Activating n8n workflow via CLI...');
  
  try {
    // Use Docker exec to activate the workflow directly
    console.log('📋 Listing all workflows to find our workflow...');
    
    const listCommand = `docker exec flowbit-n8n n8n list:workflow --output=json`;
    
    const workflowList = await new Promise((resolve, reject) => {
      exec(listCommand, (error, stdout, _stderr) => {
        if (error) {
          console.log('❌ Could not list workflows via CLI:', error.message);
          reject(error);
        } else {
          console.log('✅ Workflow list retrieved');
          resolve(stdout);
        }
      });
    });

    console.log('📊 Raw workflow data:', workflowList.substring(0, 200) + '...');
    
    // Parse the workflow list to find our workflow
    let workflows = [];
    try {
      workflows = JSON.parse(workflowList);
    } catch (parseError) {
      console.log('⚠️ Could not parse workflow list as JSON, trying alternative approach...');
      console.log('Parse error:', parseError.message);
    }

    // Find our workflow
    const ourWorkflow = workflows.find(w => 
      w.name === 'Flowbit Ticket Processing Workflow' || 
      w.name.includes('Flowbit')
    );

    if (ourWorkflow) {
      console.log(`🎯 Found workflow: ${ourWorkflow.name} (ID: ${ourWorkflow.id})`);
      
      if (ourWorkflow.active) {
        console.log('✅ Workflow is already active!');
      } else {
        console.log('🔧 Activating workflow...');
        
        const activateCommand = `docker exec flowbit-n8n n8n update:workflow --id="${ourWorkflow.id}" --active=true`;
        
        await new Promise((resolve, reject) => {
          exec(activateCommand, (error, stdout, _stderr) => {
            if (error) {
              console.log('❌ Failed to activate via CLI:', error.message);
              reject(error);
            } else {
              console.log('✅ Workflow activated successfully!');
              console.log(stdout);
              resolve();
            }
          });
        });
      }
    } else {
      console.log('⚠️ Could not find Flowbit workflow in the list');
      if (workflows.length > 0) {
        console.log('Available workflows:', workflows.map(w => w.name));
      }
    }

    // Test if webhook is now available
    await testWebhookEndpoint();

  } catch (error) {
    console.log('⚠️ CLI activation failed:', error.message);
    console.log('🔧 Please activate manually via the web interface');
    return false;
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('🧪 Testing webhook endpoint availability...');
    
    const testPayload = {
      ticketId: 'activation-test-' + Date.now(),
      customerId: 'test-tenant',
      title: 'Activation Test Ticket',
      description: 'Testing n8n workflow activation',
      priority: 'medium',
      timestamp: new Date().toISOString(),
      callbackUrl: 'http://api:3001/webhook/ticket-done'
    };
    
    const response = await axios.post(`${N8N_URL}/webhook/flowbit-ticket`, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log('✅ Webhook endpoint is working!');
    console.log('🎉 n8n workflow is fully operational!');
    console.log('📊 Response:', response.status, response.statusText);
    return true;
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Webhook endpoint still not found');
      console.log('🔧 Manual activation required in n8n web interface');
      return false;
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to n8n - is it running?');
      return false;
    } else {
      console.log('⚠️ Webhook test failed:', error.message);
      console.log('🔍 This might be normal if n8n is processing...');
      return false;
    }
  }
}

async function showQuickActivationSteps() {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 QUICK ACTIVATION STEPS');
  console.log('='.repeat(50));
  console.log('');
  console.log('1. 🌐 Open: http://localhost:5678');
  console.log('2. 🔑 Login: admin / password');
  console.log('3. 📋 Go to "Workflows" tab');
  console.log('4. 🔍 Find "Flowbit Ticket Processing Workflow"');
  console.log('5. 🎛️ Toggle the "Active" switch to ON');
  console.log('6. 💾 The workflow is now active!');
  console.log('');
  console.log('✅ After activation, tickets will trigger the n8n workflow');
  console.log('='.repeat(50));
}

if (require.main === module) {
  activateWorkflowViaCLI()
    .then(() => showQuickActivationSteps())
    .catch(error => {
      console.error('Activation failed:', error.message);
      showQuickActivationSteps();
    });
}

module.exports = { activateWorkflowViaCLI, testWebhookEndpoint };
