import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { leaders, models, cleanText } from '../../shared/companyEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const approvalId = cleanText(body.approval_id, 100);
    const taskId = cleanText(body.task_id, 100);
    if (!approvalId || !taskId) return Response.json({ error: 'approval_id와 task_id가 필요합니다.' }, { status: 400 });
    const approval = await base44.asServiceRole.entities.Approval.get(approvalId);
    const task = await base44.asServiceRole.entities.WorkTask.get(taskId);
    if (!approval || !task || approval.task_id !== task.id) return Response.json({ error: '결재와 작업 정보가 일치하지 않습니다.' }, { status: 400 });
    if (approval.status !== 'APPROVED' || approval.action_type !== 'SEND_EMAIL') return Response.json({ error: '승인된 이메일 액션만 실행할 수 있습니다.' }, { status: 409 });
    const payload = approval.action_payload || {};
    if (typeof payload.to !== 'string' || typeof payload.subject !== 'string' || typeof payload.body !== 'string') return Response.json({ error: '이메일 실행 정보가 올바르지 않습니다.' }, { status: 400 });
    await base44.asServiceRole.integrations.Core.SendEmail({ to: payload.to, subject: cleanText(payload.subject, 120), body: cleanText(payload.body, 5000), from_name: 'AI 오피스' });
    const model = models.includes(task.selected_model) ? task.selected_model : 'gemini_3_flash';
    const assessment = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model,
      add_context_from_internet: false,
      prompt: `업무 목표와 승인 실행 결과를 비교해 달성률을 0~100 정수로 엄격하게 평가하세요. 낙관적으로 추정하지 말고, 이메일 발송으로 실제 달성된 범위만 반영하세요. 500자 이내 한국어 평가 요약도 작성하세요. 목표: ${JSON.stringify(task.description)}. 승인 성과물: ${JSON.stringify(approval.preview_data || {})}. 현재 회차: ${task.iteration || 1}/3. 이메일 발송은 성공했습니다.`,
      response_json_schema: { type: 'object', properties: { progress_rate: { type: 'number' }, summary: { type: 'string' } }, required: ['progress_rate', 'summary'] }
    });
    const progressRate = Math.max(0, Math.min(100, Math.round(Number(assessment.progress_rate) || 0)));
    const summary = cleanText(assessment.summary, 500);
    const iteration = Math.max(1, Math.min(3, Number(task.iteration) || 1));
    const completed = progressRate >= 100 || iteration >= 3;
    const nextIteration = completed ? iteration : iteration + 1;
    await base44.asServiceRole.entities.WorkTask.update(task.id, { progress_rate: progressRate, progress: progressRate, iteration: nextIteration, status: completed ? 'completed' : 'in_progress', result: summary });
    await base44.asServiceRole.entities.AgentLog.create({ company_id: task.company_id, task_id: task.id, department: task.department, agent_name: leaders[task.department] || '팀장 에이전트', message: completed ? `최종 실행을 마쳤습니다. 달성률 ${progressRate}% · ${summary}` : `${iteration}회차 실행을 마쳤습니다. 달성률 ${progressRate}%로 다음 자율 순환을 시작합니다.`, level: completed ? 'SUCCESS' : 'ACTION' });
    return Response.json({ progress_rate: progressRate, iteration: nextIteration, completed, continue_cycle: !completed });
  } catch (error) {
    return Response.json({ error: error.message || '승인 액션 실행 중 오류가 발생했습니다.' }, { status: 500 });
  }
}