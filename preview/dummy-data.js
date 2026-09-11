/**
 * 미리보기용 더미 데이터.
 * 실제 Base44 엔티티(Company / Goal / WorkTask / Approval / AgentLog) 스키마와 같은 필드를 사용합니다.
 * 부서 정의는 src/components/company/companyData.js 와 동일하게 유지해 주세요.
 */
window.PIXEL_DUMMY = (function () {
  var DAY = 86400000, HOUR = 3600000, now = Date.now();
  function ago(days, hours) { return new Date(now - days * DAY - (hours || 0) * HOUR).toISOString(); }

  var departments = [
    { id: 'sales', name: '영업팀', english: 'SALES', color: '#8661db', pale: '#f2ecfc', icon: 'TrendingUp', names: ['세일', '루키', '제이', '레오'], roles: ['영업 팀장', '리드 발굴', '고객 관리', '영업 분석'] },
    { id: 'marketing', name: '마케팅팀', english: 'MARKETING', color: '#e3a33f', pale: '#fff6e7', icon: 'Megaphone', names: ['마크', '소라', '루나', '노아'], roles: ['마케팅 팀장', '콘텐츠 기획', '캠페인 관리', '시장 조사'] },
    { id: 'development', name: '개발팀', english: 'DEVELOPMENT', color: '#5a91dd', pale: '#edf4fd', icon: 'Code2', names: ['데브', '코디', '버그', '테오'], roles: ['개발 팀장', '프론트엔드', '품질 관리', '백엔드'] },
    { id: 'design', name: '디자인팀', english: 'DESIGN', color: '#df86a1', pale: '#fdf0f5', icon: 'Palette', names: ['드로', '모모', '피카', '비비'], roles: ['디자인 팀장', 'UI 디자인', '브랜드 디자인', '그래픽 디자인'] },
    { id: 'hr', name: '인사팀', english: 'PEOPLE', color: '#53a58c', pale: '#eaf6f1', icon: 'Users', names: ['피플', '하루', '온유', '미나'], roles: ['인사 팀장', '채용 관리', '조직 문화', '인사 운영'] },
    { id: 'operations', name: '경영지원팀', english: 'OPERATIONS', color: '#8390ae', pale: '#f0f2f7', icon: 'BriefcaseBusiness', names: ['오피', '핀', '정리', '보리'], roles: ['경영지원 팀장', '재무 관리', '문서 관리', '운영 지원'] },
  ];
  var statusLabels = { queued: '대기 중', in_progress: '진행 중', pending_approval: '결재 대기', completed: '완료', cancelled: '취소됨' };
  var allDepartmentIds = departments.map(function (d) { return d.id; });

  var company = { id: 'company-demo', company_id: 'company-demo', name: '픽셀 컴퍼니', business_type: 'IT · 소프트웨어', departments: allDepartmentIds };

  var goals = [
    { id: 'goal-1', company_id: 'company-demo', department: 'sales', status: 'active', title: '4분기 신규 고객 30곳 확보', description: '아웃바운드 리드 발굴부터 미팅 후속까지 영업 파이프라인을 정비합니다.', created_date: ago(12) },
    { id: 'goal-2', company_id: 'company-demo', department: 'marketing', status: 'active', title: '9월 브랜드 인지도 캠페인', description: 'SNS 콘텐츠와 광고 소재를 묶어 한 달 캠페인을 운영합니다.', created_date: ago(10) },
    { id: 'goal-3', company_id: 'company-demo', department: 'development', status: 'active', title: '랜딩 페이지 v2 런칭', description: '반응형 UI 개편과 성능 개선을 이번 스프린트에 마무리합니다.', created_date: ago(9) },
    { id: 'goal-4', company_id: 'company-demo', department: 'design', status: 'active', title: '브랜드 리뉴얼 가이드 정립', description: '로고, 컬러, 타이포 규칙을 하나의 가이드 문서로 정리합니다.', created_date: ago(8) },
    { id: 'goal-5', company_id: 'company-demo', department: 'hr', status: 'active', title: '신규 입사자 온보딩 개선', description: '첫 2주 온보딩 경험을 문서화하고 채용 공고를 새로 씁니다.', created_date: ago(6) },
    { id: 'goal-6', company_id: 'company-demo', department: 'operations', status: 'completed', title: '8월 결산 마감 및 비용 최적화', description: '지출 내역을 정리하고 불필요한 구독을 정리했습니다.', created_date: ago(14) },
    { id: 'goal-7', company_id: 'company-demo', department: 'sales', status: 'completed', title: '기존 고객 업셀 캠페인', description: '재계약 시점이 가까운 고객을 대상으로 업셀 제안을 진행했습니다.', created_date: ago(16) },
  ];

  // [id, goal_id, department, title, assignee, status, progress, priority, created(days,hours), iteration]
  var rows = [
    ['task-1', 'goal-1', 'sales', '잠재 고객 리드 리스트 정리', '레오', 'in_progress', 65, 'high', [0, 2], 1],
    ['task-2', 'goal-1', 'sales', '고객 미팅 후속 메일 초안 작성', '제이', 'pending_approval', 90, 'high', [0, 4], 2],
    ['task-3', 'goal-1', 'sales', '타깃 산업군 리서치', '루키', 'queued', 0, 'normal', [1, 1], 1],
    ['task-4', 'goal-1', 'sales', '영업 파이프라인 주간 리포트', '세일', 'completed', 100, 'normal', [3, 5], 1],
    ['task-5', 'goal-2', 'marketing', '9월 SNS 콘텐츠 캘린더 기획', '소라', 'in_progress', 40, 'normal', [0, 6], 1],
    ['task-6', 'goal-2', 'marketing', '인스타그램 광고 소재 카피 작성', '루나', 'pending_approval', 85, 'high', [1, 2], 1],
    ['task-7', 'goal-2', 'marketing', '경쟁사 마케팅 채널 분석', '노아', 'completed', 100, 'normal', [4, 3], 2],
    ['task-8', 'goal-2', 'marketing', '뉴스레터 9월호 발송 계획', '마크', 'queued', 0, 'normal', [2, 7], 1],
    ['task-9', 'goal-3', 'development', '랜딩 페이지 반응형 UI 개발', '코디', 'in_progress', 80, 'high', [0, 1], 1],
    ['task-10', 'goal-3', 'development', 'API 응답 속도 개선', '테오', 'in_progress', 35, 'normal', [2, 2], 1],
    ['task-11', 'goal-3', 'development', '결제 플로우 QA 시나리오 작성', '버그', 'completed', 100, 'normal', [5, 4], 1],
    ['task-12', 'goal-3', 'development', '배포 파이프라인 점검', '데브', 'queued', 0, 'normal', [1, 8], 1],
    ['task-13', 'goal-4', 'design', '브랜드 가이드라인 초안 작성', '피카', 'in_progress', 45, 'normal', [1, 3], 1],
    ['task-14', 'goal-4', 'design', '랜딩 페이지 히어로 시안', '모모', 'in_progress', 70, 'high', [0, 8], 2],
    ['task-15', 'goal-4', 'design', '아이콘 세트 정리', '비비', 'completed', 100, 'normal', [6, 2], 1],
    ['task-16', 'goal-5', 'hr', '신규 입사자 온보딩 가이드', '하루', 'completed', 100, 'normal', [3, 1], 1],
    ['task-17', 'goal-5', 'hr', '9월 채용 공고 초안', '온유', 'pending_approval', 80, 'normal', [0, 9], 1],
    ['task-18', 'goal-5', 'hr', '팀 문화 설문 문항 설계', '미나', 'queued', 0, 'normal', [2, 4], 1],
    ['task-19', 'goal-6', 'operations', '8월 비용 내역 정리', '핀', 'completed', 100, 'normal', [7, 3], 1],
    ['task-20', 'goal-6', 'operations', 'SaaS 구독 계약 점검', '정리', 'completed', 100, 'normal', [8, 1], 1],
    ['task-21', 'goal-6', 'operations', '사무 비품 발주 목록', '보리', 'cancelled', 20, 'normal', [9, 2], 1],
    ['task-22', 'goal-7', 'sales', '업셀 대상 고객 리스트업', '세일', 'completed', 100, 'normal', [10, 4], 1],
    ['task-23', 'goal-7', 'sales', '업셀 제안서 템플릿 작성', '제이', 'completed', 100, 'high', [11, 2], 3],
    ['task-24', '', 'operations', '작년 고객 만족도 데이터 이관', '오피', 'completed', 100, 'normal', [13, 3], 1],
  ];

  var descriptions = {
    'task-1': '기존 CRM에 쌓인 문의 이력 중 재접촉이 가능한 리드를 추려 산업군·규모·담당자 정보를 정리합니다.',
    'task-2': '지난주 미팅을 진행한 3개 고객사에 보낼 후속 메일 초안을 작성하고 대표님 결재를 요청합니다.',
    'task-3': '우리 제품이 가장 잘 맞는 산업군 3곳을 선정하기 위한 기초 리서치입니다.',
    'task-4': '주간 파이프라인 현황(신규/진행/마감)을 한 장으로 정리했습니다.',
    'task-5': '9월 한 달간 업로드할 인스타그램·링크드인 콘텐츠 주제와 발행 일정을 캘린더로 정리합니다.',
    'task-6': '신규 기능 소개 광고에 사용할 카피 3종(짧은 후킹형, 정보형, 사례형)을 작성했습니다.',
    'task-7': '경쟁사 4곳의 채널별 게시 빈도와 메시지 톤을 정리했습니다.',
    'task-8': '뉴스레터 9월호에 담을 섹션 구성과 발송 대상 세그먼트를 정합니다.',
    'task-9': '모바일 360px부터 데스크톱 1440px까지 브레이크포인트별 레이아웃을 구현합니다.',
    'task-10': '가장 느린 3개 엔드포인트의 쿼리를 점검하고 캐싱 전략을 적용합니다.',
    'task-11': '결제 성공/실패/환불 시나리오를 QA 체크리스트로 정리했습니다.',
    'task-12': '배포 전 자동 검사 단계가 정상 동작하는지 확인합니다.',
    'task-13': '로고 사용 규칙, 컬러 팔레트, 타이포그래피 기준을 초안으로 정리합니다.',
    'task-14': '랜딩 페이지 최상단 히어로 영역 시안 2종을 제작합니다.',
    'task-15': '서비스 전반에서 쓰이는 아이콘을 한 세트로 정리하고 규격을 통일했습니다.',
    'task-16': '입사 첫 2주 동안 필요한 계정, 문서, 미팅 일정을 온보딩 가이드로 정리했습니다.',
    'task-17': '프론트엔드 개발자 채용 공고 초안을 작성하고 게시 전 결재를 요청합니다.',
    'task-18': '분기별 조직 문화 설문에 사용할 문항을 설계합니다.',
    'task-19': '8월 지출 내역을 항목별로 분류하고 예산 대비 집행률을 정리했습니다.',
    'task-20': '사용 빈도가 낮은 구독 2건을 정리해 월 18만원을 절감했습니다.',
    'task-21': '분기 예산 조정으로 이번 발주는 다음 달로 연기되었습니다.',
    'task-22': '재계약이 3개월 이내인 고객 18곳을 선별했습니다.',
    'task-23': '업셀 제안서 기본 템플릿과 사례 슬라이드를 완성했습니다.',
    'task-24': '이전 스프레드시트에 흩어져 있던 만족도 응답을 하나로 통합했습니다.',
  };
  var results = {
    'task-4': '이번 주 신규 리드 24건, 진행 중 상담 9건, 계약 마감 2건입니다. 전주 대비 신규 리드가 18% 늘었습니다.',
    'task-7': '경쟁사 A는 주 5회 짧은 영상 중심, B는 주 2회 사례 중심으로 운영합니다. 우리는 사례형 콘텐츠 비중을 높이는 편이 유리합니다.',
    'task-11': 'QA 시나리오 32건을 작성했고, 그중 환불 관련 3건에서 예외 처리 보완이 필요합니다.',
    'task-15': '아이콘 64종을 24px 그리드 기준으로 통일하고 SVG 스프라이트로 정리했습니다.',
    'task-16': '온보딩 체크리스트 1종, 첫 주 일정표 1종, 계정 발급 요청 양식 1종을 만들었습니다.',
    'task-19': '8월 총 지출 1,240만원 · 예산 대비 92% 집행. 마케팅비가 예산을 12% 초과했습니다.',
    'task-20': '중복 도구 2건을 해지해 월 180,000원이 절감됩니다.',
    'task-22': '업셀 대상 18곳 중 우선 접촉 대상 6곳을 선정했습니다.',
    'task-23': '제안서 템플릿(10p)과 고객 사례 슬라이드 3종을 공유 드라이브에 정리했습니다.',
    'task-24': '응답 1,842건을 통합했고 중복 137건을 제거했습니다.',
  };

  var tasks = rows.map(function (r) {
    var created = ago(r[8][0], r[8][1]);
    var updated = ago(r[8][0], Math.max(0, r[8][1] - 1));
    return {
      id: r[0], company_id: 'company-demo', goal_id: r[1], department: r[2], title: r[3], assignee: r[4],
      status: r[5], progress: r[6], priority: r[7], iteration: r[9],
      progress_rate: r[5] === 'completed' ? 100 : r[6],
      description: descriptions[r[0]] || '',
      result: results[r[0]] || '',
      selected_model: 'gemini_3_flash',
      created_date: created, updated_date: updated,
    };
  });

  var approvals = [
    {
      id: 'approval-1', company_id: 'company-demo', task_id: 'task-2', department: 'sales', status: 'PENDING',
      title: '고객 미팅 후속 메일 발송 결재', action_type: 'SEND_EMAIL', feedback_memo: '', created_date: ago(0, 3),
      preview_data: {
        subject: '[픽셀 컴퍼니] 지난주 미팅 감사드립니다 · 제안 자료 전달',
        summary: '미팅을 진행한 3개 고객사에 감사 인사와 제안 자료를 함께 보내는 후속 메일입니다.',
        body: '안녕하세요, 픽셀 컴퍼니 제이입니다.\n\n지난주 귀한 시간 내어 미팅에 참석해 주셔서 감사합니다.\n논의해 주신 내용을 반영해 제안 자료를 정리했습니다. 첨부 파일을 확인해 주세요.\n\n1) 도입 범위 및 일정\n2) 예상 비용과 단계별 적용 방안\n3) 유사 산업군 도입 사례\n\n추가로 궁금하신 점이 있으면 편하게 회신 부탁드립니다.\n감사합니다.',
      },
      action_payload: { to: ['contact@example.com'], cc: [] },
    },
    {
      id: 'approval-2', company_id: 'company-demo', task_id: 'task-6', department: 'marketing', status: 'PENDING',
      title: '인스타그램 광고 소재 게시 결재', action_type: 'INSTAGRAM_POST', feedback_memo: '', created_date: ago(1, 1),
      preview_data: {
        subject: '신규 기능 소개 광고 카피 3종',
        summary: '후킹형 · 정보형 · 사례형 카피 3종입니다. 예산은 일 3만원, 7일 집행 기준입니다.',
        body: 'A안(후킹형)\n"팀원 24명이 오늘도 대신 일하고 있습니다."\n\nB안(정보형)\n"업무 지시 한 줄이면 부서 배정부터 결재까지. 픽셀 컴퍼니에서 시작하세요."\n\nC안(사례형)\n"10인 규모 스타트업이 주간 보고 준비 시간을 4시간에서 20분으로 줄인 방법."',
      },
      action_payload: { budget_per_day: 30000, duration_days: 7 },
    },
    {
      id: 'approval-3', company_id: 'company-demo', task_id: 'task-17', department: 'hr', status: 'PENDING',
      title: '프론트엔드 채용 공고 게시 결재', action_type: 'SEND_EMAIL', feedback_memo: '', created_date: ago(0, 8),
      preview_data: {
        subject: '[채용] 프론트엔드 개발자 (경력 3년 이상)',
        summary: '채용 사이트 3곳에 동시 게시할 공고 초안입니다. 연봉 범위 표기 여부만 확인 부탁드립니다.',
        body: '픽셀 컴퍼니는 작은 팀이 큰 일을 해내도록 돕는 업무 자동화 서비스를 만듭니다.\n\n[담당 업무]\n- 웹 대시보드 화면 개발 및 개선\n- 디자인 시스템 유지 보수\n\n[자격 요건]\n- React 기반 개발 경력 3년 이상\n- 컴포넌트 구조 설계 경험\n\n[우대 사항]\n- 데이터 시각화 경험\n- 스타트업 초기 제품 개발 경험',
      },
      action_payload: { channels: ['원티드', '잡코리아', '자사 홈페이지'] },
    },
    {
      id: 'approval-4', company_id: 'company-demo', task_id: 'task-4', department: 'sales', status: 'APPROVED',
      title: '주간 리포트 공유 결재', action_type: 'SEND_EMAIL', feedback_memo: '', created_date: ago(3, 4),
      preview_data: { subject: '[주간] 영업 파이프라인 현황', summary: '주간 리포트를 팀 전체에 공유했습니다.', body: '신규 리드 24건, 진행 중 상담 9건, 계약 마감 2건입니다.' },
      action_payload: {},
    },
  ];

  // [task_id, department, agent_name, level, message, created(days,hours)]
  var logRows = [
    ['task-9', 'development', '데브', 'INFO', '목표 "랜딩 페이지 v2 런칭"을 분석해 개발팀으로 배정했습니다.', [0, 1]],
    ['task-9', 'development', '코디', 'ACTION', '모바일 브레이크포인트 레이아웃 작업을 시작했습니다.', [0, 1]],
    ['task-17', 'hr', '온유', 'ACTION', '채용 공고 초안을 작성했습니다. 게시 전 결재가 필요합니다.', [0, 8]],
    ['task-17', 'hr', '피플', 'APPROVAL', '대표님 결재를 요청했습니다. (프론트엔드 채용 공고)', [0, 8]],
    ['task-2', 'sales', '제이', 'ACTION', '미팅 3건의 회의록을 요약해 후속 메일 초안을 만들었습니다.', [0, 4]],
    ['task-2', 'sales', '세일', 'APPROVAL', '메일 발송 전 대표님 결재를 요청했습니다.', [0, 3]],
    ['task-1', 'sales', '레오', 'INFO', 'CRM에서 재접촉 가능한 리드 312건을 불러왔습니다.', [0, 2]],
    ['task-1', 'sales', '레오', 'ACTION', '중복 리드 48건을 정리하고 산업군 태그를 붙이는 중입니다.', [0, 2]],
    ['task-14', 'design', '모모', 'ACTION', '히어로 영역 시안 A안을 완성했습니다. B안 작업 중입니다.', [0, 7]],
    ['task-5', 'marketing', '소라', 'INFO', '지난달 성과가 좋았던 콘텐츠 유형을 기준으로 주제를 뽑고 있습니다.', [0, 6]],
    ['task-6', 'marketing', '루나', 'APPROVAL', '광고 소재 3종에 대한 집행 결재를 요청했습니다.', [1, 1]],
    ['task-10', 'development', '테오', 'WARN', '리포트 조회 API 응답이 평균 2.4초로 느립니다. 인덱스 점검이 필요합니다.', [1, 2]],
    ['task-13', 'design', '피카', 'INFO', '기존 자료에서 사용 중인 컬러 17종을 수집했습니다.', [1, 3]],
    ['task-4', 'sales', '세일', 'SUCCESS', '주간 파이프라인 리포트를 완료했습니다.', [3, 4]],
    ['task-16', 'hr', '하루', 'SUCCESS', '온보딩 가이드 3종을 완료해 공유 드라이브에 저장했습니다.', [3, 1]],
    ['task-7', 'marketing', '노아', 'SUCCESS', '경쟁사 채널 분석을 완료했습니다. (2회차 보완 반영)', [4, 2]],
    ['task-11', 'development', '버그', 'SUCCESS', 'QA 시나리오 32건을 작성했습니다. 3건은 보완이 필요합니다.', [5, 3]],
    ['task-15', 'design', '비비', 'SUCCESS', '아이콘 64종 정리를 완료했습니다.', [6, 1]],
    ['task-19', 'operations', '핀', 'SUCCESS', '8월 결산 정리를 완료했습니다. 마케팅비가 예산을 12% 초과했습니다.', [7, 2]],
    ['task-21', 'operations', '보리', 'WARN', '예산 조정으로 비품 발주 작업이 취소되었습니다.', [9, 1]],
    ['task-22', 'sales', '세일', 'SUCCESS', '업셀 대상 고객 18곳 선별을 완료했습니다.', [10, 3]],
    ['task-23', 'sales', '제이', 'SUCCESS', '3회차 수정 끝에 제안서 템플릿을 확정했습니다.', [11, 1]],
  ];
  var logs = logRows.map(function (r, i) {
    return { id: 'log-' + (i + 1), company_id: 'company-demo', task_id: r[0], department: r[1], agent_name: r[2], level: r[3], message: r[4], created_date: ago(r[5][0], r[5][1]) };
  });

  function buildHeavy() {
    var hGoals = [], hTasks = [], hLogs = [], statuses = ['queued', 'in_progress', 'in_progress', 'completed', 'completed', 'pending_approval'];
    var titles = ['리포트 정리', '자료 조사', '초안 작성', '일정 조율', '데이터 점검', '결과 공유', '피드백 반영', '체크리스트 작성'];
    departments.forEach(function (d, di) {
      for (var g = 0; g < 2; g++) {
        var goalId = 'h-goal-' + di + '-' + g;
        hGoals.push({ id: goalId, company_id: 'company-demo', department: d.id, status: g === 1 ? 'completed' : 'active', title: d.name + ' 목표 ' + (g + 1), description: d.name + '의 ' + (g === 0 ? '이번 분기' : '지난 분기') + ' 목표입니다.', created_date: ago(20 - di) });
        for (var t = 0; t < 6; t++) {
          var idx = di * 12 + g * 6 + t, status = g === 1 ? 'completed' : statuses[idx % statuses.length];
          var progress = status === 'completed' ? 100 : status === 'queued' ? 0 : 20 + (idx * 7) % 70;
          var id = 'h-task-' + idx;
          hTasks.push({
            id: id, company_id: 'company-demo', goal_id: goalId, department: d.id, title: d.name + ' ' + titles[idx % titles.length] + ' #' + (t + 1),
            assignee: d.names[idx % 4], status: status, progress: progress, progress_rate: progress, priority: idx % 5 === 0 ? 'high' : 'normal', iteration: (idx % 3) + 1,
            description: '대량 데이터 테스트용으로 생성된 작업입니다. 목록, 필터, 캘린더 렌더링 성능을 확인할 때 사용하세요.',
            result: status === 'completed' ? '테스트용 완료 결과입니다. (' + d.name + ')' : '',
            created_date: ago(idx % 27, idx % 12), updated_date: ago(idx % 27, Math.max(0, (idx % 12) - 1)),
          });
          hLogs.push({ id: 'h-log-' + idx, company_id: 'company-demo', task_id: id, department: d.id, agent_name: d.names[idx % 4], level: ['INFO', 'ACTION', 'SUCCESS', 'WARN', 'APPROVAL'][idx % 5], message: d.name + ' 에이전트가 작업 #' + (t + 1) + ' 진행 상황을 기록했습니다.', created_date: ago(idx % 27, idx % 12) });
        }
      }
    });
    return { company: { id: 'company-demo', company_id: 'company-demo', name: '픽셀 컴퍼니 (대량)', business_type: 'IT · 소프트웨어', departments: allDepartmentIds }, goals: hGoals, tasks: hTasks, approvals: [], logs: hLogs };
  }

  return {
    departments: departments,
    statusLabels: statusLabels,
    datasets: {
      demo: { label: '기본 데모 (24건)', company: company, goals: goals, tasks: tasks, approvals: approvals, logs: logs },
      empty: { label: '빈 워크스페이스', company: { id: 'company-empty', company_id: 'company-empty', name: '새로 만든 회사', business_type: 'IT · 소프트웨어', departments: allDepartmentIds }, goals: [], tasks: [], approvals: [], logs: [] },
      heavy: { label: '대량 데이터 (72건)', build: buildHeavy },
    },
    buildHeavy: buildHeavy,
  };
})();
