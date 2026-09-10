import React from 'react';
export default function OfficeScene({ department }) {
  const c = department.color, pale = department.pale;
  return <svg className="office-scene" viewBox="0 0 300 146" role="img" aria-label={`${department.name}의 직원 네 명이 있는 픽셀 오피스`} shapeRendering="crispEdges">
    <defs><pattern id={`floor-${department.id}`} width="24" height="16" patternUnits="userSpaceOnUse"><path d="M24 0H0v16" fill="none" stroke="#dcdce5" strokeWidth=".5"/></pattern></defs>
    <path d="M0 0h300v146H0z" fill="#eeeef4"/><path d="M0 0h300v58H0z" fill={pale}/><path d="M0 58h300v88H0z" fill={`url(#floor-${department.id})`}/><path d="M0 56h300v4H0z" fill="#d3d2df"/>
    {[30, 202].map(x => <g key={x}><path d={`M${x} 9h53v36h-53z`} fill="#d4d5e1"/><path d={`M${x+3} 12h47v29h-47z`} fill="#d6e9f0"/><path d={`M${x+5} 14h43v8h-43z`} fill="#edf5f7"/><path d={`M${x+25} 12h3v30h-3zM${x+3} 29h47v2h-47z`} fill="#fff"/></g>)}
    <path d="M122 11h48v30h-48z" fill="#fff"/><path d="M126 15h40v3h-40zM126 23h22v2h-22zM126 29h32v2h-32z" fill={c} opacity=".5"/>
    {[{x:36,y:65,v:0},{x:173,y:65,v:1},{x:60,y:112,v:2},{x:196,y:112,v:3}].map(({x,y,v}) => <g key={v}>
      <path d={`M${x+12} ${y-3}h20v20h-20z`} fill={c} opacity=".4"/><path d={`M${x+16} ${y+14}h13v4h-13z`} fill="#717088"/>
      <path d={`M${x} ${y-17}h66v22h-66z`} fill="#b7a49b"/><path d={`M${x} ${y-20}h66v21h-66z`} fill="#eee1cf"/><path d={`M${x+2} ${y+5}h3v6h-3zM${x+60} ${y+5}h3v6h-3z`} fill="#b4a69c"/>
      <path d={`M${x+18} ${y-33}h27v17h-27z`} fill="#666b80"/><path d={`M${x+20} ${y-31}h23v12h-23z`} fill="#b6c9dc"/><path d={`M${x+22} ${y-29}h11v2h-11zM${x+22} ${y-25}h18v1h-18z`} fill="#edf7ff"/><path d={`M${x+29} ${y-16}h5v3h-5zM${x+23} ${y-13}h17v2h-17z`} fill="#858695"/>
      <path d={`M${x+46} ${y-10}h5v6h-5z`} fill="#fff"/>
      <g transform={`translate(${x+17},${y-4})`}><path d="M3 0h11v3h2v9H2V3h1z" fill={['#4b3f51','#795641','#42485b','#b68661'][v]}/><path d="M4 7h10v6H4z" fill="#ecc8ac"/><path d="M3 13h13v9H3zM1 15h2v5H1zM16 15h2v5h-2z" fill={c}/><path d="M4 22h4v3H4zM11 22h4v3h-4z" fill="#535365"/>{v===0&&<path d="M3 -3h3v1h2v-2h3v2h2v-1h2v4H3z" fill="#e3b457"/>}</g>
    </g>)}
    {[9,276].map(x=><g key={x}><path d={`M${x} 113h12v15h-12z`} fill="#c5b5a1"/><path d={`M${x+5} 93h2v21h-2z`} fill="#649674"/><path d={`M${x} 94h6v10h-6zM${x+7} 99h7v9h-7zM${x+3} 88h7v10h-7z`} fill="#87b68b"/></g>)}
  </svg>;
}