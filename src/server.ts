// import socket from 'socket.io';
import http from 'http';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import express, { NextFunction, Request, Response } from 'express';

import router from './router';

const app = express();
const server = http.createServer(app);
// const io = new socket.Server(server);

app.use(cors());
app.use(fileUpload({ parseNested: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') res.status(401).send({ message: 'auth/invalid-token' });

  next();
});

export default server;
