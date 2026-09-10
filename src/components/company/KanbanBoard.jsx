import React from 'react';
import { Target, Inbox } from 'lucide-react';
import KanbanCard from '@/components/company/KanbanCard';

export default function KanbanBoard({ goals, tasks, approvals, onDecision, onOpen }) {
  const columns=[...goals];
  if(tasks.some(t=>!goals.some(g=>g.id===t.goal_id))) columns.push({id:'legacy',title:'기존 업무',description:'목표 연결 전 등록된 업무'});
  const latestApproval=taskId=>approvals.filter(a=>a.task_id===taskId).sort((a,b)=>new Date(b.created_date)-new Date(a.created_date))[0];
  return <section className="kanban-section"><div className="section-heading"><div><h2>목표별 업무 보드 <span className="heading-count">{tasks.length}</span></h2><p>회사와 부서의 목표마다 담당자, 진행 상태, 결과물을 확인하세요.</p></div></div>
    {!columns.length?<div className="panel empty-state"><Inbox size={28}/><strong>등록된 목표가 없어요</strong><p>아래 지시창에서 첫 목표를 입력해 주세요.</p></div>:<div className="kanban-board">{columns.map(goal=>{const items=tasks.filter(t=>goal.id==='legacy'?!t.goal_id:t.goal_id===goal.id);return <div className="kanban-column" key={goal.id}><header><span><Target size={15}/></span><div><h3>{goal.title}</h3><p>{goal.description}</p></div><b>{items.length}</b></header><div className="kanban-cards">{items.map(task=><KanbanCard key={task.id} task={task} approval={latestApproval(task.id)} onDecision={onDecision} onOpen={onOpen}/>)}{!items.length&&<div className="kanban-empty">아직 연결된 업무가 없어요.</div>}</div></div>})}</div>}
  </section>;
}