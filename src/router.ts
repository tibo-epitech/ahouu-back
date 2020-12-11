import express from 'express';
import authApi from './authApi';
import strings_ = require('../config/strings.json');

const router = express.Router();
const strings = JSON.parse(JSON.stringify(strings_));

// Routes GET

router.get('/', (req, res) => {
    res.send('Ping');
});

router.get('*/:lang?', (req, res) => {
    res.status(404);
    if (req.query.lang !== undefined) {
        const lang : string = req.query.lang.toString();
        res.send(strings[lang].routeDown);
    } else {
        res.send(strings.en.routeDown);
    }
});

// Routes POST

router.post('/login', (req, res) => {
    authApi.login(req, res);
});

router.post('/register', (req, res) => {
    authApi.register(req, res);
});

export default router;
