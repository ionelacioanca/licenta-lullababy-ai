// Simple script to test the chatbot endpoint
import axios from 'axios';

const testMessage = process.argv[2] || "How can I help my baby sleep better?";

async function testChatbot() {
  try {
    console.log(`\nTesting chatbot with message: "${testMessage}"\n`);
    
    const response = await axios.post('http://localhost:5000/api/chatbot', {
      message: testMessage
    });

    console.log('✅ Success!');
    console.log('\nChatbot Reply:');
    console.log('─'.repeat(50));
    console.log(response.data.reply);
    console.log('─'.repeat(50));
    console.log(`\nResponse received in ${response.headers['x-response-time'] || 'N/A'}`);
  } catch (error) {
    console.log('❌ Error testing chatbot:');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Response:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Is the server running on port 5000?');
      console.log('Make sure you start the server with: npm start');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testChatbot();
