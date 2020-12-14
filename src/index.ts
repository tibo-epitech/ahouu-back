/* eslint-disable no-console */
import http from 'http';
import app from './app';

type Out = Record<string, unknown> | null | undefined | NodeJS.Signals | Error

function handler(this: { server?: http.Server }, message: string, out: Out) {
    try {
        if (out instanceof Error) console.error(`${message}:`, out);
        else console.error(`${message}: ${out}`);

        if (!this.server) process.exit(1);
        this.server.close(() => process.exit(1));
    } catch (e) {
        process.exit(1);
    }
}

const server = app.listen(process.env.PORT || 7070, () => {
    console.log(`🚀 Server ready at: http://localhost:${process.env.PORT || 7070}`);
});

const logger = handler.bind({ server });

process
    .on('unhandledRejection', (reason) => logger('Unhandled Rejection', reason))
    .on('uncaughtException', (err) => logger('Uncaught Exception', err))
    .on('SIGINT', (signal) => logger('Received signal', signal))
    .on('SIGTERM', (signal) => logger('Received signal', signal));
