
import React from 'react';

export const AnalogCamera3D: React.FC<{ className?: string, style?: React.CSSProperties }> = ({ className, style }) => (
  <svg 
    width="300" 
    height="200" 
    viewBox="0 0 300 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    style={style}
  >
    {/* Body Base - Dark Grey */}
    <rect x="20" y="40" width="260" height="140" rx="20" fill="#333333" />
    <rect x="20" y="40" width="260" height="140" rx="20" fill="url(#grad-body)" fillOpacity="0.5" />

    {/* Top Plate - Metallic Silver */}
    <path d="M20 40H280V70H20V40Z" fill="#C0C0C0" />
    <path d="M20 40H280V70H20V40Z" fill="url(#grad-silver)" />

    {/* Leather Grip Texture */}
    <rect x="20" y="70" width="260" height="110" rx="20" fill="#1A1A1A" />
    <rect x="20" y="70" width="260" height="110" rx="20" fill="url(#pattern-leather)" fillOpacity="0.2" />

    {/* Lens Barrel Base */}
    <circle cx="150" cy="110" r="55" fill="#111111" stroke="#555555" strokeWidth="2" />
    
    {/* Lens Glass Reflection */}
    <circle cx="150" cy="110" r="45" fill="#1a237e" />
    <circle cx="150" cy="110" r="45" fill="url(#grad-lens)" fillOpacity="0.6" />
    <ellipse cx="135" cy="95" rx="15" ry="10" fill="white" fillOpacity="0.3" transform="rotate(-45 135 95)" />

    {/* Viewfinder */}
    <rect x="140" y="45" width="40" height="20" rx="2" fill="#111111" stroke="#333" strokeWidth="1" />
    <rect x="145" y="48" width="30" height="14" rx="1" fill="#444" />

    {/* Flash */}
    <rect x="230" y="45" width="40" height="20" rx="2" fill="#F0F0F0" stroke="#999" />
    <rect x="235" y="48" width="30" height="14" rx="1" fill="url(#grad-flash)" />

    {/* Shutter Button */}
    <circle cx="240" cy="35" r="12" fill="#B00000" />
    <circle cx="240" cy="35" r="12" fill="url(#grad-button)" fillOpacity="0.4" />
    <ellipse cx="236" cy="31" rx="4" ry="2" fill="white" fillOpacity="0.4" />

    {/* Dials */}
    <circle cx="60" cy="38" r="15" fill="#888" stroke="#555" />
    <rect x="58" y="23" width="4" height="30" fill="#333" />

    {/* Brand Label Area */}
    <rect x="35" y="80" width="60" height="15" rx="2" fill="#111" />
    <rect x="37" y="82" width="56" height="11" fill="#333" />

    {/* Definitions for Gradients */}
    <defs>
      <linearGradient id="grad-body" x1="20" y1="40" x2="280" y2="180" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#555" />
        <stop offset="1" stopColor="#111" />
      </linearGradient>
      <linearGradient id="grad-silver" x1="20" y1="40" x2="20" y2="70" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#E0E0E0" />
        <stop offset="0.5" stopColor="#F5F5F5" />
        <stop offset="1" stopColor="#A0A0A0" />
      </linearGradient>
      <radialGradient id="grad-lens" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(150 110) rotate(90) scale(45)">
        <stop offset="0" stopColor="#304FFE" stopOpacity="0" />
        <stop offset="0.8" stopColor="#000000" stopOpacity="0.5" />
        <stop offset="1" stopColor="#000000" />
      </radialGradient>
      <linearGradient id="grad-flash" x1="230" y1="45" x2="270" y2="65" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFF" />
        <stop offset="1" stopColor="#CCC" />
      </linearGradient>
      <radialGradient id="grad-button" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(240 35) rotate(90) scale(12)">
        <stop offset="0" stopColor="white" stopOpacity="0.5" />
        <stop offset="1" stopColor="black" stopOpacity="0.1" />
      </radialGradient>
      <pattern id="pattern-leather" patternUnits="userSpaceOnUse" width="4" height="4">
        <circle cx="2" cy="2" r="1" fill="#000" fillOpacity="0.3"/>
      </pattern>
    </defs>
  </svg>
);
