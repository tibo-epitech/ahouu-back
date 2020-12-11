import express from 'express';
import * as dotenv from 'dotenv';
import bodyParser from 'body-parser';
import router from './router';

dotenv.config({ path: `./config/.env.${process.env.NODE_ENV}/` });

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

app.listen(port, () => {
    console.log(`server listen on: ${host}${port}`); // eslint-disable-line
});

if (`${process.env.NODE_ENV}` === 'test') {
    setTimeout(() => {
        console.error('Test OK'); // eslint-disable-line
        process.exit(0);
    }, 3000);
}
