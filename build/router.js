"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var strings_ = require("./strings.json");
var router = express_1.default.Router();
var strings = JSON.parse(JSON.stringify(strings_));
router.get('/', function (req, res) {
    res.send('Hello World');
});
router.get('*/:lang?', function (req, res) {
    res.status(404);
    if (req.query.lang !== undefined) {
        var lang = req.query.lang.toString();
        res.send(strings[lang].routeDown);
    }
    else {
        res.send(strings.en.routeDown);
    }
});
exports.default = router;
