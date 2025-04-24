import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 * @param server HTTP server instance
 * @returns WebSocket server instance
 */
export const initWebSocket = (server: Server): WebSocketServer => {
  // Create WebSocket server on a specific path to avoid conflicts with Vite HMR
  wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'info',
      message: 'Connected to PropertyHub WebSocket Server'
    }));
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  return wss;
};

/**
 * Broadcast a message to all connected WebSocket clients
 * @param eventType Event type identifier
 * @param data Data to send
 */
export const broadcast = (eventType: string, data: any): void => {
  if (!wss) {
    console.warn('WebSocket server not initialized, cannot broadcast');
    return;
  }
  
  const message = JSON.stringify({
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
  
  let clientCount = 0;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      clientCount++;
    }
  });
  
  console.log(`Broadcast ${eventType} to ${clientCount} clients`);
};

/**
 * Get the WebSocket server instance
 * @returns The WebSocket server or null if not initialized
 */
export const getWebSocketServer = (): WebSocketServer | null => wss;