"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authApi_1 = __importDefault(require("./authApi"));
const strings_ = require("../config/strings.json");
const router = express_1.default.Router();
const strings = JSON.parse(JSON.stringify(strings_));
// Routes GET
router.get('/', (req, res) => {
    res.send('Ping');
});
router.get('*/:lang?', (req, res) => {
    res.status(404);
    if (req.query.lang !== undefined) {
        const lang = req.query.lang.toString();
        res.send(strings[lang].routeDown);
    }
    else {
        res.send(strings.en.routeDown);
    }
});
// Routes POST
router.post('/login', (req, res) => {
    authApi_1.default.login(req, res);
});
router.post('/register', (req, res) => {
    authApi_1.default.register(req, res);
});
exports.default = router;
