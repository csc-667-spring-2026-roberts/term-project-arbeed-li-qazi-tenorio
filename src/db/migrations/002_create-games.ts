import type { MigrationBuilder } from "node-pg-migrate";

exports.up = (pgm: MigrationBuilder): void => {
  pgm.createTable("games", {
    id: "id",
    status: { type: "varchar(20)", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.addConstraint("games", "status_check", {
    check: "status IN ('waiting', 'active', 'completed')",
  });
};

exports.down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("games");
};
