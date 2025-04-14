// src/utils/token-refresh.helper.ts

import {Request, Response} from '@loopback/rest';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import {HttpErrors} from '@loopback/rest';

export class TokenRefreshHelper {
  static skipPaths = ['/login', '/refresh-token', '/signup', '/ping'];

  static async refreshAccessTokenIfNeeded(
    req: Request,
    res: Response,
  ): Promise<void> {
    if (this.skipPaths.includes(req.path)) return;

    const cookies = this.parseCookies(req.headers.cookie || '');
    let accessToken = cookies.accessToken;
    const refreshToken = cookies.refreshToken;

    console.log("accessToken",accessToken)
    console.log("refreshToken ", refreshToken)
    if (!refreshToken) {
      throw new HttpErrors.Unauthorized('Refresh token not found');
    }

    try {
      jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET || '1');
      req.headers.authorization = `Bearer ${accessToken}`;
    } catch (err: any) {
      console.log("error name", err.name)
      if ((err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') && refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `http://localhost:3011/refresh-token`,
            {refreshToken},
          );
          const newAccessToken = refreshResponse.data.accessToken;
          console.log("new access token assigned", newAccessToken);
          if (!newAccessToken) throw new Error('No access token received');

          res.setHeader(
            'Set-Cookie',
            this.serializeCookie('accessToken', newAccessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              path: '/',
              maxAge: 900,
            }),
          );

          req.headers.authorization = `Bearer ${newAccessToken}`;
        } catch (refreshErr) {
          res.setHeader('Set-Cookie', [
            this.serializeCookie('accessToken', '', {path: '/', maxAge: 0}),
            this.serializeCookie('refreshToken', '', {path: '/', maxAge: 0}),
          ]);
          throw new HttpErrors.Unauthorized(
            'Session expired. Please login again.',
          );
        }
      } else {
        throw new HttpErrors.Unauthorized('Invalid access token');
      }
    }
  }

  private static parseCookies(cookieHeader: string): Record<string, string> {
    return cookieHeader
      .split(';')
      .map(c => c.trim().split('='))
      .reduce((acc, [key, value]) => {
        acc[key] = decodeURIComponent(value);
        return acc;
      }, {} as Record<string, string>);
  }

  private static serializeCookie(
    name: string,
    value: string,
    options: Record<string, any> = {},
  ): string {
    const pairs = [`${name}=${encodeURIComponent(value)}`];
    for (const [key, val] of Object.entries(options)) {
      if (val === true) {
        pairs.push(key);
      } else {
        pairs.push(`${key}=${val}`);
      }
    }
    return pairs.join('; ');
  }
}
