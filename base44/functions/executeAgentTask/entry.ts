import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { leaders, models, cleanText } from '../../shared/companyEngine.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const taskId = cleanText(body.task_id, 100);
    const feedbackMemo = cleanText(body.feedback_memo, 2000);
    if (!taskId) return Response.json({ error: 'task_id가 필요합니다.' }, { status: 400 });
    const task = await base44.asServiceRole.entities.WorkTask.get(taskId);
    if (!task || task.status === 'cancelled' || task.status === 'completed') return Response.json({ error: '실행할 수 없는 작업입니다.' }, { status: 409 });
    const model = models.includes(task.selected_model) ? task.selected_model : 'gemini_3_flash';
    const owner = await base44.asServiceRole.entities.User.get(task.created_by_id);
    const agentName = leaders[task.department] || '팀장 에이전트';
    await base44.asServiceRole.entities.AgentLog.bulkCreate([
      { company_id: task.company_id, task_id: task.id, department: task.department, agent_name: agentName, message: `${task.iteration || 1}회차 업무 목표와 요구사항을 분석했습니다.`, level: 'INFO' },
      { company_id: task.company_id, task_id: task.id, department: task.department, agent_name: agentName, message: feedbackMemo ? '대표의 수정 의견을 반영해 결재안을 다시 작성합니다.' : '실행 가능한 이메일 결재안을 작성합니다.', level: 'ACTION' }
    ]);
    const draft = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model,
      add_context_from_internet: false,
      prompt: `당신은 ${task.department} 부서의 실무 팀장입니다. 목표를 달성하기 위해 대표에게 보고할 실행 이메일 초안을 한국어로 작성하세요. 숨겨진 사고 과정은 쓰지 말고 결과와 근거만 간결하게 제시하세요. 제목 80자 이내, 본문 3000자 이내, 성과물 요약 500자 이내입니다. 업무 제목: ${JSON.stringify(task.title)}. 업무 설명: ${JSON.stringify(task.description)}. 회차: ${task.iteration || 1}. 대표 수정 의견: ${JSON.stringify(feedbackMemo || '없음')}`,
      response_json_schema: { type: 'object', properties: { subject: { type: 'string' }, body: { type: 'string' }, summary: { type: 'string' } }, required: ['subject', 'body', 'summary'] }
    });
    const subject = cleanText(draft.subject, 80);
    const emailBody = cleanText(draft.body, 3000);
    const summary = cleanText(draft.summary, 500);
    const approval = await base44.asServiceRole.entities.Approval.create({ company_id: task.company_id, task_id: task.id, department: task.department, title: `${task.title} · ${task.iteration || 1}회차 실행 승인`, preview_data: { subject, body: emailBody, summary }, action_type: 'SEND_EMAIL', action_payload: { to: owner.email, subject, body: emailBody }, status: 'PENDING', feedback_memo: '' });
    await base44.asServiceRole.entities.WorkTask.update(task.id, { status: 'pending_approval', result: summary });
    await base44.asServiceRole.entities.AgentLog.create({ company_id: task.company_id, task_id: task.id, department: task.department, agent_name: agentName, message: '실행 초안을 완성해 대표 결재를 요청했습니다.', level: 'APPROVAL' });
    return Response.json({ approval_id: approval.id, status: approval.status });
  } catch (error) {
    return Response.json({ error: error.message || '에이전트 실행 중 오류가 발생했습니다.' }, { status: 500 });
  }
}