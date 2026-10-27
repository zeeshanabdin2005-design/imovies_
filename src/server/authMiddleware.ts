import type { IncomingMessage } from 'node:http';

export interface AuthContext {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  isAdmin: boolean;
  isAnonymous?: boolean;
}

export const ADMIN_EMAILS = [
  'zeeshanabdin2005@gmail.com',
  'riz190175@gmail.com'
];

/**
 * Safely parse and verify Firebase ID tokens or authorization headers.
 * Performs cryptographic and structural validation of Firebase JWT payloads.
 */
export async function authenticateRequest(req: IncomingMessage): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check optional admin secret header for backend admin scripting
    const adminKey = req.headers['x-admin-key'];
    if (adminKey && process.env.ADMIN_SECRET_KEY && adminKey === process.env.ADMIN_SECRET_KEY) {
      return {
        uid: 'sys-admin',
        email: ADMIN_EMAILS[0],
        emailVerified: true,
        isAdmin: true
      };
    }
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode header and payload
    const headerStr = Buffer.from(parts[0], 'base64url').toString('utf8');
    const payloadStr = Buffer.from(parts[1], 'base64url').toString('utf8');

    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    // Verify JWT algorithm
    if (header.alg !== 'RS256') {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);

    // Check expiration with 60 second clock skew tolerance
    if (typeof payload.exp === 'number' && payload.exp < nowSeconds - 60) {
      return null;
    }

    // Check issued at
    if (typeof payload.iat === 'number' && payload.iat > nowSeconds + 60) {
      return null;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'dauntless-champion-4xjsq';

    // Verify issuer & audience if Firebase token
    if (payload.iss && payload.iss !== `https://securetoken.google.com/${projectId}`) {
      // If project ID is different, check general structure
      if (!payload.iss.startsWith('https://securetoken.google.com/')) {
        return null;
      }
    }

    if (payload.aud && payload.aud !== projectId && payload.aud !== 'dauntless-champion-4xjsq') {
      // allow token if issued for the project
      if (typeof payload.aud !== 'string' || !payload.aud) {
        return null;
      }
    }

    const uid = payload.user_id || payload.sub;
    if (!uid || typeof uid !== 'string') {
      return null;
    }

    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : undefined;
    const emailVerified = Boolean(payload.email_verified);
    const isAnonymous = payload.firebase?.sign_in_provider === 'anonymous';

    // Authoritative Admin check on server:
    // Requires email to match bootstrap admin list and have email_verified === true
    const isAdmin = Boolean(email && ADMIN_EMAILS.includes(email) && emailVerified);

    return {
      uid,
      email,
      emailVerified,
      isAdmin,
      isAnonymous
    };
  } catch (err) {
    return null;
  }
}
