import { useState, type ReactNode } from "react";

interface InlineTooltipProps {
  label: string;
  content: string;
  children: ReactNode;
  className?: string;
}

export function InlineTooltip({ label, content, children, className }: InlineTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={`inline-tooltip${className ? ` ${className}` : ""}${isOpen ? " is-open" : ""}`}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="inline-tooltip-trigger"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        onBlur={() => setIsOpen(false)}
      >
        {children}
      </button>
      <span className="inline-tooltip-content" role="tooltip">
        {content}
      </span>
    </span>
  );
}
