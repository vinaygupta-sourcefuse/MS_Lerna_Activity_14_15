import {post, requestBody, HttpErrors} from '@loopback/rest';
import axios from 'axios';

/* Book Interface */
import {Signup, Login, Token} from '../models/user';

export class AuthController {
  private authBaseURL = 'http://localhost:3011';

  constructor() {}

  /* Auth End Points */

  @post('/user/signup')
  async signupUser(@requestBody() userData: Signup): Promise<Token> {
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

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (error.response) {
        console.error('Error during signup API call:', error.response.data);
        throw new HttpErrors.Unauthorized(
          `Signup failed: ${error.response.data.message || 'Unknown error'}`,
        );
      } else if (error.request) {
        console.error(
          'Error during signup: No response from the server',
          error.request,
        );
        throw new HttpErrors.GatewayTimeout(
          'Signup service is unavailable. Please try again later.',
        );
      } else {
        console.error('Error during signup:', error.message);
        throw new HttpErrors.InternalServerError(
          'An unexpected error occurred during signup.',
        );
      }
    }
  }

  @post('/admin/signup')
  async signupAdmin(@requestBody() userData: Signup): Promise<Token> {
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

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (error.response) {
        console.error('Error during signup API call:', error.response.data);
        throw new HttpErrors.Unauthorized(
          `Signup failed: ${error.response.data.message || 'Unknown error'}`,
        );
      } else if (error.request) {
        console.error(
          'Error during signup: No response from the server',
          error.request,
        );
        throw new HttpErrors.GatewayTimeout(
          'Signup service is unavailable. Please try again later.',
        );
      } else {
        console.error('Error during signup:', error.message);
        throw new HttpErrors.InternalServerError(
          'An unexpected error occurred during signup.',
        );
      }
    }
  }

  @post('/login')
  async login(@requestBody() credentials: Login): Promise<Token> {
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

      const token: any = {accessToken, refreshToken};

      return token;
    } catch (error) {
      if (error.response) {
        console.error('Error during login API call:', error.response.data);
        throw new HttpErrors.Unauthorized(
          `Login failed: ${error.response.data.message || 'Invalid credentials.'}`,
        );
      } else if (error.request) {
        console.error(
          'Error during login: No response from the server',
          error.request,
        );
        throw new HttpErrors.GatewayTimeout(
          'Login service is unavailable. Please try again later.',
        );
      } else {
        console.error('Error during login:', error.message);
        throw new HttpErrors.InternalServerError(
          'An unexpected error occurred during login.',
        );
      }
    }
  }

  @post('/logout')
  async logout(
    @requestBody() body: {refreshToken: string},
  ): Promise<{message: string}> {
    try {
      const response = await axios.post(`${this.authBaseURL}/logout`, body);

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

  //it should be implemented in provider or inside the sequence so it can be used like middleware
  //   @post('/refresh-token')
  //   async refreshToken(
  //     @requestBody() body: {refreshToken: string},
  //   ): Promise<{accessToken: string}> {
  //     try {
  //       const response = await axios.post(
  //         `${this.authBaseURL}/refresh-token`,
  //         body,
  //       );

  //       return response.data;
  //     } catch (error) {
  //       if (error.response) {
  //         console.error(
  //           'Error during refresh token API call:',
  //           error.response.data,
  //         );
  //         throw new HttpErrors.Unauthorized(
  //           `Refresh token failed: ${error.response.data.message || 'Unknown error'}`,
  //         );
  //       } else if (error.request) {
  //         console.error(
  //           'Error during refresh token: No response from the server',
  //           error.request,
  //         );
  //         throw new HttpErrors.GatewayTimeout(
  //           'Refresh token service is unavailable. Please try again later.',
  //         );
  //       } else {
  //         console.error('Error during refresh token:', error.message);
  //         throw new HttpErrors.InternalServerError(
  //           'An unexpected error occurred during refresh token.',
  //         );
  //       }
  //     }
  //   }
}
