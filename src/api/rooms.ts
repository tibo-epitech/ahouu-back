import { NextFunction, Request, Response } from 'express';
import isEmpty from 'lodash.isempty';
import omit from 'lodash.omit';

import fbworker from '../dbWorker';
import {
  Room, RoomCreateBody, RoomGetManyBody, RoomGetOneBody, RoomResponse,
  RoomState,
} from '../types';

import {
  GenerateRandomID, GenerateRoomName, getUserFromRequest, Hash, PasswordRegEx,
} from '../utils';

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ room: RoomResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  const body = req.body as RoomCreateBody;
  const { name = GenerateRoomName(), max = 8, password } = body;

  const data: Room = {
    id: GenerateRandomID(),
    admin: current.username,
    name,
    max,
    players: [],
    state: RoomState.LOBBY,
    private: !!password,
    adminTurn: 'none',
    votes: {
      wolfs: {},
      villagers: {},
    },
  };

  const query = await fbworker.rooms.where('name', '==', data.name).get();
  if (!query.empty) return res.status(400).send({ message: 'rooms/room-name-already-in-use' });

  if (!max || max < 4 || max > 12) return res.status(400).send({ message: 'rooms/invalid-max' });

  if (password) {
    if (!PasswordRegEx.test(password)) return res.status(400).send({ message: 'rooms/invalid-password' });

    data.password = Hash(password);
  }

  await fbworker.rooms.doc(data.id).set(data);

  const room: RoomResponse = omit(data, 'password');
  return res.status(201).send({ room });
};

export const join = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ room: RoomResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  if (isEmpty(req.body)) return res.status(400).send({ message: 'rooms/invalid-body' });

  const body = req.body as { id: string, password: string };
  const { id, password } = body;

  const snap = await fbworker.rooms.doc(id).get();
  if (!snap.exists) return res.status(400).send({ message: 'rooms/room-not-found' });

  const hash = Hash(password);
  const room = snap.data() as Room;

  if (!room.password || room.password !== hash) return res.status(400).send({ message: 'rooms/invalid-password' });

  return res.status(201).send({ valid: true });
};

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ room: RoomResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  if (isEmpty(req.body)) return res.status(400).send({ message: 'rooms/invalid-body' });

  const body = req.body as RoomGetOneBody;
  const { id } = body;

  const snap = await fbworker.rooms.doc(id).get();
  if (!snap.exists) return res.status(400).send({ message: 'rooms/room-not-found' });

  const data = snap.data() as Room;

  const room: RoomResponse = omit(data, 'password');
  return res.status(201).send({ room });
};

export const getMany = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ room: RoomResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  const query = await fbworker.rooms.get();
  const rooms = query.docs.map((snap) => omit(snap.data() as Room, 'password'));

  return res.status(201).send({ rooms });
};
