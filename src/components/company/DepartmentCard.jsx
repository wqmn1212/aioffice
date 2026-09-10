import React from 'react';
import { ArrowUpRight, TrendingUp, Megaphone, Code2, Palette, Users, BriefcaseBusiness } from 'lucide-react';
import OfficeScene from '@/components/company/OfficeScene';
import PixelPerson from '@/components/company/PixelPerson';
const icons = { TrendingUp, Megaphone, Code2, Palette, Users, BriefcaseBusiness };
export default function DepartmentCard({ department: d, tasks, onSelect, view }) {
  const running = tasks.filter(t=>t.status === 'in_progress'), completed = tasks.filter(t=>t.status === 'completed').length;
  const active = new Set(running.map(t=>t.assignee)).size;
  const Icon = icons[d.icon];
  return <button className={`department-card ${view === 'list' ? 'compact-department' : ''}`} onClick={()=>onSelect(d.id)}>
    <div className="department-head"><span className="department-icon" style={{background:d.pale,color:d.color}}><Icon size={17}/></span><strong>{d.name}</strong><span className={`team-status ${running.length ? 'working' : ''}`}><i/>{running.length ? '업무 중' : '대기 중'}</span></div>
    {view === 'office' && <OfficeScene department={d}/>}
    <div className="department-info"><div className="department-task-count"><span>진행 중 <strong>{running.length}</strong></span><span>완료 <strong>{completed}</strong></span><ArrowUpRight size={15}/></div><div className="department-progress"><span style={{width: `${tasks.length ? completed/tasks.length*100 : 0}%`,background:d.color}}/></div><div className="department-people"><span className="avatar-stack">{d.names.map((name,i)=><span key={name} style={{background:d.pale}} title={`${name} · ${d.roles[i]}`}><PixelPerson size={25} variant={i} color={d.color}/></span>)}</span><small><b style={{color:d.color}}>{active}</b> / 4명 업무 중</small></div></div>
  </button>;
}