const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World');
});

router.use((req, res) => {
    res.status(404);
    res.send('error route not found');
});

module.exports = router;
