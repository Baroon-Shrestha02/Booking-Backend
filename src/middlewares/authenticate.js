import AppError from "../shared/errors/AppError.js";
import { AUTH_ERROR_CODES, USER_STATUSES } from "../shared/constants/index.js";
import { verifyAccessToken } from "../shared/security/tokens.js";
import { findRefreshSessionByPublicId } from "../modules/auth/auth.repository.js";
import { findUserById } from "../modules/users/user.repository.js";

const authenticate = async (req, _res, next) => {
  try {
    const header = req.get("authorization") || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError(
        401,
        AUTH_ERROR_CODES.UNAUTHENTICATED,
        "A bearer token is required.",
      );
    }
    const claims = verifyAccessToken(token);
    const [session, user] = await Promise.all([
      findRefreshSessionByPublicId(claims.sid),
      findUserById(claims.sub),
    ]);

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !user ||
      !user.isVerified ||
      user.status !== USER_STATUSES.ACTIVE ||
      String(session.user) !== String(user._id)
    ) {
      throw new AppError(
        401,
        AUTH_ERROR_CODES.UNAUTHENTICATED,
        "The session is no longer active.",
      );
    }

    req.auth = {
      userId: String(user._id),
      databaseUserId: user._id,
      role: user.role,
      sessionId: session.id,
      token,
    };
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
