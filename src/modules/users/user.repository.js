import User from "./user.model.js";
import { USER_ROLES } from "../../shared/constants/index.js";
import { createUserId } from "./user.ids.js";

const ensureUserId = async (user) => {
  if (!user || user.userId) return user;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const userId = createUserId(user.role);
    try {
      const result = await User.collection.updateOne(
        {
          _id: user._id,
          $or: [{ userId: { $exists: false } }, { userId: null }],
        },
        { $set: { userId } },
      );

      if (result.modifiedCount === 1) {
        user.userId = userId;
        return user;
      }

      const storedUser = await User.collection.findOne(
        { _id: user._id },
        { projection: { userId: 1 } },
      );
      if (storedUser?.userId) {
        user.userId = storedUser.userId;
        return user;
      }
    } catch (error) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }

  return user;
};

export const findUserByPhone = async (
  phone,
  { includePassword = false } = {},
) => {
  const query = User.findOne({ phone });
  if (includePassword) query.select("+passwordHash");
  return ensureUserId(await query);
};

export const findUserByEmail = async (
  email,
  { includePassword = false } = {},
) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+passwordHash");
  return ensureUserId(await query);
};
export const findUserById = async (
  id,
  { includePassword = false } = {},
) => {
  const query = User.findById(id);
  if (includePassword) query.select("+passwordHash");
  return ensureUserId(await query);
};

export const createUnverifiedPlayer = ({ name, email, phone, passwordHash }) =>
  User.create({
    userId: createUserId(USER_ROLES.PLAYER),
    name,
    email,
    phone,
    passwordHash,
    role: USER_ROLES.PLAYER,
    isVerified: false,
  });

export const createUnverifiedOwner = ({ name, email, phone, passwordHash }) =>
  User.create({
    userId: createUserId(USER_ROLES.OWNER),
    name,
    email,
    phone,
    passwordHash,
    role: USER_ROLES.OWNER,
    isVerified: false,
  });

export const updateUnverifiedRegistration = (userId, { name, passwordHash }) =>
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

export const updateUserProfile = (userId, updates) =>
  User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true },
  );
