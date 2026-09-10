import React from 'react';
import { LayoutDashboard, ListTodo, Users, Plug, Settings2, ChevronDown, ArrowUpRight, Building2, Boxes } from 'lucide-react';
import PixelPerson from '@/components/company/PixelPerson';
const items = [{ id: 'dashboard', label: '대시보드', icon: LayoutDashboard }, { id: 'tasks', label: '전체 작업', icon: ListTodo }, { id: 'agents', label: '에이전트', icon: Users }];
export default function Sidebar({ company, page, onPage, onSetup, onConnections, taskCount, isDemo }) {
  return <aside className="company-sidebar">
    <a className="brand" href="/" aria-label="픽셀 컴퍼니 홈"><span className="brand-mark"><Boxes size={24}/></span><span>pixel company<span className="brand-dot">.</span></span></a>
    <button className="workspace-switch" onClick={onSetup}><span className="workspace-icon"><Building2 size={19}/></span><span><strong>{company?.name || '내 회사'}</strong><small>나의 AI 워크스페이스</small></span><ChevronDown size={15}/></button>
    <span className="nav-caption">WORKSPACE</span>
    <nav>{items.map(item => <button key={item.id} onClick={() => onPage(item.id)} className={`nav-item ${page === item.id ? 'active' : ''}`}><item.icon size={18}/><span>{item.label}</span>{item.id === 'tasks' && <span className="nav-count">{taskCount}</span>}{item.id === 'dashboard' && page === item.id && <i/>}</button>)}</nav>
    <span className="nav-caption settings-caption">MANAGEMENT</span>
    <button className="nav-item" onClick={onConnections}><Plug size={18}/><span>외부 서비스 연동</span><span className="tiny-new">준비</span></button>
    <button className="nav-item" onClick={onSetup}><Settings2 size={18}/><span>회사 설정</span></button>
    <div className="sidebar-bottom"><div className="ceo-tip"><span className="tip-spark">✦</span><strong>작은 픽셀, 무한한 가능성</strong><p>대표님은 아이디어에 집중하세요.<br/>업무는 팀과 함께 정리해요.</p><button onClick={isDemo ? onSetup : onConnections}>{isDemo ? '내 회사 시작하기' : '연동 상태 확인하기'}<ArrowUpRight size={15}/></button></div>
    <div className="ceo-profile"><span className="ceo-avatar"><PixelPerson size={33} color="#62677c"/></span><div><strong>대표님</strong><small>CEO · 워크스페이스 오너</small></div><span className="owner-dot"/></div></div>
  </aside>;
}