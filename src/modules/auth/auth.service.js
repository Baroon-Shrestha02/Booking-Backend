import env from "../../config/env.js";
import AppError from "../../shared/errors/AppError.js";
import {
  AUTH_ERROR_CODES,
  OTP_PURPOSES,
  USER_STATUSES,
} from "../../shared/constants/index.js";
import { createPublicId } from "../../shared/utils/ids.js";
import { normalizeNepalPhone } from "../../shared/utils/phone.js";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
} from "../../shared/security/otp.js";
import { hashToken, safeEqual } from "../../shared/security/hash.js";
import {
  hashPassword,
  verifyPassword,
} from "../../shared/security/passwords.js";
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken,
} from "../../shared/security/tokens.js";
import {
  consumeOtp,
  createOtpChallenge,
  createRefreshSession,
  findLatestOtp,
  findRefreshSessionByPublicId,
  incrementOtpAttempts,
  invalidateOpenOtps,
  revokeAllRefreshSessions,
  revokeRefreshSession,
  rotateRefreshSession,
} from "./auth.repository.js";
import {
  createUnverifiedPlayer,
  deleteUnverifiedUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  markUserLogin,
  updateUnverifiedRegistration,
  updatePassword,
  verifyUser,
} from "../users/user.repository.js";
import otpSender from "./otpSender.js";

const registrationPurpose = OTP_PURPOSES.REGISTRATION;
const passwordResetPurpose = OTP_PURPOSES.PASSWORD_RESET;

const invalidCredentials = () =>
  new AppError(
    401,
    AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    "The email or password is incorrect.",
  );

const invalidOtp = () =>
  new AppError(
    422,
    AUTH_ERROR_CODES.INVALID_OTP,
    "The verification code is invalid or expired.",
  );

const sessionExpiry = () =>
  new Date(Date.now() + env.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);

const publicUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  role: user.role,
  status: user.status,
  isVerified: user.isVerified,
  verifiedAt: user.verifiedAt,
});

const authData = ({ user, accessToken, refreshToken }) => ({
  ...publicUser(user),
  accessToken,
  refreshToken,
});

const issuePair = ({ user, sessionId }) => {
  const claims = { userId: String(user._id), sessionId, role: user.role };
  return {
    accessToken: issueAccessToken(claims),
    refreshToken: issueRefreshToken(claims),
  };
};

const createLoginSession = async ({ user, ip, userAgent }) => {
  const sessionId = createPublicId("ses");
  const pair = issuePair({ user, sessionId });
  await createRefreshSession({
    id: sessionId,
    user: user._id,
    role: user.role,
    currentTokenHash: hashToken(pair.refreshToken),
    expiresAt: sessionExpiry(),
    createdIp: ip,
    userAgent,
  });
  return authData({ user, ...pair });
};

const assertCanRequestOtp = async (userId, purpose) => {
  const previous = await findLatestOtp({
    userId,
    purpose,
  });
  if (!previous) return;

  const elapsedSeconds = Math.floor(
    (Date.now() - previous.createdAt.getTime()) / 1000,
  );
  const retryAfterSeconds = env.otpResendSeconds - elapsedSeconds;
  if (retryAfterSeconds > 0) {
    throw new AppError(
      429,
      AUTH_ERROR_CODES.OTP_RATE_LIMITED,
      "Wait before requesting another verification code.",
      { retryAfterSeconds },
    );
  }
};

const sendRegistrationOtp = async ({ user, requestedIp }) => {
  await assertCanRequestOtp(user._id, registrationPurpose);

  const code = generateOtp();
  await invalidateOpenOtps({
    userId: user._id,
    purpose: registrationPurpose,
  });
  const challenge = await createOtpChallenge({
    user: user._id,
    purpose: registrationPurpose,
    destination: user.email,
    codeHash: hashOtp({
      subject: String(user._id),
      purpose: registrationPurpose,
      code,
    }),
    expiresAt: new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000),
    maxAttempts: env.otpMaxAttempts,
    requestedIp,
  });

  try {
    await otpSender.sendRegistrationCode({
      email: user.email,
      name: user.name,
      code,
    });
  } catch (error) {
    challenge.consumedAt = new Date();
    await challenge.save();
    throw error;
  }

  return {
    otpExpiresInSeconds: env.otpExpiresMinutes * 60,
    retryAfterSeconds: env.otpResendSeconds,
  };
};

export const registerUser = async ({
  name,
  email: inputEmail,
  phone: inputPhone,
  password,
  requestedIp,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const phone = normalizeNepalPhone(inputPhone);
  const [phoneOwner, emailOwner] = await Promise.all([
    findUserByPhone(phone),
    findUserByEmail(email),
  ]);
  const samePendingUser =
    phoneOwner &&
    emailOwner &&
    String(phoneOwner._id) === String(emailOwner._id) &&
    !phoneOwner.isVerified;
  if ((phoneOwner || emailOwner) && !samePendingUser) {
    throw new AppError(
      409,
      AUTH_ERROR_CODES.ACCOUNT_EXISTS,
      "An account already exists with that phone number or email address.",
    );
  }

  const passwordHash = await hashPassword(password);
  const isNewUser = !samePendingUser;
  const user = samePendingUser
    ? await updateUnverifiedRegistration(phoneOwner._id, {
        name: name.trim(),
        passwordHash,
      })
    : await createUnverifiedPlayer({
        name: name.trim(),
        email,
        phone,
        passwordHash,
      });

  try {
    const delivery = await sendRegistrationOtp({ user, requestedIp });
    return {
      _id: String(user._id),
      email: user.email,
      verificationRequired: true,
      ...delivery,
    };
  } catch (error) {
    if (isNewUser) await deleteUnverifiedUser(user._id);
    throw error;
  }
};

export const resendRegistrationOtp = async ({
  email: inputEmail,
  requestedIp,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) {
    throw new AppError(
      404,
      AUTH_ERROR_CODES.NOT_FOUND,
      "No pending registration was found for this email.",
    );
  }
  if (user.isVerified) {
    throw new AppError(
      409,
      AUTH_ERROR_CODES.ALREADY_VERIFIED,
      "This account has already been verified.",
    );
  }
  return sendRegistrationOtp({ user, requestedIp });
};

export const verifyRegistration = async ({
  email: inputEmail,
  code,
  ip,
  userAgent,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) throw invalidOtp();
  if (user.isVerified) {
    throw new AppError(
      409,
      AUTH_ERROR_CODES.ALREADY_VERIFIED,
      "This account has already been verified.",
    );
  }

  const challenge = await findLatestOtp({
    userId: user._id,
    purpose: registrationPurpose,
    includeHash: true,
  });
  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= challenge.maxAttempts
  ) {
    throw invalidOtp();
  }

  const matches = verifyOtpHash({
    subject: String(user._id),
    purpose: registrationPurpose,
    code,
    expectedHash: challenge.codeHash,
  });
  if (!matches) {
    await incrementOtpAttempts(challenge._id);
    throw invalidOtp();
  }

  const consumed = await consumeOtp(challenge._id);
  if (!consumed) throw invalidOtp();

  const verifiedUser = await verifyUser(user._id);
  if (!verifiedUser) {
    throw new AppError(
      409,
      AUTH_ERROR_CODES.ALREADY_VERIFIED,
      "This account has already been verified.",
    );
  }

  return createLoginSession({ user: verifiedUser, ip, userAgent });
};

export const loginUser = async ({
  email: inputEmail,
  password,
  ip,
  userAgent,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const user = await findUserByEmail(email, { includePassword: true });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw invalidCredentials();
  }
  if (!user.isVerified) {
    throw new AppError(
      403,
      AUTH_ERROR_CODES.ACCOUNT_NOT_VERIFIED,
      "Verify your email before signing in.",
    );
  }
  if (user.status !== USER_STATUSES.ACTIVE) {
    throw new AppError(
      403,
      AUTH_ERROR_CODES.FORBIDDEN,
      "This account is not active.",
    );
  }

  const updatedUser = (await markUserLogin(user._id)) || user;
  return createLoginSession({ user: updatedUser, ip, userAgent });
};

export const refreshTokens = async ({ refreshToken }) => {
  const claims = verifyRefreshToken(refreshToken);
  const session = await findRefreshSessionByPublicId(claims.sid, {
    includeHash: true,
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    throw new AppError(
      401,
      AUTH_ERROR_CODES.UNAUTHENTICATED,
      "The refresh session is no longer active.",
    );
  }

  if (!safeEqual(hashToken(refreshToken), session.currentTokenHash)) {
    await revokeRefreshSession(session.id);
    throw new AppError(
      401,
      AUTH_ERROR_CODES.REFRESH_TOKEN_REUSED,
      "Refresh-token reuse was detected. Sign in again.",
    );
  }

  const user = await findUserById(claims.sub);
  if (
    !user ||
    !user.isVerified ||
    user.status !== USER_STATUSES.ACTIVE ||
    String(user._id) !== String(session.user)
  ) {
    await revokeRefreshSession(session.id);
    throw new AppError(
      401,
      AUTH_ERROR_CODES.UNAUTHENTICATED,
      "The account is no longer available.",
    );
  }

  const pair = issuePair({ user, sessionId: session.id });
  const rotated = await rotateRefreshSession(session.id, {
    tokenHash: hashToken(pair.refreshToken),
    expiresAt: sessionExpiry(),
  });
  if (!rotated) {
    throw new AppError(
      401,
      AUTH_ERROR_CODES.UNAUTHENTICATED,
      "The refresh session is no longer active.",
    );
  }

  return authData({ user, ...pair });
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById(userId);
  if (!user || !user.isVerified) return null;
  return publicUser(user);
};

const neutralPasswordResetMessage =
  "If the account exists, a password reset code has been sent.";

export const requestPasswordReset = async ({
  email: inputEmail,
  requestedIp,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user || !user.isVerified || user.status !== USER_STATUSES.ACTIVE) {
    return { message: neutralPasswordResetMessage };
  }

  await assertCanRequestOtp(user._id, passwordResetPurpose);
  const code = generateOtp();
  await invalidateOpenOtps({
    userId: user._id,
    purpose: passwordResetPurpose,
  });
  const challenge = await createOtpChallenge({
    user: user._id,
    purpose: passwordResetPurpose,
    destination: user.email,
    codeHash: hashOtp({
      subject: String(user._id),
      purpose: passwordResetPurpose,
      code,
    }),
    expiresAt: new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000),
    maxAttempts: env.otpMaxAttempts,
    requestedIp,
  });

  try {
    await otpSender.sendPasswordResetCode({
      email: user.email,
      name: user.name,
      code,
    });
  } catch (error) {
    challenge.consumedAt = new Date();
    await challenge.save();
    throw error;
  }

  return { message: neutralPasswordResetMessage };
};

export const resetPassword = async ({
  email: inputEmail,
  code,
  newPassword,
}) => {
  const email = inputEmail.trim().toLowerCase();
  const user = await findUserByEmail(email);
  if (!user || !user.isVerified || user.status !== USER_STATUSES.ACTIVE) {
    throw invalidOtp();
  }

  const challenge = await findLatestOtp({
    userId: user._id,
    purpose: passwordResetPurpose,
    includeHash: true,
  });
  if (
    !challenge ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= challenge.maxAttempts
  ) {
    throw invalidOtp();
  }

  const matches = verifyOtpHash({
    subject: String(user._id),
    purpose: passwordResetPurpose,
    code,
    expectedHash: challenge.codeHash,
  });
  if (!matches) {
    await incrementOtpAttempts(challenge._id);
    throw invalidOtp();
  }

  const consumed = await consumeOtp(challenge._id);
  if (!consumed) throw invalidOtp();

  const passwordHash = await hashPassword(newPassword);
  await updatePassword(user._id, passwordHash);
  await revokeAllRefreshSessions(user._id);
};

export const changePassword = async ({
  userId,
  currentPassword,
  newPassword,
  ip,
  userAgent,
}) => {
  const user = await findUserById(userId, { includePassword: true });
  if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError(
      401,
      AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      "The current password is incorrect.",
    );
  }
  if (await verifyPassword(newPassword, user.passwordHash)) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "The new password must be different from the current password.",
    );
  }

  const passwordHash = await hashPassword(newPassword);
  const updatedUser = await updatePassword(user._id, passwordHash);
  await revokeAllRefreshSessions(user._id);
  return createLoginSession({ user: updatedUser, ip, userAgent });
};

export const logout = async (sessionId) => {
  await revokeRefreshSession(sessionId);
};
