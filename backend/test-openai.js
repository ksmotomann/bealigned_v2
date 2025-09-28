const OpenAI = require('openai');
require('dotenv').config();

async function testOpenAI() {
  console.log('Testing OpenAI Configuration...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const assistantId = process.env.OPENAI_ASSISTANT_ID;
  
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('Assistant ID:', assistantId || 'NOT SET');
  
  if (!apiKey) {
    console.error('\n❌ OpenAI API key is not set in .env file');
    return;
  }
  
  if (!assistantId) {
    console.error('\n❌ OpenAI Assistant ID is not set in .env file');
    return;
  }
  
  const openai = new OpenAI({ apiKey });
  
  try {
    // Test 1: Create a thread
    console.log('\n1️⃣  Testing thread creation...');
    const thread = await openai.beta.threads.create();
    console.log('✅ Thread created:', thread.id);
    
    // Test 2: Check if assistant exists
    console.log('\n2️⃣  Testing assistant access...');
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    console.log('✅ Assistant found:', assistant.name || 'Unnamed Assistant');
    console.log('   Model:', assistant.model);
    
    // Test 3: Send a test message
    console.log('\n3️⃣  Testing message sending...');
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: 'Hello, this is a test message'
    });
    console.log('✅ Message sent');
    
    // Test 4: Run the assistant
    console.log('\n4️⃣  Testing assistant run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });
    console.log('✅ Run created:', run.id);
    console.log('   Status:', run.status);
    
    console.log('\n✨ All OpenAI tests passed!');
    console.log('The OpenAI integration is working correctly.');
    
  } catch (error) {
    console.error('\n❌ OpenAI test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Your API key might be invalid or expired.');
      console.error('   Get a new key at: https://platform.openai.com/api-keys');
    } else if (error.message.includes('assistant')) {
      console.error('\n💡 The assistant ID might be incorrect.');
      console.error('   Check your assistants at: https://platform.openai.com/assistants');
    } else if (error.message.includes('quota')) {
      console.error('\n💡 You might have exceeded your OpenAI quota.');
      console.error('   Check usage at: https://platform.openai.com/usage');
    }
  }
}

testOpenAI();