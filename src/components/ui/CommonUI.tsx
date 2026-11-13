import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { ContentSource } from '../../types/study';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-5 border-b border-[var(--border-color)]">
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-main)] text-balance">
        {title}
      </h1>
      <p className="mt-1 text-sm text-[var(--text-muted)] max-w-2xl">{subtitle}</p>
    </div>
    {action && <div className="shrink-0 flex items-center gap-3">{action}</div>}
  </div>
);

interface StatMetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}

export const StatMetricCard: React.FC<StatMetricCardProps> = ({ label, value, detail, icon }) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-4 shadow-[0_1px_2px_rgba(16,40,58,0.04)] transition-colors">
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      <span className="text-[var(--color-primary)] shrink-0" aria-hidden="true">
        {icon}
      </span>
    </div>
    <div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)] font-mono tabular-nums">
        {value}
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">{detail}</p>
    </div>
  </div>
);

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry, onDismiss }) => (
  <div
    role="alert"
    className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
  >
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-rose-950 dark:text-rose-100">
          Unable to complete request
        </p>
        <p className="text-sm text-rose-800 dark:text-rose-200 mt-0.5">{message}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-900 dark:text-rose-100 bg-white dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="p-1.5 text-rose-700 dark:text-rose-300 hover:text-rose-950 dark:hover:text-white rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-10 text-center flex flex-col items-center justify-center">
    <div className="w-11 h-11 rounded-xl bg-[var(--bg-subtle)] text-[var(--color-primary)] flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-base font-semibold text-[var(--text-main)]">{title}</h3>
    <p className="mt-1.5 text-sm text-[var(--text-muted)] max-w-md">{description}</p>
    {actionLabel && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="mt-5 px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface SourceAttributionProps {
  source?: ContentSource;
  subject?: string;
  timestamp?: string;
  extra?: string;
}

export const SourceAttribution: React.FC<SourceAttributionProps> = ({
  source,
  subject,
  timestamp,
  extra,
}) => {
  const sourceLabel =
    source === 'gemini'
      ? 'Generated with Gemini'
      : source === 'sample'
      ? 'Sample Data (Preloaded)'
      : source === 'user'
      ? 'User Created'
      : null;

  const formattedDate = timestamp
    ? new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const parts = [subject, sourceLabel, extra, formattedDate].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
      {parts.map((part, idx) => (
        <React.Fragment key={`${part}-${idx}`}>
          {idx > 0 && <span aria-hidden="true">·</span>}
          <span
            className={
              part === 'Generated with Gemini'
                ? 'text-[var(--color-primary)] font-medium'
                : ''
            }
          >
            {part}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ lines?: number }> = ({ lines = 4 }) => (
  <div
    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4 animate-pulse"
    aria-busy="true"
  >
    <div className="h-5 bg-[var(--bg-subtle)] rounded w-1/3" />
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className="h-3.5 bg-[var(--bg-subtle)] rounded"
          style={{ width: `${92 - idx * 11}%` }}
        />
      ))}
    </div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-[var(--text-main)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
          <h2 id="modal-title" className="text-base font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
