import { Request, Response } from 'express';
import cryptoJS from 'crypto-js';
import fbworker from './dbWorker';

const authApi : {[k: string]: (arg0: Request, arg1: Response) => void} = {};

authApi.register = async (req : Request, res : Response) => {
    if (req.body === undefined) {
        res.json({
            success: false,
            message: 'body is undefined',
        });
        return;
    }
    if (req.body.password === undefined || req.body.password === null || req.body.password === '') {
        res.json({
            success: false,
            message: 'no password was provided',
        });
        return;
    }
    if (req.body.email === undefined || req.body.email === null || req.body.email === '') {
        res.json({
            success: false,
            message: 'no email was provided',
        });
        return;
    }
    const userID = cryptoJS.MD5(req.body.email).toString();
    const userCall = await fbworker.users.doc(userID).get();
    if (userCall.exists) {
        res.json({
            success: false,
            message: 'user already exist',
        });
        return;
    }
    const user : {[k: string]: string} = {};
    user.id = userID;
    user.email = req.body.email;
    user.password = cryptoJS.MD5(req.body.password).toString();
    if (req.body.username !== undefined) {
        user.username = req.body.username;
    }
    await fbworker.users.doc(userID).set(user);
    res.json({
        success: true,
        message: 'register successfully',
        user,
    });
};

authApi.login = async (req : Request, res : Response) => {
    if (req.body === undefined) {
        res.json({
            success: false,
            message: 'body is undefined',
        });
        return;
    }
    if (req.body.password === undefined || req.body.password === null || req.body.password === '') {
        res.json({
            success: false,
            message: 'no password was provided',
        });
        return;
    }
    if (req.body.email === undefined || req.body.email === null || req.body.email === '') {
        res.json({
            success: false,
            message: 'no email was provided',
        });
        return;
    }
    const userID = cryptoJS.MD5(req.body.email).toString();
    const userCall = await fbworker.users.doc(userID).get();
    if (!userCall.exists) {
        res.json({
            success: false,
            message: 'user doesn\'t exist',
        });
        return;
    }
    const user = userCall.data();
    const passwordToCompare = cryptoJS.MD5(req.body.password).toString();
    if (user === undefined || user.password !== passwordToCompare) {
        res.json({
            success: false,
            message: 'login incorrect',
        });
        return;
    }
    res.json({
        success: true,
        message: 'login successfully',
        user,
    });
};

export default authApi;
