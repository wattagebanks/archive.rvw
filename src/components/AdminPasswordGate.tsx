import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  authenticateAdmin,
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "../lib/adminAuth";
import "./AdminPasswordGate.css";

type AdminPasswordGateProps = {
  children: React.ReactNode;
};

export default function AdminPasswordGate({ children }: AdminPasswordGateProps) {
  const [unlocked, setUnlocked] = useState(isAdminAuthenticated);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const configured = isAdminPasswordConfigured();

  useEffect(() => {
    if (!unlocked) inputRef.current?.focus();
  }, [unlocked]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!configured) {
        setError("Admin password is not configured for this build.");
        return;
      }
      if (authenticateAdmin(password)) {
        setPassword("");
        setUnlocked(true);
        return;
      }
      setError("Incorrect password.");
      setPassword("");
      inputRef.current?.focus();
    },
    [configured, password]
  );

  if (unlocked) return <>{children}</>;

  return (
    <div
      className="admin-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-gate-title"
    >
      <div className="admin-gate__card">
        <h1 id="admin-gate-title" className="admin-gate__title">
          Admin access
        </h1>
        <p className="admin-gate__lede">
          Enter the admin password to edit garments and uploads.
        </p>
        {!configured ? (
          <p className="admin-gate__error" role="alert">
            Set <code>VITE_ADMIN_PASSWORD</code> in your environment (see{" "}
            <code>.env.example</code>) and rebuild.
          </p>
        ) : (
          <form className="admin-gate__form" onSubmit={handleSubmit}>
            <label className="admin-gate__label" htmlFor="admin-gate-password">
              Password
            </label>
            <input
              ref={inputRef}
              id="admin-gate-password"
              className="admin-gate__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error ? (
              <p className="admin-gate__error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="admin-gate__submit">
              Continue
            </button>
          </form>
        )}
        <Link className="admin-gate__back" to="/">
          ← Back to catalog
        </Link>
      </div>
    </div>
  );
}
