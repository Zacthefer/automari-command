export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "carrier";
  tenant_id: string | null;
  tenant_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Tenant {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  api_key: string;
  twilio_phone: string | null;
  status: string;
  is_active: boolean;
  default_rate: number | null;
  billing_email: string | null;
  default_broker_name: string | null;
  default_broker_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface BOL {
  id: string;
  tenant_id: string;
  status: "received" | "processing" | "extracted" | "review" | "failed" | "invoiced";
  confidence: number | null;
  driver_phone: string | null;
  image_content_type: string | null;
  has_image: boolean;
  shipper_name: string | null;
  consignee_name: string | null;
  pro_number: string | null;
  bol_number: string | null;
  commodity: string | null;
  weight: number | null;
  pieces: number | null;
  pickup_date: string | null;
  delivery_date: string | null;
  special_instructions: string | null;
  extraction_attempts: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  bol_id: string;
  invoice_number: string;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  rate: number;
  accessorial_charges: number;
  total_amount: number;
  bill_to_name: string;
  bill_to_email: string;
  shipper_name: string | null;
  consignee_name: string | null;
  pro_number: string | null;
  commodity: string | null;
  weight: number | null;
  net_days: number;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceDocument {
  id: string;
  tenant_id: string;
  document_type: "cdl" | "medical_card" | "insurance_liability" | "insurance_cargo" | "vehicle_registration" | "ifta_permit" | "drug_test" | "mvr_report" | "other";
  holder_type: "driver" | "vehicle" | "company";
  holder_name: string;
  document_number: string | null;
  issuing_authority: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  status: "valid" | "expiring_soon" | "expired";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceSummary {
  total: number;
  valid: number;
  expiring_soon: number;
  expired: number;
}

export interface DashboardStats {
  bols_total: number;
  bols_this_week: number;
  bols_pending_review: number;
  invoices_total: number;
  invoices_sent: number;
  invoices_paid: number;
  invoices_overdue: number;
  total_outstanding: number;
  total_collected: number;
  compliance_total: number;
  compliance_expiring_soon: number;
  compliance_expired: number;
  fleet_avg_cpm: number;
  fleet_total_miles: number;
  fleet_total_expenses: number;
}

export interface AdminStats {
  total_tenants: number;
  active_tenants: number;
  total_bols: number;
  bols_this_week: number;
  total_invoices: number;
  total_revenue_outstanding: number;
  total_revenue_collected: number;
}

export type ApplicantStatus =
  | "new"
  | "screening"
  | "qualified"
  | "rejected"
  | "hired";

export interface Applicant {
  id: string;
  tenant_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cdl_class: "A" | "B" | "C" | null;
  endorsements: string[];
  years_experience: number | null;
  accident_history: string | null;
  preferred_routes: string | null;
  availability: string | null;
  status: ApplicantStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitingSummary {
  total: number;
  new: number;
  screening: number;
  qualified: number;
  rejected: number;
  hired: number;
}

// ── Loads / Rate Cons ────────────────────────────────

export type LoadStatus = "needs_review" | "booked" | "delivered" | "invoiced" | "paid";
export type RateConStatus = "approved" | "review" | "superseded" | "rejected" | "failed";
export type PaymentStatus = "not_ready" | "ready_to_submit" | "submitted" | "processing" | "paid" | "action_required";
export type PaymentPath = "direct" | "quickpay" | "factoring";

export interface AccessorialItem {
  type: string | null;
  description: string | null;
  amount: number | null;
}

export interface RateConfirmation {
  id: string;
  load_id: string | null;
  version: number | null;
  status: RateConStatus;
  filename: string | null;
  content_type: string | null;
  confidence: number | null;
  field_confidence: Record<string, number> | null;
  review_reasons: string[] | null;
  changes: Record<string, unknown> | null;
  revision_reason: string | null;
  load_number: string | null;
  broker_name: string | null;
  broker_email: string | null;
  carrier_name: string | null;
  origin: string | null;
  destination: string | null;
  pickup_at: string | null;
  delivery_at: string | null;
  equipment_type: string | null;
  commodity: string | null;
  weight: number | null;
  payment_terms: string | null;
  special_instructions: string | null;
  stops: unknown[] | null;
  linehaul: number | null;
  fuel_surcharge: number | null;
  accessorial_items: AccessorialItem[];
  accessorial_total: number | null;
  total_rate: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface LoadDocument {
  id: string;
  kind: string;
  bol_id: string | null;
  filename: string | null;
  created_at: string;
}

export interface LoadEvent {
  id: string;
  event_type: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface PipelineStep {
  key: string;
  state: "done" | "pending" | "ready" | "attention";
  detail: string | null;
}

export interface PacketDocument {
  kind: string;
  id: string;
  label: string;
  status: string;
  url: string;
}

export interface BillingPacket {
  load_id: string;
  complete: boolean;
  missing: string[];
  documents: PacketDocument[];
  total_amount: number | null;
}

export interface LoadSummary {
  id: string;
  load_number: string | null;
  status: LoadStatus;
  broker_name: string | null;
  origin: string | null;
  destination: string | null;
  pickup_at: string | null;
  delivery_at: string | null;
  invoice_id: string | null;
  payment_path: string | null;
  payment_status: PaymentStatus;
  submitted_at: string | null;
  paid_at: string | null;
  current_total: number | null;
  original_total: number | null;
  missing: string[];
  created_at: string;
}

export interface LoadDetail extends LoadSummary {
  broker_email: string | null;
  carrier_name: string | null;
  equipment_type: string | null;
  commodity: string | null;
  weight: number | null;
  payment_terms: string | null;
  special_instructions: string | null;
  stops: unknown[] | null;
  payment_provider: string | null;
  payment_external_ref: string | null;
  payment_note: string | null;
  payment_status_at: string | null;
  aging_days: number | null;
  pipeline: PipelineStep[];
  packet: BillingPacket;
  rate_confirmations: RateConfirmation[];
  documents: LoadDocument[];
  events: LoadEvent[];
}
