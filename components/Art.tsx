export function Garden() {
  return (
    <svg
      className="garden"
      viewBox="0 0 440 280"
      role="img"
      aria-label="A growing plant beside books and a rising sun"
    >
      <defs>
        <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#c3d6bd" />
        </pattern>
      </defs>
      <rect width="440" height="280" fill="url(#dots)" />
      <circle cx="332" cy="68" r="35" fill="#efbd62" />
      <path d="M23 237Q130 170 238 220T440 226V280H0Z" fill="#d5e2ce" />
      <path
        d="M222 234V114"
        stroke="#245341"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M221 176C164 179 143 145 160 125c37-5 63 22 61 51"
        fill="#5d8b65"
      />
      <path d="M223 144c-2-46 28-72 58-63 10 33-16 62-58 63" fill="#8eae74" />
      <path d="M220 207c1-37 26-55 53-49 7 28-19 47-53 49" fill="#346d4f" />
      <path d="M196 227h53l-10 43h-32Z" fill="#ca7255" />
      <rect x="73" y="226" width="87" height="17" rx="4" fill="#e2ae55" />
      <rect x="84" y="207" width="75" height="17" rx="4" fill="#e8d8b2" />
      <rect x="69" y="245" width="94" height="17" rx="4" fill="#557969" />
      <path
        d="M312 205q12-28 24 0q12-28 24 0"
        fill="none"
        stroke="#557969"
        strokeWidth="3"
      />
      <circle cx="103" cy="65" r="4" fill="#c77753" />
      <path
        d="M68 109h16m-8-8v16M374 155h12m-6-6v12"
        stroke="#8ea97d"
        strokeWidth="2"
      />
    </svg>
  );
}
export function Arrow({ turn, label }: { turn: number; label: string }) {
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label}>
      <path
        d="M50 15 78 46H61V84H39V46H22Z"
        transform={`rotate(${turn * 90} 50 50)`}
        fill="#315f4d"
      />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#d5dfd0"
        strokeWidth="1"
      />
    </svg>
  );
}
export function Icon({ name }: { name: string }) {
  const content: Record<string, React.ReactNode> = {
    Mathematics: (
      <>
        <path d="M7 8h7m-3.5-3.5v7M21 8h8M7 24h7m7-3h8m-8 6h8" />
      </>
    ),
    English: (
      <>
        <path d="M18 9Q10 4 4 8v21q7-4 14 1 7-5 14-1V8q-6-4-14 1v21Z" />
      </>
    ),
    "Verbal Reasoning": (
      <>
        <path d="M5 7h26v18H17l-7 6v-6H5Z" />
        <path d="M11 13h14m-14 6h9" />
      </>
    ),
    "Quantitative Reasoning": (
      <>
        <circle cx="9" cy="10" r="4" />
        <circle cx="27" cy="10" r="4" />
        <circle cx="18" cy="27" r="4" />
        <path d="m12 13 4 10m8-10-4 10m-7-13h10" />
      </>
    ),
    "General Paper": (
      <>
        <path d="M17 31V14m0 8C4 23 2 13 6 9c9 0 12 5 11 13Zm1-6C16 6 23 2 30 4c2 9-5 14-12 12Z" />
      </>
    ),
    "Non-Verbal Reasoning": (
      <>
        <path d="M4 5h12v12H4Z M25 4l8 14H17Z" />
        <circle cx="10" cy="27" r="6" />
        <path d="m25 21 7 7-7 7-7-7Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 36 36"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {content[name] || content.Mathematics}
    </svg>
  );
}
