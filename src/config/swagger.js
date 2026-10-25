const success = (description, dataSchema) => ({
  description,
  content: {
    "application/json": {
      schema: {
        allOf: [
          { $ref: "#/components/schemas/SuccessEnvelope" },
          ...(dataSchema
            ? [
                {
                  type: "object",
                  required: ["data"],
                  properties: { data: dataSchema },
                },
              ]
            : []),
        ],
      },
    },
  },
});

const error = (description) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ErrorEnvelope" },
    },
  },
});

const jsonBody = (schemaName) => ({
  required: true,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schemaName}` },
    },
  },
});

const bearerSecurity = [{ bearerAuth: [] }];
const objectIdExample = "507f1f77bcf86cd799439011";
const userIdExample = "ply_0123456789abcdef01234567";
const adminIdExample = "adm_0123456789abcdef01234567";

const swaggerDocument = {
  openapi: "3.1.0",
  info: {
    title: "KhelYard API",
    version: "0.1.0",
    description:
      "Current backend contract for health checks, authentication, user profiles, owner business verification, and admin review.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Health", description: "Application and database health." },
    {
      name: "Authentication",
      description:
        "Email/password authentication, email OTP verification, and refresh-token rotation.",
    },
    {
      name: "Admin Authentication",
      description:
        "Authentication for seeded administrators. Login uses email and password; password reset uses an email OTP.",
    },
    {
      name: "Admin",
      description: "Administrator-only business-verification review operations.",
    },
    { name: "Users", description: "Authenticated user profile operations." },
    {
      name: "Owners",
      description: "Owner registration and business-verification operations.",
    },
    {
      name: "Venues",
      description: "Owner venue management and public active-venue discovery.",
    },
  ],
  paths: {
    "/health/live": {
      get: {
        tags: ["Health"],
        summary: "Check process health",
        operationId: "getLiveness",
        responses: {
          200: {
            description: "The Node.js process is running.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LivenessResponse" },
              },
            },
          },
        },
      },
    },
    "/health/ready": {
      get: {
        tags: ["Health"],
        summary: "Check database readiness",
        operationId: "getReadiness",
        responses: {
          200: {
            description: "MongoDB is connected.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
              },
            },
          },
          503: {
            description: "MongoDB is unavailable.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadinessResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a player",
        description:
          "Creates an unverified player and sends a six-digit OTP by email. Phone must contain 10 Nepal mobile digits without +977.",
        operationId: "registerPlayer",
        requestBody: jsonBody("RegisterRequest"),
        responses: {
          201: success("Registration created and OTP sent.", {
            $ref: "#/components/schemas/RegistrationData",
          }),
          409: error("The email or phone is already used."),
          422: error("The request contains invalid values."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/owner-auth/register": {
      post: {
        tags: ["Owners"],
        summary: "Register a business owner",
        description:
          "Creates an unverified owner with an own_ public ID and sends a six-digit OTP by email.",
        operationId: "registerOwner",
        requestBody: jsonBody("RegisterRequest"),
        responses: {
          201: success("Owner registration created and OTP sent.", {
            $ref: "#/components/schemas/OwnerRegistrationData",
          }),
          409: error("The email or phone is already used."),
          422: error("The request contains invalid values."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/owner-auth/verify-registration": {
      post: {
        tags: ["Owners"],
        summary: "Verify an owner's registration OTP",
        description:
          "Consumes the owner's email OTP and creates a login session. Business verification remains separate.",
        operationId: "verifyOwnerRegistration",
        requestBody: jsonBody("VerifyOtpRequest"),
        responses: {
          200: success("Owner email verified successfully.", {
            $ref: "#/components/schemas/AuthData",
          }),
          409: error("The owner account is already verified."),
          422: error("The request or OTP is invalid."),
          429: error("Verification attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/owner-auth/resend-registration-otp": {
      post: {
        tags: ["Owners"],
        summary: "Resend an owner's registration OTP",
        operationId: "resendOwnerRegistrationOtp",
        requestBody: jsonBody("EmailRequest"),
        responses: {
          200: success("A replacement OTP was sent.", {
            $ref: "#/components/schemas/OtpDeliveryData",
          }),
          404: error("No pending owner registration exists for the email."),
          409: error("The owner account is already verified."),
          422: error("The email is invalid."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/auth/verify-registration": {
      post: {
        tags: ["Authentication"],
        summary: "Verify registration OTP",
        description:
          "Consumes a valid OTP, verifies the email once, and creates a login session.",
        operationId: "verifyRegistration",
        requestBody: jsonBody("VerifyOtpRequest"),
        responses: {
          200: success("Email verified successfully.", {
            $ref: "#/components/schemas/AuthData",
          }),
          409: error("The account is already verified."),
          422: error("The request or OTP is invalid."),
          429: error("Verification attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/auth/resend-registration-otp": {
      post: {
        tags: ["Authentication"],
        summary: "Resend registration OTP",
        operationId: "resendRegistrationOtp",
        requestBody: jsonBody("EmailRequest"),
        responses: {
          200: success("A replacement OTP was sent.", {
            $ref: "#/components/schemas/OtpDeliveryData",
          }),
          404: error("No pending registration exists for the email."),
          409: error("The account is already verified."),
          422: error("The email is invalid."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Log in with email and password",
        operationId: "login",
        requestBody: jsonBody("LoginRequest"),
        responses: {
          200: success("Login successful.", {
            $ref: "#/components/schemas/AuthData",
          }),
          401: error("The credentials are incorrect."),
          403: error("The account is unverified or inactive."),
          422: error("The request contains invalid values."),
          429: error("Login attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Rotate authentication tokens",
        operationId: "refreshTokens",
        requestBody: jsonBody("RefreshRequest"),
        responses: {
          200: success("Tokens refreshed successfully.", {
            $ref: "#/components/schemas/AuthData",
          }),
          401: error("The token or refresh session is invalid."),
          422: error("A refresh token is required."),
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get basic authenticated-user data",
        operationId: "getCurrentAuthUser",
        security: bearerSecurity,
        responses: {
          200: success("Current user retrieved.", {
            $ref: "#/components/schemas/PublicUser",
          }),
          401: error("A valid active access token is required."),
        },
      },
    },
    "/api/v1/auth/change-password": {
      patch: {
        tags: ["Authentication"],
        summary: "Change the logged-in user's password",
        description:
          "Revokes previous refresh sessions and returns a new token pair.",
        operationId: "changePassword",
        security: bearerSecurity,
        requestBody: jsonBody("ChangePasswordRequest"),
        responses: {
          200: success("Password changed successfully.", {
            $ref: "#/components/schemas/AuthData",
          }),
          401: error("Authentication failed or the current password is wrong."),
          422: error("The new password is invalid or unchanged."),
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request a password-reset OTP",
        description:
          "Returns a neutral message so callers cannot determine whether an account exists.",
        operationId: "forgotPassword",
        requestBody: jsonBody("EmailRequest"),
        responses: {
          200: success("Password-reset request accepted."),
          422: error("The email is invalid."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset a password using email OTP",
        description:
          "Consumes a reset OTP and revokes all existing refresh sessions.",
        operationId: "resetPassword",
        requestBody: jsonBody("ResetPasswordRequest"),
        responses: {
          200: success("Password reset successfully."),
          422: error("The request or OTP is invalid."),
          429: error("Verification attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Log out the current session",
        operationId: "logout",
        security: bearerSecurity,
        responses: {
          200: success("Logged out successfully."),
          401: error("A valid active access token is required."),
        },
      },
    },
    "/api/v1/admin-auth/login": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Log in as a seeded admin",
        description:
          "Authenticates an existing admin with email and password. Admin login does not require an OTP.",
        operationId: "loginAdmin",
        requestBody: jsonBody("LoginRequest"),
        responses: {
          200: success("Admin login successful.", {
            $ref: "#/components/schemas/AdminAuthData",
          }),
          401: error("The credentials are incorrect."),
          403: error("The admin account is inactive."),
          422: error("The request contains invalid values."),
          429: error("Login attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/admin-auth/refresh": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Rotate admin authentication tokens",
        operationId: "refreshAdminTokens",
        requestBody: jsonBody("RefreshRequest"),
        responses: {
          200: success("Tokens refreshed successfully.", {
            $ref: "#/components/schemas/AdminAuthData",
          }),
          401: error("The token or admin refresh session is invalid."),
          422: error("A refresh token is required."),
        },
      },
    },
    "/api/v1/admin-auth/me": {
      get: {
        tags: ["Admin Authentication"],
        summary: "Get the authenticated admin",
        operationId: "getCurrentAdmin",
        security: bearerSecurity,
        responses: {
          200: success("Current admin retrieved.", {
            $ref: "#/components/schemas/AdminUser",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an admin."),
        },
      },
    },
    "/api/v1/admin-auth/change-password": {
      patch: {
        tags: ["Admin Authentication"],
        summary: "Change the logged-in admin password",
        description:
          "Revokes previous refresh sessions and returns a new admin token pair.",
        operationId: "changeAdminPassword",
        security: bearerSecurity,
        requestBody: jsonBody("ChangePasswordRequest"),
        responses: {
          200: success("Password changed successfully.", {
            $ref: "#/components/schemas/AdminAuthData",
          }),
          401: error("Authentication failed or the current password is wrong."),
          403: error("The authenticated account is not an admin."),
          422: error("The new password is invalid or unchanged."),
        },
      },
    },
    "/api/v1/admin-auth/forgot-password": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Request an admin password-reset OTP",
        description:
          "Sends an email OTP only for an active seeded admin and always returns a neutral response.",
        operationId: "forgotAdminPassword",
        requestBody: jsonBody("EmailRequest"),
        responses: {
          200: success("Password-reset request accepted."),
          422: error("The email is invalid."),
          429: error("OTP requests are temporarily rate limited."),
          503: error("Email delivery is unavailable."),
        },
      },
    },
    "/api/v1/admin-auth/reset-password": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Reset an admin password with an email OTP",
        description:
          "Consumes the reset OTP and revokes all existing admin refresh sessions.",
        operationId: "resetAdminPassword",
        requestBody: jsonBody("ResetPasswordRequest"),
        responses: {
          200: success("Password reset successfully."),
          422: error("The request or OTP is invalid."),
          429: error("Verification attempts are temporarily rate limited."),
        },
      },
    },
    "/api/v1/admin-auth/logout": {
      post: {
        tags: ["Admin Authentication"],
        summary: "Log out the current admin session",
        operationId: "logoutAdmin",
        security: bearerSecurity,
        responses: {
          200: success("Logged out successfully."),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an admin."),
        },
      },
    },
    "/api/v1/admin/business-verifications": {
      get: {
        tags: ["Admin"],
        summary: "List every business-verification submission",
        description:
          "Returns all submissions newest first, including owner details, private-document metadata, and short-lived Cloudinary review URLs when Cloudinary is configured.",
        operationId: "listBusinessVerificationsForAdmin",
        security: bearerSecurity,
        responses: {
          200: success("Business-verification submissions retrieved.", {
            $ref: "#/components/schemas/AdminBusinessVerificationList",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an admin."),
        },
      },
    },
    "/api/v1/admin/business-verifications/{verificationId}": {
      patch: {
        tags: ["Admin"],
        summary: "Approve or reject a submitted business verification",
        description:
          "Only a record currently in submitted status can be reviewed. Rejection requires a review note, and the decision cannot be applied twice.",
        operationId: "reviewBusinessVerification",
        security: bearerSecurity,
        parameters: [
          {
            in: "path",
            name: "verificationId",
            required: true,
            schema: {
              type: "string",
              pattern: "^bvr_[a-f0-9]{24}$",
            },
            example: "bvr_0123456789abcdef01234567",
          },
        ],
        requestBody: jsonBody("BusinessVerificationReviewRequest"),
        responses: {
          200: success("Business-verification decision saved.", {
            $ref: "#/components/schemas/AdminBusinessVerification",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an admin."),
          404: error("The business verification does not exist."),
          409: error("The submission has already left submitted status."),
          422: error("The verification ID or decision payload is invalid."),
        },
      },
    },
    "/api/v1/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get the complete logged-in user profile",
        operationId: "getMyProfile",
        security: bearerSecurity,
        responses: {
          200: success("Profile retrieved successfully.", {
            $ref: "#/components/schemas/UserProfile",
          }),
          401: error("A valid active access token is required."),
          404: error("The user no longer exists."),
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Partially update the logged-in user profile",
        description:
          "Only supplied fields change. Use JSON for text-only changes or multipart/form-data for an image.",
        operationId: "updateMyProfile",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ProfileUpdateRequest" },
            },
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/MultipartProfileUpdateRequest",
              },
            },
          },
        },
        responses: {
          200: success("Profile updated successfully.", {
            $ref: "#/components/schemas/UserProfile",
          }),
          401: error("A valid active access token is required."),
          404: error("The user no longer exists."),
          422: error("The supplied fields or image are invalid."),
          503: error("Cloudinary is unavailable."),
        },
      },
    },
    "/api/v1/owners/me/business-verification": {
      get: {
        tags: ["Owners"],
        summary: "Get the owner's business-verification submission",
        operationId: "getMyBusinessVerification",
        security: bearerSecurity,
        responses: {
          200: success("Business verification retrieved successfully.", {
            $ref: "#/components/schemas/BusinessVerification",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated user is not an owner."),
          404: error("No business verification has been submitted."),
        },
      },
      post: {
        tags: ["Owners"],
        summary: "Submit business information and documents",
        description:
          "Requires an email-verified owner. Both document images are uploaded as authenticated Cloudinary assets.",
        operationId: "submitBusinessVerification",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/BusinessVerificationSubmission",
              },
            },
          },
        },
        responses: {
          201: success("Business verification submitted successfully.", {
            $ref: "#/components/schemas/BusinessVerification",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated user is not an owner."),
          409: error("The owner has already submitted business verification."),
          422: error("Business fields or document images are invalid."),
          503: error("Private document upload is unavailable."),
        },
      },
      patch: {
        tags: ["Owners"],
        summary: "Partially update a submitted business verification",
        description:
          "Updates only supplied fields or images. Allowed only while the verification status is still submitted.",
        operationId: "updateSubmittedBusinessVerification",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BusinessVerificationTextUpdate",
              },
            },
            "multipart/form-data": {
              schema: {
                $ref: "#/components/schemas/BusinessVerificationUpdate",
              },
            },
          },
        },
        responses: {
          200: success("Business verification updated successfully.", {
            $ref: "#/components/schemas/BusinessVerification",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated user is not an owner."),
          404: error("No business verification has been submitted."),
          409: error("The verification status no longer permits updates."),
          422: error("The supplied fields or images are invalid."),
          503: error("Cloudinary upload is unavailable."),
        },
      },
    },
    "/api/v1/owners/me/venues": {
      get: {
        tags: ["Venues"],
        summary: "List the authenticated owner's venues",
        operationId: "listOwnerVenues",
        security: bearerSecurity,
        responses: {
          200: success("Owner venues retrieved successfully.", {
            type: "array",
            items: { $ref: "#/components/schemas/Venue" },
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an owner."),
        },
      },
      post: {
        tags: ["Venues"],
        summary: "Create a venue",
        description:
          "Requires an approved owner business verification. New venues are active immediately. Submit 1-12 venue images. Nested multipart fields must contain JSON strings.",
        operationId: "createOwnerVenue",
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/VenueCreateRequest" },
            },
          },
        },
        responses: {
          201: success("Venue created successfully.", {
            $ref: "#/components/schemas/Venue",
          }),
          401: error("A valid active access token is required."),
          403: error("The owner or business verification is not eligible."),
          422: error("Venue fields or images are invalid."),
          503: error("Cloudinary venue-image upload is unavailable."),
        },
      },
    },
    "/api/v1/owners/me/venues/{venueId}": {
      get: {
        tags: ["Venues"],
        summary: "Get one venue owned by the authenticated owner",
        operationId: "getOwnerVenue",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/VenueId" },
        ],
        responses: {
          200: success("Venue retrieved successfully.", {
            $ref: "#/components/schemas/Venue",
          }),
          401: error("A valid active access token is required."),
          403: error("The authenticated account is not an owner."),
          404: error("The venue does not exist or belongs to another owner."),
          422: error("The venue ID is invalid."),
        },
      },
      patch: {
        tags: ["Venues"],
        summary: "Partially update an owned venue",
        description:
          "Only supplied fields change. Supplying images replaces the complete image set; the first image becomes the cover.",
        operationId: "updateOwnerVenue",
        security: bearerSecurity,
        parameters: [
          { $ref: "#/components/parameters/VenueId" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VenueUpdateJsonRequest" },
            },
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/VenueUpdateRequest" },
            },
          },
        },
        responses: {
          200: success("Venue updated successfully.", {
            $ref: "#/components/schemas/Venue",
          }),
          401: error("A valid active access token is required."),
          403: error("The owner or business verification is not eligible."),
          404: error("The venue does not exist or belongs to another owner."),
          422: error("The venue fields or images are invalid."),
          503: error("Cloudinary venue-image upload is unavailable."),
        },
      },
    },
    "/api/v1/venues": {
      get: {
        tags: ["Venues"],
        summary: "List active venues",
        description:
          "Publicly returns venues whose status is active. Slot-level availability is handled separately.",
        operationId: "listAvailableVenues",
        responses: {
          200: success("Active venues retrieved successfully.", {
            type: "array",
            items: { $ref: "#/components/schemas/Venue" },
          }),
        },
      },
    },
    "/api/v1/venues/{venueId}": {
      get: {
        tags: ["Venues"],
        summary: "Get an active venue",
        operationId: "getAvailableVenue",
        parameters: [
          { $ref: "#/components/parameters/VenueId" },
        ],
        responses: {
          200: success("Active venue retrieved successfully.", {
            $ref: "#/components/schemas/Venue",
          }),
          404: error("No active venue exists with this ID."),
          422: error("The venue ID is invalid."),
        },
      },
    },
  },
  components: {
    parameters: {
      VenueId: {
        in: "path",
        name: "venueId",
        required: true,
        schema: {
          type: "string",
          pattern: "^ven_[a-f0-9]{24}$",
        },
        example: "ven_0123456789abcdef01234567",
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token returned after verification or login.",
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: "object",
        required: ["status", "message"],
        properties: {
          status: { type: "string", const: "success", example: "success" },
          message: { type: "string", example: "Request completed successfully." },
        },
      },
      ErrorEnvelope: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "validation_failed" },
              message: {
                type: "string",
                example: "The request contains invalid values.",
              },
              details: {
                type: "object",
                additionalProperties: true,
                description:
                  "Optional context such as validation issues or retry timing.",
              },
            },
          },
        },
      },
      LivenessResponse: {
        type: "object",
        required: ["status"],
        properties: { status: { type: "string", const: "ok" } },
      },
      ReadinessResponse: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["ready", "not_ready"] },
        },
      },
      ProfileImage: {
        type: "object",
        required: ["publicId", "publicUrl"],
        properties: {
          publicId: {
            type: ["string", "null"],
            example: "khelyard/profile-images/507f1f77-123456789",
          },
          publicUrl: {
            type: "string",
            example:
              "https://res.cloudinary.com/example/image/upload/profile.jpg",
          },
        },
      },
      PublicUser: {
        type: "object",
        required: [
          "_id",
          "userId",
          "name",
          "email",
          "profileImage",
          "role",
          "status",
          "isVerified",
        ],
        properties: {
          _id: { type: "string", example: objectIdExample },
          userId: {
            type: "string",
            pattern: "^(ply|own|adm)_[a-f0-9]{24}$",
            example: userIdExample,
          },
          name: {
            type: "string",
            minLength: 2,
            maxLength: 80,
            example: "Aarav Shrestha",
          },
          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },
          phone: {
            type: "string",
            pattern: "^(97|98)\\d{8}$",
            example: "9818738923",
          },
          profileImage: { $ref: "#/components/schemas/ProfileImage" },
          role: {
            type: "string",
            enum: ["player", "owner", "admin"],
            example: "player",
          },
          status: {
            type: "string",
            enum: ["active", "suspended"],
            example: "active",
          },
          isVerified: { type: "boolean", example: true },
          verifiedAt: {
            type: ["string", "null"],
            format: "date-time",
            example: "2026-10-17T10:00:00.000Z",
          },
        },
      },
      AuthData: {
        allOf: [
          { $ref: "#/components/schemas/PublicUser" },
          {
            type: "object",
            required: ["accessToken", "refreshToken"],
            properties: {
              accessToken: { type: "string", example: "<access-jwt>" },
              refreshToken: { type: "string", example: "<refresh-jwt>" },
            },
          },
        ],
      },
      AdminUser: {
        type: "object",
        required: [
          "_id",
          "userId",
          "name",
          "email",
          "profileImage",
          "role",
          "status",
          "isVerified",
        ],
        properties: {
          _id: { type: "string", example: objectIdExample },
          userId: {
            type: "string",
            pattern: "^adm_[a-f0-9]{24}$",
            example: adminIdExample,
          },
          name: { type: "string", example: "KhelYard Admin" },
          email: {
            type: "string",
            format: "email",
            example: "admin@khelyard.com",
          },
          profileImage: { $ref: "#/components/schemas/ProfileImage" },
          role: { type: "string", const: "admin" },
          status: { type: "string", enum: ["active", "suspended"] },
          isVerified: { type: "boolean", const: true },
          verifiedAt: { type: ["string", "null"], format: "date-time" },
        },
      },
      AdminAuthData: {
        allOf: [
          { $ref: "#/components/schemas/AdminUser" },
          {
            type: "object",
            required: ["accessToken", "refreshToken"],
            properties: {
              accessToken: { type: "string", example: "<access-jwt>" },
              refreshToken: { type: "string", example: "<refresh-jwt>" },
            },
          },
        ],
      },
      PlayerStats: {
        type: "object",
        required: [
          "gamesPlayed",
          "gamesHosted",
          "bookingsCompleted",
          "hoursPlayed",
        ],
        properties: {
          gamesPlayed: { type: "integer", minimum: 0, example: 0 },
          gamesHosted: { type: "integer", minimum: 0, example: 0 },
          bookingsCompleted: { type: "integer", minimum: 0, example: 0 },
          hoursPlayed: { type: "number", minimum: 0, example: 0 },
        },
      },
      UserProfile: {
        allOf: [
          { $ref: "#/components/schemas/PublicUser" },
          {
            type: "object",
            required: [
              "favouriteSports",
              "stats",
              "creditsBalance",
              "createdAt",
              "updatedAt",
            ],
            properties: {
              homeArea: {
                type: ["string", "null"],
                maxLength: 100,
                example: "Baneshwor",
              },
              bio: {
                type: ["string", "null"],
                maxLength: 500,
                example: "Available for evening games.",
              },
              favouriteSports: {
                type: "array",
                maxItems: 5,
                uniqueItems: true,
                items: { type: "string", maxLength: 50 },
                example: ["futsal", "football"],
              },
              stats: { $ref: "#/components/schemas/PlayerStats" },
              creditsBalance: { type: "number", minimum: 0, example: 0 },
              lastLoginAt: {
                type: ["string", "null"],
                format: "date-time",
              },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        ],
      },
      RegisterRequest: {
        type: "object",
        additionalProperties: false,
        required: ["name", "email", "phone", "password"],
        properties: {
          name: {
            type: "string",
            minLength: 2,
            maxLength: 80,
            example: "Aarav Shrestha",
          },
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "aarav@example.com",
          },
          phone: {
            type: "string",
            pattern: "^(97|98)\\d{8}$",
            example: "9818738923",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
            example: "strong-password",
          },
        },
      },
      RegistrationData: {
        allOf: [
          { $ref: "#/components/schemas/OtpDeliveryData" },
          {
            type: "object",
            required: ["_id", "userId", "email", "verificationRequired"],
            properties: {
              _id: { type: "string", example: objectIdExample },
              userId: { type: "string", example: userIdExample },
              email: {
                type: "string",
                format: "email",
                example: "aarav@example.com",
              },
              verificationRequired: { type: "boolean", const: true },
            },
          },
        ],
      },
      OwnerRegistrationData: {
        allOf: [
          { $ref: "#/components/schemas/OtpDeliveryData" },
          {
            type: "object",
            required: ["_id", "userId", "email", "verificationRequired"],
            properties: {
              _id: { type: "string", example: objectIdExample },
              userId: {
                type: "string",
                pattern: "^own_[a-f0-9]{24}$",
                example: "own_0123456789abcdef01234567",
              },
              email: {
                type: "string",
                format: "email",
                example: "owner@example.com",
              },
              verificationRequired: { type: "boolean", const: true },
            },
          },
        ],
      },
      OtpDeliveryData: {
        type: "object",
        required: ["otpExpiresInSeconds", "retryAfterSeconds"],
        properties: {
          otpExpiresInSeconds: { type: "integer", example: 300 },
          retryAfterSeconds: { type: "integer", example: 60 },
        },
      },
      EmailRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email"],
        properties: {
          email: {
            type: "string",
            format: "email",
            maxLength: 254,
            example: "aarav@example.com",
          },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "code"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },
          code: {
            type: "string",
            pattern: "^\\d{6}$",
            example: "123456",
          },
        },
      },
      LoginRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "strong-password",
          },
        },
      },
      RefreshRequest: {
        type: "object",
        additionalProperties: false,
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            minLength: 1,
            example: "<refresh-jwt>",
          },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        additionalProperties: false,
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: {
            type: "string",
            format: "password",
            minLength: 1,
          },
          newPassword: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
          },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        additionalProperties: false,
        required: ["email", "code", "newPassword"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "aarav@example.com",
          },
          code: {
            type: "string",
            pattern: "^\\d{6}$",
            example: "123456",
          },
          newPassword: {
            type: "string",
            format: "password",
            minLength: 8,
            maxLength: 72,
          },
        },
      },
      BusinessDocument: {
        type: "object",
        required: ["publicId", "originalName", "mimeType", "bytes"],
        properties: {
          publicId: {
            type: "string",
            example: "khelyard/private/owner-verification/id/pan-vat-123",
          },
          originalName: { type: "string", example: "pan-vat.jpg" },
          mimeType: {
            type: "string",
            enum: ["image/jpeg", "image/png", "image/webp"],
          },
          bytes: { type: "integer", minimum: 1, maximum: 5242880 },
          uploadedAt: { type: "string", format: "date-time" },
        },
      },
      AdminBusinessDocument: {
        allOf: [
          { $ref: "#/components/schemas/BusinessDocument" },
          {
            type: "object",
            required: ["reviewUrl"],
            properties: {
              reviewUrl: {
                type: ["string", "null"],
                format: "uri",
                description:
                  "Short-lived authenticated Cloudinary download URL. Null when Cloudinary is not configured.",
              },
            },
          },
        ],
      },
      BusinessVerification: {
        type: "object",
        required: [
          "verificationId",
          "businessName",
          "panVatNumber",
          "businessRegistrationNumber",
          "panVatImage",
          "taxClearanceImage",
          "status",
          "submittedAt",
        ],
        properties: {
          verificationId: {
            type: "string",
            pattern: "^bvr_[a-f0-9]{24}$",
            example: "bvr_0123456789abcdef01234567",
          },
          businessName: {
            type: "string",
            minLength: 2,
            maxLength: 160,
            example: "KhelYard Sports Center",
          },
          businessLogo: {
            oneOf: [
              { $ref: "#/components/schemas/ProfileImage" },
              { type: "null" },
            ],
          },
          panVatNumber: { type: "string", example: "123456789" },
          businessRegistrationNumber: {
            type: "string",
            example: "REG-2026-001",
          },
          panVatImage: { $ref: "#/components/schemas/BusinessDocument" },
          taxClearanceImage: {
            $ref: "#/components/schemas/BusinessDocument",
          },
          status: {
            type: "string",
            enum: [
              "submitted",
              "under_review",
              "changes_requested",
              "approved",
              "rejected",
            ],
          },
          reviewNotes: { type: ["string", "null"] },
          submittedAt: { type: "string", format: "date-time" },
          reviewedAt: { type: ["string", "null"], format: "date-time" },
          approvedAt: { type: ["string", "null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      VerificationOwnerSummary: {
        type: "object",
        required: ["_id", "userId", "name", "email"],
        properties: {
          _id: { type: "string", example: objectIdExample },
          userId: {
            type: "string",
            pattern: "^own_[a-f0-9]{24}$",
            example: "own_0123456789abcdef01234567",
          },
          name: { type: "string", example: "Venue Owner" },
          email: {
            type: "string",
            format: "email",
            example: "owner@example.com",
          },
          phone: {
            type: "string",
            pattern: "^(97|98)\\d{8}$",
            example: "9818738923",
          },
        },
      },
      VerificationReviewerSummary: {
        type: "object",
        required: ["_id", "userId", "name", "email"],
        properties: {
          _id: { type: "string", example: objectIdExample },
          userId: {
            type: "string",
            pattern: "^adm_[a-f0-9]{24}$",
            example: adminIdExample,
          },
          name: { type: "string", example: "KhelYard Admin" },
          email: {
            type: "string",
            format: "email",
            example: "admin@khelyard.com",
          },
        },
      },
      AdminBusinessVerification: {
        allOf: [
          { $ref: "#/components/schemas/BusinessVerification" },
          {
            type: "object",
            required: ["owner", "reviewedBy"],
            properties: {
              owner: {
                $ref: "#/components/schemas/VerificationOwnerSummary",
              },
              reviewedBy: {
                oneOf: [
                  {
                    $ref: "#/components/schemas/VerificationReviewerSummary",
                  },
                  { type: "null" },
                ],
              },
              panVatImage: {
                $ref: "#/components/schemas/AdminBusinessDocument",
              },
              taxClearanceImage: {
                $ref: "#/components/schemas/AdminBusinessDocument",
              },
            },
          },
        ],
      },
      AdminBusinessVerificationList: {
        type: "object",
        required: ["submissions", "total"],
        properties: {
          submissions: {
            type: "array",
            items: {
              $ref: "#/components/schemas/AdminBusinessVerification",
            },
          },
          total: { type: "integer", minimum: 0, example: 1 },
        },
      },
      BusinessVerificationReviewRequest: {
        oneOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["status"],
            properties: {
              status: { type: "string", const: "approved" },
              reviewNotes: { type: "string", minLength: 1, maxLength: 1000 },
            },
          },
          {
            type: "object",
            additionalProperties: false,
            required: ["status", "reviewNotes"],
            properties: {
              status: { type: "string", const: "rejected" },
              reviewNotes: { type: "string", minLength: 1, maxLength: 1000 },
            },
          },
        ],
      },
      VenueImage: {
        type: "object",
        required: ["publicId", "publicUrl", "isCover", "sortOrder"],
        properties: {
          publicId: { type: "string" },
          publicUrl: { type: "string", format: "uri" },
          isCover: { type: "boolean" },
          sortOrder: { type: "integer", minimum: 0 },
        },
      },
      VenueLocation: {
        type: "object",
        required: ["address", "coordinates"],
        properties: {
          address: {
            type: "string",
            maxLength: 250,
            example: "New Baneshwor, Kathmandu",
            description: "Short display address selected or entered in the frontend.",
          },
          coordinates: {
            type: "object",
            required: ["coordinates"],
            description:
              "GeoJSON point selected using the frontend map. The array order is longitude, then latitude.",
            properties: {
              type: { type: "string", const: "Point" },
              coordinates: {
                type: "array",
                minItems: 2,
                maxItems: 2,
                items: { type: "number" },
                example: [85.3432, 27.6915],
              },
            },
          },
        },
      },
      VenueOperatingSchedule: {
        type: "object",
        properties: {
          defaultHours: {
            type: "object",
            properties: {
              opensAt: { type: "string", example: "08:00" },
              closesAt: { type: "string", example: "21:00" },
            },
          },
          dayOverrides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
                isClosed: { type: "boolean" },
                opensAt: { type: ["string", "null"] },
                closesAt: { type: ["string", "null"] },
              },
            },
          },
        },
      },
      VenuePricing: {
        type: "object",
        required: ["periods"],
        properties: {
          currency: { type: "string", const: "NPR" },
          weekendDays: {
            type: "array",
            items: { type: "integer", minimum: 0, maximum: 6 },
            example: [6],
          },
          periods: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: {
              type: "object",
              required: [
                "name",
                "startsAt",
                "endsAt",
                "weekdayPrice",
                "weekendPrice",
              ],
              properties: {
                name: { type: "string", example: "evening" },
                startsAt: { type: "string", example: "17:00" },
                endsAt: { type: "string", example: "21:00" },
                weekdayPrice: { type: "number", minimum: 0, example: 2200 },
                weekendPrice: { type: "number", minimum: 0, example: 2600 },
              },
            },
          },
        },
      },
      VenueClosure: {
        oneOf: [
          {
            type: "object",
            required: ["type", "date"],
            properties: {
              closureId: { type: "string", pattern: "^cls_[a-f0-9]{24}$" },
              type: { type: "string", const: "single_day" },
              date: { type: "string", format: "date" },
              reason: { type: ["string", "null"] },
            },
          },
          {
            type: "object",
            required: ["type", "startsOn", "endsOn"],
            properties: {
              closureId: { type: "string", pattern: "^cls_[a-f0-9]{24}$" },
              type: { type: "string", const: "date_range" },
              startsOn: { type: "string", format: "date" },
              endsOn: { type: "string", format: "date" },
              reason: { type: ["string", "null"] },
            },
          },
        ],
      },
      Venue: {
        type: "object",
        required: [
          "_id",
          "venueId",
          "name",
          "description",
          "venueType",
          "images",
          "groundCount",
          "slotDurationMinutes",
          "location",
          "operatingSchedule",
          "upcomingClosures",
          "pastClosures",
          "pricing",
          "status",
        ],
        properties: {
          _id: { type: "string", example: objectIdExample },
          venueId: {
            type: "string",
            pattern: "^ven_[a-f0-9]{24}$",
            example: "ven_0123456789abcdef01234567",
          },
          name: { type: "string", example: "KhelYard Futsal Arena" },
          description: { type: "string" },
          venueType: {
            type: "string",
            enum: ["futsal", "basketball", "badminton"],
          },
          images: {
            type: "array",
            items: { $ref: "#/components/schemas/VenueImage" },
          },
          groundCount: { type: "integer", minimum: 1, example: 3 },
          slotDurationMinutes: { type: "integer", example: 60 },
          location: { $ref: "#/components/schemas/VenueLocation" },
          operatingSchedule: {
            $ref: "#/components/schemas/VenueOperatingSchedule",
          },
          upcomingClosures: {
            type: "array",
            items: { $ref: "#/components/schemas/VenueClosure" },
            description:
              "Closures ending today or later, calculated using the Nepal date.",
          },
          pastClosures: {
            type: "array",
            items: { $ref: "#/components/schemas/VenueClosure" },
            description:
              "Closures whose single date or range end date has passed in Nepal.",
          },
          pricing: { $ref: "#/components/schemas/VenuePricing" },
          amenities: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["draft", "active", "inactive", "suspended"],
          },
          availabilityStatus: {
            type: "string",
            enum: ["active", "closed"],
            description:
              "Computed for the current Nepal date from status and closures.",
          },
          closureReason: { type: ["string", "null"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      VenueCreateRequest: {
        type: "object",
        required: [
          "name",
          "description",
          "venueType",
          "groundCount",
          "slotDurationMinutes",
          "location",
          "pricing",
          "images",
        ],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          venueType: {
            type: "string",
            enum: ["futsal", "basketball", "badminton"],
          },
          groundCount: { type: "integer" },
          slotDurationMinutes: { type: "integer" },
          location: {
            type: "string",
            description: "JSON string matching VenueLocation.",
          },
          operatingSchedule: {
            type: "string",
            description: "Optional JSON string matching VenueOperatingSchedule.",
          },
          closures: {
            type: "string",
            description: "Optional JSON array string of VenueClosure values.",
          },
          pricing: {
            type: "string",
            description: "JSON string matching VenuePricing.",
          },
          amenities: {
            type: "string",
            description: "Optional JSON string array.",
          },
          images: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: { type: "string", format: "binary" },
          },
        },
      },
      VenueUpdateRequest: {
        type: "object",
        minProperties: 1,
        description:
          "All fields are optional for PATCH. When provided, images replace the existing image set.",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          venueType: {
            type: "string",
            enum: ["futsal", "basketball", "badminton"],
          },
          groundCount: { type: "integer" },
          slotDurationMinutes: { type: "integer" },
          location: { type: "string", description: "VenueLocation JSON string." },
          operatingSchedule: {
            type: "string",
            description: "VenueOperatingSchedule JSON string.",
          },
          closures: {
            type: "string",
            description: "JSON array string of VenueClosure values.",
          },
          pricing: { type: "string", description: "VenuePricing JSON string." },
          amenities: { type: "string", description: "JSON string array." },
          status: {
            type: "string",
            enum: ["draft", "active", "inactive"],
          },
          images: {
            type: "array",
            minItems: 1,
            maxItems: 12,
            items: { type: "string", format: "binary" },
          },
        },
      },
      VenueUpdateJsonRequest: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          venueType: {
            type: "string",
            enum: ["futsal", "basketball", "badminton"],
          },
          groundCount: { type: "integer" },
          slotDurationMinutes: { type: "integer" },
          location: { $ref: "#/components/schemas/VenueLocation" },
          operatingSchedule: {
            $ref: "#/components/schemas/VenueOperatingSchedule",
          },
          closures: {
            type: "array",
            items: { $ref: "#/components/schemas/VenueClosure" },
          },
          pricing: { $ref: "#/components/schemas/VenuePricing" },
          amenities: { type: "array", items: { type: "string" } },
          status: {
            type: "string",
            enum: ["draft", "active", "inactive"],
          },
        },
      },
      BusinessVerificationSubmission: {
        type: "object",
        additionalProperties: false,
        required: [
          "businessName",
          "panVatNumber",
          "businessRegistrationNumber",
          "panVatImage",
          "taxClearanceImage",
        ],
        properties: {
          businessName: { type: "string", minLength: 2, maxLength: 160 },
          panVatNumber: { type: "string", minLength: 5, maxLength: 30 },
          businessRegistrationNumber: {
            type: "string",
            minLength: 2,
            maxLength: 80,
          },
          businessLogo: {
            type: "string",
            format: "binary",
            description: "Optional public JPEG, PNG, or WebP logo up to 5 MB.",
          },
          panVatImage: {
            type: "string",
            format: "binary",
            description: "JPEG, PNG, or WebP image up to 5 MB.",
          },
          taxClearanceImage: {
            type: "string",
            format: "binary",
            description: "JPEG, PNG, or WebP image up to 5 MB.",
          },
        },
      },
      BusinessVerificationUpdate: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          businessName: { type: "string", minLength: 2, maxLength: 160 },
          panVatNumber: { type: "string", minLength: 5, maxLength: 30 },
          businessRegistrationNumber: {
            type: "string",
            minLength: 2,
            maxLength: 80,
          },
          businessLogo: {
            type: "string",
            format: "binary",
            description: "Optional replacement logo up to 5 MB.",
          },
          panVatImage: {
            type: "string",
            format: "binary",
            description: "Optional replacement PAN/VAT image up to 5 MB.",
          },
          taxClearanceImage: {
            type: "string",
            format: "binary",
            description: "Optional replacement tax-clearance image up to 5 MB.",
          },
        },
      },
      BusinessVerificationTextUpdate: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          businessName: { type: "string", minLength: 2, maxLength: 160 },
          panVatNumber: { type: "string", minLength: 5, maxLength: 30 },
          businessRegistrationNumber: {
            type: "string",
            minLength: 2,
            maxLength: 80,
          },
        },
      },
      ProfileUpdateRequest: {
        type: "object",
        additionalProperties: false,
        minProperties: 1,
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          homeArea: { type: ["string", "null"], maxLength: 100 },
          bio: { type: ["string", "null"], maxLength: 500 },
          favouriteSports: {
            type: "array",
            maxItems: 5,
            uniqueItems: true,
            items: { type: "string", minLength: 1, maxLength: 50 },
          },
        },
      },
      MultipartProfileUpdateRequest: {
        type: "object",
        minProperties: 1,
        properties: {
          profileImage: {
            type: "string",
            format: "binary",
            description: "JPEG, PNG, or WebP image up to 5 MB.",
          },
          name: { type: "string", minLength: 2, maxLength: 80 },
          homeArea: { type: "string", maxLength: 100 },
          bio: { type: "string", maxLength: 500 },
          favouriteSports: {
            type: "string",
            description: 'JSON array string such as ["futsal","football"].',
            example: '["futsal","football"]',
          },
        },
      },
    },
  },
};

export default swaggerDocument;
