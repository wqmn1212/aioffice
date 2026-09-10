import React from 'react';
import { Layers3, LoaderCircle, CircleCheck, Bot } from 'lucide-react';
export default function StatsCards({ tasks, departmentCount }) {
  const running = tasks.filter(t => t.status === 'in_progress'), done = tasks.filter(t => t.status === 'completed');
  const active = new Set(running.map(t => `${t.department}-${t.assignee}`)).size;
  const items = [
    { label: '전체 작업', value: tasks.length, unit: '건', icon: Layers3, color: 'purple', note: `${tasks.filter(t=>t.status === 'queued').length}건의 작업이 배정을 기다려요` },
    { label: '진행 중인 작업', value: running.length, unit: '건', icon: LoaderCircle, color: 'blue', note: '각 부서에서 진행 중인 업무' },
    { label: '완료된 작업', value: done.length, unit: '건', icon: CircleCheck, color: 'green', note: `전체 작업의 ${tasks.length ? Math.round(done.length/tasks.length*100) : 0}% 완료` },
    { label: '업무 중인 에이전트', value: active, unit: `/ ${departmentCount*4}명`, icon: Bot, color: 'orange', note: `${departmentCount}개 부서 · 팀장 1명 + 팀원 3명` },
  ];
  return <section className="stats-grid" aria-label="업무 요약">{items.map(item=><div className="stat-card" key={item.label}><div className="stat-top"><span>{item.label}</span><span className={`stat-icon ${item.color}`}><item.icon size={18}/></span></div><div className="stat-value">{item.value}<small>{item.unit}</small></div><p><span className={`stat-bullet ${item.color}`}/>{item.note}</p></div>)}</section>;
}