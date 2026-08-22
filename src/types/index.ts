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
