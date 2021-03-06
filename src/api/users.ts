import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import imagemin from 'imagemin';
import JpegTran from 'imagemin-jpegtran';
import PngQuant from 'imagemin-pngquant';
import { UploadedFile } from 'express-fileupload';
import { NextFunction, Request, Response } from 'express';

import fbworker, { storage } from '../dbWorker';
import { UserResponse, UserUpdateBody } from '../types';
import {
  EmailRegEx, getUserFromRequest, Hash, PasswordRegEx,
} from '../utils';

// eslint-disable-next-line import/prefer-default-export
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response<{ user: UserResponse }>> => {
  const current = await getUserFromRequest(req, next);
  if (!current) return res;

  const body = req.body as UserUpdateBody;
  const { email, password, username } = body || {};

  if (!isEmpty(email)) {
    const trimed = email.trim();

    if (!EmailRegEx.test(trimed)) return res.status(400).send({ message: 'users/invalid-email' });

    const query = await fbworker.users
      .where('email', '==', trimed)
      .where('id', '!=', current.id)
      .get();

    if (!query.empty) return res.status(400).send({ message: 'users/email-already-in-use' });

    current.email = trimed;
  }

  if (!isEmpty(password)) {
    if (!PasswordRegEx.test(password)) return res.status(400).send({ message: 'users/invalid-password' });

    current.password = Hash(password);
  }

  if (!isEmpty(username)) {
    const trimed = username.trim();

    const query = await fbworker.users
      .where('username', '==', trimed)
      .where('id', '!=', current.id)
      .get();

    if (!query.empty) return res.status(400).send({ message: 'users/username-already-in-use' });

    current.username = trimed;
  }

  if (!isEmpty(req.files)) {
    const { picture } = req.files as { picture: UploadedFile };

    const path = `users/${current.id}/${picture.name}`;

    const buffer = picture.data;
    const optimized = await imagemin.buffer(buffer, {
      plugins: [
        JpegTran(),
        PngQuant({ quality: [0.6, 0.8] }),
      ],
    });

    const file = storage.file(path);
    await file.save(optimized, { public: true, contentType: picture.mimetype });

    current.picture = file.publicUrl();
  }

  await fbworker.users.doc(current.id).set(current);

  const user: UserResponse = omit(current, 'password');
  return res.status(201).send({ user });
};
