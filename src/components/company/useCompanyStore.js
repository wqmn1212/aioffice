import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { demoCompany, demoTasks, initialDepartments } from '@/components/company/companyData';
export default function useCompanyStore() {
  const [companyId, setCompanyId] = useState(() => localStorage.getItem('pixel-company-id') || '');
  const [examples, setExamples] = useState(demoTasks);
  const client = useQueryClient();
  const companyQuery = useQuery({ queryKey: ['company', companyId], queryFn: () => base44.entities.Company.get(companyId), enabled: !!companyId });
  const taskQuery = useQuery({ queryKey: ['work-tasks', companyId], queryFn: () => base44.entities.WorkTask.filter({ company_id: companyId }, '-created_date', 500), enabled: !!companyId });
  useEffect(() => {
    if (!companyId) return;
    return base44.entities.WorkTask.subscribe(() => client.invalidateQueries({ queryKey: ['work-tasks', companyId] }));
  }, [companyId, client]);
  async function saveCompany(values) {
    if (companyId) {
      const saved = await base44.entities.Company.update(companyId, values);
      await base44.auth.updateMe({ company_id: saved.id });
    } else {
      const created = await base44.entities.Company.create({ ...values, departments: initialDepartments(values.business_type) });
      const saved = await base44.entities.Company.update(created.id, { company_id: created.id });
      await base44.auth.updateMe({ company_id: saved.id });
      localStorage.setItem('pixel-company-id', saved.id); setCompanyId(saved.id);
    }
    await client.invalidateQueries({ queryKey: ['company'] });
  }
  async function assignTask(goal, model = 'gemini_3_flash') {
    const { data } = await base44.functions.invoke('routeCompanyTask', { company_id: companyId, goal, model });
    if (data.error) throw new Error(data.error);
    await client.invalidateQueries({ queryKey: ['work-tasks', companyId] });
    return data.task;
  }
  async function updateTask(id, values) {
    if (!companyId) { setExamples(items => items.map(t => t.id === id ? { ...t, ...values, updated_date: new Date().toISOString() } : t)); return; }
    await base44.entities.WorkTask.update(id, values);
    await client.invalidateQueries({ queryKey: ['work-tasks', companyId] });
  }
  return { company: companyId ? companyQuery.data : demoCompany, tasks: companyId ? taskQuery.data || [] : examples, isDemo: !companyId, loading: !!companyId && (companyQuery.isLoading || taskQuery.isLoading), error: companyQuery.error || taskQuery.error, saveCompany, assignTask, updateTask, reload: () => { companyQuery.refetch(); taskQuery.refetch(); } };
}