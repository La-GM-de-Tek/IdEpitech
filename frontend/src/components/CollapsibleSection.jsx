import { useState } from "react";
import Icon from "./Icon";

export default function CollapsibleSection({ title, leading, meta, children }) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mb-12 last:mb-0">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            className="group -ml-2 flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-2 text-left transition hover:bg-[var(--surface-hover)]"
          >
            <Icon
              name="chevronRight"
              size={16}
              className={`text-[var(--text-faint)] transition-transform duration-200 group-hover:text-[var(--text-muted)] ${
                open ? "rotate-90" : ""
              }`}
            />
            {leading}
            <span className="section-title">{title}</span>
          </button>
        </h2>
        {meta}
      </div>
      {open && children}
    </section>
  );
}
