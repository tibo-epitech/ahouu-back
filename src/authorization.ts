import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

export default jwt({
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
