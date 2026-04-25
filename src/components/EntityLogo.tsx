import { useState } from "react";

interface EntityLogoProps {
  name: string;
  website?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "lg";
  className?: string;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0]![0] ?? ""}${words[1]![0] ?? ""}`.toUpperCase();
  }

  return name.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
}

function getWebsiteLogoUrl(website?: string | null) {
  if (!website) {
    return null;
  }

  return `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(website)}`;
}

export function EntityLogo({ name, website, imageUrl, size = "sm", className }: EntityLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedImageUrl = imageFailed ? null : imageUrl ?? getWebsiteLogoUrl(website);
  const classes = ["entity-logo", `entity-logo-${size}`, className].filter(Boolean).join(" ");

  return (
    <div className={classes} aria-hidden="true">
      {resolvedImageUrl ? (
        <img className="entity-logo-image" src={resolvedImageUrl} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <span className="entity-logo-fallback">{getInitials(name)}</span>
      )}
    </div>
  );
}
