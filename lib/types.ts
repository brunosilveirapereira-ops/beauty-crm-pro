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

export type VisitHistory = {
  id: string;
  customer_id: string;
  service_id: string | null;
  service_name: string;
  professional_name: string | null;
  visit_date: string;
  value: number;
  notes: string | null;
  created_at: string;
};

export type DashboardStats = {
  totalCustomers: number;
  atRiskCustomers: number;
  monthlyBirthdays: number;
  monthlyRevenue: number;
};
