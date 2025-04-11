import dotenv from 'dotenv';
dotenv.config();
import {repository} from '@loopback/repository';
import {post, requestBody} from '@loopback/rest';
import {UserRepository, RefreshTokenRepository} from '../repositories';
import {User, RefreshToken} from '../models';
import {sign, verify} from 'jsonwebtoken';
import {HttpErrors} from '@loopback/rest';
import {compare, hash} from 'bcrypt';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(RefreshTokenRepository)
    public refreshTokenRepository: RefreshTokenRepository,
  ) {}

  // Login method - now returns both tokens
  @post('/login')
  async login(
    @requestBody() credentials: {name: string; password: string},
  ): Promise<{accessToken: string; refreshToken: string}> {
    try {
      const user = await this.userRepository.findOne({
        where: {name: credentials.name},
      });

      if (!user) {
        throw new HttpErrors.Unauthorized('Invalid credentials');
      }

      const isPasswordValid = await compare(
        credentials.password,
        user.password as string,
      );

      if (!isPasswordValid) {
        throw new HttpErrors.Unauthorized('Invalid password');
      }

      // Generate access token (short-lived)
      const accessToken = sign(
        {
          id: user.user_id,
          username: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || '1',
        {
          expiresIn: '1m', // Short expiration (15 minutes)
          issuer: process.env.JWT_ISSUER || 'issuer',
        },
      );

      // Generate refresh token (long-lived)
      const refreshToken = sign(
        {
          id: user.user_id,
          tokenType: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {
          expiresIn: '7d', // Longer expiration (7 days)
          issuer: process.env.JWT_ISSUER || 'issuer',
        },
      );

      // Store refresh token in database
      await this.refreshTokenRepository.create({
        token: refreshToken,
        userId: user.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error during login:', error.message);
      throw new HttpErrors.InternalServerError('Login failed');
    }
  }

  // Logout method - now invalidates refresh token
  @post('/logout')
  async logout(
    @requestBody() body: {refreshToken: string},
  ): Promise<{message: string}> {
    try {
      // Verify the refresh token first
      const decoded = verify(
        body.refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      ) as {id: string};

      try {
        // Check if the refresh token exists in the database
        await this.refreshTokenRepository.findById(body.refreshToken);
      } catch (error) {
        return {
          message: 'Refresh token is already invalidated or does not exist',
        };
      }

      // Delete the refresh token from database
      await this.refreshTokenRepository.deleteById(body.refreshToken);

      return {message: 'Logout successful'};
    } catch (error) {
      console.error('Error during logout:', error.message);
      throw new HttpErrors.InternalServerError('Logout failed');
    }
  }

  // Add a new endpoint for token refresh
  @post('/refresh-token')
  async refreshToken(
    @requestBody() body: {refreshToken: string},
  ): Promise<{accessToken: string}> {
    try {
      // 1. Verify the refresh token
      const decoded = verify(
        body.refreshToken,
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      ) as {id: string; tokenType: string};

      if (decoded.tokenType !== 'refresh') {
        throw new HttpErrors.Unauthorized('Invalid token type');
      }

      // 2. Check if refresh token exists in database
      const storedToken = await this.refreshTokenRepository.findById(
        body.refreshToken,
      );
      if (!storedToken) {
        throw new HttpErrors.Unauthorized('Refresh token not found');
      }

      // 3. Check if refresh token is expired
      if (new Date(storedToken.expiresAt) < new Date()) {
        await this.refreshTokenRepository.deleteById(body.refreshToken);
        throw new HttpErrors.Unauthorized('Refresh token expired');
      }

      // 4. Get user details
      const user = await this.userRepository.findById(Number(decoded.id));
      if (!user) {
        throw new HttpErrors.Unauthorized('User not found');
      }

      // 5. Generate new access token
      const accessToken = sign(
        {
          id: user.user_id,
          username: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || '1',
        {
          expiresIn: '1m',
          issuer: process.env.JWT_ISSUER || 'issuer',
        },
      );

      return {accessToken};
    } catch (error) {
      console.error('Error during token refresh:', error.message);
      throw new HttpErrors.Unauthorized('Token refresh failed');
    }
  }

  // Signup method
  @post('/signup')
  async signup(
    @requestBody() userData: User,
  ): Promise<{accessToken: string; refreshToken: string}> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: {name: userData.name},
      });

      if (existingUser) {
        throw new HttpErrors.Conflict('Username already exists');
      }

      const hashPassword = await hash(userData.password as string, 10);

      const user = await this.userRepository.create({
        ...userData,
        password: hashPassword,
      });

      // Generate access token (short-lived)
      const accessToken = sign(
        {
          id: user.user_id,
          username: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || '1',
        {
          expiresIn: '1m', // Short expiration (15 minutes)
          issuer: process.env.JWT_ISSUER || 'issuer',
        },
      );

      // Generate refresh token (long-lived)
      const refreshToken = sign(
        {
          id: user.user_id,
          tokenType: 'refresh',
        },
        process.env.JWT_REFRESH_SECRET || 'refresh-secret',
        {
          expiresIn: '7d', // Longer expiration (7 days)
          issuer: process.env.JWT_ISSUER || 'issuer',
        },
      );

      // Store refresh token in database
      await this.refreshTokenRepository.create({
        token: refreshToken,
        userId: user.user_id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error during signup:', error.message);
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.InternalServerError('Signup failed');
    }
  }
}
