import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

export const ATTENDANCE_NEW_EVENT = 'attendance:new';

export interface AttendanceNewPayload {
  attendance: {
    id: string;
    studentId: string;
    classSessionId: string;
    timestamp: string;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      indexNumber?: string;
    };
  };
}

@WebSocketGateway({
  cors: { origin: true },
  namespace: '/attendance',
})
export class AttendanceGateway {
  @WebSocketServer()
  server!: Server;

  /**
   * Profesor se priključuje sobi za čas.
   * Client šalje: { classSessionId: string }
   */
  @SubscribeMessage('join-class')
  handleJoinClass(
    @MessageBody() data: { classSessionId: string },
    @ConnectedSocket() client: any,
  ) {
    const classSessionId = data?.classSessionId;
    if (client?.join && classSessionId) {
      client.join(`class:${classSessionId}`);
    }
  }

  /**
   * Profesor napušta sobu.
   */
  @SubscribeMessage('leave-class')
  handleLeaveClass(
    @MessageBody() data: { classSessionId: string },
    @ConnectedSocket() client: any,
  ) {
    if (client?.leave && data?.classSessionId) {
      client.leave(`class:${data.classSessionId}`);
    }
  }

  /**
   * Emituje novu prijavu svim profesorima u sobi časa.
   */
  emitNewAttendance(classSessionId: string, attendance: AttendanceNewPayload['attendance']) {
    const room = `class:${classSessionId}`;
    this.server.to(room).emit(ATTENDANCE_NEW_EVENT, { attendance });
  }
}
