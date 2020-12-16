import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import router from './router';

const app = express();

// @ts-ignore
app.use(cors());
app.use(fileUpload({ parseNested: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') res.status(401).send({ message: 'auth/invalid-token' });

  next();
});

export default app;
