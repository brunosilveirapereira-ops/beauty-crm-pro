import type { Customer } from "./types";

export function whatsappRecoveryUrl(customer: Pick<Customer, "name" | "whatsapp" | "phone">) {
  const number = normalizePortugalWhatsapp(customer.whatsapp || customer.phone);
  const message = `Olá ${customer.name}, tudo bem? Notámos que já faz algum tempo desde a sua última visita. Gostaríamos de saber se quer agendar um horário esta semana.`;
  return `https://web.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(message)}`;
}

function normalizePortugalWhatsapp(whatsapp: string | null) {
  const raw = whatsapp?.trim() ?? "";
  const digits = raw.replace(/\D/g, "");

  if (!digits) return "";
  if (raw.startsWith("+")) return digits;
  if (raw.startsWith("00")) return digits.replace(/^00/, "");
  if (digits.startsWith("351")) return digits;

  return `351${digits}`;
}
