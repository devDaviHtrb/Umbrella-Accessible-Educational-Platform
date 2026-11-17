function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null | undefined, now: number = Date.now()): boolean {
  if (!token) return false;

  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = raw.split('.');
  if (parts.length !== 3) return false;

  const payload = decodeBase64Url(parts[1]);
  if (!payload) return false;

  try {
    const exp = JSON.parse(payload)?.exp;
    return typeof exp === 'number' && exp * 1000 <= now;
  } catch {
    return false;
  }
}

export function getJwtExpiry(token: string | null | undefined): number | null {
  if (!token) return null;

  const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;

  const payload = decodeBase64Url(parts[1]);
  if (!payload) return null;

  try {
    const exp = JSON.parse(payload)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
