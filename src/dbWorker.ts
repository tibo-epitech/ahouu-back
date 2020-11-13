import adminDb from 'firebase-admin';
import serviceAccount_ from '../config/ahouu-db-firebase.json';

const serviceAccount = JSON.parse(JSON.stringify(serviceAccount_));

adminDb.initializeApp({
    credential: adminDb.credential.cert(serviceAccount),
    databaseURL: 'https://ahouu-db.firebaseio.com',
});

const db = adminDb.firestore();

export default db;
