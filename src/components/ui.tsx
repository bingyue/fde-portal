"use client";

import { X } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const styles = {
    primary:
      "bg-[var(--primary)] text-white border-[var(--primary)] hover:bg-[var(--primary-hover)] hover:border-[var(--primary-hover)] dark:text-[#071426]",
    secondary:
      "bg-[var(--surface)] text-[var(--ink)] border-[var(--line-strong)] hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)]",
    ghost:
      "bg-transparent text-[var(--muted)] border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
    danger:
      "bg-[var(--danger)] text-white border-[var(--danger)] hover:brightness-90",
  };
  return (
    <button
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--radius-sm)] border px-3.5 py-2 text-[13px] font-semibold transition disabled:pointer-events-none disabled:opacity-45 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const styles = {
    neutral: "bg-[var(--surface-hover)] text-[var(--muted)]",
    success: "bg-[var(--success-soft)] text-[var(--success)]",
    warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
    info: "bg-[var(--info-soft)] text-[var(--info)]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold leading-none ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Progress({
  value,
  tone = "signal",
  label,
}: {
  value: number;
  tone?: "signal" | "success" | "warning";
  label?: string;
}) {
  const color =
    tone === "signal"
      ? "var(--primary)"
      : tone === "success"
        ? "var(--success)"
        : "var(--warning)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: color,
          }}
        />
      </div>
      {label !== undefined && (
        <span className="font-data w-9 text-right text-xs font-bold">
          {label}
        </span>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

const fieldClass =
  "min-h-10 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] transition focus:border-[var(--primary)]";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${fieldClass} ${props.className || ""}`} />
  );
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${fieldClass} min-h-24 resize-y ${props.className || ""}`}
    />
  );
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${fieldClass} ${props.className || ""}`} />
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-[#071426]/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[92vh] w-full overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] ${wide ? "max-w-3xl" : "max-w-lg"}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[var(--line)] bg-[var(--surface)] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-[var(--muted)]">{description}</p>
            )}
          </div>
          <button
            aria-label="关闭"
            className="p-1 text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[var(--radius-md)] border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
          {icon}
        </div>
        <h3 className="font-bold">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col justify-between gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="font-data mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--primary)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          {description}
        </p>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      )}
    </header>
  );
}

export function SectionTitle({
  title,
  meta,
  action,
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-bold">{title}</h2>
        {meta && <p className="mt-1 text-xs text-[var(--muted)]">{meta}</p>}
      </div>
      {action}
    </div>
  );
}
