"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const ahouu_db_firebase_json_1 = __importDefault(require("../config/ahouu-db-firebase.json"));
const serviceAccount = JSON.parse(JSON.stringify(ahouu_db_firebase_json_1.default));
const fbworker = {};
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: 'https://ahouu-db.firebaseio.com',
});
const db = firebase_admin_1.default.firestore();
fbworker.users = db.collection('users');
exports.default = fbworker;
