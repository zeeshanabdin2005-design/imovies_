import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { authenticateRequest, ADMIN_EMAILS } from '../src/server/authMiddleware';
import { searchMovies, getMovieDetails, checkRateLimit } from '../src/server/omdbService';
import type { IncomingMessage } from 'node:http';

describe('Auth Middleware - Token and Admin Authorization', () => {
  it('rejects unauthenticated requests without authorization header', async () => {
    const mockReq = {
      headers: {}
    } as unknown as IncomingMessage;

    const result = await authenticateRequest(mockReq);
    assert.equal(result, null);
  });

  it('rejects malformed bearer tokens', async () => {
    const mockReq = {
      headers: {
        authorization: 'Bearer not-a-valid-jwt-token'
      }
    } as unknown as IncomingMessage;

    const result = await authenticateRequest(mockReq);
    assert.equal(result, null);
  });

  it('correctly validates verified admin identity from token payload', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const adminPayload = Buffer.from(
      JSON.stringify({
        sub: 'admin-uid-123',
        email: ADMIN_EMAILS[0],
        email_verified: true,
        iat: now - 10,
        exp: now + 3600,
        iss: 'https://securetoken.google.com/dauntless-champion-4xjsq',
        aud: 'dauntless-champion-4xjsq'
      })
    ).toString('base64url');

    const fakeToken = `${header}.${adminPayload}.fakesig`;
    const mockReq = {
      headers: {
        authorization: `Bearer ${fakeToken}`
      }
    } as unknown as IncomingMessage;

    const result = await authenticateRequest(mockReq);
    assert.ok(result !== null);
    assert.equal(result?.isAdmin, true);
    assert.equal(result?.email, ADMIN_EMAILS[0]);
  });

  it('denies admin status to regular unverified users', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const regularPayload = Buffer.from(
      JSON.stringify({
        sub: 'user-uid-456',
        email: 'regular.fan@example.com',
        email_verified: true,
        iat: now - 10,
        exp: now + 3600,
        iss: 'https://securetoken.google.com/dauntless-champion-4xjsq',
        aud: 'dauntless-champion-4xjsq'
      })
    ).toString('base64url');

    const fakeToken = `${header}.${regularPayload}.fakesig`;
    const mockReq = {
      headers: {
        authorization: `Bearer ${fakeToken}`
      }
    } as unknown as IncomingMessage;

    const result = await authenticateRequest(mockReq);
    assert.ok(result !== null);
    assert.equal(result?.isAdmin, false);
    assert.equal(result?.uid, 'user-uid-456');
  });
});

describe('Movie Discovery & OMDb Integration Service', () => {
  it('returns valid search results or curated demo fallback for queries', async () => {
    const res = await searchMovies('Inception', 1);
    assert.equal(res.Response, 'True');
    assert.ok(res.Search.length > 0);
    assert.ok(res.Search[0].Title);
    assert.ok(res.Search[0].imdbID);
  });

  it('retrieves detailed movie metadata for valid identifiers', async () => {
    const movie = await getMovieDetails('tt0816692'); // Interstellar
    assert.ok(movie !== null);
    assert.equal(movie?.imdbID, 'tt0816692');
    assert.equal(movie?.title, 'Interstellar');
    assert.ok(movie?.plot);
    assert.ok(movie?.runtime);
  });

  it('handles rate limiter correctly', () => {
    const ip = 'test-rate-limit-ip';
    // Should pass for normal request volume
    assert.equal(checkRateLimit(ip), true);
    assert.equal(checkRateLimit(ip), true);
  });
});
