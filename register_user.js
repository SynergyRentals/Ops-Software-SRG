import fetch from 'node-fetch';

async function registerUser() {
  try {
    const response = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "propadmin",
        password: "password123",
        email: "propadmin@example.com",
        role: "admin",
        name: "Property Administrator"
      })
    });

    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('Registration failed:', data);
      return;
    }

    console.log('User registered successfully');
    
    // Now try to login with the new user
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: "propadmin",
        password: "password123"
      }),
      credentials: 'include'
    });

    const loginData = await loginResponse.text();
    console.log('Login status:', loginResponse.status);
    console.log('Login data:', loginData);

    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }

    console.log('Login successful');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

registerUser();