/**
 * Paisaje original de cafetal al amanecer, dibujado en SVG (sin imágenes externas).
 * Se estira para cubrir su contenedor; el contenedor debe ser `relative`.
 */
export function CoffeeLandscape() {
  const rows = Array.from({ length: 9 }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="cl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1d2e" />
          <stop offset="0.45" stopColor="#8a3f3a" />
          <stop offset="0.75" stopColor="#e08b4a" />
          <stop offset="1" stopColor="#f6c97e" />
        </linearGradient>
        <radialGradient id="cl-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff3c9" stopOpacity="1" />
          <stop offset="0.35" stopColor="#ffd88a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cl-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6c97e" stopOpacity="0" />
          <stop offset="1" stopColor="#f6c97e" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#cl-sky)" />
      <circle cx="820" cy="470" r="230" fill="url(#cl-sun)" />
      <circle cx="820" cy="470" r="58" fill="#fff0c0" />

      {/* Montañas lejanas */}
      <path
        d="M0 520 L110 430 L200 490 L330 380 L450 480 L560 420 L690 510 L800 440 L930 500 L1060 410 L1200 490 L1200 800 L0 800 Z"
        fill="#6b3a3f"
        opacity="0.75"
      />
      <path
        d="M0 570 L140 500 L260 555 L400 470 L520 550 L650 490 L780 565 L920 505 L1050 560 L1200 500 L1200 800 L0 800 Z"
        fill="#4a2f36"
      />
      <rect y="480" width="1200" height="140" fill="url(#cl-mist)" />

      {/* Colinas con cafetales en terrazas */}
      <path
        d="M0 610 C200 550 360 600 560 575 C760 550 960 600 1200 560 L1200 800 L0 800 Z"
        fill="#3a4a2c"
      />
      <path
        d="M0 690 C220 630 420 690 640 655 C860 620 1020 680 1200 640 L1200 800 L0 800 Z"
        fill="#2c3b22"
      />
      {rows.map((i) => {
        const y = 640 + i * 18;
        return (
          <path
            key={i}
            d={`M0 ${y + 24} C260 ${y - 22} 520 ${y + 26} 760 ${y - 6} C940 ${y - 28} 1080 ${y + 10} 1200 ${y - 8}`}
            fill="none"
            stroke="#6f8a45"
            strokeOpacity={0.35 + i * 0.05}
            strokeWidth={2 + i * 0.7}
            strokeLinecap="round"
            strokeDasharray={`${6 + i * 2} ${5 + i}`}
          />
        );
      })}

      {/* Rama de cafeto en primer plano */}
      <g transform="translate(-20 560) rotate(-8)">
        <path
          d="M0 220 C140 160 260 120 420 110"
          fill="none"
          stroke="#1d2a17"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {[
          [90, 160, -25],
          [170, 130, 20],
          [250, 105, -30],
          [330, 95, 15],
          [140, 190, 35],
          [230, 150, 30],
          [310, 128, 40],
        ].map(([x, y, r], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="46"
            ry="16"
            transform={`rotate(${r} ${x} ${y})`}
            fill={i % 2 === 0 ? "#26381d" : "#304826"}
          />
        ))}
        {[
          [120, 182],
          [128, 196],
          [205, 150],
          [214, 163],
          [292, 128],
          [284, 142],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="8"
            fill={i % 3 === 0 ? "#d9a03a" : "#b3262e"}
          />
        ))}
      </g>
    </svg>
  );
}
