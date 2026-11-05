const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  // status is 0 when the server could not be reached at all.
  constructor(status, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token, signal } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body && JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, error.message);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? response.statusText);
  }
  return data;
}

export function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function register({ email, username, password }) {
  return request("/auth/register", {
    method: "POST",
    body: { email, username, password },
  });
}

export function fetchMe(token, signal) {
  return request("/auth/me", { token, signal });
}
