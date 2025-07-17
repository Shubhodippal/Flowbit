#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';

async function setupWorkflowViaDockerExec() {
  console.log('🐳 Setting up n8n workflow via Docker exec...');
  
  try {
    // First, copy the workflow file into the n8n container
    const workflowPath = path.join(__dirname, '../n8n-workflows/flowbit-ticket-workflow.json');
    
    if (!fs.existsSync(workflowPath)) {
      throw new Error(`Workflow file not found: ${workflowPath}`);
    }

    console.log('📂 Copying workflow file to n8n container...');
    
    // Copy the workflow file to n8n container
    const copyCommand = `docker cp "${workflowPath}" flowbit-n8n:/tmp/flowbit-workflow.json`;
    
    await new Promise((resolve, reject) => {
      exec(copyCommand, (error, _stdout, _stderr) => {
        if (error) {
          console.error('Copy error:', error);
          reject(error);
        } else {
          console.log('✅ Workflow file copied to container');
          resolve();
        }
      });
    });

    // Import the workflow using n8n CLI
    console.log('📥 Importing workflow into n8n...');
    const importCommand = `docker exec flowbit-n8n n8n import:workflow --input=/tmp/flowbit-workflow.json`;
    
    await new Promise((resolve, _reject) => {
      exec(importCommand, (error, stdout, _stderr) => {
        if (error) {
          console.log('Import via CLI might not be available, continuing with manual setup instructions...');
          resolve(); // Don't fail, just continue
        } else {
          console.log('✅ Workflow imported successfully');
          console.log(stdout);
          resolve();
        }
      });
    });

    // Test if webhook is now available
    await testWebhookEndpoint();

  } catch (error) {
    console.log('⚠️ Docker exec setup failed, providing manual instructions...');
    console.log('Error:', error.message);
  }
}

async function testWebhookEndpoint() {
  try {
    console.log('🧪 Testing webhook endpoint availability...');
    
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
    
    console.log('✅ Webhook endpoint is working!');
    console.log('🎉 n8n workflow is fully operational!');
    return true;
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Webhook endpoint not found - workflow needs manual activation');
      showManualSetupInstructions();
      return false;
    } else {
      console.log('⚠️ Webhook test failed:', error.message);
      return false;
    }
  }
}

function showManualSetupInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📝 MANUAL N8N SETUP REQUIRED');
  console.log('='.repeat(60));
  console.log('');
  console.log('1. Open n8n in your browser:');
  console.log('   🌐 http://localhost:5678');
  console.log('');
  console.log('2. Login with credentials:');
  console.log('   👤 Username: admin');
  console.log('   🔑 Password: password');
  console.log('');
  console.log('3. Import the workflow:');
  console.log('   📁 Click "Import" in the top menu');
  console.log('   📄 Select file: n8n-workflows/flowbit-ticket-workflow.json');
  console.log('   ✅ Click "Import workflow"');
  console.log('');
  console.log('4. Activate the workflow:');
  console.log('   🔄 Find the workflow in your workflows list');
  console.log('   🎛️ Toggle the "Active" switch ON');
  console.log('   💾 Save the workflow');
  console.log('');
  console.log('5. Verify setup:');
  console.log('   🔗 Webhook URL should be: http://localhost:5678/webhook/flowbit-ticket');
  console.log('   🧪 Test by creating a ticket in the app');
  console.log('');
  console.log('💡 The application will work properly once the workflow is active!');
  console.log('='.repeat(60));
}

async function main() {
  console.log('🚀 Starting n8n workflow automated setup...');
  console.log('');
  
  // Try automated setup first
  await setupWorkflowViaDockerExec();
  
  // Show manual instructions as backup
  console.log('');
  showManualSetupInstructions();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupWorkflowViaDockerExec, testWebhookEndpoint };
