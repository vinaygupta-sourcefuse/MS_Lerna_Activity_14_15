import {AuthApplication} from './application';
import * as mysql from 'mysql2/promise';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  // Step 1: Create the DB if it doesn't exist
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',       // replace if different
      user: 'vinay',            // your MySQL user
      password: 'password',            // your MySQL password
      port: 3306               // default port
    });

    await connection.query('CREATE DATABASE IF NOT EXISTS auth;');
    console.log('Ensured "auth" database exists.');
    await connection.end();
  } catch (err) {
    console.error('Failed to ensure the database exists', err);
    process.exit(1);
  }

  const app = new AuthApplication();
  await app.boot();
  await app.migrateSchema({existingSchema});

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
