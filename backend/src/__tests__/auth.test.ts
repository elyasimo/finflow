import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { db } from '../db.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

describe('Auth API', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePass123';
  let authToken: string;

  afterAll(async () => {
    // Cleanup: delete test user
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('POST /auth/register', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testEmail);
      expect(response.body.user).not.toHaveProperty('passwordHash');

      authToken = response.body.accessToken;
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(400);
    });

    it('should reject weak password', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'another@example.com',
          password: 'short',
        })
        .expect(400);
    });

    it('should reject invalid email', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: testPassword,
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login existing user', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should reject wrong password', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword',
        })
        .expect(401);
    });

    it('should reject non-existent user', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.email).toBe(testEmail);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token', async () => {
      await request(app).get('/auth/me').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
