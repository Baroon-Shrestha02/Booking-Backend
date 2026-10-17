import bcrypt from "bcryptjs";

const PASSWORD_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, PASSWORD_ROUNDS);
export const verifyPassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);
