import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Access token carrying the user id (`sub`) and token version (`ver`). The role is deliberately NOT stored in the
 * token: the authenticate middleware loads the user on each request, so role changes and deleted
 * accounts take effect immediately instead of when the token expires.
 */
export interface TokenPayload {
  sub: string;
  /** The user's tokenVersion when issued; signing out bumps it and so revokes every older token. */
  ver: number;
}

// Pinning the algorithm prevents algorithm-confusion attacks (e.g. a token claiming `alg: none`).
const ALGORITHM = 'HS256';

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): TokenPayload => {
  // verify() checks the signature, the algorithm and the expiry, and throws if any is invalid.
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.ver !== 'number') {
    throw new Error('Malformed token');
  }
  return { sub: decoded.sub, ver: decoded.ver };
};
