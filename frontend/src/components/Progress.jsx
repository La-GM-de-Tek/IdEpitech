export default function Progress({ done, total, tone = "var(--accent)" }) {
  const ratio = total > 0 ? Math.min(done / total, 1) : 0;

  return (
    <span
      className="flex items-center gap-2.5"
      title={`${done} terminé${done > 1 ? "s" : ""} sur ${total}`}
    >
      <span className="meter" style={{ "--tone": tone }} aria-hidden="true">
        <span style={{ width: `${ratio * 100}%` }} />
      </span>
      <span className="text-xs font-semibold tabular-nums text-[var(--text-muted)]">
        {done}
        <span className="text-[var(--text-faint)]">/{total}</span>
      </span>
    </span>
  );
}
