import { Room } from './rooms';
import { User } from './users';

export type SocketQuery = {
  token: string
  roomId: string
};

export type SocketAuth = {
  user: User
  room: Room
};
