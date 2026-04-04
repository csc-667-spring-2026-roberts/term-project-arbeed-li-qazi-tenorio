import db from "./connection.js";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  email: string;
  created_at: Date;
}

type CreateUserInput = {
  username: string;
  email: string;
  password_hash: string;
};

export class UserConflictError extends Error {
  code: "USERNAME_TAKEN" | "EMAIL_TAKEN";

  constructor(code: "USERNAME_TAKEN" | "EMAIL_TAKEN") {
    super(code === "USERNAME_TAKEN" ? "Username already taken" : "Email already taken");
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

  return new UserConflictError("EMAIL_TAKEN");
}

export async function findUserById(id: number): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT id, username, password_hash, email, created_at
                                 FROM users 
                                 WHERE id = $1
                                 `,
    [id],
  );
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT id, username, password_hash, email, created_at
                                 FROM users 
                                 WHERE email = $1
                                 `,
    [email],
  );
}

export async function findUserByUsername(username: string): Promise<UserRow | null> {
  return db.oneOrNone<UserRow>(
    `
                                 SELECT id, username, password_hash, email, created_at
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

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const { username, email, password_hash } = input;

  try {
    return await db.one<UserRow>(
      `
                                     INSERT INTO users(username, email, password_hash)
                                     VALUES($1, $2, $3)
                                     RETURNING id, username, password_hash, email, created_at
                                     `,
      [username, email, password_hash],
    );
  } catch (error) {
    const mapped = mapUniqueViolation(error);
    if (mapped) {
      throw mapped;
    }

    throw error;
  }
}
