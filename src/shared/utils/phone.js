export const normalizeNepalPhone = (input) => {
  const phone = String(input || "");
  if (!/^(97|98)\d{8}$/.test(phone)) {
    throw new Error("Enter a valid 10-digit Nepal mobile number without +977");
  }
  return phone;
};
