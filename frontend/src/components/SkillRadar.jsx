const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LABEL_RADIUS = RADIUS + 16;
const RINGS = [0.25, 0.5, 0.75, 1];

function polar(index, count, radius) {
  const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
  return [
    CENTER + Math.cos(angle) * radius,
    CENTER + Math.sin(angle) * radius,
  ];
}

const toPoints = (ratios) =>
  ratios
    .map((ratio, index) => polar(index, ratios.length, RADIUS * ratio).join(","))
    .join(" ");

function labelAnchor(x) {
  if (Math.abs(x - CENTER) < 1) return "middle";
  return x > CENTER ? "start" : "end";
}

export default function SkillRadar({ skills }) {
  const count = skills.length;
  const ratios = skills.map(({ done, total }) => done / total);

  return (
    <svg
      viewBox={`-40 0 ${SIZE + 80} ${SIZE}`}
      role="img"
      aria-label="Radar des compétences"
      className="mx-auto w-full max-w-md"
    >
      {RINGS.map((ring) => (
        <polygon
          key={ring}
          points={toPoints(skills.map(() => ring))}
          fill="none"
          stroke="var(--border)"
        />
      ))}
      {skills.map(({ id }, index) => {
        const [x, y] = polar(index, count, RADIUS);
        return (
          <line
            key={id}
            x1={CENTER}
            y1={CENTER}
            x2={x}
            y2={y}
            stroke="var(--border)"
          />
        );
      })}
      <polygon
        points={toPoints(ratios)}
        fill="color-mix(in oklab, var(--accent) 24%, transparent)"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {skills.map(({ id, label, done, total }, index) => {
        const [x, y] = polar(index, count, RADIUS * ratios[index]);
        const [labelX, labelY] = polar(index, count, LABEL_RADIUS);
        return (
          <g key={id}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
            <circle cx={x} cy={y} r="12" fill="transparent">
              <title>{`${label} : ${done}/${total}`}</title>
            </circle>
            <text
              x={labelX}
              y={labelY}
              dy="0.35em"
              textAnchor={labelAnchor(labelX)}
              fill="var(--text-muted)"
              fontSize="14"
              fontWeight="600"
            >
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
