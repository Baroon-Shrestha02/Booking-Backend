export const parseInteger = (name, value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return parsed;
};

export const parseBoolean = (value, fallback = false) => {
  if (value == null || value === "") return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  throw new Error("Boolean environment values must be true or false");
};

export const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

export const requireSecret = (name, value, { production, minimumLength = 32, fallback } = {}) => {
  const resolved = value || fallback;
  if (!resolved || (production && resolved.length < minimumLength)) {
    throw new Error(`${name} must contain at least ${minimumLength} characters`);
  }
  return resolved;
};
