import React, { useState } from 'react';
import { Check, RotateCcw, X, LoaderCircle } from 'lucide-react';
import PixelPerson from '@/components/company/PixelPerson';
import { getDepartment, statusLabels } from '@/components/company/companyData';

export default function KanbanCard({ task, approval, onDecision, onOpen }) {
  const [feedback,setFeedback]=useState(''),[revising,setRevising]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const d=getDepartment(task.department), preview=approval?.preview_data || {};
  async function decide(status){setBusy(status);setError('');try{await onDecision(approval.id,status,feedback);setRevising(false);}catch(err){setError(err.message || '결재를 처리하지 못했습니다.');}finally{setBusy('');}}
  return <article className="kanban-card" style={{borderTopColor:d.color}}>
    <button className="kanban-card-main" onClick={()=>onOpen(task)}><span className={`status-tag ${task.status}`}><i/>{statusLabels[task.status]}</span><h3>{task.title}</h3><p>{task.description}</p><span className="kanban-owner"><PixelPerson size={25} color={d.color} variant={Math.max(0,d.names.indexOf(task.assignee))}/><b>{task.assignee}</b><small>{d.name} · {task.iteration || 1}회차</small></span></button>
    {task.status==='pending_approval'&&approval?.status==='PENDING'&&<div className="approval-inline"><strong>결재안</strong><b>{preview.subject}</b><p>{preview.summary}</p><details><summary>이메일 본문 보기</summary><div>{preview.body}</div></details>{revising&&<textarea rows={3} value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="수정할 내용을 입력하세요."/>}<div className="approval-actions"><button className="approve" disabled={!!busy} onClick={()=>decide('APPROVED')}>{busy==='APPROVED'?<LoaderCircle className="animate-spin" size={13}/>:<Check size={13}/>}승인</button><button disabled={!!busy} onClick={()=>revising?decide('REVISION_REQUESTED'):setRevising(true)}><RotateCcw size={13}/>수정</button><button className="reject" disabled={!!busy} onClick={()=>decide('REJECTED')}><X size={13}/>반려</button></div>{error&&<p className="form-error">{error}</p>}</div>}
    {task.result&&<button className="result-preview" onClick={()=>onOpen(task)}><b>저장된 결과물</b><span>{task.result.slice(0,120)}{task.result.length>120?'…':''}</span></button>}
  </article>;
}