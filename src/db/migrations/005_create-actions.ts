import type { MigrationBuilder } from "node-pg-migrate";

exports.up = (pgm: MigrationBuilder): void => {
  pgm.createTable("actions", {
    id: "id",
    player_id: { type: "integer", notNull: true, references: "players(id)", onDelete: "CASCADE" },
    hand_id: { type: "integer", notNull: true, references: "hands(id)", onDelete: "CASCADE" },
    action_type: { type: "varchar(20)", notNull: true },
    amount: { type: "integer" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.addConstraint("actions", "action_type_check", {
    check: "action_type IN ('fold', 'check', 'call', 'bet', 'raise', 'small_blind', 'big_blind')",
  });
};

exports.down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("actions");
};
