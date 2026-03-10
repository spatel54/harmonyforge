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
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-[8px] h-[88px] w-full rounded-[6px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hf-surface)]",
        selected
          ? "bg-[var(--hf-surface)] border-2 border-[var(--hf-surface)]"
          : "bg-[var(--hf-panel-bg)] border border-[var(--hf-detail)] hover:bg-[rgba(var(--hf-surface-rgb),0.05)]",
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
