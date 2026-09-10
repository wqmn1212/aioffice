import React, { useState } from 'react';
import { ArrowUp, Sparkles, LoaderCircle, CornerDownLeft } from 'lucide-react';
export default function CommandBar({ isDemo, onSetup, onAssign, onCreated }) {
  const [text,setText]=useState(''), [busy,setBusy]=useState(false), [error,setError]=useState('');
  async function submit(e) {
    e.preventDefault(); if(text.trim().length<3 || busy) return;
    if(isDemo){onSetup();return;}
    setBusy(true);setError('');
    try { const task=await onAssign(text.trim());setText('');onCreated(task); }
    catch(err){setError(err.response?.data?.error || err.message || '업무를 접수하지 못했습니다. 다시 시도해 주세요.');}
    finally{setBusy(false);}
  }
  return <div className="command-area"><form className="command-form" onSubmit={submit}><span className="command-icon"><Sparkles size={21}/></span><div className="command-input"><label htmlFor="ceo-command">대표님, 어떤 업무를 맡길까요?</label><input id="ceo-command" placeholder="예: 마케팅팀, 다음 주 SNS 콘텐츠 기획안을 준비해 줘" value={text} onChange={e=>setText(e.target.value)} maxLength={1500} disabled={busy}/></div><span className="command-enter"><CornerDownLeft size={13}/></span><button className="command-send" aria-label="업무 지시 보내기" disabled={busy || text.trim().length<3}>{busy?<LoaderCircle className="animate-spin" size={19}/>:<ArrowUp size={20}/>}</button></form>{error && <p className="form-error" role="alert">{error}</p>}<p className="command-hint">{busy ? '업무 내용을 분석하고 담당 부서를 배정하고 있어요…' : 'AI가 담당 부서를 찾아 대기 작업으로 등록해요. 외부 업무 자동 실행은 아직 연결되지 않았어요.'}</p></div>;
}