import {HttpErrors, Response} from '@loopback/rest';
import {AxiosError} from 'axios';

export function handleAuthResponseTokens(
  res: Response,
  accessToken: string,
  refreshToken: string,
) {
  if (!accessToken && !refreshToken) {
    throw new HttpErrors.Unauthorized(
      'Access token or refresh token cannot be empty.',
    );
  }

  // Set access token cookie with security flags
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  // Set refresh token cookie with security flags
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return {accessToken, refreshToken};
}

export function handleAxiosError(error: AxiosError, fallbackMessage: string) {
  if (error.response) {
    const message = (error.response.data as {message?: string})?.message || fallbackMessage;
    throw new HttpErrors.Unauthorized(message);
  } else if (error.request) {
    throw new HttpErrors.GatewayTimeout(
      'No response from the auth server. Try again later.',
    );
  } else {
    throw new HttpErrors.InternalServerError(error.message);
  }
}