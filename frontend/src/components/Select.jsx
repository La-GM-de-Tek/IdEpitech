import Icon from "./Icon";

export default function Select({ className = "", children, ...props }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      <select className="select w-full" {...props}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={14}
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[var(--text-faint)]"
      />
    </span>
  );
}
