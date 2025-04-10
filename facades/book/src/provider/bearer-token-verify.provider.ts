import dotenv from 'dotenv';
dotenv.config();
import {Provider} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import jwt from 'jsonwebtoken';
import {VerifyFunction} from 'loopback4-authentication';
import {User} from '../models/user';
import {RolePermissions} from '../utils/permissionsMappling.js';

export class BearerTokenVerifyProvider
  implements Provider<VerifyFunction.BearerFn>
{
  constructor() {}

  value(): VerifyFunction.BearerFn {
    console.log('Bearer token verify provider value() called');

    return async (token: string) => {
      try {
        if (!token) {
          throw new HttpErrors.Unauthorized('Token not provided');
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '1' as string, {
          issuer: process.env.JWT_ISSUER || 'issuer',
        });

        const user = decoded as User;
        if (!user) {
          throw new HttpErrors.Unauthorized(
            'Token is invalid or has missing data',
          );
        }

        console.log('Decoded user: ', user);
        user.permissions = RolePermissions[user.role] || [];
        return user;
      } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
          console.error('JWT Error:', error.message);
          throw new HttpErrors.Unauthorized(`Invalid token: ${error.message}`);
        }

        if (error instanceof jwt.TokenExpiredError) {
          console.error('Token expired:', error.message);
          throw new HttpErrors.Unauthorized('Token has expired');
        }

        console.error('Unexpected error:', error);
        throw new HttpErrors.Unauthorized('Invalid or expired token');
      }
    };
  }
}