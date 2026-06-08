export type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  birth_date: string | null;
  last_visit: string | null;
  last_visit_date?: string | null;
  notes: string | null;
  created_at: string;
};

export type ServiceHistory = {
  id: string;
  customer_id: string;
  date: string;
  service: string;
  professional: string | null;
  value: number;
  formula_products: string | null;
  notes: string | null;
  customer?: Pick<Customer, "id" | "name" | "whatsapp"> | null;
};

export type VisitHistory = ServiceHistory;

export type ColorHistory = {
  id: string;
  customer_id: string;
  color_date: string;
  dye_brand: string;
  color_used: string;
  oxidant: string | null;
  notes: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  customer_id: string;
  service: string;
  professional: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at?: string | null;
  customer?: Pick<Customer, "id" | "name" | "phone" | "whatsapp"> | null;
};

export type DashboardStats = {
  totalCustomers: number;
  atRiskCustomers: number;
  monthlyBirthdays: number;
  monthlyRevenue: number;
};
