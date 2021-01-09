import adminDb from 'firebase-admin';
import serviceAccount from '../config/ahouu-db-firebase.json';
import { Collections } from './types';

adminDb.initializeApp({
  credential: adminDb.credential.cert(serviceAccount as adminDb.ServiceAccount),
  databaseURL: 'https://ahouu-db.firebaseio.com',
  storageBucket: 'ahouu-db.appspot.com',
});

const db = adminDb.firestore();
db.settings({ ignoreUndefinedProperties: true });

const fbworker : Record<Collections, FirebaseFirestore.CollectionReference> = {
  users: db.collection('users'),
  rooms: db.collection('rooms'),
};

export const storage = adminDb.storage().bucket();
export default fbworker;
