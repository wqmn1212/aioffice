import React from 'react';
import { Activity } from 'lucide-react';
import { getDepartment } from '@/components/company/companyData';

export default function AgentLogFeed({ logs, tasks, onTask, isDemo }) {
  const recent=[...logs].sort((a,b)=>new Date(b.created_date)-new Date(a.created_date)).slice(0,12);
  return <section className="panel log-panel"><div className="section-heading"><div><h2>실시간 에이전트 로그</h2><p>팀장 에이전트의 분석·실행·결재 진행 상황입니다.</p></div><Activity size={16}/></div><div className="log-feed">{recent.map(log=>{const task=tasks.find(t=>t.id===log.task_id),d=getDepartment(log.department);return <button key={log.id} onClick={()=>task&&onTask(task)}><span className={`log-level ${log.level}`}>{log.level}</span><div><b>{log.agent_name} · {d.name}</b><p>{log.message}</p><small>{new Date(log.created_date).toLocaleString('ko-KR')}</small></div></button>})}{!recent.length&&<div className="empty-state"><Activity size={25}/><p>{isDemo?'내 회사를 만들면 실행 로그가 표시돼요.':'업무가 실행되면 진행 로그가 여기에 쌓입니다.'}</p></div>}</div></section>;
}