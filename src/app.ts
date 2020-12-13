import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from './router';

dotenv.config({ path: `./config/.env.${process.env.NODE_ENV}` });

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', router);

app.use((err: any, req: Request, res: Response, next: any) => { // eslint-disable-line
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({
            success: false,
            message: 'invalid token',
        });
    }
});

app.listen(port, () => {
    console.log(`server listen on: ${host}${port}`); // eslint-disable-line
});

if (`${process.env.NODE_ENV}` === 'test') {
    setTimeout(() => {
        console.error('Test OK'); // eslint-disable-line
        process.exit(0);
    }, 3000);
}
