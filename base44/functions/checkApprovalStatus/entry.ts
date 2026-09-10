import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { leaders, cleanText } from '../../shared/companyEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const { approval_id: approvalIdValue } = await req.json();
    const approvalId = cleanText(approvalIdValue, 100);
    if (!approvalId) return Response.json({ error: 'approval_id가 필요합니다.' }, { status: 400 });
    const approval = await base44.asServiceRole.entities.Approval.get(approvalId);
    if (!approval) return Response.json({ error: '결재 문서를 찾을 수 없습니다.' }, { status: 404 });
    if (approval.status === 'REJECTED') {
      await base44.asServiceRole.entities.WorkTask.update(approval.task_id, { status: 'cancelled' });
      await base44.asServiceRole.entities.AgentLog.create({ company_id: approval.company_id, task_id: approval.task_id, department: approval.department, agent_name: leaders[approval.department] || '팀장 에이전트', message: `대표가 결재안을 반려했습니다.${approval.feedback_memo ? ` 사유: ${approval.feedback_memo}` : ''}`, level: 'WARN' });
    }
    return Response.json({ approval_id: approval.id, status: approval.status, feedback_memo: approval.feedback_memo || '' });
  } catch (error) {
    return Response.json({ error: error.message || '결재 상태 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}