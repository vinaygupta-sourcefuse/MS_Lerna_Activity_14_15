import {Client, expect} from '@loopback/testlab';
import {AuthApplication} from '../../application';
import {setupApplication} from './test-helper';
import {UserRepository, RefreshTokenRepository} from '../../repositories';
import {sign} from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import {hash} from 'bcrypt';

dotenv.config();

describe('AuthController', () => {
  let app: AuthApplication;
  let client: Client;
  let userRepo: UserRepository;
  let refreshTokenRepo: RefreshTokenRepository;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    userRepo = await app.getRepository(UserRepository);
    refreshTokenRepo = await app.getRepository(RefreshTokenRepository);
  });

  after(async () => {
    await app.stop();
  });

  beforeEach(async () => {
    await userRepo.deleteAll();
    await refreshTokenRepo.deleteAll();
  });

  describe('POST /login', () => {
    it('successfully logs in with valid credentials', async () => {
      // Create a test user with properly hashed password
      const hashedPassword = await hash('password', 10);
      const testUser = await userRepo.create({
        name: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user'
      });

      const response = await client
        .post('/login')
        .send({
          name: 'testuser',
          password: 'password' // Correct password
        })
        .expect(200);

      expect(response.body).to.have.properties(['accessToken', 'refreshToken']);
    });

    it('rejects login with invalid username', async () => {
      await client
        .post('/login')
        .send({
          name: 'nonexistent',
          password: 'password'
        })
        .expect(401);
    });

    it('rejects login with invalid password', async () => {
      const hashedPassword = await hash('correctpassword', 10);
      await userRepo.create({
        name: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'user'
      });

      await client
        .post('/login')
        .send({
          name: 'testuser',
          password: 'wrongpassword' // Incorrect password
        })
        .expect(401);
    });
  });

  describe('POST /logout', () => {
    it('successfully logs out with valid refresh token', async () => {
      const testUser = await userRepo.create({
        name: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'user'
      });

      const refreshToken = sign(
        {id: testUser.user_id, tokenType: 'refresh'},
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'issuer'}
      );

      await refreshTokenRepo.create({
        token: refreshToken,
        userId: testUser.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      const response = await client
        .post('/logout')
        .send({refreshToken})
        .expect(200);

      expect(response.body).to.have.property('message', 'Logout successful');
    });

    it('handles already invalidated refresh token', async () => {
      const invalidToken = sign(
        {id: 999, tokenType: 'refresh'},
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'issuer'}
      );

      const response = await client
        .post('/logout')
        .send({refreshToken: invalidToken})
        .expect(200);

      expect(response.body).to.have.property(
        'message',
        'Refresh token is already invalidated or does not exist'
      );
    });
  });

  describe('POST /refresh-token', () => {
    it('successfully refreshes access token', async () => {
      const testUser = await userRepo.create({
        name: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'user'
      });

      const refreshToken = sign(
        {id: testUser.user_id, tokenType: 'refresh'},
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {expiresIn: '7d', issuer: process.env.JWT_ISSUER || 'issuer'}
      );

      await refreshTokenRepo.create({
        token: refreshToken,
        userId: testUser.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      const response = await client
        .post('/refresh-token')
        .send({refreshToken})
        .expect(200);

      expect(response.body).to.have.property('accessToken');
      expect(response.body.accessToken).to.be.a.String();
    });

    it('rejects invalid refresh token', async () => {
      await client
        .post('/refresh-token')
        .send({refreshToken: 'invalidtoken'})
        .expect(401);
    });

    it('rejects expired refresh token', async () => {
      const testUser = await userRepo.create({
        name: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'user'
      });

      const expiredToken = sign(
        {id: testUser.user_id, tokenType: 'refresh'},
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {expiresIn: '-1s', issuer: process.env.JWT_ISSUER || 'issuer'}
      );

      await refreshTokenRepo.create({
        token: expiredToken,
        userId: testUser.user_id,
        expiresAt: new Date(Date.now() - 1000).toISOString()
      });

      await client
        .post('/refresh-token')
        .send({refreshToken: expiredToken})
        .expect(401);
    });
  });

  describe('POST /signup', () => {
    it('successfully creates new user and returns tokens', async () => {
      const newUser = {
        name: 'newuser',
        email: 'new@example.com',
        password: 'password',
        role: 'user'
      };

      const response = await client
        .post('/signup')
        .send(newUser)
        .expect(200);

      expect(response.body).to.have.properties(['accessToken', 'refreshToken']);
      expect(response.body.accessToken).to.be.a.String();
      expect(response.body.refreshToken).to.be.a.String();

      // Verify user was created
      const createdUser = await userRepo.findOne({where: {name: 'newuser'}});
      expect(createdUser).to.not.be.null();
    });

    it('rejects duplicate username', async () => {
      await userRepo.create({
        name: 'existinguser',
        email: 'existing@example.com',
        password: 'password',
        role: 'user'
      });

      await client
        .post('/signup')
        .send({
          name: 'existinguser',
          email: 'new@example.com',
          password: 'password',
          role: 'user'
        })
        .expect(409);
    });

    it('rejects invalid user data', async () => {
      await client
        .post('/signup')
        .send({
          name: 'incomplete',
          // Missing email, password, role
        })
        .expect(422);
    });
  });
});