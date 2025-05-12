import {
  post,
  requestBody,
  HttpErrors,
  Response,
  RestBindings,
} from '@loopback/rest';
import axios from 'axios';
import {inject} from '@loopback/core';
import {Signup, Login, Token} from '../models/user';
import {
  handleAuthResponseTokens,
  handleAxiosError,
} from '../utils/auth-utils';

export class AuthController {
  private authBaseURL = 'http://localhost:3011';

  constructor() {}

  @post('/user/signup')
  async signupUser(
    @requestBody() userData: Signup,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Token> {
    try {
      userData.role = 'user';
      const response = await axios.post(`${this.authBaseURL}/signup`, userData);
      const {accessToken, refreshToken} = response.data;
      return handleAuthResponseTokens(res, accessToken, refreshToken);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleAxiosError(error, 'Authentication failed or Username already exists');
      }
      throw new HttpErrors.InternalServerError('Signup processing failed');
    }
  }

  @post('/admin/signup')
  async signupAdmin(
    @requestBody() userData: Signup,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Token> {
    try {
      userData.role = 'admin';
      const response = await axios.post(`${this.authBaseURL}/signup`, userData);
      const {accessToken, refreshToken} = response.data;
      return handleAuthResponseTokens(res, accessToken, refreshToken);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleAxiosError(error, 'Authentication failed or Username already exists');
      }
      throw new HttpErrors.InternalServerError('Signup processing failed');
    }
  }

  @post('/login')
  async login(
    @requestBody() credentials: Login,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Token> {
    try {
      const response = await axios.post(`${this.authBaseURL}/login`, credentials);
      const {accessToken, refreshToken} = response.data;
      return handleAuthResponseTokens(res, accessToken, refreshToken);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleAxiosError(error, 'Authentication failed');
      }
      throw new HttpErrors.InternalServerError('Login processing failed');
    }
  }

  @post('/logout')
  async logout(
    @requestBody() body: {refreshToken: string},
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<{message: string}> {
    try {
      const response = await axios.post(`${this.authBaseURL}/logout`, body);
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        handleAxiosError(error, 'Logout failed');
      }
      throw new HttpErrors.InternalServerError('Logout processing failed');
    }
  }
}