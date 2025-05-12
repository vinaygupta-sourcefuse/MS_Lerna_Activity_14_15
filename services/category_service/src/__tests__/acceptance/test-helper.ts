import {CategoryServiceApplication} from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';
import {ApplicationConfig} from '@loopback/core';
import {juggler} from '@loopback/repository';
import {config} from '../../datasources/category.datasource';

export interface AppWithClient {
  app: CategoryServiceApplication;
  client: Client;
}

/**
 * A helper to setup the application for testing.
 * Includes in-memory DB setup with schema initialization and client initialization.
 */
export async function setupApplication(): Promise<AppWithClient> {
  const restConfig: ApplicationConfig = {
    rest: givenHttpServerConfig({
      // Use random port for parallel test execution
      port: 0,
    }),
  };

  const app = new CategoryServiceApplication(restConfig);

  // Create a more realistic in-memory DB with schema initialization
  const testDbConfig = {
    ...config,
    connector: 'memory',
    // Enable debug mode for tests to see SQL queries
    debug: true,
  };

  app.bind('datasources.db').to(
    new juggler.DataSource(testDbConfig),
  );

  await app.boot();
  await app.migrateSchema(); // Ensure schema is created
  await app.start();

  const client = createRestAppClient(app);

  return {app, client};
}