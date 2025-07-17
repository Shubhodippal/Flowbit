const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('./setup');

describe('Token Refresh Tests', () => {
  let user, accessToken, refreshToken;

  beforeAll(async () => {
    // Create test user
    user = new User({
      name: 'Test User',
      email: 'token-test@example.com',
      password: 'password123',
      customerId: 'TOKEN-TEST',
      role: 'User'
    });
    await user.save();
  });

  afterAll(async () => {
    await User.deleteMany({ email: 'token-test@example.com' });
  });

  describe('Login with new token structure', () => {
    it('should return both access token and refresh token on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'token-test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('token-test@example.com');

      // Store tokens for further tests
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      // Verify token structure
      const decodedAccess = jwt.verify(accessToken, process.env.JWT_SECRET);
      expect(decodedAccess.type).toBe('access');
      expect(decodedAccess.userId).toBe(user._id.toString());
      expect(decodedAccess.customerId).toBe('TOKEN-TEST');

      const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      expect(decodedRefresh.type).toBe('refresh');
      expect(decodedRefresh.userId).toBe(user._id.toString());
    });

    it('should accept access token for protected routes', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('token-test@example.com');
    });
  });

  describe('Token Refresh Endpoint', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');

      // Verify new tokens are different
      expect(response.body.accessToken).not.toBe(accessToken);
      expect(response.body.refreshToken).not.toBe(refreshToken);

      // Update our stored tokens
      const oldRefreshToken = refreshToken;
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;

      // Verify old refresh token is invalidated
      await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: oldRefreshToken
        })
        .expect(401);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(401);

      expect(response.body.error).toContain('Invalid refresh token');
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(401);

      expect(response.body.error).toContain('Refresh token required');
    });
  });

  describe('Access Token Expiration', () => {
    it('should reject expired access token', async () => {
      // Create an expired access token
      const expiredAccessToken = jwt.sign(
        { 
          userId: user._id, 
          customerId: user.customerId, 
          role: user.role,
          type: 'access'
        },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' } // Already expired
      );

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredAccessToken}`)
        .expect(401);

      expect(response.body.error).toBe('Token expired');
      expect(response.body.code).toBe('TOKEN_EXPIRED');
    });

    it('should reject refresh token as access token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(401);

      expect(response.body.error).toContain('Invalid token type');
    });
  });

  describe('Logout Endpoint', () => {
    it('should invalidate refresh token on logout', async () => {
      // First, verify refresh token works
      await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: refreshToken
        })
        .expect(200);

      // Verify refresh token is now invalid
      await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        })
        .expect(401);
    });

    it('should handle logout with invalid refresh token gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: 'invalid-token'
        })
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});
