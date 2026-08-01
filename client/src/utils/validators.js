export const validateName = (name) => {
  // Allow ONLY alphabets: A-Z, a-z. No numbers, no spaces, no special characters.
  return /^[a-zA-Z]+$/.test(name);
};

export const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password, role) => {
  if (!password) return { isValid: false, message: 'Password is required' };
  
  // Alphanumeric only
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return { isValid: false, message: 'Password must be alphanumeric only (letters and digits, no special characters)' };
  }

  // Length greater than 6 (meaning at least 7 characters)
  if (password.length <= 6) {
    return { isValid: false, message: 'Password must be greater than 6 characters' };
  }

  // Prefix check
  const prefix = password.substring(0, 3);
  const remaining = password.substring(3);

  // Check remaining characters are numeric digits only
  if (!/^\d+$/.test(remaining)) {
    return { isValid: false, message: 'Password characters after the prefix must be numeric digits only (e.g. ADM123456)' };
  }

  if (role === 'admin' && prefix !== 'ADM') {
    return { isValid: false, message: 'Admin password must start with "ADM" (e.g. ADM123456)' };
  }
  if (role === 'manager' && prefix !== 'MNG') {
    return { isValid: false, message: 'Manager password must start with "MNG" (e.g. MNG123456)' };
  }
  if (role === 'owner' && prefix !== 'OWN') {
    return { isValid: false, message: 'Owner password must start with "OWN" (e.g. OWN123456)' };
  }
  if (role === 'tenant' && prefix !== 'TEN') {
    return { isValid: false, message: 'Tenant password must start with "TEN" (e.g. TEN123456)' };
  }

  return { isValid: true };
};
