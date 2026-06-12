import type { Customer, Professional, ServiceHistory } from "./types";

export const demoCustomers: Customer[] = [
  {
    id: "1",
    name: "Mariana Costa",
    phone: "+351 910 000 112",
    whatsapp: "+351910000112",
    instagram: "@maricosta",
    birth_date: "1991-06-18",
    last_visit: "2026-05-20",
    notes: "Prefere tons frios e atendimento no fim do dia.",
    created_at: "2026-01-12T10:00:00Z"
  },
  {
    id: "2",
    name: "Sofia Almeida",
    phone: "+351 920 441 223",
    whatsapp: "+351920441223",
    instagram: "@sofiaalmeida",
    birth_date: "1987-06-04",
    last_visit: "2026-02-08",
    notes: "Cliente de coloracao, sensivel a produtos com amonia.",
    created_at: "2026-01-26T11:00:00Z"
  },
  {
    id: "3",
    name: "Beatriz Rocha",
    phone: "+351 930 118 442",
    whatsapp: "+351930118442",
    instagram: "@bia.rocha",
    birth_date: "1994-11-27",
    last_visit: "2026-03-18",
    notes: "Gosta de lembretes por WhatsApp.",
    created_at: "2026-02-02T09:00:00Z"
  }
];

export const demoProfessionals: Professional[] = [
  {
    id: "p1",
    name: "Ines",
    phone: "+351 910 222 101",
    email: "ines@salao.pt",
    role: "Cabeleireira",
    commission_percentage: 35,
    active: true,
    created_at: "2026-01-08T10:00:00Z"
  },
  {
    id: "p2",
    name: "Clara",
    phone: "+351 920 333 202",
    email: "clara@salao.pt",
    role: "Colorista",
    commission_percentage: 40,
    active: true,
    created_at: "2026-01-09T10:00:00Z"
  },
  {
    id: "p3",
    name: "Marta",
    phone: "+351 930 444 303",
    email: "marta@salao.pt",
    role: "Esteticista",
    commission_percentage: 30,
    active: true,
    created_at: "2026-01-10T10:00:00Z"
  }
];

export const demoServices: ServiceHistory[] = [
  {
    id: "s1",
    customer_id: "1",
    professional_id: "p1",
    date: "2026-05-20",
    service: "Corte + brushing",
    professional: "Ines",
    value: 48,
    formula_products: "Shampoo hidratante, protetor termico",
    notes: "Manter comprimento abaixo do ombro.",
    customer: demoCustomers[0],
    professional_profile: demoProfessionals[0]
  },
  {
    id: "s2",
    customer_id: "2",
    professional_id: "p2",
    date: "2026-02-08",
    service: "Coloracao raiz",
    professional: "Clara",
    value: 82,
    formula_products: "6.1 + oxidante 20 vol",
    notes: "Reavaliar brilho no proximo retorno.",
    customer: demoCustomers[1],
    professional_profile: demoProfessionals[1]
  },
  {
    id: "s3",
    customer_id: "3",
    professional_id: "p3",
    date: "2026-03-18",
    service: "Manicure gel",
    professional: "Marta",
    value: 32,
    formula_products: "Base niveladora, top coat",
    notes: "Preferencia por nude rosado.",
    customer: demoCustomers[2],
    professional_profile: demoProfessionals[2]
  }
];
