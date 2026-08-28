import type {
  Truck,
  Driver,
  Expense,
  Trip,
  FleetOverview,
  CpmSummaryResponse,
} from "@/types/cost-per-mile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("automari_token");
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

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("automari_token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.detail || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// ── Trucks ────────────────────────────────────────────

export async function getTrucks(params?: { status?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return request<Truck[]>(`/api/cost-per-mile/trucks/${qs ? `?${qs}` : ""}`);
}

export async function getTruck(id: string) {
  return request<Truck>(`/api/cost-per-mile/trucks/${id}`);
}

export async function createTruck(data: {
  unit_number: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  status?: string;
  notes?: string;
}) {
  return request<Truck>("/api/cost-per-mile/trucks/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTruck(
  id: string,
  data: Partial<{
    unit_number: string;
    vin: string;
    year: number;
    make: string;
    model: string;
    status: string;
    notes: string;
  }>
) {
  return request<Truck>(`/api/cost-per-mile/trucks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTruck(id: string) {
  return request<void>(`/api/cost-per-mile/trucks/${id}`, {
    method: "DELETE",
  });
}

// ── Drivers ───────────────────────────────────────────

export async function getDrivers(params?: { status?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return request<Driver[]>(`/api/cost-per-mile/drivers/${qs ? `?${qs}` : ""}`);
}

export async function getDriver(id: string) {
  return request<Driver>(`/api/cost-per-mile/drivers/${id}`);
}

export async function createDriver(data: {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  cdl_number?: string;
  cdl_state?: string;
  status?: string;
  default_truck_id?: string;
  notes?: string;
}) {
  return request<Driver>("/api/cost-per-mile/drivers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDriver(
  id: string,
  data: Partial<{
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    cdl_number: string;
    cdl_state: string;
    status: string;
    default_truck_id: string;
    notes: string;
  }>
) {
  return request<Driver>(`/api/cost-per-mile/drivers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDriver(id: string) {
  return request<void>(`/api/cost-per-mile/drivers/${id}`, {
    method: "DELETE",
  });
}

// ── Expenses ──────────────────────────────────────────

export async function getExpenses(params?: {
  truck_id?: string;
  driver_id?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.truck_id) query.set("truck_id", params.truck_id);
  if (params?.driver_id) query.set("driver_id", params.driver_id);
  if (params?.category) query.set("category", params.category);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request<Expense[]>(
    `/api/cost-per-mile/expenses/${qs ? `?${qs}` : ""}`
  );
}

export async function getExpense(id: string) {
  return request<Expense>(`/api/cost-per-mile/expenses/${id}`);
}

export async function createExpense(data: {
  truck_id?: string;
  driver_id?: string;
  category: string;
  amount: number;
  description?: string;
  vendor?: string;
  expense_date: string;
  odometer_reading?: number;
  gallons?: number;
  source?: string;
  external_id?: string;
  notes?: string;
}) {
  return request<Expense>("/api/cost-per-mile/expenses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExpense(
  id: string,
  data: Partial<{
    truck_id: string;
    driver_id: string;
    category: string;
    amount: number;
    description: string;
    vendor: string;
    expense_date: string;
    odometer_reading: number;
    gallons: number;
    source: string;
    external_id: string;
    notes: string;
  }>
) {
  return request<Expense>(`/api/cost-per-mile/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteExpense(id: string) {
  return request<void>(`/api/cost-per-mile/expenses/${id}`, {
    method: "DELETE",
  });
}

// ── Trips ─────────────────────────────────────────────

export async function getTrips(params?: {
  truck_id?: string;
  driver_id?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.truck_id) query.set("truck_id", params.truck_id);
  if (params?.driver_id) query.set("driver_id", params.driver_id);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.skip) query.set("skip", String(params.skip));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return request<Trip[]>(`/api/cost-per-mile/trips/${qs ? `?${qs}` : ""}`);
}

export async function getTrip(id: string) {
  return request<Trip>(`/api/cost-per-mile/trips/${id}`);
}

export async function createTrip(data: {
  truck_id: string;
  driver_id?: string;
  bol_id?: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  miles: number;
  empty_miles?: number;
  revenue: number;
  start_date: string;
  end_date?: string;
  status?: string;
  source?: string;
  external_id?: string;
  notes?: string;
}) {
  return request<Trip>("/api/cost-per-mile/trips/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTrip(
  id: string,
  data: Partial<{
    truck_id: string;
    driver_id: string;
    bol_id: string;
    origin_city: string;
    origin_state: string;
    destination_city: string;
    destination_state: string;
    miles: number;
    empty_miles: number;
    revenue: number;
    start_date: string;
    end_date: string;
    status: string;
    source: string;
    external_id: string;
    notes: string;
  }>
) {
  return request<Trip>(`/api/cost-per-mile/trips/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTrip(id: string) {
  return request<void>(`/api/cost-per-mile/trips/${id}`, {
    method: "DELETE",
  });
}

// ── Analytics ─────────────────────────────────────────

export async function getFleetOverview() {
  return request<FleetOverview>("/api/cost-per-mile/analytics/fleet-overview");
}

export async function getCpmSummary(params: {
  group_by: "truck" | "driver" | "lane";
  start_date?: string;
  end_date?: string;
}) {
  const query = new URLSearchParams();
  query.set("group_by", params.group_by);
  if (params.start_date) query.set("start_date", params.start_date);
  if (params.end_date) query.set("end_date", params.end_date);
  return request<CpmSummaryResponse>(
    `/api/cost-per-mile/analytics/summary?${query.toString()}`
  );
}

export async function getTruckCpm(id: string) {
  return request<CpmSummaryResponse>(
    `/api/cost-per-mile/analytics/truck/${id}`
  );
}

export async function getDriverCpm(id: string) {
  return request<CpmSummaryResponse>(
    `/api/cost-per-mile/analytics/driver/${id}`
  );
}
