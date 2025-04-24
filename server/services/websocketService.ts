import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

// Initialize WebSocket server
export const initWebSocket = (server: Server): WebSocketServer => {
  wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
  });
  
  return wss;
};

// Broadcast message to all connected clients
export const broadcast = (eventType: string, data: any): void => {
  if (!wss) {
    console.warn('WebSocket server not initialized');
    return;
  }
  
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Get WebSocket server instance
export const getWebSocketServer = (): WebSocketServer | null => wss;