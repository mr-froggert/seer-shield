interface ProtocolBadgeGroupProps {
  items: string[];
  className?: string;
}

export function ProtocolBadgeGroup({ items, className }: ProtocolBadgeGroupProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className ? `badge-row ${className}` : "badge-row"}>
      {items.map((item) => (
        <span key={item} className="pill">
          {item}
        </span>
      ))}
    </div>
  );
}
