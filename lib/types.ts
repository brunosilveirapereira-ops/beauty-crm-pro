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
  professional_id?: string | null;
  date: string;
  service: string;
  professional: string | null;
  value: number;
  formula_products: string | null;
  notes: string | null;
  customer?: Pick<Customer, "id" | "name" | "whatsapp"> | null;
  professional_profile?: Pick<Professional, "id" | "name" | "commission_percentage" | "active"> | null;
};

export type VisitHistory = ServiceHistory;

export type Professional = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  commission_percentage: number;
  active: boolean;
  created_at: string;
};

export type CommissionReportItem = {
  professional: Professional;
  totalRevenue: number;
  commissionPercentage: number;
  commissionValue: number;
  salonValue: number;
};

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

export type ProductHistory = {
  id: string;
  customer_id: string;
  date: string;
  brand: string;
  product_name: string;
  quantity: string | null;
  observations: string | null;
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

export type BeforeAfterHistory = {
  id: string;
  customer_id: string;
  date: string;
  service: string;
  before_image_url: string;
  after_image_url: string;
  observations: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalCustomers: number;
  atRiskCustomers: number;
  monthlyBirthdays: number;
  monthlyRevenue: number;
  monthlyCommissions: number;
  monthlySalonNet: number;
};
