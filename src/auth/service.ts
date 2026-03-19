import bcrypt from "bcrypt";
import { createUser, findUserByIdentifier, type UserRow, UserConflictError } from "../db/users.js";

const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 12;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function normalizeUsername(username: string): string {
  return username.toLowerCase().trim();
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim();
}

function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

function isValidEmail(email: string): boolean {
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email);
}

function validateSignupInput(username: string, email: string, password: string): void {
  if (!username) {
    throw new ValidationError("Username is required");
  }

  if (username.includes("@")) {
    throw new ValidationError("Username cannot contain an @");
  }

  if (!isValidPassword(password)) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  if (!email) {
    throw new ValidationError("Email is required");
  }

  if (!isValidEmail(email)) {
    throw new ValidationError("Please enter a valid email");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError("Password must be at least 8 characters");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function registerUser(
  usernameRaw: string,
  emailRaw: string,
  passwordRaw: string,
): Promise<UserRow> {
  const username = normalizeUsername(usernameRaw);
  const email = normalizeEmail(emailRaw);
  const password = passwordRaw;

  validateSignupInput(username, email, password);

  const hashedPassword = await hashPassword(password);

  return createUser({ username, email, password: hashedPassword });
}

export async function authenticateUser(
  identifierRaw: string,
  passwordRaw: string,
): Promise<UserRow | null> {
  const identifier = normalizeIdentifier(identifierRaw);
  if (!identifier) {
    return null;
  }

  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return null;
  }

  const ok = await verifyPassword(passwordRaw, user.password);
  if (!ok) {
    return null;
  }

  return user;
}

export { UserConflictError };
