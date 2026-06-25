import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExportFormatCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ExportFormatCard({
  icon: Icon,
  label,
  description,
  selected = false,
  onClick,
  className,
}: ExportFormatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "hf-pressable flex flex-col items-center justify-center gap-2 h-[92px] w-full rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hf-panel-bg)]",
        selected
          ? "bg-[var(--hf-surface)] border-2 border-[var(--hf-surface)] shadow-[0_4px_14px_color-mix(in_srgb,var(--hf-surface)_28%,transparent)]"
          : "bg-[color-mix(in_srgb,var(--hf-panel-bg)_96%,#fff)] border border-[color-mix(in_srgb,var(--hf-detail)_75%,transparent)] hover:border-[color-mix(in_srgb,var(--hf-accent)_45%,var(--hf-detail))] hover:bg-[color-mix(in_srgb,var(--hf-accent)_4%,var(--hf-panel-bg))]",
        className
      )}
    >
      <Icon
        className={cn(
          "w-[22px] h-[22px]",
          selected ? "text-white" : "text-[var(--hf-text-primary)] opacity-70"
        )}
      />
      <span
        className={cn(
          "font-mono text-[12px] font-medium leading-none",
          selected ? "text-white" : "text-[var(--hf-text-primary)]"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-sans text-[10px] leading-none",
          selected ? "text-white opacity-75" : "text-[var(--hf-text-primary)] opacity-50"
        )}
      >
        {description}
      </span>
    </button>
  );
}
