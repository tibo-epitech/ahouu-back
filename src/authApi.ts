import { Request, Response } from 'express';
import cryptoJS from 'crypto-js';
import axios, { AxiosRequestConfig } from 'axios';
import fbworker from './dbWorker';

const authApi : {[k: string]: (arg0: Request, arg1: Response) => void} = {};

async function getTokenFromAuth0() {
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

    return axios.request(options).then((response) => response.data.access_token.toString());
}

authApi.register = async (req : Request, res : Response) => {
    if (req.body === undefined) {
        res.status(400).json({
            success: false,
            message: 'body is undefined',
        });
        return;
    }
    if (req.body.password === undefined || req.body.password === null || req.body.password === '') {
        res.status(400).json({
            success: false,
            message: 'no password was provided',
        });
        return;
    }
    if (req.body.email === undefined || req.body.email === null || req.body.email === '') {
        res.status(400).json({
            success: false,
            message: 'no email was provided',
        });
        return;
    }
    const userID = cryptoJS.MD5(req.body.email).toString();
    const userCall = await fbworker.users.doc(userID).get();
    if (userCall.exists) {
        res.status(400).json({
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
    } else {
        const first = user.email.split('@')[0];
        user.username = first;
    }
    await fbworker.users.doc(userID).set(user);
    res.status(201).json({
        success: true,
        message: 'register successfully',
        user,
    });
};

authApi.login = async (req : Request, res : Response) => {
    if (req.body === undefined) {
        res.status(400).json({
            success: false,
            message: 'body is undefined',
        });
        return;
    }
    if (req.body.password === undefined || req.body.password === null || req.body.password === '') {
        res.status(400).json({
            success: false,
            message: 'no password was provided',
        });
        return;
    }
    if (req.body.email === undefined || req.body.email === null || req.body.email === '') {
        res.status(400).json({
            success: false,
            message: 'no email was provided',
        });
        return;
    }
    const userID = cryptoJS.MD5(req.body.email).toString();
    const userCall = await fbworker.users.doc(userID).get();
    if (!userCall.exists) {
        res.status(403).json({
            success: false,
            message: 'user doesn\'t exist',
        });
        return;
    }
    const user = userCall.data();
    const passwordToCompare = cryptoJS.MD5(req.body.password).toString();
    if (user === undefined || user.password !== passwordToCompare) {
        res.status(403).json({
            success: false,
            message: 'login incorrect',
        });
        return;
    }
    getTokenFromAuth0().then((accessToken) => {
        user.token = accessToken;
        fbworker.users.doc(userID).set(user);
        res.status(200).json({
            success: true,
            message: 'login successfully',
            user,
        });
    });
};

export default authApi;
