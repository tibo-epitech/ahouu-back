import express, { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import router from './router';

dotenv.config({ path: `./config/.env.${process.env.NODE_ENV}` });

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use((req, res, next) => { next(); }, cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

app.use((err: any, req: Request, res: Response, next: any) => { // eslint-disable-line
    if (err.name === 'UnauthorizedError') {
        res.status(401).send({
            success: false,
            message: 'invalid token',
        });
    }

    next();
});

app.listen(port, () => {
    console.log(`server listen on: ${host}${port}`); // eslint-disable-line
});
