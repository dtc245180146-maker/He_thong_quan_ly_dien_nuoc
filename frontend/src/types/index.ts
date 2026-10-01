export interface User {
  id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'ADMIN' | 'USER';
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  full_name: string;
  role: 'ADMIN' | 'USER';
  room_id?: number | null;
  room_code?: string | null;
}

export interface Room {
  id: number;
  room_code: string;
  name: string;
  address?: string;
  resident_count: number;
  phone?: string;
  is_active: boolean;
  user_id?: number | null;
  user_name?: string | null;
  user_full_name?: string | null;
  created_at: string;
}

export interface RoomDetail extends Room {
  meters: {
    id: number;
    meter_code: string;
    meter_type: 'ELECTRICITY' | 'WATER';
    unit: string;
    is_active: boolean;
    installation_date?: string;
    notes?: string;
  }[];
}

export interface Meter {
  id: number;
  meter_code: string;
  meter_type: 'ELECTRICITY' | 'WATER';
  unit: string;
  room_id: number;
  room_code?: string;
  room_name?: string;
  installation_date?: string;
  is_active: boolean;
  notes?: string;
}

export interface PriceConfig {
  id: number;
  service_type: 'ELECTRICITY' | 'WATER';
  pricing_type: 'TIERED' | 'FIXED';
  tier_name?: string;
  from_level: number;
  to_level?: number | null;
  unit_price: number;
  effective_date: string;
  expired_date?: string | null;
  is_active: boolean;
  description?: string;
}

export interface MeterReading {
  id: number;
  meter_id: number;
  room_id: number;
  room_code?: string;
  room_name?: string;
  meter_code?: string;
  meter_type?: 'ELECTRICITY' | 'WATER';
  unit?: string;
  period: string; // YYYY-MM
  reading_date: string;
  old_reading: number;
  new_reading: number;
  consumption: number;
  notes?: string;
  created_at: string;
}

export interface TierDetailItem {
  tier_name: string;
  from_level: number;
  to_level?: number | null;
  unit_price: number;
  usage_in_tier: number;
  cost: number;
}

export interface Invoice {
  id: number;
  invoice_code: string;
  room_id: number;
  room_code?: string;
  room_name?: string;
  period: string;
  issue_date: string;
  due_date?: string | null;
  electricity_usage: number;
  electricity_cost: number;
  water_usage: number;
  water_cost: number;
  other_fees: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  notes?: string;
  created_at: string;
}

export interface InvoiceDetail extends Invoice {
  electricity_details?: TierDetailItem[];
  water_details?: TierDetailItem[];
  payments: {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    transaction_code?: string;
    status: string;
    notes?: string;
  }[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  invoice_code?: string;
  room_code?: string;
  room_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_code?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface MonthlyStatItem {
  period: string;
  electricity_usage: number;
  water_usage: number;
  electricity_cost: number;
  water_cost: number;
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
}

export interface RoomUsageItem {
  room_id: number;
  room_code: string;
  room_name: string;
  electricity_usage: number;
  water_usage: number;
  total_amount: number;
  debt_amount: number;
}

export interface AdminDashboardStats {
  total_rooms: number;
  total_meters: number;
  total_electricity_usage: number;
  total_water_usage: number;
  total_revenue: number;
  total_debt: number;
  unpaid_invoices_count: number;
  paid_invoices_count: number;
  anomalies_count: number;
  monthly_stats: MonthlyStatItem[];
  recent_anomalies: {
    id: number;
    room_id: number;
    room_code: string;
    period: string;
    alert: string;
    created_at: string;
  }[];
}

export interface UserDashboardStats {
  room_id?: number | null;
  room_code?: string | null;
  room_name?: string | null;
  current_debt: number;
  latest_invoice?: {
    id: number;
    invoice_code: string;
    period: string;
    issue_date: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
  } | null;
  consumption_history: MonthlyStatItem[];
  latest_ai_analysis?: {
    id: number;
    period: string;
    summary: string;
    alert?: string;
    recommendations?: string;
    is_anomaly: boolean;
    created_at: string;
  } | null;
}

export interface AIAnalyzeResponse {
  id?: number;
  room_id: number;
  room_code?: string;
  room_name?: string;
  period: string;
  summary: string;
  alert?: string;
  recommendations?: string;
  is_anomaly: boolean;
  anomaly_details?: {
    is_anomaly: boolean;
    target_period: string;
    prev_period?: string;
    elec_curr: number;
    elec_prev: number;
    elec_diff_pct: number;
    water_curr: number;
    water_prev: number;
    water_diff_pct: number;
    reasons: string[];
  };
  provider: string;
  created_at: string;
  input_history_count: number;
}

export interface RecommendationItem {
  category: 'ĐIỆN' | 'NƯỚC' | 'THIẾT BỊ' | 'THÓI QUEN';
  title: string;
  description: string;
  priority: 'CAO' | 'TRUNG BÌNH' | 'THẤP';
  estimated_saving?: string;
}

export interface AISavingsResponse {
  room_id: number;
  room_code: string;
  room_name: string;
  overall_advice: string;
  recommendations: RecommendationItem[];
  provider: string;
  generated_at: string;
}

export interface AIStatusResponse {
  provider: string;
  is_configured: boolean;
  model: string;
  available_providers: string[];
  message: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ANOMALY' | 'PAYMENT';
  is_read: boolean;
  room_id?: number | null;
  user_id?: number | null;
  created_at: string;
}
