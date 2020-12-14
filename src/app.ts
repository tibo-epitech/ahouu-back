import express, { Request, Response } from 'express';
import cors from 'cors';
import router from './router';

const app = express();

// @ts-ignore
app.use(cors());

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

export default app;
