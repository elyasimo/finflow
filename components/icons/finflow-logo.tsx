import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

export const FinflowLogo: React.FC<LogoProps> = ({
  className = '',
  variant = 'full',
  size = 'md',
}) => {
  const sizes = {
    sm: { height: '24', width: '24', textHeight: '24' },
    md: { height: '32', width: '32', textHeight: '32' },
    lg: { height: '48', width: '48', textHeight: '48' },
  };

  const currentSize = sizes[size];

  // Icon Only - Modern FF Logo with flow effect
  const IconSvg = () => (
    <svg
      width={currentSize.width}
      height={currentSize.height}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="finflow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="finflow-gradient-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      {/* Glow effect background */}
      <circle cx="24" cy="24" r="22" fill="url(#finflow-gradient-glow)" />
      
      {/* First F - Bold and Modern */}
      <path
        d="M14 10 L26 10 L26 13 L18 13 L18 21 L24 21 L24 24 L18 24 L18 36"
        stroke="url(#finflow-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Second F - Overlapping with flow effect */}
      <path
        d="M22 12 L34 12 L34 15 L26 15 L26 23 L32 23 L32 26 L26 26 L26 38"
        stroke="url(#finflow-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      
      {/* Flow lines connecting the F's */}
      <path
        d="M20 18 Q22 18, 24 16"
        stroke="url(#finflow-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M20 28 Q23 28, 26 26"
        stroke="url(#finflow-gradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );

  // Text Only
  const TextSvg = () => (
    <svg
      height={currentSize.textHeight}
      viewBox="0 0 120 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="text-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="24"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="24"
        fontWeight="700"
        fill="url(#text-gradient)"
        className="dark:fill-white"
      >
        Finflow
      </text>
    </svg>
  );

  // Full Logo - Icon + Text
  const FullLogo = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      <IconSvg />
      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 bg-clip-text text-transparent">
        Finflow
      </span>
    </div>
  );

  if (variant === 'icon') return <IconSvg />;
  if (variant === 'text') return <TextSvg />;
  return <FullLogo />;
};

// Convenience exports
export const FinflowIcon = (props: Omit<LogoProps, 'variant'>) => (
  <FinflowLogo {...props} variant="icon" />
);

export const FinflowText = (props: Omit<LogoProps, 'variant'>) => (
  <FinflowLogo {...props} variant="text" />
);

export default FinflowLogo;
