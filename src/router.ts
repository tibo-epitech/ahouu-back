import express, { NextFunction, Request, Response } from 'express';
import * as auth from './api/auth';
import * as users from './api/users';
import authorization from './authorization';

const router = express.Router();

const open = (req: Request, res: Response, next: NextFunction) => next();

router.post('/login', open, auth.login);
router.post('/verify', open, auth.verify);
router.post('/register', open, auth.register);
router.post('/users/update', authorization, users.update);

export default router;
