import { WebSocket } from 'ws';

// Connect to the WebSocket server
const protocol = 'ws:';
const wsUrl = `${protocol}//localhost:5000/ws`;
console.log(`Connecting to WebSocket at ${wsUrl}`);
const socket = new WebSocket(wsUrl);

// Connection opened
socket.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send a ping message
  socket.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
});

// Listen for messages
socket.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message:', message);
    
    // If we receive a new task, log it
    if (message.type === 'task:new') {
      console.log('New task received:', message.data);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Connection closed
socket.on('close', () => {
  console.log('Disconnected from WebSocket server');
});

// Connection error
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Keep the script running
console.log('WebSocket client running. Press Ctrl+C to exit.');