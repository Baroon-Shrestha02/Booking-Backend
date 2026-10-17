import User from "./user.model.js";
import { USER_ROLES } from "../../shared/constants/index.js";

export const findUserByPhone = (phone, { includePassword = false } = {}) => {
  const query = User.findOne({ phone });
  if (includePassword) query.select("+passwordHash");
  return query;
};

export const findUserByEmail = (email, { includePassword = false } = {}) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+passwordHash");
  return query;
};
export const findUserById = (id, { includePassword = false } = {}) => {
  const query = User.findById(id);
  if (includePassword) query.select("+passwordHash");
  return query;
};

export const createUnverifiedPlayer = ({ name, email, phone, passwordHash }) =>
  User.create({
    name,
    email,
    phone,
    passwordHash,
    role: USER_ROLES.PLAYER,
    isVerified: false,
  });

export const updateUnverifiedRegistration = (
  userId,
  { name, passwordHash },
) =>
  User.findOneAndUpdate(
    { _id: userId, isVerified: false },
    { $set: { name, passwordHash } },
    { new: true },
  );

export const verifyUser = (userId) =>
  User.findOneAndUpdate(
    { _id: userId, isVerified: false },
    {
      $set: {
        isVerified: true,
        verifiedAt: new Date(),
        lastLoginAt: new Date(),
      },
    },
    { new: true },
  );

export const deleteUnverifiedUser = (userId) =>
  User.deleteOne({ _id: userId, isVerified: false });

export const markUserLogin = (userId) =>
  User.findByIdAndUpdate(
    userId,
    { $set: { lastLoginAt: new Date() } },
    { new: true },
  );

export const updatePassword = (userId, passwordHash) =>
  User.findByIdAndUpdate(
    userId,
    {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    },
    { new: true },
  );
