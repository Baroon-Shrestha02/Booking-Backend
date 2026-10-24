import OwnerBusinessVerification from "./ownerBusinessVerification.model.js";
import { BUSINESS_VERIFICATION_STATUSES } from "../../shared/constants/index.js";

export const findBusinessVerificationByOwner = (
  ownerId,
  { includeDocuments = false } = {},
) => {
  const query = OwnerBusinessVerification.findOne({ owner: ownerId });
  if (includeDocuments) query.select("+panVatImage +taxClearanceImage");
  return query;
};

export const createBusinessVerification = (data) =>
  OwnerBusinessVerification.create(data);

export const updateSubmittedBusinessVerification = (ownerId, updates) =>
  OwnerBusinessVerification.findOneAndUpdate(
    {
      owner: ownerId,
      status: BUSINESS_VERIFICATION_STATUSES.SUBMITTED,
    },
    { $set: updates },
    { new: true, runValidators: true },
  ).select("+panVatImage +taxClearanceImage");

const adminVerificationQuery = (query) =>
  query
    .select("+panVatImage +taxClearanceImage")
    .populate("owner", "userId name email phone")
    .populate("reviewedBy", "userId name email");

export const findAllBusinessVerificationsForAdmin = () =>
  adminVerificationQuery(
    OwnerBusinessVerification.find().sort({ submittedAt: -1 }),
  );

export const findBusinessVerificationByPublicId = (verificationId) =>
  adminVerificationQuery(OwnerBusinessVerification.findOne({ verificationId }));

export const reviewSubmittedBusinessVerification = (verificationId, updates) =>
  adminVerificationQuery(
    OwnerBusinessVerification.findOneAndUpdate(
      {
        verificationId,
        status: BUSINESS_VERIFICATION_STATUSES.SUBMITTED,
      },
      { $set: updates },
      { new: true, runValidators: true },
    ),
  );
