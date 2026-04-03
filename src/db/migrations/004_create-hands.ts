import type { MigrationBuilder } from "node-pg-migrate";

exports.up = (pgm: MigrationBuilder): void => {
  pgm.createTable("hands", {
    id: "id",
    game_id: { type: "integer", notNull: true, references: "games(id)", onDelete: "CASCADE" },
    dealer_seat: { type: "integer", notNull: true },
    stage: { type: "varchar(20)", notNull: true },
    pot: { type: "integer", notNull: true, default: 0 },
  });

  pgm.addConstraint("hands", "stage_check", {
    check: "stage IN ('pre-flop', 'flop', 'turn', 'river', 'showdown', 'completed')",
  });
};

exports.down = (pgm: MigrationBuilder): void => {
  pgm.dropTable("hands");
};
