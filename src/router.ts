import express from 'express';
import strings_ = require('./strings.json');

const router = express.Router();
const strings = JSON.parse(JSON.stringify(strings_));

router.get('/', (req, res) => {
    res.send('Hello World');
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

export default router;
