const TOKEN_KEY = "wealthly_token";

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export async function apiFetch(
  url: string,
  options: RequestInit = {}
) {
  const token = getToken();

  const headers = new Headers(
    options.headers
  );

  headers.set(
    "Content-Type",
    "application/json"
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();

    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith(
        "/login"
      ) &&
      !window.location.pathname.startsWith(
        "/register"
      )
    ) {
      window.location.href = "/login";
    }
  }

  return response;
}