import { useEffect, useMemo, useRef, useState } from "react";

interface MultiSelectDropdownOption {
  label: string;
  value: number;
}

interface MultiSelectDropdownProps {
  allLabel?: string;
  label: string;
  onChange: (values: number[]) => void;
  options: MultiSelectDropdownOption[];
  selectedValues: number[];
}

function formatTriggerValue(selectedLabels: string[], allLabel: string) {
  if (selectedLabels.length === 0) {
    return allLabel;
  }

  if (selectedLabels.length <= 2) {
    return selectedLabels.join(", ");
  }

  return `${selectedLabels.length} selected`;
}

export function MultiSelectDropdown({
  allLabel = "All",
  label,
  onChange,
  options,
  selectedValues
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const triggerValue = useMemo(
    () =>
      formatTriggerValue(
        options.filter((option) => selectedSet.has(option.value)).map((option) => option.label),
        allLabel
      ),
    [allLabel, options, selectedSet]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleValue(value: number) {
    onChange(
      selectedSet.has(value)
        ? selectedValues.filter((selectedValue) => selectedValue !== value)
        : [...selectedValues, value].sort((left, right) => left - right)
    );
  }

  return (
    <div ref={containerRef} className={`field field-inline dropdown-field${isOpen ? " is-open" : ""}`}>
      <span className="control-label">{label}</span>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="field-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="field-button-value">{triggerValue}</span>
        <span aria-hidden="true" className="field-button-icon">
          {isOpen ? "▴" : "▾"}
        </span>
      </button>
      {isOpen ? (
        <div aria-label={`${label} options`} className="dropdown-menu" role="dialog">
          <button className="dropdown-menu-action" type="button" onClick={() => onChange([])}>
            {allLabel}
          </button>
          <div className="dropdown-options">
            {options.map((option) => (
              <label key={option.value} className="dropdown-option">
                <input
                  checked={selectedSet.has(option.value)}
                  type="checkbox"
                  onChange={() => toggleValue(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
