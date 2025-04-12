import {
  post,
  requestBody,
  HttpErrors,
  Response,
  RestBindings,
} from '@loopback/rest';
import axios from 'axios';

/* Book Interface */
import {Signup, Login, Token} from '../models/user';
import {inject} from '@loopback/core';

export class AuthController {
  private authBaseURL = 'http://localhost:3011';

  constructor() {}

  /* Auth End Points */

  @post('/user/signup')
  async signupUser(
    @requestBody() userData: Signup,
    @inject(RestBindings.Http.RESPONSE) res: Response, // LoopBack/Express response
  ): Promise<Token> {
    try {
      // Ensure the role is fixed to "user" regardless of the input
      userData.role = 'user';
      const response = await axios.post(`${this.authBaseURL}/signup`, userData);

      const {accessToken, refreshToken} = response.data;

      if (!accessToken && !refreshToken) {
        throw new HttpErrors.Unauthorized(
          'Access token or refresh token cannot be empty.',
        );
      }

      // Set access token cookie with security flags
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production', // Enforces HTTPS in production
        sameSite: 'strict', // Prevents CSRF
        maxAge: 15 * 60 * 1000, // 15 minutes expiration (matches token expiry)
        path: '/', // Accessible across all routes
      });

      // Set refresh token cookie with security flags
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        path: '/',
      });

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Authentication failed or Username already exists';
        throw new HttpErrors.Unauthorized(message);
      }

      console.error('Unexpected login error:', error);
      throw new HttpErrors.InternalServerError('Login processing failed');
    }
  }

  @post('/admin/signup')
  async signupAdmin(
    @requestBody() userData: Signup,
    @inject(RestBindings.Http.RESPONSE) res: Response, // LoopBack/Express response
  ): Promise<Token> {
    try {
      // Ensure the role is fixed to "user" regardless of the input
      userData.role = 'admin';
      const response = await axios.post(`${this.authBaseURL}/signup`, userData);

      const {accessToken, refreshToken} = response.data;

      if (!accessToken && !refreshToken) {
        throw new HttpErrors.Unauthorized(
          'Access token or refresh token cannot be empty.',
        );
      }

      // Set access token cookie with security flags
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production', // Enforces HTTPS in production
        sameSite: 'strict', // Prevents CSRF
        maxAge: 15 * 60 * 1000, // 15 minutes expiration (matches token expiry)
        path: '/', // Accessible across all routes
      });

      // Set refresh token cookie with security flags
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        path: '/',
      });

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message ||
          'Authentication failed or Username already exists';
        throw new HttpErrors.Unauthorized(message);
      }

      console.error('Unexpected login error:', error);
      throw new HttpErrors.InternalServerError('Login processing failed');
    }
  }

  @post('/login')
  async login(
    @requestBody() credentials: Login,
    @inject(RestBindings.Http.RESPONSE) res: Response, // LoopBack/Express response
  ): Promise<Token> {
    try {
      const response = await axios.post(
        `${this.authBaseURL}/login`,
        credentials,
      );

      const {accessToken, refreshToken} = response.data;

      if (!accessToken && !refreshToken) {
        throw new HttpErrors.Unauthorized(
          'Access token or refresh token cannot be empty.',
        );
      }

      // Set access token cookie with security flags
      res.cookie('accessToken', accessToken, {
        httpOnly: true, // Prevents JavaScript access
        secure: process.env.NODE_ENV === 'production', // Enforces HTTPS in production
        sameSite: 'strict', // Prevents CSRF
        maxAge: 15 * 60 * 1000, // 15 minutes expiration (matches token expiry)
        path: '/', // Accessible across all routes
      });

      // Set refresh token cookie with security flags
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
        path: '/',
      });

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || 'Authentication failed';
        throw new HttpErrors.Unauthorized(message);
      }

      console.error('Unexpected login error:', error);
      throw new HttpErrors.InternalServerError('Login processing failed');
    }
  }

  @post('/logout')
  async logout(
    @requestBody() body: {refreshToken: string},
    @inject(RestBindings.Http.RESPONSE) res: Response, // LoopBack/Express response
  ): Promise<{message: string}> {
    try {
      const response = await axios.post(`${this.authBaseURL}/logout`, body);

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('Error during logout API call:', error.response.data);
        throw new HttpErrors.Unauthorized(
          `Logout failed: ${error.response.data.message || 'Unknown error'}`,
        );
      } else if (error.request) {
        console.error(
          'Error during logout: No response from the server',
          error.request,
        );
        throw new HttpErrors.GatewayTimeout(
          'Logout service is unavailable. Please try again later.',
        );
      } else {
        console.error('Error during logout:', error.message);
        throw new HttpErrors.InternalServerError(
          'An unexpected error occurred during logout.',
        );
      }
    }
  }

}
