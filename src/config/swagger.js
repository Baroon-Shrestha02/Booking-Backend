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

const swaggerDocument = {
  openapi: "3.1.0",
  info: {
    title: "KhelYard API",
    version: "0.1.0",
    description:
      "Current backend contract for health checks, player and owner authentication, user profiles, and owner business verification.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Health", description: "Application and database health." },
    {
      name: "Authentication",
      description:
        "Email/password authentication, email OTP verification, and refresh-token rotation.",
    },
    { name: "Users", description: "Authenticated user profile operations." },
    {
      name: "Owners",
      description: "Owner registration and business-verification operations.",
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
  },
  components: {
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
          "phone",
          "profileImage",
          "role",
          "status",
          "isVerified",
        ],
        properties: {
          _id: { type: "string", example: objectIdExample },
          userId: {
            type: "string",
            pattern: "^(ply|own)_[a-f0-9]{24}$",
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
            enum: ["player", "owner"],
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
