"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var dotenv = __importStar(require("dotenv"));
var router_1 = __importDefault(require("./router"));
dotenv.config({ path: "./.env." + process.env.NODE_ENV + "/" });
var app = express_1.default();
var port = process.env.PORT;
var host = process.env.HOST;
app.use('/', router_1.default);
app.listen(port, function () {
    console.log("server listen on: " + host + port); // eslint-disable-line
});
if ("" + process.env.NODE_ENV === 'test') {
    setTimeout(function () {
        console.error('Test OK'); // eslint-disable-line
        process.exit(0);
    }, 3000);
}
