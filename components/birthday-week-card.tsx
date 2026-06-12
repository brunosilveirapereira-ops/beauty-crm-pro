"use client";

import { useEffect, useMemo, useState } from "react";
import { Cake, MessageCircle } from "lucide-react";
import { deletedCustomersStorageKey, localCustomersStorageKey, mergeById } from "@/lib/risk";
import { isSupabaseConfigured } from "@/lib/supabase";
import { openWhatsappWithFallback, whatsappBirthdayLinks } from "@/lib/whatsapp";
import type { Customer } from "@/lib/types";

type BirthdayCustomer = {
  customer: Customer;
  birthdayDate: Date;
  daysUntil: number;
};

export function BirthdayWeekCard({ initialCustomers }: { initialCustomers: Customer[] }) {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<string[]>([]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      console.info("[Beauty CRM Pro] Supabase conectado: aniversariantes da semana calculados com dados do Supabase.");
      return;
    }

    console.info("[Beauty CRM Pro] Modo local: aniversariantes da semana calculados com localStorage/demo.");

    function loadLocalData() {
      setLocalCustomers(readStoredItems<Customer>(localCustomersStorageKey));
      setDeletedCustomerIds(readStoredItems<string>(deletedCustomersStorageKey));
    }

    loadLocalData();
    window.addEventListener("storage", loadLocalData);
    window.addEventListener("focus", loadLocalData);

    return () => {
      window.removeEventListener("storage", loadLocalData);
      window.removeEventListener("focus", loadLocalData);
    };
  }, []);

  const birthdays = useMemo(() => {
    const customers = mergeById(localCustomers, initialCustomers, deletedCustomerIds);
    return buildBirthdayWeek(customers);
  }, [deletedCustomerIds, initialCustomers, localCustomers]);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-champagne text-ink">
          <Cake className="h-5 w-5" />
        </span>
        <h2 className="text-base font-semibold text-ink">Aniversariantes da Semana</h2>
      </div>

      <div className="mt-4 space-y-3">
        {birthdays.map(({ customer, birthdayDate, daysUntil }) => {
          const whatsappLinks = whatsappBirthdayLinks(customer);

          return (
            <div key={customer.id} className="flex flex-col gap-3 rounded-md bg-champagne/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-ink">{customer.name}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {formatBirthdayDate(birthdayDate)} · {formatDaysUntil(daysUntil)}
                </p>
              </div>
              <a
                href={whatsappLinks.webUrl}
                onClick={(event) => {
                  event.preventDefault();
                  openWhatsappWithFallback(whatsappLinks.appUrl, whatsappLinks.webUrl);
                }}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-sage px-3 py-2 text-xs font-semibold text-white hover:bg-sage/90"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          );
        })}

        {birthdays.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-200 px-3 py-6 text-center text-sm text-stone-500">
            Nenhum aniversário nos próximos 7 dias.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function buildBirthdayWeek(customers: Customer[]) {
  const today = startOfDay(new Date());

  return customers
    .map((customer): BirthdayCustomer | null => {
      if (!customer.birth_date) return null;

      const birthdayDate = nextBirthdayDate(customer.birth_date, today);
      if (!birthdayDate) return null;

      const daysUntil = Math.round((birthdayDate.getTime() - today.getTime()) / 86400000);
      if (daysUntil < 0 || daysUntil > 7) return null;

      return { customer, birthdayDate, daysUntil };
    })
    .filter((item): item is BirthdayCustomer => Boolean(item))
    .sort((a, b) => a.daysUntil - b.daysUntil || a.customer.name.localeCompare(b.customer.name, "pt-PT"));
}

function nextBirthdayDate(birthDate: string, today: Date) {
  const [, month, day] = birthDate.split("-").map(Number);
  if (!month || !day) return null;

  let nextBirthday = new Date(today.getFullYear(), month - 1, day);
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }

  return startOfDay(nextBirthday);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatBirthdayDate(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long" }).format(date);
}

function formatDaysUntil(days: number) {
  if (days === 0) return "é hoje";
  if (days === 1) return "falta 1 dia";
  return `faltam ${days} dias`;
}

function readStoredItems<T>(key: string) {
  const saved = window.localStorage.getItem(key);
  if (!saved) return [];

  try {
    return JSON.parse(saved) as T[];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}
