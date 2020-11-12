const express = require('express');
const router = require('./src/router');

require('dotenv').config({ path: `./.env.${process.env.NODE_ENV}/` });

const app = express();
const port = process.env.PORT;
const host = process.env.HOST;

app.use('/', router);

app.listen(port, () => {
    console.log(`server listen on: ${host}${port}`);
});

if (`${process.env.NODE_ENV}` === 'test') {
    setTimeout(() => {
        console.error('Test is Ok');
        process.exit(0);
    }, 3000);
}
