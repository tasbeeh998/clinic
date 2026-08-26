const configuredApiUrl = import.meta.env.VITE_API_URL || '/api';

export const apiBaseUrl = configuredApiUrl.replace(/\/$/, '');
