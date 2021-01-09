import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import fbworker from '../dbWorker';
import {
  Room, SocketAuth, SocketQuery, User,
} from '../types';

export default function SocketMiddleware(
  socket: Socket,
  next: (err?: ExtendedError | undefined) => void,
): void {
  const query = socket.handshake.query as SocketQuery | undefined;

  if (!query) return next(new Error('socket/invalid-query'));
  if (!query.token) return next(new Error('socket/invalid-token'));
  if (!query.roomId) return next(new Error('socket/invalid-room-id'));

  const auth: Partial<SocketAuth> = {};

  fbworker.users
    .where('token', '==', query.token)
    .get()
    .then((res) => {
      if (res.empty) throw new Error('socket/invalid-token');
      auth.user = res.docs[0].data() as User;

      return fbworker.rooms.doc(query.roomId).get();
    })
    .then((snap) => {
      if (!snap.exists) throw new Error('socket/room-not-found');
      auth.room = snap.data() as Room;
    })
    // eslint-disable-next-line no-param-reassign
    .then(() => { socket.handshake.auth = auth; })
    .then(() => next())
    .catch((e: Error) => {
      if (e.message === 'socket/invalid-token' || e.message === 'socket/room-not-found') next(e);
      else next(new Error('socket/generic-error'));
    });
}
