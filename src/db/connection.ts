import pgPromise from "pg-promise";

const pgp = pgPromise();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const db = pgp(connectionString);

export default db;
