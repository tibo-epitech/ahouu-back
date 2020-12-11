// import fs from 'fs'
// import http from 'http'

// import { LoadFirestoreRulesOptions } from '@firebase/rules-unit-testing/dist/src/api'

// import config from '../../../firebase.json'
// import firebase, { FIRESTORE_COVERAGE_FILE, FIRESTORE_COVERAGE_URL, PROJECT_ID } from './firebase'

import Users from './users'
import Rooms from './rooms'

// before(async() => {
//     const rules = fs.readFileSync(config.firestore.rules, 'utf8')

//     const options: LoadFirestoreRulesOptions = {
//         projectId: PROJECT_ID,
//         rules,
//     }

//     await firebase.loadFirestoreRules(options)
// })

// beforeEach(async () => firebase.clearFirestoreData({ projectId: PROJECT_ID }))

// after(async () => {
//     await Promise.all(firebase.apps().map(app => app.delete()))

//     const fstream = fs.createWriteStream(FIRESTORE_COVERAGE_FILE)

//     await new Promise((resolve, reject) => {
//         http.get(FIRESTORE_COVERAGE_URL, res => {
//             res.pipe(fstream, { end: true })

//             res.on('end', resolve)
//             res.on('error', reject)
//         })
//     })

//     console.log(`Coverage information is available at: ${process.cwd()}/${FIRESTORE_COVERAGE_FILE}\n`)
// })

describe('Users', Users.bind(this));
describe('Rooms', Rooms.bind(this));
