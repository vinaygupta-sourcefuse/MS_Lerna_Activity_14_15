import {BookApplication} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import {ApplicationConfig} from '@loopback/core';

export interface AppWithClient {
  app: BookApplication;
  client: Client;
}

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig: ApplicationConfig = {
    rest: givenHttpServerConfig({
      port: 0, // Random port for parallel tests
    }),
  };

  const app = new BookApplication(restConfig);

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}