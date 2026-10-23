import { USER_ROLES } from "../../shared/constants/index.js";
import { createPublicId } from "../../shared/utils/ids.js";

const USER_ID_PREFIXES = Object.freeze({
  [USER_ROLES.PLAYER]: "ply",
  [USER_ROLES.OWNER]: "own",
});

export const createUserId = (role) => {
  const prefix = USER_ID_PREFIXES[role];
  if (!prefix) throw new Error(`Unsupported user role: ${role}`);
  return createPublicId(prefix);
};
