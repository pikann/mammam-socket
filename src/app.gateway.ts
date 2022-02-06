import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://admin.mammam.online',
      'https://admin.mammam.online',
    ],
  },
  allowEIO3: true,
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private jwtService: JwtService) {}

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): void {
    if (client.handshake?.query?.backendKey === process.env.BACKEND_KEY) {
      this.server.to(payload.room).emit('message', payload.data);
    }
  }

  afterInit() {
    Logger.log('Init socket server complete');
  }

  handleConnection(client: Socket) {
    if (client.handshake?.query?.backendKey === process.env.BACKEND_KEY) {
      return;
    }

    try {
      const authToken: any = client.handshake?.query?.token;
      const decoded = this.jwtService.verify(authToken);
      client.join(decoded.id);
      client.join(decoded.role);
    } catch (ex) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
  }
}
