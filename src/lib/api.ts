const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("automari_token");
}

function setToken(token: string): void {
  localStorage.setItem("automari_token", token);
}

function clearToken(): void {
  localStorage.removeItem("automari_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.detail || `Request failed with status ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// ── Auth ──────────────────────────────────────────────

export async function login(email: string, password: string) {
  const data = await request<{ access_token: string; token_type: string }>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  setToken(data.access_token);
  return data;
}

export async function getMe() {
  return request<import("@/types").User>("/api/auth/me");
}

export function logout() {
  clearToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

// ── Dashboard ─────────────────────────────────────────

export async function getDashboardStats() {
  return request<import("@/types").DashboardStats>("/api/dashboard/stats");
}

export async function getAdminStats() {
  return request<import("@/types").AdminStats>("/api/dashboard/admin-stats");
}

// ── BOLs ──────────────────────────────────────────────

export async function getBols(params?: { skip?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request<import("@/types").BOL[]>(`/api/bol/${qs ? `?${qs}` : ""}`);
}

export async function getBol(id: string) {
  return request<import("@/types").BOL>(`/api/bol/${id}`);
}

export async function uploadBol(file: File): Promise<import("@/types").BOL> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/bol/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.detail || `Upload failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
}

// ── Invoices ──────────────────────────────────────────

export async function getInvoices(params?: {
  skip?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request<import("@/types").Invoice[]>(
    `/api/invoices/${qs ? `?${qs}` : ""}`
  );
}

export async function getInvoice(id: string) {
  return request<import("@/types").Invoice>(`/api/invoices/${id}`);
}

export async function sendInvoice(id: string) {
  return request<import("@/types").Invoice>(`/api/invoices/${id}/send`, {
    method: "POST",
  });
}

export async function markInvoicePaid(id: string, paidAt?: string) {
  return request<import("@/types").Invoice>(`/api/invoices/${id}/paid`, {
    method: "POST",
    body: JSON.stringify({ paid_at: paidAt }),
  });
}

// ── Tenants (Admin) ───────────────────────────────────

export async function getTenants(params?: {
  skip?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request<import("@/types").Tenant[]>(
    `/api/tenants/${qs ? `?${qs}` : ""}`
  );
}

export async function getTenant(id: string) {
  return request<import("@/types").Tenant>(`/api/tenants/${id}`);
}

export async function createTenant(data: {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  default_rate?: number;
  billing_email?: string;
  default_broker_name?: string;
  default_broker_email?: string;
}) {
  return request<import("@/types").Tenant>("/api/tenants/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export { ApiError, getToken, clearToken };
