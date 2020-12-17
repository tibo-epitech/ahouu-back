import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import { NextFunction, Request, Response } from 'express';

import fbworker from '../dbWorker';
import {
  GenerateRandomID, getUserFromRequest, Hash, PasswordRegEx,
} from '../utils';
import {
  Room,
  RoomCreateBody,
  PlayerRole,
  PlayerState,
  RoomState,
  RoomResponse,
} from '../types';

// eslint-disable-next-line import/prefer-default-export
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ room: RoomResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  if (isEmpty(req.body)) return res.status(400).send({ message: 'rooms/invalid-body' });

  const body = req.body as RoomCreateBody;
  const { name, max, password } = body;

  const data: Room = {
    id: GenerateRandomID(),
    admin: current.id,
    name: name.trim(),
    max,
    players: [{
      userId: current.id,
      role: PlayerRole.NONE,
      state: PlayerState.WAITING_IN_LOBBY,
    }],
    state: RoomState.LOBBY,
    messages: [],
    private: !!password,
  };

  if (!max || max < 6 || max > 12) return res.status(400).send({ message: 'rooms/invalid-max' });

  if (password) {
    if (!PasswordRegEx.test(password)) return res.status(400).send({ message: 'rooms/invalid-password' });

    data.password = Hash(password);
  }

  const query = await fbworker.rooms.where('name', '==', data.name).get();
  if (!query.empty) return res.status(400).send({ message: 'rooms/name-already-in-use' });

  await fbworker.rooms.doc(data.id).set(data);

  const room: RoomResponse = omit(data, 'password');
  return res.status(201).send({ room });
};
