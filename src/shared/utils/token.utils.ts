const ACCESS_TOKEN_REFRESH_RATIO = 0.8; // Refresh when 80% of the time has passed

export const calculateExpiresAt = (expiresIn: number) => {
  return Date.now() + expiresIn * 1000;
};

export const isTokenAboutToExpire = (expiresAt?: number, issuedAt?: number) => {
  if (!expiresAt || !issuedAt) return true;

  const totalLifetime = expiresAt - issuedAt;
  const refreshAt = issuedAt + totalLifetime * ACCESS_TOKEN_REFRESH_RATIO;

  return Date.now() >= refreshAt;
};
