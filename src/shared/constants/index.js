export const USER_ROLES = Object.freeze({
  PLAYER: "player",
  OWNER: "owner",
  ADMIN: "admin",
});

export const USER_STATUSES = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
});

export const BUSINESS_VERIFICATION_STATUSES = Object.freeze({
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  CHANGES_REQUESTED: "changes_requested",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const VENUE_STATUSES = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
});

export const VENUE_TYPES = Object.freeze({
  FUTSAL: "futsal",
  BASKETBALL: "basketball",
  BADMINTON: "badminton",
});

export const VENUE_CLOSURE_TYPES = Object.freeze({
  SINGLE_DAY: "single_day",
  DATE_RANGE: "date_range",
});

export const VENUE_AVAILABILITY_STATUSES = Object.freeze({
  ACTIVE: "active",
  CLOSED: "closed",
});

export const OTP_PURPOSES = Object.freeze({
  REGISTRATION: "registration",
  PASSWORD_RESET: "password_reset",
});

export const AUTH_ERROR_CODES = Object.freeze({
  INVALID_CREDENTIALS: "invalid_credentials",
  INVALID_OTP: "invalid_otp",
  OTP_RATE_LIMITED: "otp_rate_limited",
  ACCOUNT_EXISTS: "account_exists",
  ACCOUNT_NOT_VERIFIED: "account_not_verified",
  ALREADY_VERIFIED: "already_verified",
  OTP_DELIVERY_UNAVAILABLE: "otp_delivery_unavailable",
  RATE_LIMITED: "rate_limited",
  UNAUTHENTICATED: "unauthenticated",
  TOKEN_EXPIRED: "token_expired",
  REFRESH_TOKEN_REUSED: "refresh_token_reused",
  FORBIDDEN: "forbidden",
  VALIDATION_FAILED: "validation_failed",
  NOT_FOUND: "not_found",
  INTERNAL_ERROR: "internal_error",
});

export const OWNER_ERROR_CODES = Object.freeze({
  BUSINESS_VERIFICATION_EXISTS: "business_verification_exists",
  BUSINESS_VERIFICATION_NOT_FOUND: "business_verification_not_found",
  BUSINESS_VERIFICATION_LOCKED: "business_verification_locked",
  DOCUMENT_UPLOAD_UNAVAILABLE: "document_upload_unavailable",
});

export const VENUE_ERROR_CODES = Object.freeze({
  NOT_FOUND: "venue_not_found",
  BUSINESS_NOT_APPROVED: "business_verification_not_approved",
  IMAGE_UPLOAD_UNAVAILABLE: "venue_image_upload_unavailable",
});
