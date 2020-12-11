"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_js_1 = __importDefault(require("crypto-js"));
const dbWorker_1 = __importDefault(require("./dbWorker"));
const authApi = {};
authApi.register = async (req, res) => {
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
    const userID = crypto_js_1.default.MD5(req.body.email).toString();
    const userCall = await dbWorker_1.default.users.doc(userID).get();
    if (userCall.exists) {
        res.json({
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
    res.json({
        success: true,
        message: 'register successfully',
        user,
    });
};
authApi.login = async (req, res) => {
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
    const userID = crypto_js_1.default.MD5(req.body.email).toString();
    const userCall = await dbWorker_1.default.users.doc(userID).get();
    if (!userCall.exists) {
        res.json({
            success: false,
            message: 'user doesn\'t exist',
        });
        return;
    }
    const user = userCall.data();
    const passwordToCompare = crypto_js_1.default.MD5(req.body.password).toString();
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
exports.default = authApi;
