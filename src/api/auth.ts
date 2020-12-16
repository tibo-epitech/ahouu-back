import omit from 'lodash.omit';
import isEmpty from 'lodash.isempty';
import cryptoJS from 'crypto-js';
import imagemin from 'imagemin';
import JpegTran from 'imagemin-jpegtran';
import PngQuant from 'imagemin-pngquant';
import { UploadedFile } from 'express-fileupload';
import { Request, Response } from 'express';
import axios, { AxiosRequestConfig } from 'axios';

import mime from '../mime';
import fbworker, { storage } from '../dbWorker';
import { User, UserResponse } from '../types';
import { EmailRegEx, PasswordRegEx } from '../utils';

async function getTokenFromAuth0(): Promise<string> {
  const options : AxiosRequestConfig = {
    method: 'POST',
    url: 'https://ahouu-back.eu.auth0.com/oauth/token',
    headers: { 'content-type': 'application/json' },
    data: {
      grant_type: 'client_credentials',
      client_id: 'cR2ngLbO1T3PvYIjT1LclXita39FO4p6',
      client_secret: 'XIpBZpcCFxda78qwxYGtt_DeiTYIr_9tj1UDe3jWu2VAkKBel1up7a75jwL_nmgn',
      audience: 'https://ahouu-back-authorization',
    },
  };

  const res = await axios.request(options);
  const { access_token: accessToken } = res.data as { access_token: string};

  return accessToken.toString();
}

export const register = async (
  req: Request,
  res: Response,
): Promise<Response<{ user: User }>> => {
  if (isEmpty(req.body)) return res.status(400).send({ message: 'auth/invalid-body' });

  const body = req.body as { email: string, password: string, username: string};
  const { email, password, username } = body;

  if (isEmpty(email) || !EmailRegEx.test(email.trim())) return res.status(400).send({ message: 'auth/invalid-email' });
  if (isEmpty(password) || !PasswordRegEx.test(password)) return res.status(400).send({ message: 'auth/invalid-password' });

  const userID = cryptoJS.MD5(email.trim()).toString();
  const userCall = await fbworker.users.doc(userID).get();

  const parsed = isEmpty(username) ? email.trim().split('@')[0] : username.trim();

  const q1 = await fbworker.users.where('email', '==', email.trim()).get();
  const q2 = await fbworker.users.where('username', '==', parsed).get();

  if (userCall.exists || !q1.empty) return res.status(400).send({ message: 'auth/email-already-in-use' });
  if (!q2.empty) return res.status(400).send({ message: 'auth/username-already-in-use' });

  const data: User = {
    id: userID,
    email: email.trim(),
    password: cryptoJS.MD5(password).toString(),
    username: parsed,
    rooms: [],
    token: await getTokenFromAuth0(),
  };

  if (!isEmpty(req.files)) {
    const { picture } = req.files as { picture: UploadedFile };

    const ext = mime[picture.mimetype];
    const path = `users/${userID}/picture.${ext}`;

    const buffer = picture?.data;
    const optimized = await imagemin.buffer(buffer, {
      plugins: [
        JpegTran(),
        PngQuant({ quality: [0.6, 0.8] }),
      ],
    });

    const file = storage.file(path);
    await file.save(optimized, { public: true, contentType: picture?.mimetype });

    data.picture = file.publicUrl();
  }

  await fbworker.users.doc(userID).set(data);

  const user: UserResponse = omit(data, 'password');
  return res.status(201).send({ user });
};

export const login = async (
  req: Request,
  res: Response,
): Promise<Response<{ user: User }>> => {
  if (isEmpty(req.body)) return res.status(400).send({ message: 'auth/invalid-body' });

  const body = req.body as { email: string, password: string };
  const { email, password } = body;

  if (isEmpty(email)) return res.status(400).send({ message: 'auth/invalid-email' });
  if (isEmpty(password)) return res.status(400).send({ message: 'auth/invalid-password' });

  const userID = cryptoJS.MD5(email).toString();
  const userCall = await fbworker.users.doc(userID).get();
  if (!userCall.exists) return res.status(400).send({ message: 'auth/user-not-found' });

  const data = userCall.data() as User;
  const passwordToCompare = cryptoJS.MD5(password).toString();

  if (data.password !== passwordToCompare) return res.status(400).send({ message: 'auth/invalid-credentials' });

  data.token = await getTokenFromAuth0();
  await fbworker.users.doc(userID).set(data);

  const user: UserResponse = omit(data, 'password');
  return res.status(200).send({ user });
};
