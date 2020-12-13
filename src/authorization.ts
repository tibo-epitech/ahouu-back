import jwt = require('express-jwt');
import jwks = require('jwks-rsa');

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: 'https://ahouu-back.eu.auth0.com/.well-known/jwks.json',
    }),
    audience: 'https://ahouu-back-authorization',
    issuer: 'https://ahouu-back.eu.auth0.com/',
    algorithms: ['RS256'],
});

export default jwtCheck;
