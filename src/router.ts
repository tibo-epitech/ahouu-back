import express from 'express';

import * as auth from './api/auth';
import * as users from './api/users';
import * as rooms from './api/rooms';
import { authed, unauthed } from './authorization';

const router = express.Router();

/**
 * Public
 */
router.post('/login', unauthed, auth.login);
router.post('/verify', unauthed, auth.verify);
router.post('/register', unauthed, auth.register);

/**
 * Private
 */
router.post('/users/update', authed, users.update);
router.post('/rooms/create', authed, rooms.create);

export default router;
