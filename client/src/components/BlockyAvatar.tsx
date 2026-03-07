import React from "react";

type AvatarConfig = {
  skinColor: string;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  equippedItems?: number[];
};

type Props = {
  config: AvatarConfig;
  size?: number;
  animate?: boolean;
  className?: string;
  hat?: string | null;
  accessory?: string | null;
};

const DEFAULT_CONFIG: AvatarConfig = {
  skinColor: "#FDBCB4",
  hairColor: "#4A2C2A",
  shirtColor: "#4169E1",
  pantsColor: "#4682B4",
};

export default function BlockyAvatar({
  config = DEFAULT_CONFIG,
  size = 120,
  animate = false,
  className = "",
  hat = null,
  accessory = null,
}: Props) {
  const scale = size / 120;
  const animClass = animate ? "animate-bounce-slow" : "";

  return (
    <div
      className={`inline-block ${animClass} ${className}`}
      style={{ width: size, height: size * 1.4 }}
    >
      <svg
        viewBox="0 0 120 168"
        width={size}
        height={size * 1.4}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="60" cy="162" rx="28" ry="5" fill="rgba(0,0,0,0.15)" />

        {/* Legs */}
        <rect x="34" y="110" width="22" height="44" rx="4" fill={config.pantsColor} />
        <rect x="64" y="110" width="22" height="44" rx="4" fill={config.pantsColor} />
        {/* Leg shading */}
        <rect x="34" y="110" width="8" height="44" rx="4" fill="rgba(0,0,0,0.1)" />
        <rect x="64" y="110" width="8" height="44" rx="4" fill="rgba(0,0,0,0.1)" />
        {/* Shoes */}
        <rect x="30" y="148" width="28" height="14" rx="5" fill="#2C1810" />
        <rect x="62" y="148" width="28" height="14" rx="5" fill="#2C1810" />

        {/* Body */}
        <rect x="28" y="68" width="64" height="48" rx="6" fill={config.shirtColor} />
        {/* Body shading */}
        <rect x="28" y="68" width="18" height="48" rx="6" fill="rgba(0,0,0,0.1)" />
        {/* Shirt details */}
        <rect x="52" y="72" width="16" height="4" rx="2" fill="rgba(255,255,255,0.3)" />

        {/* Arms */}
        <rect x="6" y="70" width="20" height="42" rx="6" fill={config.shirtColor} />
        <rect x="94" y="70" width="20" height="42" rx="6" fill={config.shirtColor} />
        {/* Arm shading */}
        <rect x="6" y="70" width="7" height="42" rx="6" fill="rgba(0,0,0,0.1)" />
        <rect x="94" y="70" width="7" height="42" rx="6" fill="rgba(0,0,0,0.1)" />
        {/* Hands */}
        <rect x="4" y="108" width="24" height="16" rx="6" fill={config.skinColor} />
        <rect x="92" y="108" width="24" height="16" rx="6" fill={config.skinColor} />

        {/* Neck */}
        <rect x="50" y="58" width="20" height="14" rx="3" fill={config.skinColor} />

        {/* Head */}
        <rect x="22" y="12" width="76" height="56" rx="10" fill={config.skinColor} />
        {/* Head shading */}
        <rect x="22" y="12" width="20" height="56" rx="10" fill="rgba(0,0,0,0.06)" />
        {/* Head highlight */}
        <rect x="30" y="16" width="12" height="8" rx="4" fill="rgba(255,255,255,0.2)" />

        {/* Eyes */}
        <rect x="36" y="30" width="16" height="14" rx="4" fill="white" />
        <rect x="68" y="30" width="16" height="14" rx="4" fill="white" />
        {/* Pupils */}
        <rect x="41" y="33" width="8" height="8" rx="3" fill="#1a1a2e" />
        <rect x="73" y="33" width="8" height="8" rx="3" fill="#1a1a2e" />
        {/* Eye shine */}
        <rect x="43" y="34" width="3" height="3" rx="1" fill="white" />
        <rect x="75" y="34" width="3" height="3" rx="1" fill="white" />

        {/* Smile */}
        <path
          d="M 44 52 Q 60 62 76 52"
          stroke="#c0392b"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Cheeks */}
        <ellipse cx="35" cy="50" rx="8" ry="5" fill="rgba(255,100,100,0.25)" />
        <ellipse cx="85" cy="50" rx="8" ry="5" fill="rgba(255,100,100,0.25)" />

        {/* Hair */}
        <rect x="22" y="8" width="76" height="20" rx="8" fill={config.hairColor} />
        <rect x="22" y="8" width="14" height="32" rx="6" fill={config.hairColor} />
        <rect x="84" y="8" width="14" height="32" rx="6" fill={config.hairColor} />

        {/* Hat overlay */}
        {hat === "cowboy" && (
          <>
            <rect x="18" y="2" width="84" height="12" rx="4" fill="#8B4513" />
            <rect x="28" y="-8" width="64" height="18" rx="6" fill="#A0522D" />
          </>
        )}
        {hat === "crown" && (
          <>
            <polygon points="30,8 45,-4 60,2 75,-4 90,8" fill="#FFD700" />
            <rect x="30" y="6" width="60" height="10" rx="3" fill="#FFD700" />
            <circle cx="45" cy="2" r="4" fill="#FF4444" />
            <circle cx="60" cy="0" r="4" fill="#4444FF" />
            <circle cx="75" cy="2" r="4" fill="#44FF44" />
          </>
        )}
        {hat === "wizard" && (
          <>
            <polygon points="60,-20 35,10 85,10" fill="#4B0082" />
            <rect x="28" y="8" width="64" height="8" rx="3" fill="#6A0DAD" />
            <circle cx="60" cy="-8" r="5" fill="#FFD700" />
          </>
        )}
        {hat === "helmet" && (
          <>
            <rect x="20" y="2" width="80" height="22" rx="8" fill="#C0C0C0" />
            <rect x="35" y="6" width="50" height="10" rx="3" fill="rgba(100,200,255,0.5)" />
          </>
        )}

        {/* Accessory overlay */}
        {accessory === "glasses" && (
          <>
            <rect x="32" y="28" width="20" height="18" rx="5" fill="none" stroke="#333" strokeWidth="2.5" />
            <rect x="68" y="28" width="20" height="18" rx="5" fill="none" stroke="#333" strokeWidth="2.5" />
            <line x1="52" y1="37" x2="68" y2="37" stroke="#333" strokeWidth="2.5" />
            <line x1="22" y1="37" x2="32" y2="37" stroke="#333" strokeWidth="2.5" />
            <line x1="88" y1="37" x2="98" y2="37" stroke="#333" strokeWidth="2.5" />
          </>
        )}
        {accessory === "backpack" && (
          <>
            <rect x="88" y="72" width="22" height="34" rx="5" fill="#FF6347" />
            <rect x="90" y="76" width="18" height="10" rx="3" fill="rgba(255,255,255,0.3)" />
            <rect x="93" y="90" width="12" height="3" rx="1" fill="rgba(255,255,255,0.4)" />
          </>
        )}
        {accessory === "cape" && (
          <>
            <path d="M 28 72 Q 10 100 18 154 L 28 150 Q 20 110 28 90 Z" fill="#8B0000" opacity="0.9" />
            <path d="M 92 72 Q 110 100 102 154 L 92 150 Q 100 110 92 90 Z" fill="#8B0000" opacity="0.9" />
          </>
        )}
        {accessory === "wings" && (
          <>
            <path d="M 28 80 Q -10 50 -5 100 Q 10 90 28 100 Z" fill="#FFFACD" opacity="0.9" />
            <path d="M 92 80 Q 130 50 125 100 Q 110 90 92 100 Z" fill="#FFFACD" opacity="0.9" />
          </>
        )}
      </svg>
    </div>
  );
}
