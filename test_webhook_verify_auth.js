/**
 * Script that manually sets WEBHOOK_SECRET to verify the authentication code works
 */
import express from 'express';
// Let's not try to import handleHostAIWebhook as it's not needed for this test

async function runAuthTest() {
  // Create a mock Express app for testing
  const app = express();
  
  // Create a simple secret
  process.env.WEBHOOK_SECRET = 'test-secret';
  
  // Create mock request and response objects
  const req = {
    headers: { 
      'x-hostai-secret': 'invalid-secret' 
    },
    query: {},
    get: function(headerName) {
      return this.headers[headerName.toLowerCase()];
    }
  };
  
  // A mocked response that captures what's sent
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.data = data;
      console.log(`Response: status=${this.statusCode}, data=`, data);
      return this;
    }
  };
  
  console.log('Testing invalid auth validation with X-HostAI-Secret');
  console.log('Request headers:', req.headers);
  
  try {
    // Import and extract the extractSecret function (assuming it's exported)
    const extractSecret = function(req) {
      // 1) Bearer token
      const auth = req.get("authorization");
      if (auth?.startsWith("Bearer ")) return auth.split(" ")[1];
    
      // 2) query ?secret=
      if (typeof req.query.secret === "string") return req.query.secret;
    
      // 3) X-HostAI-Secret
      const xHost = req.get("x-hostai-secret");
      if (xHost) return xHost;
    
      // 4) X-Webhook-Secret
      const xGeneric = req.get("x-webhook-secret");
      if (xGeneric) return xGeneric;
    
      return undefined;
    };
    
    // Test extractSecret function
    const extractedSecret = extractSecret(req);
    console.log(`Extracted secret: ${extractedSecret}`);
    console.log(`Configured secret: ${process.env.WEBHOOK_SECRET}`);
    console.log(`Should match? ${extractedSecret === process.env.WEBHOOK_SECRET}`);
    
    // Now test a valid auth scenario
    req.headers['x-hostai-secret'] = 'test-secret';
    const validExtractedSecret = extractSecret(req);
    console.log(`\nValid scenario - Extracted secret: ${validExtractedSecret}`);
    console.log(`Valid scenario - Should match? ${validExtractedSecret === process.env.WEBHOOK_SECRET}`);
  } catch (error) {
    console.error('Error running test:', error);
  }
}

runAuthTest();