import {Entity, model, property} from '@loopback/repository';

@model()
export class RefreshToken extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  token: string;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;

  @property({
    type: 'string',
    required: true,
  })
  expiresAt: string;

  @property({
    type: 'string',
    default: new Date().toISOString(),
  })
  createdAt?: string;


  constructor(data?: Partial<RefreshToken>) {
    super(data);
  }
}

export interface RefreshTokenRelations {
  // describe navigational properties here
}

export type RefreshTokenWithRelations = RefreshToken & RefreshTokenRelations;
