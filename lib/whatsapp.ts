import type { RiskLevel } from "./risk";
import type { Customer } from "./types";

type RecoveryMessageOptions = {
  daysWithoutVisit?: number;
  lastServiceName?: string | null;
  risk?: RiskLevel | null;
};

export function whatsappRecoveryUrl(customer: Pick<Customer, "name" | "whatsapp" | "phone">, options: RecoveryMessageOptions = {}) {
  return whatsappRecoveryLinks(customer, options).webUrl;
}

export function whatsappRecoveryLinks(customer: Pick<Customer, "name" | "whatsapp" | "phone">, options: RecoveryMessageOptions = {}) {
  const number = normalizePortugalWhatsapp(customer.whatsapp || customer.phone);
  const message = buildRecoveryMessage(customer.name, options);
  return whatsappMessageLinks(number, message);
}

export function whatsappBirthdayLinks(customer: Pick<Customer, "name" | "whatsapp" | "phone">) {
  const number = normalizePortugalWhatsapp(customer.whatsapp || customer.phone);
  const message = `Olá ${customer.name}! 🎉 A equipa do salão deseja-lhe um feliz aniversário. Que o seu dia seja maravilhoso! Temos uma surpresa especial para si este mês.`;

  return whatsappMessageLinks(number, message);
}

function whatsappMessageLinks(number: string, message: string) {
  const encodedMessage = encodeURIComponent(message);

  return {
    appUrl: `whatsapp://send?phone=${number}&text=${encodedMessage}`,
    webUrl: `https://web.whatsapp.com/send?phone=${number}&text=${encodedMessage}`
  };
}

export function openWhatsappWithFallback(appUrl: string, webUrl: string) {
  if (typeof window === "undefined") return;

  const startedAt = Date.now();
  window.location.href = appUrl;

  window.setTimeout(() => {
    if (document.visibilityState === "visible" && Date.now() - startedAt < 2500) {
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  }, 1200);
}

function normalizePortugalWhatsapp(whatsapp: string | null) {
  const digits = whatsapp?.trim().replace(/\D/g, "") ?? "";

  if (!digits) return "";
  if (digits.startsWith("00")) return digits.replace(/^00/, "");
  if (digits.startsWith("351")) return digits;

  return `351${digits.replace(/^0+/, "")}`;
}

function buildRecoveryMessage(name: string, options: RecoveryMessageOptions) {
  const daysText = options.daysWithoutVisit ? `já passaram ${options.daysWithoutVisit} dias desde a sua última visita` : "já faz algum tempo desde a sua última visita";
  const serviceText = options.lastServiceName ? `, quando realizou ${options.lastServiceName}` : "";

  if (options.risk?.label === "Crítico") {
    return `Olá ${name}, tudo bem? Notámos que ${daysText}${serviceText}. Queremos muito continuar a cuidar de si e podemos ajudar a encontrar um horário esta semana. Quer que lhe enviemos algumas opções?`;
  }

  if (options.risk?.label === "Alto Risco") {
    return `Olá ${name}, tudo bem? Notámos que ${daysText}${serviceText}. Temos saudades de a receber no salão. Quer agendar um horário esta semana?`;
  }

  return `Olá ${name}, tudo bem? Notámos que ${daysText}${serviceText}. Gostaríamos de saber se quer agendar um horário esta semana.`;
}
