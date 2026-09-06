// VITE_API_URL can be set a few different ways depending on the environment
// (bare host like "http://localhost:3001", a full URL that already ends in
// "/api", or left unset to fall back to the relative "/api"). Every service
// file in this app builds its requests as `${apiBaseUrl}/patients`,
// `${apiBaseUrl}/invoices`, etc. — none of them add "/api" themselves — so
// apiBaseUrl must always resolve to a base that already ends in "/api", or
// every request 404s against the backend's global "api" prefix.
const configuredApiUrl = import.meta.env.VITE_API_URL || '/api';
const withoutTrailingSlash = configuredApiUrl.replace(/\/$/, '');

export const apiBaseUrl = withoutTrailingSlash.endsWith('/api')
  ? withoutTrailingSlash
  : `${withoutTrailingSlash}/api`;
