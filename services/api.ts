import Constants from 'expo-constants';

const apiBaseUrl = (() => {
  const extra = Constants.expoConfig?.extra;
  return typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl : '';
})();

const defaultHeaders = {
  'Content-Type': 'application/json',
};

function getErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (typeof record.error === 'string') {
      return record.error;
    }
  }
  return `Request failed (${status})`;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error('API base URL is not configured. Set expo.extra.apiBaseUrl.');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers ?? {}),
    },
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data as T;
}
