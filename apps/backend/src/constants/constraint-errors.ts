export const constraintErrors: Record<string, string> = Object.freeze({
  UQ_user_username: 'user.unique.username',
  UQ_user_email: 'user.unique.email',
  UQ_user_phone: 'user.error.phone_exists',
});
