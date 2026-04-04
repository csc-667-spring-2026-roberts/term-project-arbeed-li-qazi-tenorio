import db from "./connection.js";

export interface UserRow {
  username: string;
  password: string;
  email: string;
  age: number;
  created_at: Date;
}

type CreateUserInput = {
  username: string;
  email: string;
  password: string;
  age: number;
};

export class UserConflictError extends Error {
  code: "USERNAME_TAKEN" | "EMAIL_TAKEN" | "AGE_TAKEN" | "PASSWORD_TAKEN";

  constructor(
    code: "USERNAME_TAKEN" | "EMAIL_TAKEN" | "AGE_TAKEN" | "PASSWORD_TAKEN",
    conflictingUsername?: string,
  ) {
    super(
      code === "USERNAME_TAKEN"
        ? "Username already taken"
        : code === "EMAIL_TAKEN"
          ? "Email already taken"
          : code === "AGE_TAKEN"
            ? "Age already taken"
            : `${conflictingUsername ?? "Another user"} has that password`,
    );
    this.name = "UserConflictError";
    this.code = code;
  }
}

type pgError = {
  code?: string;
  constraint?: string;
  detail?: string;
};

function mapUniqueViolation(error: unknown): UserConflictError | null {
  const pgError = error as pgError;

  if (pgError.code !== "23505") {
    return null;
  }

  const constraint = pgError.constraint ?? "";
  const detail = pgError.detail ?? "";

  if (constraint.includes("username") || detail.includes("(username)")) {
    return new UserConflictError("USERNAME_TAKEN");
  }

  if (constraint.includes("email") || detail.includes("(email)")) {
    return new UserConflictError("EMAIL_TAKEN");
  }

  if (constraint.includes("age") || detail.includes("(age)")) {
    return new UserConflictError("AGE_TAKEN");
  }

  return new UserConflictError("EMAIL_TAKEN");
}

export async function findUserByAge(age: number): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT username, password, email, age, created_at
                                 FROM users 
                                 WHERE age = $1
                                 `,
    [age],
  );
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT username, password, email, age, created_at
                                 FROM users 
                                 WHERE email = $1
                                 `,
    [email],
  );
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT username, password, email, age, created_at
                                 FROM users 
                                 WHERE username = $1
                                 `,
    [username],
  );
}

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  if (identifier.includes("@")) {
    return findUserByEmail(identifier);
  }

  return findUserByUsername(identifier);
}

export async function listUsersForPasswordCheck(): Promise<
  Array<Pick<UserRow, "username" | "password">>
> {
  return db.manyOrNone<Pick<UserRow, "username" | "password">>(
    `
      SELECT username, password
      FROM users
    `,
  );
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { username, email, password, age } = input;

  try {
    return await db.one<UserRow>(
      `
                                      INSERT INTO users(username, email, password, age)
                                      VALUES($1, $2, $3, $4)
                                     RETURNING username, password, email, age, created_at
                                     `,
      [username, email, password, age],
    );
  } catch (error) {
    const mapped = mapUniqueViolation(error);
    if (mapped) {
      throw mapped;
    }

    throw error;
  }
}
