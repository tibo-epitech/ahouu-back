/* eslint-disable no-console */
import server from './server';

process
  .on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason))
  .on('uncaughtException', (err) => console.error('Uncaught Exception:', err))
  .on('SIGINT', (signal) => console.log('Received signal:', signal))
  .on('SIGTERM', (signal) => console.log('Received signal;', signal))
  .on('beforeExit', (code) => {
    if (server.listening) server.close(() => process.exit(code));
    else process.exit(code);

    setTimeout(() => process.exit(code), 500).unref();
  });

server.listen(process.env.PORT || 7070, () => {
  console.log(`🚀 Server ready at: http://localhost:${process.env.PORT || 7070}`);
});
