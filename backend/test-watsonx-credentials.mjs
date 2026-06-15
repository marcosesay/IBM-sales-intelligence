#!/usr/bin/env node

/**
 * IBM watsonx.ai Credentials Tester
 *
 * This script tests your IBM watsonx.ai API credentials and helps you find the correct Project ID.
 */

const API_KEY = 'your_api_key_here';
const PROJECT_ID = 'your_project_id_here';

console.log('🔍 Testing IBM watsonx.ai Credentials...\n');

// Step 1: Get IAM Token
async function getIAMToken() {
  console.log('Step 1: Getting IAM Token...');
  try {
    const response = await fetch('https://iam.cloud.ibm.com/identity/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${API_KEY}`
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ IAM Token obtained successfully');
      console.log(`   Token type: ${data.token_type}`);
      console.log(`   Expires in: ${data.expires_in} seconds\n`);
      return data.access_token;
    } else {
      console.log('❌ Failed to get IAM Token');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}\n`);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting IAM Token:', error.message, '\n');
    return null;
  }
}

// Step 2: List Projects
async function listProjects(token) {
  console.log('Step 2: Listing available projects...');
  try {
    const response = await fetch('https://api.dataplatform.cloud.ibm.com/v2/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Found ${data.total_results || 0} project(s)\n`);
      
      if (data.resources && data.resources.length > 0) {
        console.log('Available Projects:');
        data.resources.forEach((project, index) => {
          console.log(`\n${index + 1}. ${project.entity.name}`);
          console.log(`   Project ID: ${project.metadata.guid}`);
          console.log(`   Created: ${project.metadata.created_at}`);
          console.log(`   Description: ${project.entity.description || 'N/A'}`);
        });
        console.log('\n');
        return data.resources;
      } else {
        console.log('⚠️  No projects found. You may need to create a project in IBM Cloud.\n');
        return [];
      }
    } else {
      console.log('❌ Failed to list projects');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}\n`);
      return [];
    }
  } catch (error) {
    console.log('❌ Error listing projects:', error.message, '\n');
    return [];
  }
}

// Step 3: Test specific Project ID
async function testProjectID(token, projectId) {
  console.log(`Step 3: Testing Project ID: ${projectId}...`);
  try {
    const response = await fetch('https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        input: 'Test',
        model_id: 'ibm/granite-13b-chat-v2',
        project_id: projectId,
        parameters: {
          max_new_tokens: 10
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Project ID is valid and working!');
      console.log(`   Model: ${data.model_id}`);
      console.log(`   Response: ${data.results?.[0]?.generated_text || 'N/A'}\n`);
      return true;
    } else {
      console.log('❌ Project ID test failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data, null, 2)}\n`);
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing Project ID:', error.message, '\n');
    return false;
  }
}

// Main execution
async function main() {
  const token = await getIAMToken();
  
  if (!token) {
    console.log('❌ Cannot proceed without valid IAM token.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Verify your API key is correct');
    console.log('   2. Check that the API key has not expired');
    console.log('   3. Ensure the API key has proper permissions\n');
    process.exit(1);
  }

  const projects = await listProjects(token);
  
  console.log('─'.repeat(80));
  const isValid = await testProjectID(token, PROJECT_ID);
  
  if (!isValid && projects.length > 0) {
    console.log('💡 Suggestion: Try using one of the Project IDs listed above.');
    console.log('   Update your .env file with the correct PROJECT_ID.\n');
  } else if (!isValid && projects.length === 0) {
    console.log('💡 Next Steps:');
    console.log('   1. Go to https://cloud.ibm.com/');
    console.log('   2. Navigate to watsonx.ai');
    console.log('   3. Create a new project');
    console.log('   4. Copy the Project ID and update your .env file\n');
  }
}

main().catch(console.error);

// Made with Bob
