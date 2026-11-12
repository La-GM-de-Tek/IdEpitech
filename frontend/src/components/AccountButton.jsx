import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../auth/AuthContext";

const inputClass =
  "mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]";

function errorMessage(error, mode) {
  if (error.status === 0) return "Impossible de contacter le serveur.";
  if (mode === "login" && error.status === 401) {
    return "Identifiant ou mot de passe incorrect.";
  }
  if (mode === "register" && error.status === 409) {
    return "Un compte existe déjà avec cet email ou ce nom d'utilisateur.";
  }
  if (error.status === 400) return "Vérifie les informations saisies.";
  return "Une erreur est survenue. Réessaie plus tard.";
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onPointerDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-md px-2 py-1 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Field({ label, ...inputProps }) {
  return (
    <label className="block text-xs font-medium text-[var(--text-muted)]">
      {label}
      <input required className={inputClass} {...inputProps} />
    </label>
  );
}

function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  const isRegister = mode === "register";

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (isRegister) {
        await register({ mail: email, username, password });
      } else {
        await login({ login: email, password });
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err, mode));
      setPending(false);
    }
  };

  return (
    <Modal title={isRegister ? "Inscription" : "Connexion"} onClose={onClose}>
      <div className="mt-5 flex gap-2">
        {[
          { id: "login", label: "Connexion" },
          { id: "register", label: "Inscription" },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={option.id === mode}
            onClick={() => switchMode(option.id)}
            className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition ${
              option.id === mode
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Field
          label={isRegister ? "Email" : "Email ou nom d'utilisateur"}
          type={isRegister ? "email" : "text"}
          autoComplete={isRegister ? "email" : "username"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {isRegister && (
          <Field
            label="Nom d'utilisateur"
            autoComplete="username"
            maxLength={32}
            pattern=".*\S.*"
            title="Le nom d'utilisateur ne peut pas être vide."
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        )}
        <Field
          label={
            isRegister ? "Mot de passe (8 caractères minimum)" : "Mot de passe"
          }
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          maxLength={isRegister ? 72 : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md border border-[var(--accent)] px-2 py-1.5 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--surface-hover)] disabled:cursor-default disabled:opacity-50"
        >
          {pending
            ? "Chargement…"
            : isRegister
              ? "Créer mon compte"
              : "Se connecter"}
        </button>
      </form>
    </Modal>
  );
}

function ProfileModal({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <Modal title="Mon compte" onClose={onClose}>
      <p className="mt-5 text-sm font-medium text-[var(--text)]">
        {user.username}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{user.mail}</p>
      <button
        type="button"
        onClick={() => {
          logout();
          onClose();
        }}
        className="mt-4 w-full rounded-md border border-[var(--border)] px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        Se déconnecter
      </button>
    </Modal>
  );
}

export default function AccountButton() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  if (loading) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="max-w-40 truncate rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
      >
        {user ? user.username : "Connexion"}
      </button>

      {open &&
        (user ? (
          <ProfileModal onClose={close} />
        ) : (
          <AuthModal onClose={close} />
        ))}
    </>
  );
}
