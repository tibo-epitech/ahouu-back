import { Request, Response } from 'express';
import cryptoJS from 'crypto-js';
import axios, { AxiosRequestConfig } from 'axios';
import isEmpty from 'lodash.isempty';
import omit from 'lodash.omit';
import fbworker from './dbWorker';
import { User, UserResponse } from './types';

const authApi : {[k: string]: (arg0: Request, arg1: Response) => void} = {};

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

    return axios.request(options).then((response) => response.data.access_token.toString());
}

authApi.register = async (req : Request, res : Response) => {
    if (isEmpty(req.body)) return res.status(400).send({ message: 'auth/invalid-body' });

    const { email, password, username } = req.body;
    if (isEmpty(email)) return res.status(400).send({ message: 'auth/invalid-email' });
    if (isEmpty(password)) return res.status(400).send({ message: 'auth/invalid-password' });

    const userID = cryptoJS.MD5(email).toString();
    const userCall = await fbworker.users.doc(userID).get();

    const parsed = isEmpty(username) ? email.split('@')[0] : username;
    const query = await fbworker.users.where('username', '==', parsed).get();

    if (userCall.exists || query.docs.length) return res.status(400).send({ message: 'auth/user-already-in-use' });

    const data: User = {
        id: userID,
        email,
        password: cryptoJS.MD5(password).toString(),
        username: parsed,
        rooms: [],
        token: await getTokenFromAuth0(),
    };
    await fbworker.users.doc(userID).set(data);

    const user: UserResponse = omit(data, 'password');
    return res.status(201).send({ user });
};

authApi.login = async (req : Request, res : Response) => {
    if (isEmpty(req.body)) return res.status(400).send({ message: 'auth/invalid-body' });

    const { email, password } = req.body;
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

export default authApi;
