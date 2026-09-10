import React, { useState } from 'react';
import { Plus, Settings2, ChevronRight, Sun, Menu, LoaderCircle } from 'lucide-react';
import useCompanyStore from '@/components/company/useCompanyStore';
import Sidebar from '@/components/company/Sidebar';
import StatsCards from '@/components/company/StatsCards';
import DashboardContent from '@/components/company/DashboardContent';
import KanbanBoard from '@/components/company/KanbanBoard';
import AgentDirectory from '@/components/company/AgentDirectory';
import CommandBar from '@/components/company/CommandBar';
import SetupDialog from '@/components/company/SetupDialog';
import TaskResultDialog from '@/components/company/TaskResultDialog';
import ConnectionsDialog from '@/components/company/ConnectionsDialog';
import '@/components/company/company.css';
const pageNames={dashboard:'대시보드',tasks:'목표별 칸반',agents:'에이전트'};
export default function Dashboard() {
  const store=useCompanyStore();
  const [draft,setDraft]=useState('');
  const [page,setPage]=useState('dashboard'),[taskFilter,setTaskFilter]=useState('all'),[setup,setSetup]=useState(false),[connections,setConnections]=useState(false),[task,setTask]=useState(null),[mobile,setMobile]=useState(false);
  function changePage(value){setPage(value);setTaskFilter('all');setMobile(false);window.scrollTo({top:0});}
  function openDepartment(id){setTaskFilter(id);setPage('tasks');window.scrollTo({top:0});}
  function focusCommand(){document.getElementById('ceo-command')?.focus();}
  const departmentIds=store.company?.departments || [];
  return <div className="pixel-company"><div className={`sidebar-container ${mobile?'open':''}`}><Sidebar company={store.company} page={page} onPage={changePage} onSetup={()=>{setSetup(true);setMobile(false);}} onConnections={()=>{setConnections(true);setMobile(false);}} taskCount={store.tasks.length} isDemo={store.isDemo}/></div>{mobile&&<button className="mobile-shade" aria-label="메뉴 닫기" onClick={()=>setMobile(false)}/>}
    <div className="company-shell"><header className="company-topbar"><button className="mobile-menu" onClick={()=>setMobile(true)} aria-label="메뉴 열기"><Menu size={19}/></button><div className="breadcrumb">워크스페이스<ChevronRight size={12}/><strong>{pageNames[page]}</strong></div><div className="topbar-meta"><time>{new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</time><span className="workspace-mode"><i/>{store.isDemo?'데모 워크스페이스':'내 워크스페이스'}</span></div></header>
      <main className="company-main"><div className="page-heading"><div><div className="eyebrow"><Sun size={12}/> YOUR TEAM, ONE PIXEL AT A TIME</div><h1>{page==='dashboard'?'한눈에 보는 우리 회사':page==='tasks'?'우리 팀의 모든 작업':'함께 일하는 픽셀 팀원들'}{page==='dashboard'&&<span>✦</span>}</h1><p>{page==='dashboard'?'대표님의 아이디어가 성과가 되는 곳. 오늘도 우리 팀과 함께해요.':page==='tasks'?'부서별 진행 상황부터 완료 결과까지, 놓치지 않고 확인하세요.':'각 부서의 팀장 1명과 팀원 3명이 대표님의 업무를 기다려요.'}</p></div><div className="heading-actions"><button className="secondary-button" onClick={()=>setSetup(true)}><Settings2 size={14}/>{store.isDemo?'내 회사 만들기':'회사 설정'}</button><button className="primary-button" onClick={focusCommand} aria-label="새 업무 지시"><Plus size={16}/>새 업무 지시</button></div></div>
        {store.loading?<div className="page-loading"><LoaderCircle className="animate-spin" size={24}/>회사 현황을 불러오고 있어요…</div>:store.error?<div className="page-error"><p>회사 정보를 불러오지 못했습니다.</p><button className="secondary-button" onClick={store.reload}>다시 불러오기</button></div>:<><StatsCards tasks={store.tasks} departmentCount={departmentIds.length}/>{page==='dashboard'?<DashboardContent tasks={store.tasks} goals={store.goals} logs={store.logs} onTask={setTask} isDemo={store.isDemo}/>:page==='tasks'?<KanbanBoard goals={taskFilter==='all'?store.goals:store.goals.filter(g=>g.department===taskFilter)} tasks={taskFilter==='all'?store.tasks:store.tasks.filter(t=>t.department===taskFilter)} approvals={store.approvals} onDecision={store.decideApproval} onOpen={setTask}/>:<AgentDirectory departmentIds={departmentIds} tasks={store.tasks} onTask={setTask}/>}<CommandBar isDemo={store.isDemo} onSetup={()=>setSetup(true)} onAssign={store.assignTask} onCreated={setTask} draft={draft} setDraft={setDraft}/></>}
      </main></div>
    {setup&&<SetupDialog key={store.company?.id || 'demo'} open onClose={()=>setSetup(false)} company={store.company} isDemo={store.isDemo} onSave={store.saveCompany}/>}{task&&<TaskResultDialog key={task.id} task={store.tasks.find(t=>t.id===task.id)||task} approval={store.approvals.filter(a=>a.task_id===task.id).sort((a,b)=>new Date(b.created_date)-new Date(a.created_date))[0]} logs={store.logs.filter(l=>l.task_id===task.id)} goal={store.goals.find(g=>g.id===(store.tasks.find(t=>t.id===task.id)||task).goal_id)} onClose={()=>setTask(null)}/>}<ConnectionsDialog open={connections} onClose={()=>setConnections(false)}/>
  </div>;
}