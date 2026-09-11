/**
 * 픽셀 컴퍼니 대시보드 미리보기 (더미 데이터).
 * src/pages/Dashboard.jsx 와 src/components/company/*.jsx 의 DOM 구조·클래스명을 그대로 재현한
 * 순수 JavaScript 버전입니다. 빌드나 백엔드 없이 이 파일이 있는 index.html을 브라우저로 열면 됩니다.
 */
(function () {
  var DUMMY = window.PIXEL_DUMMY;
  var departments = DUMMY.departments;
  var statusLabels = DUMMY.statusLabels;
  var pageNames = { dashboard: '대시보드', tasks: '목표별 칸반', agents: '에이전트' };

  function getDepartment(id) {
    for (var i = 0; i < departments.length; i++) if (departments[i].id === id) return departments[i];
    return departments[0];
  }
  function initialDepartments(type) {
    if (type === '마케팅 · 에이전시') return ['sales', 'marketing', 'design', 'hr', 'operations'];
    if (type === '컨설팅 · 전문 서비스') return ['sales', 'marketing', 'hr', 'operations'];
    return departments.map(function (d) { return d.id; });
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  /* ---------------------------------------------------------------- 아이콘
     실제 앱은 lucide-react를 사용합니다. 여기서는 같은 규격(24x24, stroke 2)의
     인라인 SVG로 대체했습니다. 형태는 근사치입니다. */
  var ICONS = {
    Plus: '<path d="M5 12h14M12 5v14"/>',
    Settings2: '<path d="M20 7h-9M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    ChevronRight: '<path d="m9 18 6-6-6-6"/>',
    ChevronLeft: '<path d="m15 18-6-6 6-6"/>',
    ChevronDown: '<path d="m6 9 6 6 6-6"/>',
    Sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    Menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    LayoutDashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    ListTodo: '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4M13 6h8M13 12h8M13 18h8"/>',
    Users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    Plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z"/>',
    ArrowUpRight: '<path d="M7 7h10v10M7 17 17 7"/>',
    Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    Boxes: '<rect x="2" y="13" width="8" height="8" rx="1"/><rect x="14" y="13" width="8" height="8" rx="1"/><rect x="8" y="3" width="8" height="8" rx="1"/>',
    Layers3: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m21 12-9 5-9-5M21 17l-9 5-9-5"/>',
    LoaderCircle: '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
    CircleCheck: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    Bot: '<path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>',
    Activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    Target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    Inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    Sparkles: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M18 3v4M20 5h-4M5 17v3M6.5 18.5h-3"/>',
    ArrowUp: '<path d="m5 12 7-7 7 7M12 19V5"/>',
    CornerDownLeft: '<path d="m9 10-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/>',
    Check: '<path d="M20 6 9 17l-5-5"/>',
    RotateCcw: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    X: '<path d="M18 6 6 18M6 6l12 12"/>',
    FileCheck2: '<path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m3 15 2 2 4-4"/>',
    Clock3: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6h4.5"/>',
    Mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
    Database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    Network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-3h14v3M12 13V8"/>',
  };
  function icon(name, size, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (cls ? ' class="' + cls + '"' : '') + ' aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  /* PixelPerson.jsx 와 동일한 픽셀 아트 */
  function pixelPerson(color, variant, size) {
    var hair = ['#493d51', '#72503b', '#343e53', '#ba8858'][(variant || 0) % 4];
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 20" shape-rendering="crispEdges" role="img" aria-label="픽셀 직원">' +
      '<ellipse cx="8" cy="19" rx="6" ry="1" fill="#293046" opacity=".12"/>' +
      '<path d="M4 2h8v2h1v6H3V4h1z" fill="' + hair + '"/><path d="M4 5h8v6H4zM6 11h4v2H6z" fill="#f0c8a5"/>' +
      '<path d="M4 3h8v3H7V5H4z" fill="' + hair + '"/><path d="M5 7h1v1H5zM10 7h1v1h-1z" fill="#343043"/>' +
      '<path d="M4 12h8v5H4zM2 13h2v3H2zM12 13h2v3h-2z" fill="' + color + '"/><path d="M7 12h2v3H7z" fill="#fff" opacity=".85"/>' +
      '<path d="M4 17h3v2H4zM9 17h3v2H9z" fill="#3e4259"/><path d="M2 16h2v1H2zM12 16h2v1h-2z" fill="#f0c8a5"/>' +
      ((variant || 0) === 0 ? '<path d="M4 0h2v1h1V0h2v1h1V0h2v2H4z" fill="#e3b75b"/>' : '') + '</svg>';
  }

  /* ---------------------------------------------------------------- 상태 */
  var state = {
    datasetKey: 'demo',
    data: null,
    page: 'dashboard',
    taskFilter: 'all',
    mobile: false,
    month: startOfMonth(new Date()),
    selectedDay: dayKey(new Date()),
    dialog: null,           // { type:'result'|'setup'|'connections', taskId? }
    draft: '',
    commandBusy: false,
    commandError: '',
    approvalUI: {},         // { [approvalId]: { revising, feedback, busy, error } }
    previewOpen: true,
    setupBusy: false,
    liveSeq: 0,
  };

  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function dayKey(d) { return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate(); }

  function loadDataset(key) {
    var source = DUMMY.datasets[key];
    var built = source.build ? source.build() : source;
    state.datasetKey = key;
    state.data = { company: clone(built.company), goals: clone(built.goals), tasks: clone(built.tasks), approvals: clone(built.approvals), logs: clone(built.logs) };
    state.approvalUI = {};
    state.taskFilter = 'all';
    state.dialog = null;
    state.draft = '';
    state.commandError = '';
    state.month = startOfMonth(new Date());
    state.selectedDay = dayKey(new Date());
    state.liveSeq = 0;
  }

  /* ---------------------------------------------------------------- 화면 조각 */
  function renderSidebar() {
    var items = [{ id: 'dashboard', label: '대시보드', icon: 'LayoutDashboard' }, { id: 'tasks', label: '전체 작업', icon: 'ListTodo' }, { id: 'agents', label: '에이전트', icon: 'Users' }];
    var company = state.data.company;
    var nav = items.map(function (item) {
      var active = state.page === item.id;
      return '<button data-action="page" data-page="' + item.id + '" class="nav-item' + (active ? ' active' : '') + '">' + icon(item.icon, 18) + '<span>' + esc(item.label) + '</span>' +
        (item.id === 'tasks' ? '<span class="nav-count">' + state.data.tasks.length + '</span>' : '') +
        (item.id === 'dashboard' && active ? '<i></i>' : '') + '</button>';
    }).join('');
    return '<aside class="company-sidebar">' +
      '<a class="brand" href="#" aria-label="픽셀 컴퍼니 홈"><span class="brand-mark">' + icon('Boxes', 24) + '</span><span>pixel company<span class="brand-dot">.</span></span></a>' +
      '<button class="workspace-switch" data-action="open-setup"><span class="workspace-icon">' + icon('Building2', 19) + '</span><span><strong>' + esc(company && company.name || '내 회사') + '</strong><small>나의 AI 워크스페이스</small></span>' + icon('ChevronDown', 15) + '</button>' +
      '<span class="nav-caption">WORKSPACE</span><nav>' + nav + '</nav>' +
      '<span class="nav-caption settings-caption">MANAGEMENT</span>' +
      '<button class="nav-item" data-action="open-connections">' + icon('Plug', 18) + '<span>외부 서비스 연동</span><span class="tiny-new">준비</span></button>' +
      '<button class="nav-item" data-action="open-setup">' + icon('Settings2', 18) + '<span>회사 설정</span></button>' +
      '<div class="sidebar-bottom"><div class="ceo-tip"><span class="tip-spark">✦</span><strong>작은 픽셀, 무한한 가능성</strong><p>대표님은 아이디어에 집중하세요.<br/>업무는 팀과 함께 정리해요.</p><button data-action="open-connections">연동 상태 확인하기' + icon('ArrowUpRight', 15) + '</button></div>' +
      '<div class="ceo-profile"><span class="ceo-avatar">' + pixelPerson('#62677c', 0, 33) + '</span><div><strong>대표님</strong><small>CEO · 워크스페이스 오너</small></div><span class="owner-dot"></span></div></div></aside>';
  }

  function renderStats() {
    var tasks = state.data.tasks;
    var running = tasks.filter(function (t) { return t.status === 'in_progress'; });
    var done = tasks.filter(function (t) { return t.status === 'completed'; });
    var seen = {}, active = 0;
    running.forEach(function (t) { var k = t.department + '-' + t.assignee; if (!seen[k]) { seen[k] = 1; active++; } });
    var departmentCount = (state.data.company && state.data.company.departments || []).length;
    var items = [
      { label: '전체 작업', value: tasks.length, unit: '건', icon: 'Layers3', color: 'purple', note: tasks.filter(function (t) { return t.status === 'queued'; }).length + '건의 작업이 배정을 기다려요' },
      { label: '진행 중인 작업', value: running.length, unit: '건', icon: 'LoaderCircle', color: 'blue', note: '각 부서에서 진행 중인 업무' },
      { label: '완료된 작업', value: done.length, unit: '건', icon: 'CircleCheck', color: 'green', note: '전체 작업의 ' + (tasks.length ? Math.round(done.length / tasks.length * 100) : 0) + '% 완료' },
      { label: '업무 중인 에이전트', value: active, unit: '/ ' + departmentCount * 4 + '명', icon: 'Bot', color: 'orange', note: departmentCount + '개 부서 · 팀장 1명 + 팀원 3명' },
    ];
    return '<section class="stats-grid" aria-label="업무 요약">' + items.map(function (item) {
      return '<div class="stat-card"><div class="stat-top"><span>' + esc(item.label) + '</span><span class="stat-icon ' + item.color + '">' + icon(item.icon, 18) + '</span></div>' +
        '<div class="stat-value">' + item.value + '<small>' + esc(item.unit) + '</small></div><p><span class="stat-bullet ' + item.color + '"></span>' + esc(item.note) + '</p></div>';
    }).join('') + '</section>';
  }

  function renderCalendar() {
    var month = state.month, tasks = state.data.tasks, goals = state.data.goals;
    var first = new Date(month.getFullYear(), month.getMonth(), 1);
    var start = new Date(first); start.setDate(1 - first.getDay());
    var cells = [];
    for (var i = 0; i < 42; i++) { var d = new Date(start); d.setDate(start.getDate() + i); cells.push(d); }
    var grid = cells.map(function (d) {
      var dayTasks = tasks.filter(function (t) { return dayKey(new Date(t.created_date)) === dayKey(d); });
      var cls = (d.getMonth() !== month.getMonth() ? 'other ' : '') + (state.selectedDay === dayKey(d) ? 'selected' : '');
      var dots = dayTasks.slice(0, 4).map(function (t) { return '<i class="' + t.status + '" title="' + esc(t.title) + '"></i>'; }).join('');
      return '<button class="' + cls + '" data-action="cal-day" data-day="' + dayKey(d) + '"><b>' + d.getDate() + '</b><span>' + dots + '</span>' + (dayTasks.length > 4 ? '<small>+' + (dayTasks.length - 4) + '</small>' : '') + '</button>';
    }).join('');
    var selectedTasks = tasks.filter(function (t) { return dayKey(new Date(t.created_date)) === state.selectedDay; });
    var agenda = selectedTasks.map(function (t) {
      var d = getDepartment(t.department);
      var goal = goals.filter(function (g) { return g.id === t.goal_id; })[0];
      return '<button data-action="open-task" data-task-id="' + t.id + '"><i class="' + t.status + '"></i><span><b>' + esc(t.title) + '</b><small>' + esc(goal ? goal.title : '기존 목표') + ' · ' + esc(d.name) + ' · ' + esc(t.assignee) + '</small></span><em>' + esc(statusLabels[t.status]) + '</em></button>';
    }).join('');
    return '<section class="panel calendar-panel"><div class="calendar-head"><div><h2>업무 캘린더</h2><p>작업 생성일과 현재 상태를 월간으로 확인하세요.</p></div>' +
      '<div><button data-action="cal-move" data-step="-1" aria-label="이전 달">' + icon('ChevronLeft', 16) + '</button><strong>' + month.getFullYear() + '년 ' + (month.getMonth() + 1) + '월</strong><button data-action="cal-move" data-step="1" aria-label="다음 달">' + icon('ChevronRight', 16) + '</button></div></div>' +
      '<div class="calendar-week">' + ['일', '월', '화', '수', '목', '금', '토'].map(function (v) { return '<span>' + v + '</span>'; }).join('') + '</div>' +
      '<div class="calendar-grid">' + grid + '</div>' +
      '<div class="calendar-agenda"><h3>선택한 날짜의 업무 <span>' + selectedTasks.length + '</span></h3>' + agenda + (selectedTasks.length ? '' : '<p>이 날짜에 생성된 업무가 없습니다.</p>') + '</div></section>';
  }

  function renderLogFeed() {
    var logs = state.data.logs.slice().sort(function (a, b) { return new Date(b.created_date) - new Date(a.created_date); }).slice(0, 12);
    var body = logs.map(function (log) {
      var task = state.data.tasks.filter(function (t) { return t.id === log.task_id; })[0];
      var d = getDepartment(log.department);
      return '<button' + (task ? ' data-action="open-task" data-task-id="' + task.id + '"' : '') + '><span class="log-level ' + log.level + '">' + esc(log.level) + '</span>' +
        '<div><b>' + esc(log.agent_name) + ' · ' + esc(d.name) + '</b><p>' + esc(log.message) + '</p><small>' + new Date(log.created_date).toLocaleString('ko-KR') + '</small></div></button>';
    }).join('');
    return '<section class="panel log-panel"><div class="section-heading"><div><h2>실시간 에이전트 로그</h2><p>팀장 에이전트의 분석·실행·결재 진행 상황입니다.</p></div>' + icon('Activity', 16) + '</div>' +
      '<div class="log-feed">' + body + (logs.length ? '' : '<div class="empty-state">' + icon('Activity', 25) + '<p>업무가 실행되면 진행 로그가 여기에 쌓입니다.</p></div>') + '</div></section>';
  }

  function renderKanbanCard(task) {
    var d = getDepartment(task.department);
    var approval = state.data.approvals.filter(function (a) { return a.task_id === task.id; })
      .sort(function (a, b) { return new Date(b.created_date) - new Date(a.created_date); })[0];
    var preview = approval && approval.preview_data || {};
    var ui = approval ? (state.approvalUI[approval.id] || {}) : {};
    var variant = Math.max(0, d.names.indexOf(task.assignee));
    var html = '<article class="kanban-card" style="border-top-color:' + d.color + '">' +
      '<button class="kanban-card-main" data-action="open-task" data-task-id="' + task.id + '"><span class="status-tag ' + task.status + '"><i></i>' + esc(statusLabels[task.status]) + '</span>' +
      '<h3>' + esc(task.title) + '</h3><p>' + esc(task.description) + '</p>' +
      '<span class="kanban-owner">' + pixelPerson(d.color, variant, 25) + '<b>' + esc(task.assignee) + '</b><small>' + esc(d.name) + ' · ' + (task.iteration || 1) + '회차</small></span></button>';
    if (task.status === 'pending_approval' && approval && approval.status === 'PENDING') {
      html += '<div class="approval-inline"><strong>결재안</strong><b>' + esc(preview.subject) + '</b><p>' + esc(preview.summary) + '</p>' +
        '<details><summary>이메일 본문 보기</summary><div>' + esc(preview.body) + '</div></details>' +
        (ui.revising ? '<textarea rows="3" data-action="approval-feedback" data-approval-id="' + approval.id + '" placeholder="수정할 내용을 입력하세요.">' + esc(ui.feedback || '') + '</textarea>' : '') +
        '<div class="approval-actions">' +
        '<button class="approve"' + (ui.busy ? ' disabled' : '') + ' data-action="approval-decide" data-approval-id="' + approval.id + '" data-decision="APPROVED">' + (ui.busy === 'APPROVED' ? icon('LoaderCircle', 13, 'animate-spin') : icon('Check', 13)) + '승인</button>' +
        '<button' + (ui.busy ? ' disabled' : '') + ' data-action="' + (ui.revising ? 'approval-decide' : 'approval-revise') + '" data-approval-id="' + approval.id + '" data-decision="REVISION_REQUESTED">' + icon('RotateCcw', 13) + '수정</button>' +
        '<button class="reject"' + (ui.busy ? ' disabled' : '') + ' data-action="approval-decide" data-approval-id="' + approval.id + '" data-decision="REJECTED">' + icon('X', 13) + '반려</button>' +
        '</div>' + (ui.error ? '<p class="form-error">' + esc(ui.error) + '</p>' : '') + '</div>';
    }
    if (task.result) {
      html += '<button class="result-preview" data-action="open-task" data-task-id="' + task.id + '"><b>저장된 결과물</b><span>' + esc(task.result.slice(0, 120)) + (task.result.length > 120 ? '…' : '') + '</span></button>';
    }
    return html + '</article>';
  }

  function renderKanban() {
    var goals = state.taskFilter === 'all' ? state.data.goals : state.data.goals.filter(function (g) { return g.department === state.taskFilter; });
    var tasks = state.taskFilter === 'all' ? state.data.tasks : state.data.tasks.filter(function (t) { return t.department === state.taskFilter; });
    var columns = goals.slice();
    var hasLegacy = tasks.some(function (t) { return !goals.some(function (g) { return g.id === t.goal_id; }); });
    if (hasLegacy) columns.push({ id: 'legacy', title: '기존 업무', description: '목표 연결 전 등록된 업무' });
    var board = columns.map(function (goal) {
      var items = tasks.filter(function (t) { return goal.id === 'legacy' ? !t.goal_id : t.goal_id === goal.id; });
      return '<div class="kanban-column"><header><span>' + icon('Target', 15) + '</span><div><h3>' + esc(goal.title) + '</h3><p>' + esc(goal.description) + '</p></div><b>' + items.length + '</b></header>' +
        '<div class="kanban-cards">' + items.map(renderKanbanCard).join('') + (items.length ? '' : '<div class="kanban-empty">아직 연결된 업무가 없어요.</div>') + '</div></div>';
    }).join('');
    return '<section class="kanban-section"><div class="section-heading"><div><h2>목표별 업무 보드 <span class="heading-count">' + tasks.length + '</span></h2><p>회사와 부서의 목표마다 담당자, 진행 상태, 결과물을 확인하세요.</p></div></div>' +
      (columns.length ? '<div class="kanban-board">' + board + '</div>' : '<div class="panel empty-state">' + icon('Inbox', 28) + '<strong>등록된 목표가 없어요</strong><p>아래 지시창에서 첫 목표를 입력해 주세요.</p></div>') + '</section>';
  }

  function renderAgents() {
    var ids = state.data.company && state.data.company.departments || [];
    return '<div class="agent-directory">' + ids.map(function (id) {
      var d = getDepartment(id);
      var cards = d.names.map(function (name, i) {
        var work = state.data.tasks.filter(function (t) { return t.department === id && t.assignee === name && t.status !== 'completed'; });
        var running = work.some(function (t) { return t.status === 'in_progress'; });
        return '<div class="agent-card"><span class="agent-portrait" style="background:' + d.pale + '">' + pixelPerson(d.color, i, 58) + '</span>' +
          '<div><h3>' + esc(name) + (i === 0 ? '<span>LEAD</span>' : '') + '</h3><p>' + esc(d.roles[i]) + '</p><span class="status-tag ' + (running ? 'in_progress' : 'queued') + '"><i></i>' + (running ? '업무 중' : '대기 중') + '</span></div>' +
          '<div class="agent-work">' + (work.length ? work.map(function (t) { return '<button data-action="open-task" data-task-id="' + t.id + '">' + esc(t.title) + '</button>'; }).join('') : '<small>배정된 작업이 없습니다.</small>') + '</div></div>';
      }).join('');
      return '<section class="panel agent-team"><div class="section-heading"><h2><span class="department-dot" style="background:' + d.color + '"></span>' + esc(d.name) + '</h2><span class="muted-small">팀장 1 · 팀원 3</span></div><div class="agent-grid">' + cards + '</div></section>';
    }).join('') + '</div>';
  }

  function renderCommandBar() {
    var disabled = state.commandBusy || state.draft.trim().length < 3;
    return '<div class="command-area"><form class="command-form" data-action="command-submit"><span class="command-icon">' + icon('Sparkles', 21) + '</span>' +
      '<div class="command-input"><label for="ceo-command">대표님, 어떤 업무를 맡길까요?</label>' +
      '<input id="ceo-command" data-action="command-input" placeholder="예: 마케팅팀, 다음 주 SNS 콘텐츠 기획안을 준비해 줘" value="' + esc(state.draft) + '" maxlength="1500"' + (state.commandBusy ? ' disabled' : '') + '/></div>' +
      '<span class="command-enter">' + icon('CornerDownLeft', 13) + '</span>' +
      '<button class="command-send" aria-label="업무 지시 보내기"' + (disabled ? ' disabled' : '') + '>' + (state.commandBusy ? icon('LoaderCircle', 19, 'animate-spin') : icon('ArrowUp', 20)) + '</button></form>' +
      (state.commandError ? '<p class="form-error" role="alert">' + esc(state.commandError) + '</p>' : '') +
      '<p class="command-hint">' + (state.commandBusy ? '목표를 분석하고 담당 부서와 에이전트를 배정하고 있어요…' : 'AI가 목표를 만들고 담당 에이전트의 실행·결재 흐름을 시작해요.') + '</p></div>';
  }

  function dialogShell(inner, extraClass) {
    return '<div class="preview-dialog-overlay" data-action="close-dialog"></div>' +
      '<div class="preview-dialog company-dialog ' + (extraClass || '') + '" role="dialog" aria-modal="true">' + inner +
      '<button class="preview-dialog-close" data-action="close-dialog" aria-label="닫기">' + icon('X', 16) + '</button></div>';
  }

  function renderResultDialog(task) {
    var d = getDepartment(task.department);
    var approval = state.data.approvals.filter(function (a) { return a.task_id === task.id; })
      .sort(function (a, b) { return new Date(b.created_date) - new Date(a.created_date); })[0];
    var preview = approval && approval.preview_data || {};
    var goal = state.data.goals.filter(function (g) { return g.id === task.goal_id; })[0];
    var logs = state.data.logs.filter(function (l) { return l.task_id === task.id; });
    var inner = '<div class="preview-dialog-header"><span class="dialog-feature-icon" style="color:' + d.color + ';background:' + d.pale + '">' + icon('FileCheck2', 24) + '</span>' +
      '<h2>' + esc(task.title) + '</h2><p id="result-description">' + esc(goal ? goal.title : '기존 목표') + ' · ' + esc(d.name) + ' · ' + esc(task.assignee) + ' · ' + esc(statusLabels[task.status]) + '</p></div>' +
      '<section><h3>업무 내용</h3><p>' + esc(task.description) + '</p></section>' +
      (preview.subject ? '<section><h3>실행 결과물</h3><b>' + esc(preview.subject) + '</b><p>' + esc(preview.body) + '</p></section>' : '') +
      (task.result ? '<section><h3>저장소 기록</h3><p>' + esc(task.result) + '</p><div class="result-score">달성률 <strong>' + (task.progress_rate || task.progress || 0) + '%</strong> · ' + (task.iteration || 1) + '회차</div></section>' : '') +
      '<section><h3>실행 이력</h3><div class="result-logs">' + logs.map(function (log) {
        return '<div><b>' + esc(log.agent_name) + '</b><span>' + esc(log.message) + '</span><small>' + new Date(log.created_date).toLocaleString('ko-KR') + '</small></div>';
      }).join('') + (logs.length ? '' : '<p>아직 기록된 실행 로그가 없습니다.</p>') + '</div></section>';
    return dialogShell(inner, 'result-dialog');
  }

  function renderSetupDialog() {
    var company = state.data.company || {};
    var ids = company.departments || [];
    var inner = '<div class="preview-dialog-header"><span class="dialog-feature-icon">' + icon('Building2', 24) + '</span><h2>회사 설정</h2>' +
      '<p id="setup-description">회사의 이름과 비즈니스 정보를 관리하세요.</p></div>' +
      '<form class="company-form" data-action="setup-submit">' +
      '<label>회사 이름<input name="name" required maxlength="60" value="' + esc(company.name || '') + '" placeholder="예: 픽셀 스튜디오"/></label>' +
      '<label>비즈니스 종류<select name="business_type">' + ['IT · 소프트웨어', '마케팅 · 에이전시', '컨설팅 · 전문 서비스', '기타'].map(function (t) {
        return '<option' + (company.business_type === t ? ' selected' : '') + '>' + t + '</option>';
      }).join('') + '</select></label>' +
      '<div class="setup-preview"><strong>현재 부서 구성</strong><div>' + ids.map(function (id) { return '<span>' + esc(getDepartment(id).name) + '</span>'; }).join('') + '</div>' +
      '<p>부서마다 팀장 1명 + 팀원 3명 · 총 ' + ids.length * 4 + '명 (기존 부서는 유지됩니다)</p></div>' +
      '<p class="form-notice">외부 서비스는 아직 연결되지 않았으며, 작업 상태는 직접 관리할 수 있어요.</p>' +
      '<button class="primary-button full-width"' + (state.setupBusy ? ' disabled' : '') + '>' + (state.setupBusy ? icon('LoaderCircle', 17, 'animate-spin') : icon('Building2', 17)) + ' ' + (state.setupBusy ? '저장 중…' : '변경사항 저장') + '</button></form>';
    return dialogShell(inner);
  }

  function renderConnectionsDialog() {
    var items = [{ icon: 'Mail', title: '메일 발송', text: '메일 계정 연결 및 발송 승인 필요' }, { icon: 'Database', title: '데이터 수집 · 처리', text: '대상 서비스와 접근 권한 설정 필요' }, { icon: 'Network', title: 'MCP 연결', text: '연결할 도구와 사용 범위 설정 필요' }];
    var inner = '<div class="preview-dialog-header"><span class="dialog-feature-icon">' + icon('Plug', 24) + '</span><h2>외부 서비스 연동</h2><p id="connections-description">현재 연결된 서비스가 없습니다.</p></div>' +
      '<div class="connection-list">' + items.map(function (item) {
        return '<div>' + icon(item.icon, 22) + '<span><strong>' + item.title + '</strong><small>' + item.text + '</small></span><em>미연결</em></div>';
      }).join('') + '</div>' +
      '<p class="form-notice">지금은 자연어 업무 배정과 진행 현황 관리를 사용할 수 있어요. 실제 자동화를 추가하려면 앱 제작 채팅에서 연결하려는 서비스와 업무를 알려 주세요.</p>' +
      '<button class="primary-button full-width" data-action="close-dialog">확인</button>';
    return dialogShell(inner);
  }

  function renderPreviewBar() {
    var head = '<div class="preview-bar-head">' + icon('Boxes', 14) + '<span>더미 데이터 미리보기</span>' +
      '<button data-action="preview-toggle" aria-label="' + (state.previewOpen ? '미리보기 패널 접기' : '미리보기 패널 펼치기') + '">' + (state.previewOpen ? '접기' : '펼치기') + '</button></div>';
    if (!state.previewOpen) return '<div class="preview-bar collapsed">' + head + '</div>';
    var options = Object.keys(DUMMY.datasets).map(function (key) {
      return '<option value="' + key + '"' + (state.datasetKey === key ? ' selected' : '') + '>' + esc(DUMMY.datasets[key].label) + '</option>';
    }).join('');
    return '<div class="preview-bar">' + head +
      '<label>데이터셋<select data-action="dataset">' + options + '</select></label>' +
      '<div class="preview-bar-actions"><button data-action="reset-data">데이터 초기화</button><button data-action="page" data-page="tasks">칸반 보기</button></div>' +
      '<p>백엔드 없이 동작하는 미리보기입니다. 변경 사항은 새로고침하면 사라집니다.</p></div>';
  }

  function render() {
    var heading = state.page === 'dashboard' ? '한눈에 보는 우리 회사' : state.page === 'tasks' ? '우리 팀의 모든 작업' : '함께 일하는 픽셀 팀원들';
    var sub = state.page === 'dashboard' ? '대표님의 아이디어가 성과가 되는 곳. 오늘도 우리 팀과 함께해요.' : state.page === 'tasks' ? '부서별 진행 상황부터 완료 결과까지, 놓치지 않고 확인하세요.' : '각 부서의 팀장 1명과 팀원 3명이 대표님의 업무를 기다려요.';
    var content = state.page === 'dashboard' ? '<div class="dashboard-workspace">' + renderCalendar() + renderLogFeed() + '</div>' : state.page === 'tasks' ? renderKanban() : renderAgents();
    var dialog = '';
    if (state.dialog && state.dialog.type === 'result') {
      var task = state.data.tasks.filter(function (t) { return t.id === state.dialog.taskId; })[0];
      dialog = task ? renderResultDialog(task) : '';
    } else if (state.dialog && state.dialog.type === 'setup') dialog = renderSetupDialog();
    else if (state.dialog && state.dialog.type === 'connections') dialog = renderConnectionsDialog();

    document.getElementById('root').innerHTML =
      '<div class="pixel-company"><div class="sidebar-container' + (state.mobile ? ' open' : '') + '">' + renderSidebar() + '</div>' +
      (state.mobile ? '<button class="mobile-shade" aria-label="메뉴 닫기" data-action="mobile-close"></button>' : '') +
      '<div class="company-shell"><header class="company-topbar"><button class="mobile-menu" data-action="mobile-open" aria-label="메뉴 열기">' + icon('Menu', 19) + '</button>' +
      '<div class="breadcrumb">워크스페이스' + icon('ChevronRight', 12) + '<strong>' + pageNames[state.page] + '</strong></div>' +
      '<div class="topbar-meta"><time>' + new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) + '</time><span class="workspace-mode"><i></i>내 워크스페이스</span></div></header>' +
      '<main class="company-main"><div class="page-heading"><div><div class="eyebrow">' + icon('Sun', 12) + ' YOUR TEAM, ONE PIXEL AT A TIME</div>' +
      '<h1>' + heading + (state.page === 'dashboard' ? '<span>✦</span>' : '') + '</h1><p>' + sub + '</p></div>' +
      '<div class="heading-actions"><button class="secondary-button" data-action="open-setup">' + icon('Settings2', 14) + '회사 설정</button>' +
      '<button class="primary-button" data-action="focus-command" aria-label="새 업무 지시">' + icon('Plus', 16) + '새 업무 지시</button></div></div>' +
      renderStats() + content + renderCommandBar() +
      '</main></div>' + dialog + '</div>' + renderPreviewBar();
  }

  /* ---------------------------------------------------------------- 동작 */
  var KEYWORDS = {
    sales: ['영업', '고객', '세일즈', '리드', '계약', '매출', '상담', '제안', '미팅'],
    marketing: ['마케팅', 'sns', '콘텐츠', '광고', '캠페인', '홍보', '뉴스레터', '인스타', '블로그'],
    development: ['개발', 'api', '버그', '서버', '배포', '코드', '앱', '기능', '성능'],
    design: ['디자인', '시안', 'ui', 'ux', '로고', '배너', '썸네일', '브랜드'],
    hr: ['채용', '인사', '온보딩', '면접', '조직', '복지', '평가', '문화'],
    operations: ['비용', '정산', '회계', '계약서', '문서', '운영', '총무', '예산', '구매', '결산'],
  };
  function routeDepartment(text) {
    var lower = text.toLowerCase(), best = 'operations', bestScore = 0;
    (state.data.company.departments || []).forEach(function (id) {
      var score = 0;
      (KEYWORDS[id] || []).forEach(function (word) { if (lower.indexOf(word) >= 0) score++; });
      if (lower.indexOf(getDepartment(id).name) >= 0) score += 2;
      if (score > bestScore) { bestScore = score; best = id; }
    });
    return best;
  }
  function nowIso() { return new Date().toISOString(); }
  function addLog(task, agentName, level, message) {
    state.data.logs.push({ id: 'log-live-' + (++state.liveSeq), company_id: task.company_id, task_id: task.id, department: task.department, agent_name: agentName, level: level, message: message, created_date: nowIso() });
  }
  function assignTask(text) {
    var departmentId = routeDepartment(text);
    var d = getDepartment(departmentId);
    var seq = ++state.liveSeq;
    var goal = { id: 'goal-live-' + seq, company_id: state.data.company.company_id || state.data.company.id, department: departmentId, status: 'active', title: text.length > 28 ? text.slice(0, 28) + '…' : text, description: text, created_date: nowIso() };
    var assignee = d.names[1 + (seq % 3)];
    var task = {
      id: 'task-live-' + seq, company_id: goal.company_id, goal_id: goal.id, department: departmentId, title: text.length > 40 ? text.slice(0, 40) + '…' : text,
      assignee: assignee, status: 'in_progress', progress: 15, progress_rate: 15, priority: 'normal', iteration: 1,
      description: text, result: '', selected_model: 'gemini_3_flash', created_date: nowIso(), updated_date: nowIso(),
    };
    state.data.goals.unshift(goal);
    state.data.tasks.unshift(task);
    addLog(task, d.names[0], 'INFO', '대표님의 지시를 분석해 ' + d.name + '으로 배정했습니다.');
    addLog(task, assignee, 'ACTION', '작업을 시작했습니다. 진행 상황을 기록합니다.');
    return task;
  }
  function decideApproval(approvalId, decision) {
    var approval = state.data.approvals.filter(function (a) { return a.id === approvalId; })[0];
    if (!approval) return;
    var ui = state.approvalUI[approvalId] || {};
    approval.status = decision;
    approval.feedback_memo = ui.feedback || '';
    var task = state.data.tasks.filter(function (t) { return t.id === approval.task_id; })[0];
    var d = getDepartment(approval.department);
    if (task) {
      if (decision === 'APPROVED') {
        task.status = 'completed'; task.progress = 100; task.progress_rate = 100;
        task.result = (approval.preview_data && approval.preview_data.subject ? approval.preview_data.subject + '\n\n' : '') + (approval.preview_data && approval.preview_data.body || '');
        addLog(task, d.names[0], 'SUCCESS', '대표님 승인으로 결재안을 확정했습니다.');
      } else if (decision === 'REVISION_REQUESTED') {
        task.status = 'in_progress'; task.progress = 60; task.progress_rate = 60; task.iteration = (task.iteration || 1) + 1;
        addLog(task, task.assignee, 'ACTION', '수정 요청을 반영해 다시 작업합니다.' + (ui.feedback ? ' (요청: ' + ui.feedback + ')' : ''));
      } else {
        task.status = 'cancelled';
        addLog(task, d.names[0], 'WARN', '대표님 반려로 작업을 종료했습니다.' + (ui.feedback ? ' (사유: ' + ui.feedback + ')' : ''));
      }
      task.updated_date = nowIso();
    }
    delete state.approvalUI[approvalId];
  }

  /* ---------------------------------------------------------------- 이벤트 */
  function closest(el, selector) { return el && el.closest ? el.closest(selector) : null; }

  document.addEventListener('click', function (event) {
    var el = closest(event.target, '[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'command-submit' || action === 'setup-submit' || action === 'command-input' || action === 'approval-feedback' || action === 'dataset') return;
    if (el.tagName === 'A') event.preventDefault();

    if (action === 'page') { state.page = el.getAttribute('data-page'); state.taskFilter = 'all'; state.mobile = false; window.scrollTo({ top: 0 }); }
    else if (action === 'open-setup') { state.dialog = { type: 'setup' }; state.mobile = false; }
    else if (action === 'open-connections') { state.dialog = { type: 'connections' }; state.mobile = false; }
    else if (action === 'close-dialog') state.dialog = null;
    else if (action === 'open-task') state.dialog = { type: 'result', taskId: el.getAttribute('data-task-id') };
    else if (action === 'mobile-open') state.mobile = true;
    else if (action === 'mobile-close') state.mobile = false;
    else if (action === 'cal-move') state.month = new Date(state.month.getFullYear(), state.month.getMonth() + Number(el.getAttribute('data-step')), 1);
    else if (action === 'cal-day') state.selectedDay = el.getAttribute('data-day');
    else if (action === 'approval-revise') { var id = el.getAttribute('data-approval-id'); state.approvalUI[id] = state.approvalUI[id] || {}; state.approvalUI[id].revising = true; }
    else if (action === 'approval-decide') {
      var approvalId = el.getAttribute('data-approval-id'), decision = el.getAttribute('data-decision');
      state.approvalUI[approvalId] = state.approvalUI[approvalId] || {};
      state.approvalUI[approvalId].busy = decision;
      render();
      setTimeout(function () { decideApproval(approvalId, decision); render(); }, 350);
      return;
    }
    else if (action === 'focus-command') { var input = document.getElementById('ceo-command'); if (input) { input.focus(); } return; }
    else if (action === 'reset-data') loadDataset(state.datasetKey);
    else if (action === 'preview-toggle') state.previewOpen = !state.previewOpen;
    else return;
    render();
  });

  document.addEventListener('input', function (event) {
    var el = closest(event.target, '[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'command-input') {
      var wasDisabled = state.draft.trim().length < 3;
      state.draft = el.value;
      if (wasDisabled !== (state.draft.trim().length < 3)) {
        var send = document.querySelector('.command-send');
        if (send) send.disabled = state.draft.trim().length < 3;
      }
    } else if (action === 'approval-feedback') {
      var id = el.getAttribute('data-approval-id');
      state.approvalUI[id] = state.approvalUI[id] || {};
      state.approvalUI[id].feedback = el.value;
    }
  });

  document.addEventListener('change', function (event) {
    var el = closest(event.target, '[data-action="dataset"]');
    if (!el) return;
    loadDataset(el.value);
    render();
  });

  document.addEventListener('submit', function (event) {
    var el = closest(event.target, '[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'command-submit') {
      event.preventDefault();
      var text = state.draft.trim();
      if (text.length < 3 || state.commandBusy) return;
      state.commandBusy = true; state.commandError = '';
      render();
      setTimeout(function () {
        var task = assignTask(text);
        state.commandBusy = false; state.draft = '';
        state.dialog = { type: 'result', taskId: task.id };
        render();
      }, 700);
    } else if (action === 'setup-submit') {
      event.preventDefault();
      var form = el;
      var name = form.querySelector('[name=name]').value.trim();
      var type = form.querySelector('[name=business_type]').value;
      if (!name) return;
      state.setupBusy = true;
      render();
      setTimeout(function () {
        state.data.company.name = name;
        state.data.company.business_type = type;
        state.setupBusy = false;
        state.dialog = null;
        render();
      }, 400);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.dialog) { state.dialog = null; render(); }
  });

  loadDataset('demo');
  render();
})();
