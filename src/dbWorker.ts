import adminDb from 'firebase-admin';
import serviceAccount_ from '../config/ahouu-db-firebase.json';

const serviceAccount = JSON.parse(JSON.stringify(serviceAccount_));
const fbworker : {[k: string]: FirebaseFirestore.CollectionReference} = {};

adminDb.initializeApp({
    credential: adminDb.credential.cert(serviceAccount),
    databaseURL: 'https://ahouu-db.firebaseio.com',
});

const db = adminDb.firestore();
fbworker.users = db.collection('users');

export default fbworker;
