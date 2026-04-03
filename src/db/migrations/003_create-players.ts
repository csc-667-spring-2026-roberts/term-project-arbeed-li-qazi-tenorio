import type { MigrationBuilder } from "node-pg-migrate";

exports.up = (pgm: MigrationBuilder): void => {
  pgm.createTable("players", {
    id: "id",
    user_id: { type: "integer", notNull: true, references: "users(id)", onDelete: "CASCADE" },
    game_id: { type: "integer", notNull: true, references: "games(id)", onDelete: "CASCADE" },
    seat_number: { type: "integer", notNull: true },
    chips: { type: "integer", notNull: true, default: 1000 },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.addConstraint("players", "unique_user_per_game", {
    unique: ["user_id", "game_id"],
  });

  pgm.addConstraint("players", "unique_seat_per_game", {
    unique: ["seat_number", "game_id"],
  });
};

exports.down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("players");
};
