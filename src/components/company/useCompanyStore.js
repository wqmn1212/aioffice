import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { demoCompany, demoTasks, initialDepartments } from '@/components/company/companyData';

export default function useCompanyStore() {
  const [companyId,setCompanyId]=useState(()=>localStorage.getItem('pixel-company-id') || '');
  const [examples,setExamples]=useState(demoTasks);
  const client=useQueryClient(), enabled=!!companyId;
  const currentUserQuery=useQuery({queryKey:['current-user'],queryFn:()=>base44.auth.me()});
  const companyQuery=useQuery({queryKey:['company',companyId],queryFn:()=>base44.entities.Company.get(companyId),enabled});
  const taskQuery=useQuery({queryKey:['work-tasks',companyId],queryFn:()=>base44.entities.WorkTask.filter({company_id:companyId},'-created_date',500),enabled});
  const goalQuery=useQuery({queryKey:['goals',companyId],queryFn:()=>base44.entities.Goal.filter({company_id:companyId},'-created_date',200),enabled});
  const approvalQuery=useQuery({queryKey:['approvals',companyId],queryFn:()=>base44.entities.Approval.filter({company_id:companyId},'-created_date',500),enabled});
  const logQuery=useQuery({queryKey:['agent-logs',companyId],queryFn:()=>base44.entities.AgentLog.filter({company_id:companyId},'-created_date',500),enabled});
  useEffect(()=>{const linked=currentUserQuery.data?.company_id || currentUserQuery.data?.data?.company_id || '';if(currentUserQuery.data&&linked!==companyId){setCompanyId(linked);if(linked)localStorage.setItem('pixel-company-id',linked);else localStorage.removeItem('pixel-company-id');}},[currentUserQuery.data,companyId]);
  useEffect(()=>{if(!companyId)return;const invalidate=key=>client.invalidateQueries({queryKey:[key,companyId]});const stops=[base44.entities.WorkTask.subscribe(()=>invalidate('work-tasks')),base44.entities.Goal.subscribe(()=>invalidate('goals')),base44.entities.Approval.subscribe(()=>invalidate('approvals')),base44.entities.AgentLog.subscribe(()=>invalidate('agent-logs'))];return()=>stops.forEach(stop=>stop());},[companyId,client]);
  async function saveCompany(values){if(companyId){const saved=await base44.entities.Company.update(companyId,values);const updatedUser=await base44.auth.updateMe({company_id:saved.id});client.setQueryData(['current-user'],updatedUser);}else{const created=await base44.entities.Company.create({...values,departments:initialDepartments(values.business_type)});const saved=await base44.entities.Company.update(created.id,{company_id:created.id});const updatedUser=await base44.auth.updateMe({company_id:saved.id});client.setQueryData(['current-user'],updatedUser);localStorage.setItem('pixel-company-id',saved.id);setCompanyId(saved.id);}await client.invalidateQueries({queryKey:['company']});}
  async function assignTask(goal,model='gemini_3_flash'){const {data}=await base44.functions.invoke('routeCompanyTask',{company_id:companyId,goal,model});if(data.error)throw new Error(data.error);await Promise.all([client.invalidateQueries({queryKey:['work-tasks',companyId]}),client.invalidateQueries({queryKey:['goals',companyId]})]);return data.task;}
  async function updateTask(id,values){if(!companyId){setExamples(items=>items.map(t=>t.id===id?{...t,...values,updated_date:new Date().toISOString()}:t));return;}await base44.entities.WorkTask.update(id,values);await client.invalidateQueries({queryKey:['work-tasks',companyId]});}
  async function decideApproval(id,status,feedback_memo=''){await base44.entities.Approval.update(id,{status,feedback_memo});await client.invalidateQueries({queryKey:['approvals',companyId]});}
  const demoGoals=examples.map(t=>({id:`goal-${t.id}`,title:t.title,description:t.description,status:t.status==='completed'?'completed':'active',department:t.department}));
  const tasks=enabled?(taskQuery.data||[]):examples.map(t=>({...t,goal_id:`goal-${t.id}`}));
  const queries=[companyQuery,taskQuery,goalQuery,approvalQuery,logQuery];
  return {company:enabled?companyQuery.data:demoCompany,tasks,goals:enabled?(goalQuery.data||[]):demoGoals,approvals:enabled?(approvalQuery.data||[]):[],logs:enabled?(logQuery.data||[]):[],isDemo:!enabled,loading:enabled&&queries.some(q=>q.isLoading),error:queries.find(q=>q.error)?.error,saveCompany,assignTask,updateTask,decideApproval,reload:()=>queries.forEach(q=>q.refetch())};
}