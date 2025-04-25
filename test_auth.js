import fetch from 'node-fetch';

async function registerTestUser() {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        role: 'admin',
        name: 'Test User'
      }),
    });

    const data = await response.json();
    console.log('Registration response:', data);
    return data;
  } catch (error) {
    console.error('Error registering user:', error);
  }
}

async function loginTestUser() {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
      }),
    });

    const data = await response.json();
    console.log('Login response:', data);
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
  }
}

async function testAuth() {
  // First try to register
  let result = await registerTestUser();
  
  // If registration fails (likely because user already exists), try to login
  if (!result || result.message === 'Username already exists') {
    console.log('User already exists, trying to login...');
    result = await loginTestUser();
  }
  
  console.log('Test completed.');
}

testAuth();