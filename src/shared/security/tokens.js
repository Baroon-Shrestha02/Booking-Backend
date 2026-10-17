import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import AppError from "../errors/AppError.js";
import { AUTH_ERROR_CODES } from "../constants/index.js";

const verify = ({ token, secret, expectedType }) => {
  try {
    const payload = jwt.verify(token, secret);
    if (
      payload.typ !== expectedType ||
      !payload.sub ||
      !payload.sid
    ) {
      throw new Error("Unexpected token claims");
    }
    return payload;
  } catch (error) {
    const expired = error?.name === "TokenExpiredError";
    throw new AppError(
      401,
      expired
        ? AUTH_ERROR_CODES.TOKEN_EXPIRED
        : AUTH_ERROR_CODES.UNAUTHENTICATED,
      expired
        ? "Your session token has expired."
        : "A valid authentication token is required.",
    );
  }
};

export const issueAccessToken = ({ userId, sessionId, role }) =>
  jwt.sign(
    { sub: userId, sid: sessionId, role, typ: "access" },
    env.accessTokenSecret,
    { expiresIn: env.accessTokenExpiresIn, jwtid: randomUUID() },
  );

export const issueRefreshToken = ({ userId, sessionId, role }) =>
  jwt.sign(
    { sub: userId, sid: sessionId, role, typ: "refresh" },
    env.refreshTokenSecret,
    { expiresIn: `${env.refreshTokenExpiresDays}d`, jwtid: randomUUID() },
  );

export const verifyAccessToken = (token) =>
  verify({
    token,
    secret: env.accessTokenSecret,
    expectedType: "access",
  });

export const verifyRefreshToken = (token) =>
  verify({
    token,
    secret: env.refreshTokenSecret,
    expectedType: "refresh",
  });

