import { NextFunction, Request } from 'express';
import { UnauthorizedError } from 'express-jwt';

import db from './dbWorker';
import { User } from './types';

export const EmailRegEx = new RegExp(/^[^@\s]+@[^@\s.]+\.[^@.\s]+$/);
export const PasswordRegEx = new RegExp(/^[a-zA-Z0-9]{6,}$/);

export const getUserFromRequest = async (
  req: Request,
  next: NextFunction,
): Promise<User | void> => {
  if (!req || !req.headers || !req.headers.authorization) {
    const err = new UnauthorizedError('credentials_required', { message: 'Missing token' });
    return next(err);
  }

  const token = req.headers.authorization.replace('Bearer ', '');
  const snap = await db.users.where('token', '==', token).get();

  if (snap.empty) {
    const err = new UnauthorizedError('invalid_token', { message: 'Token not found' });
    return next(err);
  }

  return snap.docs[0].data() as User;
};
