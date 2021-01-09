import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import http from 'http';

import router from './router';
import io from './socket';

const app = express();
const server = http.createServer(app);

io(server);

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
