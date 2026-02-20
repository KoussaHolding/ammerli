export const normalizePhone = (phone: string): string => {
  // Remove all non-numeric characters (except +)
  const cleaned = phone.replace(/[^\d+]/g, '');

  // If it starts with +213, keep it (ensure it has 9 digits after country code)
  if (cleaned.startsWith('+213')) {
    return cleaned;
  }

  // If it starts with 0 (e.g., 05, 06, 07 - Algeria), replace 0 with +213
  if (cleaned.startsWith('0')) {
    return `+213${cleaned.slice(1)}`;
  }

  // If it starts with 213 (without +), prepend +
  if (cleaned.startsWith('213')) {
    return `+${cleaned}`;
  }

  // If it's just 9 digits (e.g., 555123456), assume +213
  if (cleaned.length === 9) {
    return `+213${cleaned}`;
  }

  // Default return cleaned (let backend validate)
  return cleaned;
};
