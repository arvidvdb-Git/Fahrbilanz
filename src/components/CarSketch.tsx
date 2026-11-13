import { BodyClassId, PowertrainId } from '../data/cars';

interface CarSketchProps {
  powertrain: PowertrainId;
  bodyClass?: BodyClassId;
  accentColor?: string;
  className?: string;
}

/**
 * Bespoke architectural / industrial design SVG sketch of each vehicle body class
 * paired with a distinct internal powertrain schematic (engine block, fuel tank,
 * hybrid split drive, or full-floor skateboard battery pack).
 */
export function CarSketch({
  powertrain,
  bodyClass = 'sedan',
  accentColor,
  className = '',
}: CarSketchProps) {
  const accent = accentColor || 'var(--accent)';

  const renderBodyOutline = () => {
    if (bodyClass === 'compact') {
      return (
        <g>
          {/* Compact hatchback silhouette */}
          <path
            d="M38 118 L34 103 C34 94 40 85 52 80 L84 62 C97 54 116 50 144 50 L184 50 C205 50 220 58 232 74 L244 92 C250 96 254 104 252 118"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Hatch beltline & window */}
          <path
            d="M84 78 L102 58 L178 58 C196 58 208 66 218 79 L84 78 Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeOpacity="0.62"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.035"
          />
          <line
            x1="146"
            y1="58"
            x2="144"
            y2="78"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          {/* Subtle shoulder crease */}
          <path
            d="M44 92 Q144 86 242 93"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.32"
            fill="none"
          />
          {/* Lower rocker panel between wheel arches */}
          <line
            x1="96"
            y1="118"
            x2="196"
            y2="118"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="38"
            y1="118"
            x2="52"
            y2="118"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="240"
            y1="118"
            x2="252"
            y2="118"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (bodyClass === 'suv') {
      return (
        <g>
          {/* Crossover SUV silhouette */}
          <path
            d="M32 115 L30 96 C30 85 37 76 52 72 L86 52 C100 45 124 42 162 42 L202 42 C222 42 234 54 244 74 L256 89 C261 96 261 106 258 115"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* SUV greenhouse */}
          <path
            d="M84 72 L106 50 L196 50 C212 50 222 59 230 73 L84 72 Z"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeOpacity="0.62"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.035"
          />
          <line
            x1="152"
            y1="50"
            x2="150"
            y2="72"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.5"
          />
          <line
            x1="202"
            y1="50"
            x2="206"
            y2="72"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeOpacity="0.4"
          />
          {/* Roof rail sketch line */}
          <path
            d="M110 42 L200 42"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeOpacity="0.4"
            strokeLinecap="round"
          />
          {/* Body crease */}
          <path
            d="M38 86 Q146 80 250 86"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity="0.32"
            fill="none"
          />
          {/* Higher ground clearance rocker */}
          <line
            x1="98"
            y1="115"
            x2="194"
            y2="115"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="115"
            x2="50"
            y2="115"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <line
            x1="242"
            y1="115"
            x2="258"
            y2="115"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Default: Fastback Sedan
    return (
      <g>
        {/* Sleek Sedan silhouette */}
        <path
          d="M28 118 L26 104 C26 93 34 86 50 82 L88 60 C105 51 128 48 156 48 L188 49 C212 50 228 60 246 78 L260 91 C264 96 264 106 260 118"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Sedan cabin glass */}
        <path
          d="M84 78 L108 56 L186 56 C204 56 218 65 232 79 L84 78 Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeOpacity="0.62"
          strokeLinejoin="round"
          fill="currentColor"
          fillOpacity="0.035"
        />
        <line
          x1="150"
          y1="56"
          x2="148"
          y2="78"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeOpacity="0.5"
        />
        {/* Sculpted character line */}
        <path
          d="M36 93 Q146 87 254 94"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.32"
          fill="none"
        />
        {/* Rocker line */}
        <line
          x1="96"
          y1="118"
          x2="196"
          y2="118"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="118"
          x2="50"
          y2="118"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="242"
          y1="118"
          x2="260"
          y2="118"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </g>
    );
  };

  const renderPowertrainCutaway = () => {
    if (powertrain === 'gasoline') {
      return (
        <g>
          {/* Front 4-cylinder engine block + pistons */}
          <rect
            x="48"
            y="88"
            width="28"
            height="19"
            rx="3"
            fill={accent}
            fillOpacity="0.16"
            stroke={accent}
            strokeWidth="1.5"
          />
          <line x1="55" y1="88" x2="55" y2="107" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
          <line x1="62" y1="88" x2="62" y2="107" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
          <line x1="69" y1="88" x2="69" y2="107" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
          {/* Exhaust & rear fuel tank */}
          <path
            d="M76 105 L184 105 L196 100"
            stroke={accent}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            fill="none"
            strokeOpacity="0.7"
          />
          <rect
            x="176"
            y="92"
            width="24"
            height="14"
            rx="3"
            fill={accent}
            fillOpacity="0.18"
            stroke={accent}
            strokeWidth="1.4"
          />
          {/* Subtle exhaust lines at rear */}
          <path
            d="M266 108 L278 108 M268 113 L283 113"
            stroke={accent}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </g>
      );
    }

    if (powertrain === 'diesel') {
      return (
        <g>
          {/* Heavy-torque turbo diesel engine + intercooler */}
          <rect
            x="45"
            y="87"
            width="33"
            height="21"
            rx="3"
            fill={accent}
            fillOpacity="0.18"
            stroke={accent}
            strokeWidth="1.5"
          />
          {/* Turbo swirl indicator */}
          <circle
            cx="54"
            cy="97"
            r="5"
            fill="none"
            stroke={accent}
            strokeWidth="1.3"
          />
          <circle cx="54" cy="97" r="1.8" fill={accent} />
          {/* Long-range under-body tank */}
          <rect
            x="166"
            y="91"
            width="34"
            height="16"
            rx="3"
            fill={accent}
            fillOpacity="0.18"
            stroke={accent}
            strokeWidth="1.5"
          />
          <line
            x1="78"
            y1="103"
            x2="166"
            y2="103"
            stroke={accent}
            strokeWidth="1.3"
            strokeOpacity="0.7"
          />
          {/* Highway motion lines */}
          <path
            d="M265 103 L282 103 M269 110 L288 110"
            stroke={accent}
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.65"
          />
        </g>
      );
    }

    if (powertrain === 'hybrid') {
      return (
        <g>
          {/* Compact front engine + electric motor split */}
          <rect
            x="48"
            y="89"
            width="22"
            height="17"
            rx="3"
            fill={accent}
            fillOpacity="0.14"
            stroke={accent}
            strokeWidth="1.4"
          />
          {/* Compact mid-floor traction battery */}
          <rect
            x="114"
            y="102"
            width="52"
            height="10"
            rx="2.5"
            fill={accent}
            fillOpacity="0.22"
            stroke={accent}
            strokeWidth="1.5"
          />
          <line x1="131" y1="102" x2="131" y2="112" stroke={accent} strokeWidth="1" />
          <line x1="148" y1="102" x2="148" y2="112" stroke={accent} strokeWidth="1" />
          {/* Rear fuel cell / tank */}
          <rect
            x="178"
            y="93"
            width="20"
            height="13"
            rx="2.5"
            fill={accent}
            fillOpacity="0.14"
            stroke={accent}
            strokeWidth="1.3"
          />
          {/* Dual energy link */}
          <path
            d="M70 98 L114 106 M166 106 L178 100"
            stroke={accent}
            strokeWidth="1.2"
            strokeDasharray="2 2"
            fill="none"
          />
        </g>
      );
    }

    // Full Electric: flat skateboard battery floor + e-motor capsules + energy bolt
    return (
      <g>
        {/* Full-wheelbase skateboard battery pack */}
        <rect
          x="96"
          y="103"
          width="100"
          height="10"
          rx="3"
          fill={accent}
          fillOpacity="0.24"
          stroke={accent}
          strokeWidth="1.6"
        />
        {/* Cell grid ticks */}
        <line x1="116" y1="103" x2="116" y2="113" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
        <line x1="136" y1="103" x2="136" y2="113" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
        <line x1="156" y1="103" x2="156" y2="113" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
        <line x1="176" y1="103" x2="176" y2="113" stroke={accent} strokeWidth="1" strokeOpacity="0.7" />
        {/* Compact front/rear e-axle markers */}
        <circle
          cx="74"
          cy="106"
          r="5"
          fill={accent}
          fillOpacity="0.18"
          stroke={accent}
          strokeWidth="1.3"
        />
        <circle
          cx="218"
          cy="106"
          r="5"
          fill={accent}
          fillOpacity="0.18"
          stroke={accent}
          strokeWidth="1.3"
        />
        {/* Minimal lightning charge icon above battery */}
        <path
          d="M148 83 L142 91 L147 91 L144 98 L151 89 L146 89 Z"
          fill={accent}
          fillOpacity="0.9"
        />
      </g>
    );
  };

  return (
    <svg
      viewBox="0 0 296 146"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Subtle architectural drafting grid baseline & tick marks */}
      <line
        x1="14"
        y1="133"
        x2="282"
        y2="133"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.22"
      />
      <line
        x1="74"
        y1="26"
        x2="74"
        y2="137"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.1"
        strokeDasharray="2 3"
      />
      <line
        x1="218"
        y1="26"
        x2="218"
        y2="137"
        stroke="currentColor"
        strokeWidth="0.75"
        strokeOpacity="0.1"
        strokeDasharray="2 3"
      />

      {/* Body silhouette */}
      {renderBodyOutline()}

      {/* Powertrain cutaway */}
      {renderPowertrainCutaway()}

      {/* Front & rear wheel arches & sketched alloy spokes */}
      {[74, 218].map((cx) => (
        <g key={cx}>
          {/* Arch cutout */}
          <path
            d={`M${cx - 23} 118 A23 23 0 0 1 ${cx + 23} 118`}
            stroke="currentColor"
            strokeWidth="1.6"
            fill="var(--bg)"
            fillOpacity="0.65"
          />
          {/* Tire */}
          <circle
            cx={cx}
            cy="118"
            r="16.5"
            stroke="currentColor"
            strokeWidth="2.4"
            fill="var(--surface)"
          />
          {/* Rim */}
          <circle
            cx={cx}
            cy="118"
            r="10"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.72"
            fill="none"
          />
          {/* Hub + 5-spoke sketch */}
          <circle cx={cx} cy="118" r="2.6" fill="currentColor" fillOpacity="0.75" />
          <line x1={cx} y1="108" x2={cx} y2="128" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          <line x1={cx - 9.5} y1="115" x2={cx + 9.5} y2="121" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
          <line x1={cx - 6} y1="126" x2={cx + 6} y2="110" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
        </g>
      ))}
    </svg>
  );
}
