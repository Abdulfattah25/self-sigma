export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const formatLicenseCode = (code) => {
  return code.replace(/\s+/g, '').toUpperCase();
};

export const validateSignUpForm = ({ licenseCode, name, email, password }) => {
  const errors = {};

  if (!validateRequired(licenseCode)) errors.licenseCode = 'Kode lisensi wajib diisi';
  if (!validateRequired(name)) errors.name = 'Nama wajib diisi';
  if (!validateRequired(email)) errors.email = 'Email wajib diisi';
  else if (!validateEmail(email)) errors.email = 'Format email tidak valid';
  if (!validatePassword(password)) errors.password = 'Password minimal 6 karakter';

  return { isValid: Object.keys(errors).length === 0, errors };
};
