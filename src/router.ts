import express from 'express';

import * as auth from './api/auth';
import * as rooms from './api/rooms';
import * as users from './api/users';
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
router.post('/rooms/get-one', authed, rooms.getOne);
router.post('/rooms/get-many', authed, rooms.getMany);

export default router;
