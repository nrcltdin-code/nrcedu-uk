// Illustration for the 404 page: a paper plane that has looped off course around a globe,
// with a dashed flight path and a map pin with a question mark. Brand colours only.
export function LostIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 320" className={className} role="img" aria-labelledby="lost-title">
      <title id="lost-title">A paper plane that has lost its way around the globe</title>
      <defs>
        <linearGradient id="lost-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5499d1" />
          <stop offset="1" stopColor="#174c80" />
        </linearGradient>
        <linearGradient id="lost-land" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#17677f" />
        </linearGradient>
        <linearGradient id="lost-pin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </linearGradient>
        <clipPath id="lost-globe-clip">
          <circle cx="240" cy="178" r="96" />
        </clipPath>
      </defs>

      {/* Soft halo and ground shadow */}
      <circle cx="240" cy="178" r="128" fill="#8abbe2" opacity="0.18" />
      <ellipse cx="240" cy="296" rx="110" ry="10" fill="#123453" opacity="0.1" />

      {/* Globe */}
      <circle cx="240" cy="178" r="96" fill="url(#lost-globe)" />
      <g clipPath="url(#lost-globe-clip)">
        <path d="M150 120c22-14 44-10 58 4s10 30 28 34 30-8 42 6-2 34-24 38-30 18-52 12-30-30-46-38-26-40-6-56z" fill="url(#lost-land)" opacity="0.95" />
        <path d="M262 92c18-6 40 0 50 14s2 26 14 34 26 6 28 22-16 22-30 16-18-20-34-22-24-14-22-30 0-30-6-34z" fill="url(#lost-land)" opacity="0.9" />
        <path d="M206 236c14-6 30-2 38 8s-4 22-20 22-30-20-18-30z" fill="url(#lost-land)" opacity="0.85" />
        {/* Latitude and longitude lines */}
        <g fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.5">
          <ellipse cx="240" cy="178" rx="96" ry="32" />
          <ellipse cx="240" cy="178" rx="36" ry="96" />
          <line x1="144" y1="178" x2="336" y2="178" />
        </g>
        {/* Shine */}
        <circle cx="206" cy="132" r="54" fill="#ffffff" opacity="0.1" />
      </g>

      {/* Looping dashed flight path */}
      <path
        d="M60 250C90 150 170 60 250 52c70-7 122 34 112 78-9 40-70 44-80 10-9-30 30-58 74-56 46 2 74 26 80 52"
        fill="none"
        stroke="#1b5e9e"
        strokeOpacity="0.5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />

      {/* Paper plane at the end of the path */}
      <g transform="translate(424 186) rotate(28)">
        <path d="M-30 -14L26 0L-30 14L-18 0z" fill="#ffffff" stroke="#123453" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M-18 0L26 0L-24 8z" fill="#dbeaf7" stroke="#123453" strokeWidth="2.5" strokeLinejoin="round" />
      </g>

      {/* Map pin with a question mark, stuck in the globe */}
      <g transform="translate(298 92)">
        <path d="M0 -38c-17 0-30 13-30 29 0 22 30 47 30 47s30-25 30-47c0-16-13-29-30-29z" fill="url(#lost-pin)" stroke="#123453" strokeWidth="2.5" />
        <text x="0" y="1" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="30" fontWeight="800" fill="#123453">?</text>
      </g>

      {/* Little stars */}
      <g fill="#f59e0b">
        <path d="M96 70l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M400 60l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" opacity="0.8" />
        <path d="M120 200l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity="0.7" />
      </g>
    </svg>
  );
}
