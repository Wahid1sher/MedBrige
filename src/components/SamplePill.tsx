import { useId } from 'react';

export type SamplePillAppearance = 'round-white' | 'oval-peach' | 'capsule-blue';
const descriptions: Record<SamplePillAppearance, string> = {
  'round-white': 'Small, round white tablet with a score line',
  'oval-peach': 'Medium, oval peach tablet with a score line',
  'capsule-blue': 'Large, blue and ivory capsule',
};

/** Fictional artwork only. Never infer a real medicine's appearance from its name or dose. */
export function SamplePill({ appearance }: { readonly appearance: SamplePillAppearance }) {
  const id = useId();
  const surface = `${id}-surface`,
    edge = `${id}-edge`,
    shadow = `${id}-shadow`;
  const round = appearance === 'round-white',
    oval = appearance === 'oval-peach';
  return (
    <figure className={`sample-pill sample-pill-${appearance}`}>
      <div className="sample-pill-stage">
        <svg
          viewBox="0 0 220 120"
          role="img"
          aria-label={`${descriptions[appearance]}. Fictional sample illustration.`}
        >
          <defs>
            <linearGradient
              id={surface}
              x1="0"
              y1="0"
              x2={round || oval ? '0.3' : '1'}
              y2={round || oval ? '1' : '0'}
            >
              {round ? (
                <>
                  <stop stopColor="#FFFFFF" />
                  <stop offset=".55" stopColor="#F7F6F1" />
                  <stop offset="1" stopColor="#E4E2DA" />
                </>
              ) : oval ? (
                <>
                  <stop stopColor="#FFE1C2" />
                  <stop offset=".5" stopColor="#F7C9A0" />
                  <stop offset="1" stopColor="#DEA178" />
                </>
              ) : (
                <>
                  <stop stopColor="#FFFFFF" />
                  <stop offset=".499" stopColor="#EAE8DF" />
                  <stop offset=".5" stopColor="#79B4DD" />
                  <stop offset="1" stopColor="#3F80B6" />
                </>
              )}
            </linearGradient>
            <linearGradient id={edge} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={oval ? '#D8A17D' : '#C7C8C2'} />
              <stop offset="1" stopColor={oval ? '#C78E6A' : '#B0B6B8'} />
            </linearGradient>
            <radialGradient id={shadow}>
              <stop stopColor="#665E4F" stopOpacity=".19" />
              <stop offset="1" stopColor="#665E4F" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="111" cy="101" rx={round ? 39 : 61} ry="10" fill={`url(#${shadow})`} />
          {round ? (
            <g transform="rotate(-19 110 56)">
              <ellipse cx="110" cy="62" rx="32" ry="27" fill={`url(#${edge})`} />
              <ellipse
                cx="110"
                cy="56"
                rx="32"
                ry="27"
                fill={`url(#${surface})`}
                stroke="#CFD0C9"
                strokeWidth=".8"
              />
              <ellipse
                cx="110"
                cy="55"
                rx="28.5"
                ry="23.5"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity=".85"
                strokeWidth=".8"
              />
              <path d="M110 33V79" stroke="#C2C3BB" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M111.7 34V78" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
              <path
                d="M88 43Q95 34 103 34"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : oval ? (
            <g transform="rotate(-26 110 58)">
              <rect x="59" y="44" width="102" height="37" rx="18.5" fill={`url(#${edge})`} />
              <rect
                x="59"
                y="37"
                width="102"
                height="37"
                rx="18.5"
                fill={`url(#${surface})`}
                stroke="#D5A37E"
                strokeWidth=".8"
              />
              <rect
                x="62"
                y="39.5"
                width="96"
                height="31"
                rx="15.5"
                fill="none"
                stroke="#FFF1DB"
                strokeOpacity=".8"
                strokeWidth=".8"
              />
              <path d="M110 40V71" stroke="#C28F6C" strokeWidth="2.3" strokeLinecap="round" />
              <path d="M111.6 40V71" stroke="#FFE8CC" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M76 42H99" stroke="#FFF1DB" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : (
            <g transform="rotate(-29 110 57)">
              <rect x="54" y="43" width="112" height="39" rx="19.5" fill="#3D719B" opacity=".6" />
              <rect
                x="54"
                y="36"
                width="112"
                height="39"
                rx="19.5"
                fill={`url(#${surface})`}
                stroke="#A1B5C3"
                strokeWidth=".8"
              />
              <path d="M111 37V74" stroke="#748D9D" strokeWidth="1.3" />
              <path d="M114 38V73" stroke="#ACD3EE" strokeWidth="1" strokeOpacity=".8" />
              <path
                d="M73 41H102"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                opacity=".9"
              />
              <path
                d="M120 41H145"
                stroke="#BFE0F3"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity=".8"
              />
              <path
                d="M61 64Q65 72 75 72H103"
                stroke="#C8C8BF"
                strokeWidth="1"
                opacity=".7"
                fill="none"
              />
            </g>
          )}
        </svg>
      </div>
      <figcaption>
        <span>
          {round ? 'Small round tablet' : oval ? 'Medium oval tablet' : 'Large two-tone capsule'}
        </span>
        <small>Illustration · not for pill identification</small>
      </figcaption>
    </figure>
  );
}
