import type { MigrationBuilder } from "node-pg-migrate";

exports.up = (pgm: MigrationBuilder): void => {
  pgm.createTable("users", {
    id: "id",
    username: { type: "varchar(50)", notNull: true, unique: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });
};

exports.down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("users");
};
