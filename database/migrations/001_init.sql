CREATE TABLE IF NOT EXISTS users (
  age integer PRIMARY KEY,
  username varchar(50) NOT NULL UNIQUE,
  email varchar(255) NOT NULL UNIQUE,
  password varchar(255) NOT NULL,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS games (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp NOT NULL DEFAULT NOW(),
  status varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(age) ON DELETE CASCADE,
  game_id integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  seat_number integer NOT NULL,
  chips integer NOT NULL,
  UNIQUE (game_id, seat_number),
  UNIQUE (user_id, game_id)
);

CREATE TABLE IF NOT EXISTS hands (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  dealer_seat integer NOT NULL,
  stage varchar(50) NOT NULL,
  pot integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS actions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hand_id integer NOT NULL REFERENCES hands(id) ON DELETE CASCADE,
  player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  action_type varchar(50) NOT NULL,
  amount integer,
  created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_messages (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message text NOT NULL,
  created_at timestamp NOT NULL DEFAULT NOW()
);
