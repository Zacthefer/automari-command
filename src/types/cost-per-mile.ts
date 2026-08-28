// ---------------------------------------------------------------------------
// Truck
// ---------------------------------------------------------------------------

export interface Truck {
  id: string;
  tenant_id: string;
  unit_number: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  status: "active" | "inactive" | "maintenance";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

export interface Driver {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  cdl_number: string | null;
  cdl_state: string | null;
  status: "active" | "inactive" | "on_leave";
  default_truck_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Expense
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | "fuel"
  | "maintenance"
  | "insurance"
  | "truck_payment"
  | "tolls"
  | "tires"
  | "permits"
  | "driver_pay"
  | "other";

export interface Expense {
  id: string;
  tenant_id: string;
  truck_id: string | null;
  driver_id: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  vendor: string | null;
  expense_date: string;
  odometer_reading: number | null;
  gallons: number | null;
  source: "manual" | "eld_import" | "fuel_card_import";
  external_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Trip
// ---------------------------------------------------------------------------

export interface Trip {
  id: string;
  tenant_id: string;
  truck_id: string;
  driver_id: string | null;
  bol_id: string | null;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  miles: number;
  empty_miles: number;
  revenue: number;
  start_date: string;
  end_date: string | null;
  status: "planned" | "in_transit" | "completed";
  source: "manual" | "eld_import";
  external_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface CpmGroupRow {
  group_key: string;
  group_id: string | null;
  total_miles: number;
  total_empty_miles: number;
  total_expenses: number;
  total_revenue: number;
  cost_per_mile: number;
  revenue_per_mile: number;
  profit_per_mile: number;
  trip_count: number;
}

export interface CpmSummaryResponse {
  group_by: string;
  start_date: string | null;
  end_date: string | null;
  rows: CpmGroupRow[];
  fleet_avg_cpm: number;
  fleet_total_miles: number;
  fleet_total_expenses: number;
}

export interface ExpenseCategoryBreakdown {
  category: string;
  total: number;
  percentage: number;
}

export interface FleetOverview {
  total_miles: number;
  total_empty_miles: number;
  total_expenses: number;
  total_revenue: number;
  avg_cost_per_mile: number;
  avg_revenue_per_mile: number;
  avg_profit_per_mile: number;
  truck_count: number;
  driver_count: number;
  trip_count: number;
  expense_breakdown: ExpenseCategoryBreakdown[];
}
