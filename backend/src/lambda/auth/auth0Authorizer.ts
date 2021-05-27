import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import { JWKS_URL } from '../../utils/env'
import { cache } from 'middy/middlewares'
import * as middy from 'middy'

const logger = createLogger('auth')

// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = JWKS_URL;
//cached JWKS key
let cachedJWKS = null;

export const handler = middy(
  async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken)
    try {
      const jwtToken = await verifyToken(event.authorizationToken)
      logger.info('User was authorized', jwtToken)

      return {
        principalId: jwtToken.sub,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: '*'
            }
          ]
        }
      }
    } catch (e) {
      logger.error('User not authorized', { error: e.message })

      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: '*'
            }
          ]
        }
      }
    }
  }
);

const calculateCacheId = (event: CustomAuthorizerEvent) => Promise.resolve(event.headers.Authorization)

handler.use(cache(calculateCacheId));

async function downloadJWKS(): Promise<any> {
  if (cachedJWKS == null) {
    logger.debug("JWKS not cached. Downloading from: " + jwksUrl);
    const response = await axios.get(jwksUrl)
    if (response.status !== 200) {
      throw new Error('Unable to download JWKS key')
    }
    const keys = response.data.keys
    if (!keys || !keys.length) {
      throw new Error('The JWKS endpoint did not contain any keys')
    }
    //From: https://auth0.com/blog/navigating-rs256-and-jwks/
    const signingKeys = keys
      .filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signature verification
        && key.kty === 'RSA' // We are only supporting RSA (RS256)
        && key.kid           // The `kid` must be present to be useful for later
        && ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
      ).map(key => {
        return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0])};
      });

    if (!signingKeys.length) {
      return new Error('The JWKS endpoint did not contain any signature verification keys');
    }

    cachedJWKS = signingKeys;
    logger.debug("Downloaded JWKS: %s", cachedJWKS);
  }

  return cachedJWKS;
}

async function getSigningKey(kid: string): Promise<any> {
  const keys = await downloadJWKS();
  const signingKey = keys.find(key => key.kid === kid);
  if (!signingKey) {
    throw new Error(`Unable to find a signing key that matches '${kid}'`);
  }
  logger.debug("getSigningKey: %s", JSON.stringify(signingKey));
  return signingKey;
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader);
  const jwt: Jwt = decode(token, { complete: true }) as Jwt;

  if (!jwt.header || jwt.header.alg !== 'RS256') {
    throw new Error("Only RS256 is supported");
  }

  const key = await getSigningKey(jwt.header.kid);
  try {
    logger.debug("Verify: ", key);
    verify(token, key.publicKey, { algorithms: [jwt.header.alg]});
  } catch(err) {
    logger.error(err, token);
    throw new Error("Failed to verify token: " + token);
  }
  return jwt.payload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

function certToPEM(cert) {
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
  return cert;
}
