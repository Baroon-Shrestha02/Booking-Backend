import OtpChallenge from "./otpChallenge.model.js";
import RefreshSession from "./refreshSession.model.js";

export const findLatestOtp = ({ userId, purpose, includeHash = false }) => {
  const query = OtpChallenge.findOne({ user: userId, purpose }).sort({ createdAt: -1 });
  if (includeHash) query.select("+codeHash");
  return query;
};

export const invalidateOpenOtps = ({ userId, purpose }) =>
  OtpChallenge.updateMany(
    { user: userId, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } },
  );

export const createOtpChallenge = (data) => OtpChallenge.create(data);

export const incrementOtpAttempts = (id) =>
  OtpChallenge.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true });

export const consumeOtp = (id) =>
  OtpChallenge.findOneAndUpdate(
    {
      _id: id,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ["$attempts", "$maxAttempts"] },
    },
    { $set: { consumedAt: new Date() } },
    { new: true },
  );

export const createRefreshSession = (data) => RefreshSession.create(data);

export const findRefreshSessionByPublicId = (id, { includeHash = false } = {}) => {
  const query = RefreshSession.findOne({ id });
  if (includeHash) query.select("+currentTokenHash");
  return query;
};

export const rotateRefreshSession = (id, { tokenHash, expiresAt }) =>
  RefreshSession.findOneAndUpdate(
    { id, revokedAt: null, expiresAt: { $gt: new Date() } },
    {
      $set: {
        currentTokenHash: tokenHash,
        expiresAt,
        lastUsedAt: new Date(),
      },
    },
    { new: true },
  );

export const revokeRefreshSession = (id) =>
  RefreshSession.findOneAndUpdate(
    { id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

export const revokeAllRefreshSessions = (userId) =>
  RefreshSession.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
