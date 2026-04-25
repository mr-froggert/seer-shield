import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="callout error-callout">
        Unknown route. <Link to="/">Return to the protocol dashboard.</Link>
      </div>
    </main>
  );
}
