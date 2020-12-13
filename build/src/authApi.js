"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const axios_1 = __importDefault(require("axios"));
const dbWorker_1 = __importDefault(require("./dbWorker"));
const authApi = {};
async function getTokenFromAuth0() {
    const options = {
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
    return axios_1.default.request(options).then((response) => response.data.access_token.toString());
}
authApi.register = async (req, res) => {
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
    const userID = crypto_js_1.default.MD5(req.body.email).toString();
    const userCall = await dbWorker_1.default.users.doc(userID).get();
    if (userCall.exists) {
        res.status(400).json({
            success: false,
            message: 'user already exist',
        });
        return;
    }
    const user = {};
    user.id = userID;
    user.email = req.body.email;
    user.password = crypto_js_1.default.MD5(req.body.password).toString();
    if (req.body.username !== undefined) {
        user.username = req.body.username;
    }
    else {
        const first = user.email.split('@')[0];
        user.username = first;
    }
    await dbWorker_1.default.users.doc(userID).set(user);
    res.status(201).json({
        success: true,
        message: 'register successfully',
        user,
    });
};
authApi.login = async (req, res) => {
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
    const userID = crypto_js_1.default.MD5(req.body.email).toString();
    const userCall = await dbWorker_1.default.users.doc(userID).get();
    if (!userCall.exists) {
        res.status(403).json({
            success: false,
            message: 'user doesn\'t exist',
        });
        return;
    }
    const user = userCall.data();
    const passwordToCompare = crypto_js_1.default.MD5(req.body.password).toString();
    if (user === undefined || user.password !== passwordToCompare) {
        res.status(403).json({
            success: false,
            message: 'login incorrect',
        });
        return;
    }
    getTokenFromAuth0().then((accessToken) => {
        user.token = accessToken;
        dbWorker_1.default.users.doc(userID).set(user);
        res.status(200).json({
            success: true,
            message: 'login successfully',
            user,
        });
    });
};
exports.default = authApi;
