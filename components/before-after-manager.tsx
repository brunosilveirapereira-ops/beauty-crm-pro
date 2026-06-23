"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Camera, ChevronLeft, ChevronRight, ImageOff, ImagePlus, Save, X } from "lucide-react";
import { isDevMode } from "@/lib/supabase";
import type { BeforeAfterHistory, Customer } from "@/lib/types";

const BUCKET = "customer-transformations";
const ACCEPTED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

type Payload = Omit<BeforeAfterHistory, "id" | "created_at">;

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

// ============================================================
// Manager principal
// ============================================================

export function BeforeAfterManager({
  customer,
  initialEntries
}: {
  customer: Customer;
  initialEntries: BeforeAfterHistory[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<BeforeAfterHistory | null>(null);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);

  function clearFormState() {
    setBeforePreview(null);
    setAfterPreview(null);
    setStatus("");
    if (beforeFileRef.current) beforeFileRef.current.value = "";
    if (afterFileRef.current) afterFileRef.current.value = "";
  }

  function toggleForm() {
    if (showForm) clearFormState();
    setShowForm((v) => !v);
  }

  function handleFileChange(
    e: ChangeEvent<HTMLInputElement>,
    setPreview: (url: string | null) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    if (!ACCEPTED_MIME.includes(file.type)) {
      setStatus("Formato inválido. Usa JPG, JPEG, PNG ou WEBP.");
      e.target.value = "";
      setPreview(null);
      return;
    }
    setPreview(URL.createObjectURL(file));
    setStatus("");
  }

  async function uploadImage(
    supabase: ReturnType<typeof createClientComponentClient>,
    file: File,
    label: "antes" | "depois"
  ): Promise<string> {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${customer.id}/${Date.now()}-${label}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false
    });

    if (error) throw new Error(`Erro ao fazer upload da foto "${label}": ${error.message}`);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    const beforeFile = beforeFileRef.current?.files?.[0];
    const afterFile = afterFileRef.current?.files?.[0];

    if (!beforeFile) { setStatus("Por favor seleciona a foto Antes."); return; }
    if (!afterFile)  { setStatus("Por favor seleciona a foto Depois."); return; }

    setLoading(true);
    setStatus("");

    const supabase = createClientComponentClient();

    try {
      const [beforeUrl, afterUrl] = await Promise.all([
        uploadImage(supabase, beforeFile, "antes"),
        uploadImage(supabase, afterFile, "depois")
      ]);

      const payload: Payload = {
        customer_id: customer.id,
        date: String(form.get("date")),
        service: String(form.get("service")),
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        observations: String(form.get("observations") || "") || null
      };

      console.info("[Beauty CRM Pro] Supabase conectado: gravando transformação em public.before_after_history.", {
        table: "before_after_history",
        devMode: isDevMode,
        customerId: customer.id,
        payload
      });

      const { data, error } = await supabase
        .from("before_after_history")
        .insert(payload)
        .select("*")
        .single();

      if (error) { setStatus(formatSupabaseError(error)); return; }

      setEntries((current) =>
        [data as BeforeAfterHistory, ...current].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      setStatus("Transformação guardada com sucesso.");
      formElement.reset();
      clearFormState();
      setShowForm(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro inesperado ao guardar transformação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Antes e Depois</h2>
            <p className="mt-1 text-sm text-stone-500">Histórico visual de transformações por atendimento.</p>
          </div>
          <button
            type="button"
            onClick={toggleForm}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blush px-4 py-2.5 text-sm font-semibold text-white hover:bg-blush/90"
          >
            <ImagePlus className="h-4 w-4" />
            {showForm ? "Cancelar" : "Adicionar Transformação"}
          </button>
        </div>

        {/* Formulário */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-stone-200 bg-champagne/40 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Data" name="date" type="date" required />
              <Field label="Serviço realizado" name="service" required />

              <FileDropzone
                label="Foto Antes"
                preview={beforePreview}
                fileRef={beforeFileRef}
                onClear={() => {
                  setBeforePreview(null);
                  if (beforeFileRef.current) beforeFileRef.current.value = "";
                }}
                onChange={(e) => handleFileChange(e, setBeforePreview)}
              />

              <FileDropzone
                label="Foto Depois"
                preview={afterPreview}
                fileRef={afterFileRef}
                onClear={() => {
                  setAfterPreview(null);
                  if (afterFileRef.current) afterFileRef.current.value = "";
                }}
                onChange={(e) => handleFileChange(e, setAfterPreview)}
              />

              {/* Preview interactivo com slider */}
              {beforePreview && afterPreview ? (
                <div className="md:col-span-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
                    Pré-visualização — arrasta para comparar
                  </p>
                  <div className="overflow-hidden rounded-lg border border-stone-200 shadow-sm">
                    <BeforeAfterSlider beforeSrc={beforePreview} afterSrc={afterPreview} height={208} />
                  </div>
                </div>
              ) : null}

              <label className="md:col-span-2">
                <span className="text-sm font-medium text-stone-700">Observações</span>
                <textarea
                  className="focus-ring mt-1 min-h-24 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
                  name="observations"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-600">{status}</p>
              <button
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-graphite disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {loading ? "A guardar..." : "Guardar transformação"}
              </button>
            </div>
          </form>
        ) : status ? (
          <p className="mt-4 rounded-md bg-champagne px-3 py-2 text-sm text-ink">{status}</p>
        ) : null}

        {/* Galeria de cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <TransformationCard
              key={entry.id}
              entry={entry}
              onOpen={() => setSelectedEntry(entry)}
            />
          ))}
          {entries.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-stone-500">
              Ainda não existem transformações registadas.
            </p>
          ) : null}
        </div>
      </section>

      {/* Modal de detalhe */}
      {selectedEntry ? (
        <TransformationModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      ) : null}
    </>
  );
}

// ============================================================
// Modal de visualização premium
// ============================================================

function TransformationModal({
  entry,
  onClose
}: {
  entry: BeforeAfterHistory;
  onClose: () => void;
}) {
  // ESC para fechar + lock de scroll do body
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  // onClose chama apenas setSelectedEntry(null) — setter estável, sem risco de closure stale
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      // Fechar ao clicar no overlay (fora do painel)
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Cabeçalho */}
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              {formatDate(entry.date)}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug text-ink">
              {entry.service}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Slider em tamanho grande */}
        <div className="flex-shrink-0">
          <BeforeAfterSlider
            beforeSrc={entry.before_image_url}
            afterSrc={entry.after_image_url}
            height={420}
          />
        </div>

        {/* Observações — só se existirem */}
        {entry.observations ? (
          <div className="flex-shrink-0 border-t border-stone-100 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Observações
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
              {entry.observations}
            </p>
          </div>
        ) : null}

      </div>
    </div>
  );
}

// ============================================================
// Comparador deslizante Antes / Depois
// ============================================================

function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  height = 192
}: {
  beforeSrc: string;
  afterSrc: string;
  height?: number;
}) {
  const [position, setPosition] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function calcPosition(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return;
      calcPosition(e.clientX);
    }
    function onMouseUp() {
      isDragging.current = false;
    }
    function onTouchMove(e: TouchEvent) {
      if (e.cancelable) e.preventDefault();
      calcPosition(e.touches[0].clientX);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden cursor-col-resize"
      style={{ height }}
      // Impede que cliques no slider propaguem para o card pai
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.preventDefault();
        isDragging.current = true;
        calcPosition(e.clientX);
      }}
      onTouchStart={(e) => {
        calcPosition(e.touches[0].clientX);
      }}
    >
      {/* Imagem Antes — camada base */}
      <SafeImage
        src={beforeSrc}
        alt="Foto antes da transformação"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Imagem Depois — revelada até à posição do slider */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <SafeImage
          src={afterSrc}
          alt="Foto depois da transformação"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Linha divisória */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 z-10 w-px"
        style={{
          left: `${position}%`,
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 8px rgba(0,0,0,0.35)"
        }}
      >
        {/* Handle */}
        <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/80">
          <ChevronLeft className="h-3.5 w-3.5 text-stone-500" />
          <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
        </div>
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
        Antes
      </span>
      <span className="pointer-events-none absolute bottom-2 right-2 z-10 rounded-full bg-blush/90 px-2 py-0.5 text-xs font-semibold text-white">
        Depois
      </span>
    </div>
  );
}

// ============================================================
// Card de transformação — clicável para abrir modal
// ============================================================

function TransformationCard({
  entry,
  onOpen
}: {
  entry: BeforeAfterHistory;
  onOpen: () => void;
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm transition-all duration-150 hover:border-stone-300 hover:shadow-md cursor-pointer"
      onClick={onOpen}
    >
      {/* Slider — onClick com stopPropagation interno para não abrir modal ao arrastar */}
      <BeforeAfterSlider
        beforeSrc={entry.before_image_url}
        afterSrc={entry.after_image_url}
        height={192}
      />

      {/* Info do card */}
      <div className="p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {formatDate(entry.date)}
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink">{entry.service}</p>
        {entry.observations ? (
          <p className="mt-1 text-xs leading-relaxed text-stone-500 line-clamp-2">
            {entry.observations}
          </p>
        ) : null}
        <p className="mt-2 text-xs font-medium text-blush">
          Clica para ver em detalhe →
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Dropzone de upload com preview individual
// ============================================================

function FileDropzone({
  label,
  preview,
  fileRef,
  onClear,
  onChange
}: {
  label: string;
  preview: string | null;
  fileRef: React.RefObject<HTMLInputElement>;
  onClear: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {preview ? (
        <div className="relative mt-1">
          <img
            src={preview}
            alt={`${label} — pré-visualização`}
            className="h-44 w-full rounded-md object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-white"
          >
            Remover
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-1 flex h-44 items-center justify-center rounded-md border-2 border-dashed border-stone-300 bg-white transition-colors hover:border-blush hover:bg-champagne/20"
        >
          <div className="text-center">
            <Camera className="mx-auto h-6 w-6 text-stone-400" />
            <p className="mt-1 text-xs font-medium text-stone-500">Clica para selecionar</p>
            <p className="text-xs text-stone-400">JPG, PNG ou WEBP</p>
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        onChange={onChange}
      />
    </div>
  );
}

// ============================================================
// Imagem com fallback elegante
// ============================================================

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-stone-100`}>
        <div className="text-center">
          <ImageOff className="mx-auto h-6 w-6 text-stone-300" />
          <p className="mt-1 text-xs text-stone-300">Imagem indisponível</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

// ============================================================
// Campo de texto genérico
// ============================================================

function Field({
  label,
  name,
  type = "text",
  required
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-stone-300 px-3 py-2.5 text-sm"
        name={name}
        type={type}
        required={required}
      />
    </label>
  );
}

// ============================================================
// Utilitários
// ============================================================

function formatSupabaseError(error: { message: string; code?: string; details?: string; hint?: string }) {
  const parts = [
    `Erro Supabase: ${error.message}`,
    error.code ? `Codigo: ${error.code}` : null,
    error.details ? `Detalhes: ${error.details}` : null,
    error.hint ? `Hint: ${error.hint}` : null
  ].filter(Boolean);
  return parts.join(" | ");
}
