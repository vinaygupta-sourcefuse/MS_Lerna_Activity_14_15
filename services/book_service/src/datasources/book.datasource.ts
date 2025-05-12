import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

export const config = {
  name: 'book',
  connector: 'mysql',
  url: 'mysql://vinay:password@localhost/book',
  host: 'localhost',
  port: 3306,
  user: 'vinay',
  password: 'password',
  database: 'book'
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class BookDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'book';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.book', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
