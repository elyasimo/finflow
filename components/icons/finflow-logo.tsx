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

  // Icon Only - Modern F with flow waves
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
        <linearGradient id="finflow-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle cx="24" cy="24" r="23" fill="url(#finflow-gradient)" opacity="0.1" />
      
      {/* Flow Waves (background) */}
      <path
        d="M8 28 Q14 24, 20 28 T32 28 T44 28"
        stroke="url(#finflow-gradient-light)"
        strokeWidth="2"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M8 34 Q14 30, 20 34 T32 34 T44 34"
        stroke="url(#finflow-gradient-light)"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      
      {/* Stylized F */}
      <path
        d="M16 12 L28 12 L28 15 L20 15 L20 22 L26 22 L26 25 L20 25 L20 36"
        stroke="url(#finflow-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Flowing Arrow */}
      <path
        d="M28 24 L34 24 L32 22 M34 24 L32 26"
        stroke="url(#finflow-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
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
