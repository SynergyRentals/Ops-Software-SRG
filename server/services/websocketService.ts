import { WebSocket, WebSocketServer } from 'ws';
import { log } from '../vite';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

// Initialize WebSocket server with HTTP server instance
export const initWebSocketServer = (server: Server) => {
  try {
    // Create WebSocket server on a specific path to avoid conflicts with Vite HMR
    wss = new WebSocketServer({ server, path: '/ws' });
    
    log('WebSocket server initialized', 'websocket');
    
    // Set up connection handling
    wss.on('connection', (ws: WebSocket) => {
      log('Client connected to WebSocket', 'websocket');
      
      // Send initial welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'Connected to PropertyHub WebSocket server',
        timestamp: new Date().toISOString()
      }));
      
      // Handle incoming messages
      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data.toString());
          log(`Received message: ${JSON.stringify(message)}`, 'websocket');
          
          // Handle different message types
          if (message.type === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          log(`Error processing message: ${error}`, 'websocket');
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      });
      
      // Handle connection errors
      ws.on('error', (error) => {
        log(`WebSocket error: ${error}`, 'websocket');
      });
      
      // Handle connection close
      ws.on('close', () => {
        log('Client disconnected from WebSocket', 'websocket');
      });
    });
    
    // Handle server errors
    wss.on('error', (error) => {
      log(`WebSocket server error: ${error}`, 'websocket');
    });
    
    return wss;
  } catch (error) {
    log(`Failed to initialize WebSocket server: ${error}`, 'websocket');
    throw error;
  }
};

// Broadcast a message to all connected clients
export const broadcast = (type: string, data: any) => {
  if (!wss) {
    log('WebSocket server not initialized', 'websocket');
    return;
  }
  
  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });
  
  let connectedClients = 0;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      connectedClients++;
    }
  });
  
  log(`Broadcasted ${type} to ${connectedClients} client(s)`, 'websocket');
};

// Get the current WebSocket server instance
export const getWebSocketServer = () => wss;

// Close all connections and shut down the server
export const closeWebSocketServer = () => {
  if (!wss) {
    log('WebSocket server not initialized', 'websocket');
    return;
  }
  
  wss.clients.forEach((client) => {
    client.close();
  });
  
  wss.close();
  wss = null;
  
  log('WebSocket server closed', 'websocket');
};