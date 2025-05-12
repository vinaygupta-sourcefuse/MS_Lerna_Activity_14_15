import {BookServiceApplication} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import {ApplicationConfig} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {config} from '../../datasources/book.datasource';

export interface AppWithClient {
  app: BookServiceApplication;
  client: Client;
}

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig: ApplicationConfig = {
    rest: givenHttpServerConfig({
      port: 0, // Random port for parallel tests
    }),
  };

  const app = new BookServiceApplication(restConfig);

  // Setup in-memory DB
  const testDbConfig = {
    ...config,
    connector: 'memory',
    debug: process.env.DEBUG === 'true',
  };

  app.bind('datasources.db').to(
    new juggler.DataSource(testDbConfig),
  );

  await app.boot();
  await app.migrateSchema();
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}