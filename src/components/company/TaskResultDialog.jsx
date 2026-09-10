import React from 'react';
import { FileCheck2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getDepartment, statusLabels } from '@/components/company/companyData';

export default function TaskResultDialog({ task, approval, logs, goal, onClose }) {
  const d=getDepartment(task.department),preview=approval?.preview_data || {};
  return <Dialog open onOpenChange={v=>!v&&onClose()}><DialogContent className="company-dialog result-dialog"><DialogHeader><span className="dialog-feature-icon" style={{color:d.color,background:d.pale}}><FileCheck2 size={24}/></span><DialogTitle>{task.title}</DialogTitle><DialogDescription>{goal?.title || '기존 목표'} · {d.name} · {task.assignee} · {statusLabels[task.status]}</DialogDescription></DialogHeader><section><h3>업무 내용</h3><p>{task.description}</p></section>{preview.subject&&<section><h3>실행 결과물</h3><b>{preview.subject}</b><p>{preview.body}</p></section>}{task.result&&<section><h3>저장소 기록</h3><p>{task.result}</p><div className="result-score">달성률 <strong>{task.progress_rate || task.progress || 0}%</strong> · {task.iteration || 1}회차</div></section>}<section><h3>실행 이력</h3><div className="result-logs">{logs.map(log=><div key={log.id}><b>{log.agent_name}</b><span>{log.message}</span><small>{new Date(log.created_date).toLocaleString('ko-KR')}</small></div>)}{!logs.length&&<p>아직 기록된 실행 로그가 없습니다.</p>}</div></section></DialogContent></Dialog>;
}