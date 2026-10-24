import AppError from "../../shared/errors/AppError.js";
import {
  AUTH_ERROR_CODES,
  BUSINESS_VERIFICATION_STATUSES,
  OWNER_ERROR_CODES,
} from "../../shared/constants/index.js";
import {
  createBusinessVerification,
  findAllBusinessVerificationsForAdmin,
  findBusinessVerificationByPublicId,
  findBusinessVerificationByOwner,
  reviewSubmittedBusinessVerification,
  updateSubmittedBusinessVerification,
} from "./ownerBusinessVerification.repository.js";
import {
  deleteBusinessDocument,
  deleteBusinessLogo,
  createBusinessDocumentReviewUrl,
  uploadBusinessDocument,
  uploadBusinessLogo,
} from "./businessDocuments.js";

const documentData = (document) => ({
  publicId: document.publicId,
  originalName: document.originalName,
  mimeType: document.mimeType,
  bytes: document.bytes,
  uploadedAt: document.uploadedAt,
});

const verificationData = (verification) => ({
  verificationId: verification.verificationId,
  businessName: verification.businessName,
  businessLogo: verification.businessLogo,
  panVatNumber: verification.panVatNumber,
  businessRegistrationNumber: verification.businessRegistrationNumber,
  panVatImage: verification.panVatImage
    ? documentData(verification.panVatImage)
    : undefined,
  taxClearanceImage: verification.taxClearanceImage
    ? documentData(verification.taxClearanceImage)
    : undefined,
  status: verification.status,
  reviewNotes: verification.reviewNotes,
  submittedAt: verification.submittedAt,
  reviewedAt: verification.reviewedAt,
  approvedAt: verification.approvedAt,
  createdAt: verification.createdAt,
  updatedAt: verification.updatedAt,
});

const accountData = (account) =>
  account
    ? {
        _id: String(account._id),
        userId: account.userId,
        name: account.name,
        email: account.email,
        ...(account.phone ? { phone: account.phone } : {}),
      }
    : null;

const adminDocumentData = (document) => {
  if (!document) return undefined;
  return {
    ...documentData(document),
    reviewUrl: createBusinessDocumentReviewUrl(document),
  };
};

const adminVerificationData = (verification) => ({
  ...verificationData(verification),
  owner: accountData(verification.owner),
  reviewedBy: accountData(verification.reviewedBy),
  panVatImage: adminDocumentData(verification.panVatImage),
  taxClearanceImage: adminDocumentData(verification.taxClearanceImage),
});

const requiredFile = (files, name) => files?.[name]?.[0] || null;

const cleanupUploads = (uploads) =>
  Promise.allSettled(
    uploads.map(({ publicId, kind }) =>
      kind === "logo"
        ? deleteBusinessLogo(publicId)
        : deleteBusinessDocument(publicId),
    ),
  );

export const submitBusinessVerification = async ({
  ownerId,
  fields,
  files,
}) => {
  const existing = await findBusinessVerificationByOwner(ownerId);
  if (existing) {
    throw new AppError(
      409,
      OWNER_ERROR_CODES.BUSINESS_VERIFICATION_EXISTS,
      "A business verification has already been submitted.",
    );
  }

  const panVatFile = requiredFile(files, "panVatImage");
  const taxClearanceFile = requiredFile(files, "taxClearanceImage");
  if (!panVatFile || !taxClearanceFile) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "PAN/VAT and tax-clearance images are required.",
      {
        issues: [
          ...(!panVatFile
            ? [{ path: "panVatImage", message: "PAN/VAT image is required" }]
            : []),
          ...(!taxClearanceFile
            ? [
                {
                  path: "taxClearanceImage",
                  message: "Tax-clearance image is required",
                },
              ]
            : []),
        ],
      },
    );
  }

  const uploaded = [];
  try {
    const panVatImage = await uploadBusinessDocument({
      file: panVatFile,
      ownerId,
      documentType: "pan-vat",
    });
    uploaded.push({ publicId: panVatImage.publicId, kind: "document" });

    const taxClearanceImage = await uploadBusinessDocument({
      file: taxClearanceFile,
      ownerId,
      documentType: "tax-clearance",
    });
    uploaded.push({
      publicId: taxClearanceImage.publicId,
      kind: "document",
    });

    const logoFile = requiredFile(files, "businessLogo");
    const businessLogo = logoFile
      ? await uploadBusinessLogo({ file: logoFile, ownerId })
      : null;
    if (businessLogo) {
      uploaded.push({ publicId: businessLogo.publicId, kind: "logo" });
    }

    const verification = await createBusinessVerification({
      owner: ownerId,
      ...fields,
      ...(businessLogo ? { businessLogo } : {}),
      panVatImage,
      taxClearanceImage,
    });
    return verificationData(verification);
  } catch (error) {
    await cleanupUploads(uploaded);
    if (error?.code === 11000) {
      throw new AppError(
        409,
        OWNER_ERROR_CODES.BUSINESS_VERIFICATION_EXISTS,
        "A business verification has already been submitted.",
      );
    }
    throw error;
  }
};

export const updateBusinessVerification = async ({
  ownerId,
  fields,
  files,
}) => {
  const existing = await findBusinessVerificationByOwner(ownerId, {
    includeDocuments: true,
  });
  if (!existing) {
    throw new AppError(
      404,
      OWNER_ERROR_CODES.BUSINESS_VERIFICATION_NOT_FOUND,
      "No business verification has been submitted.",
    );
  }
  if (existing.status !== BUSINESS_VERIFICATION_STATUSES.SUBMITTED) {
    throw new AppError(
      409,
      OWNER_ERROR_CODES.BUSINESS_VERIFICATION_LOCKED,
      "Business verification can only be updated while it is submitted.",
      { status: existing.status },
    );
  }

  const panVatFile = requiredFile(files, "panVatImage");
  const taxClearanceFile = requiredFile(files, "taxClearanceImage");
  const logoFile = requiredFile(files, "businessLogo");
  if (
    Object.keys(fields).length === 0 &&
    !panVatFile &&
    !taxClearanceFile &&
    !logoFile
  ) {
    throw new AppError(
      422,
      AUTH_ERROR_CODES.VALIDATION_FAILED,
      "Provide at least one business field, document, or logo.",
    );
  }

  const uploads = [];
  const updates = { ...fields };
  try {
    if (panVatFile) {
      updates.panVatImage = await uploadBusinessDocument({
        file: panVatFile,
        ownerId,
        documentType: "pan-vat",
      });
      uploads.push({
        publicId: updates.panVatImage.publicId,
        kind: "document",
      });
    }
    if (taxClearanceFile) {
      updates.taxClearanceImage = await uploadBusinessDocument({
        file: taxClearanceFile,
        ownerId,
        documentType: "tax-clearance",
      });
      uploads.push({
        publicId: updates.taxClearanceImage.publicId,
        kind: "document",
      });
    }
    if (logoFile) {
      updates.businessLogo = await uploadBusinessLogo({
        file: logoFile,
        ownerId,
      });
      uploads.push({ publicId: updates.businessLogo.publicId, kind: "logo" });
    }

    const updated = await updateSubmittedBusinessVerification(ownerId, updates);
    if (!updated) {
      throw new AppError(
        409,
        OWNER_ERROR_CODES.BUSINESS_VERIFICATION_LOCKED,
        "Business verification is no longer available for updates.",
      );
    }

    const replaced = [
      ...(panVatFile && existing.panVatImage?.publicId
        ? [{ publicId: existing.panVatImage.publicId, kind: "document" }]
        : []),
      ...(taxClearanceFile && existing.taxClearanceImage?.publicId
        ? [
            {
              publicId: existing.taxClearanceImage.publicId,
              kind: "document",
            },
          ]
        : []),
      ...(logoFile && existing.businessLogo?.publicId
        ? [{ publicId: existing.businessLogo.publicId, kind: "logo" }]
        : []),
    ];
    await cleanupUploads(replaced);
    return verificationData(updated);
  } catch (error) {
    await cleanupUploads(uploads);
    throw error;
  }
};

export const getBusinessVerification = async (ownerId) => {
  const verification = await findBusinessVerificationByOwner(ownerId, {
    includeDocuments: true,
  });
  if (!verification) {
    throw new AppError(
      404,
      OWNER_ERROR_CODES.BUSINESS_VERIFICATION_NOT_FOUND,
      "No business verification has been submitted.",
    );
  }
  return verificationData(verification);
};

export const getAllBusinessVerificationsForAdmin = async () => {
  const submissions = await findAllBusinessVerificationsForAdmin();
  return {
    submissions: submissions.map(adminVerificationData),
    total: submissions.length,
  };
};

export const reviewBusinessVerification = async ({
  verificationId,
  adminId,
  status,
  reviewNotes,
}) => {
  const reviewedAt = new Date();
  const verification = await reviewSubmittedBusinessVerification(
    verificationId,
    {
      status,
      reviewNotes: reviewNotes || null,
      reviewedBy: adminId,
      reviewedAt,
      approvedAt:
        status === BUSINESS_VERIFICATION_STATUSES.APPROVED ? reviewedAt : null,
    },
  );

  if (verification) return adminVerificationData(verification);

  const existing = await findBusinessVerificationByPublicId(verificationId);
  if (!existing) {
    throw new AppError(
      404,
      OWNER_ERROR_CODES.BUSINESS_VERIFICATION_NOT_FOUND,
      "Business verification was not found.",
    );
  }

  throw new AppError(
    409,
    OWNER_ERROR_CODES.BUSINESS_VERIFICATION_LOCKED,
    "Only a submitted business verification can be approved or rejected.",
    { status: existing.status },
  );
};
