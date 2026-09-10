import React from 'react';
export default function PixelPerson({ color = '#8968d9', variant = 0, size = 36, className = '' }) {
  const hair = ['#493d51', '#72503b', '#343e53', '#ba8858'][variant % 4];
  return <svg width={size} height={size} viewBox="0 0 16 20" className={className} shapeRendering="crispEdges" aria-label="픽셀 직원" role="img">
    <ellipse cx="8" cy="19" rx="6" ry="1" fill="#293046" opacity=".12" />
    <path d="M4 2h8v2h1v6H3V4h1z" fill={hair}/><path d="M4 5h8v6H4zM6 11h4v2H6z" fill="#f0c8a5"/>
    <path d="M4 3h8v3H7V5H4z" fill={hair}/><path d="M5 7h1v1H5zM10 7h1v1h-1z" fill="#343043"/>
    <path d="M4 12h8v5H4zM2 13h2v3H2zM12 13h2v3h-2z" fill={color}/><path d="M7 12h2v3H7z" fill="#fff" opacity=".85"/>
    <path d="M4 17h3v2H4zM9 17h3v2H9z" fill="#3e4259"/><path d="M2 16h2v1H2zM12 16h2v1h-2z" fill="#f0c8a5"/>
    {variant === 0 && <path d="M4 0h2v1h1V0h2v1h1V0h2v2H4z" fill="#e3b75b"/>}
  </svg>;
}