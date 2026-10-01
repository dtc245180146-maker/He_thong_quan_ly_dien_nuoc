import {
  AuthResponse,
  User,
  Room,
  RoomDetail,
  Meter,
  PriceConfig,
  MeterReading,
  Invoice,
  InvoiceDetail,
  Payment,
  AdminDashboardStats,
  UserDashboardStats,
  MonthlyStatItem,
  RoomUsageItem,
  AIAnalyzeResponse,
  AISavingsResponse,
  AIStatusResponse,
  Notification
} from '../types';

const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Phiên làm việc hết hạn hoặc token không hợp lệ
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login?expired=1';
    }
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'Có lỗi xảy ra khi xử lý yêu cầu.';
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data as T;
}

// 1. Auth API
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<User>('/auth/me'),
  changePassword: (data: { old_password: string; new_password: string }) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 2. Users API
export const usersApi = {
  getAll: () => request<User[]>('/users'),
  create: (data: any) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// 3. Rooms API
export const roomsApi = {
  getAll: (search?: string) =>
    request<Room[]>(search ? `/rooms?search=${encodeURIComponent(search)}` : '/rooms'),
  getById: (id: number) => request<RoomDetail>(`/rooms/${id}`),
  create: (data: Partial<Room>) =>
    request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Room>) =>
    request<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/rooms/${id}`, {
      method: 'DELETE',
    }),
};

// 4. Meters API
export const metersApi = {
  getAll: (roomId?: number, meterType?: string) => {
    const params = new URLSearchParams();
    if (roomId) params.append('room_id', roomId.toString());
    if (meterType) params.append('meter_type', meterType);
    const qs = params.toString();
    return request<Meter[]>(qs ? `/meters?${qs}` : '/meters');
  },
  getById: (id: number) => request<Meter>(`/meters/${id}`),
  create: (data: Partial<Meter>) =>
    request<Meter>('/meters', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Meter>) =>
    request<Meter>(`/meters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/meters/${id}`, {
      method: 'DELETE',
    }),
};

// 5. Prices API
export const pricesApi = {
  getAll: (serviceType?: string) =>
    request<PriceConfig[]>(serviceType ? `/prices?service_type=${serviceType}` : '/prices'),
  create: (data: Partial<PriceConfig>) =>
    request<PriceConfig>('/prices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<PriceConfig>) =>
    request<PriceConfig>(`/prices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/prices/${id}`, {
      method: 'DELETE',
    }),
};

// 6. Meter Readings API
export const readingsApi = {
  getAll: (roomId?: number, period?: string, meterType?: string) => {
    const params = new URLSearchParams();
    if (roomId) params.append('room_id', roomId.toString());
    if (period) params.append('period', period);
    if (meterType) params.append('meter_type', meterType);
    const qs = params.toString();
    return request<MeterReading[]>(qs ? `/readings?${qs}` : '/readings');
  },
  getLatest: (meterId: number) =>
    request<{ has_previous: boolean; latest_reading: number; latest_period: string | null }>(
      `/readings/latest/${meterId}`
    ),
  create: (data: any) =>
    request<MeterReading>('/readings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createQuick: (data: any) =>
    request<MeterReading[]>('/readings/quick-room', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: number, data: any) =>
    request<MeterReading>(`/readings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/readings/${id}`, {
      method: 'DELETE',
    }),
};

// 7. Invoices API
export const invoicesApi = {
  getAll: (roomId?: number, period?: string, statusFilter?: string) => {
    const params = new URLSearchParams();
    if (roomId) params.append('room_id', roomId.toString());
    if (period) params.append('period', period);
    if (statusFilter) params.append('status_filter', statusFilter);
    const qs = params.toString();
    return request<Invoice[]>(qs ? `/invoices?${qs}` : '/invoices');
  },
  getById: (id: number) => request<InvoiceDetail>(`/invoices/${id}`),
  create: (data: { room_id: number; period: string; due_date?: string; other_fees?: number; notes?: string }) =>
    request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<{ message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),
};

// 8. Payments API
export const paymentsApi = {
  getAll: (invoiceId?: number) =>
    request<Payment[]>(invoiceId ? `/payments?invoice_id=${invoiceId}` : '/payments'),
  create: (data: { invoice_id: number; amount: number; payment_method: string; transaction_code?: string; notes?: string }) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// 9. Statistics API
export const statsApi = {
  getAdminDashboard: () => request<AdminDashboardStats>('/stats/admin-dashboard'),
  getUserDashboard: () => request<UserDashboardStats>('/stats/user-dashboard'),
  getHistory: (roomId?: number, fromPeriod?: string, toPeriod?: string) => {
    const params = new URLSearchParams();
    if (roomId) params.append('room_id', roomId.toString());
    if (fromPeriod) params.append('from_period', fromPeriod);
    if (toPeriod) params.append('to_period', toPeriod);
    const qs = params.toString();
    return request<MonthlyStatItem[]>(qs ? `/stats/history?${qs}` : '/stats/history');
  },
  getRoomsSummary: (period?: string) =>
    request<RoomUsageItem[]>(period ? `/stats/rooms-summary?period=${period}` : '/stats/rooms-summary'),
};

// 10. AI API
export const aiApi = {
  getStatus: () => request<AIStatusResponse>('/ai/status'),
  analyze: (data: { room_id: number; period?: string }) =>
    request<AIAnalyzeResponse>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getSavings: (roomId: number) =>
    request<AISavingsResponse>('/ai/savings', {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId }),
    }),
  getHistory: (roomId: number) => request<AIAnalyzeResponse[]>(`/ai/history/${roomId}`),
};

// 11. Notifications API
export const notificationsApi = {
  getAll: (unreadOnly: boolean = false) =>
    request<Notification[]>(unreadOnly ? '/notifications?unread_only=true' : '/notifications'),
  markAsRead: (id: number) =>
    request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllRead: () =>
    request<{ message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};
