import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the CSV file
const csvData = fs.readFileSync(path.join(__dirname, 'formatted_properties.csv'), 'utf8');

// Function to login
async function login() {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'propadmin',
        password: 'password123'
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Login failed:', errorText);
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Login successful:', data);
    
    // Store cookies for subsequent requests
    const cookies = response.headers.get('set-cookie');
    return cookies;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

// Function to import properties
async function importProperties(cookies) {
  try {
    const response = await fetch('http://localhost:5000/api/property/import-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        csvData
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Import failed:', errorText);
      throw new Error(`Import failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Import successful:', data);
    return data;
  } catch (error) {
    console.error('Error during import:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    const cookies = await login();
    const importResult = await importProperties(cookies);
    console.log(`Successfully imported ${importResult.properties.length} properties.`);
  } catch (error) {
    console.error('Script failed:', error);
  }
}

main();