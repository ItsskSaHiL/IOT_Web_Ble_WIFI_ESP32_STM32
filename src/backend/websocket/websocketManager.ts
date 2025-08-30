import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';

export class WebSocketManager {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();

  constructor(server: any) {
    this.wss = new WebSocket.Server({ 
      server,
      verifyClient: this.verifyClient.bind(this)
    });
    this.setupEventHandlers();
  }

  private verifyClient(info: { req: IncomingMessage }): boolean {
    try {
      const token = new URL(info.req.url!, 'http://localhost').searchParams.get('token');
      if (!token) return false;
      
      jwt.verify(token, process.env.JWT_SECRET!);
      return true;
    } catch {
      return false;
    }
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
    });
  }

  broadcast(type: string, data: any): void {
    const message = JSON.stringify({ type, data });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }
}