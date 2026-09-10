export const departments = [
  { id: 'sales', name: '영업팀', english: 'SALES', color: '#8661db', pale: '#f2ecfc', icon: 'TrendingUp', names: ['세일', '루키', '제이', '레오'], roles: ['영업 팀장', '리드 발굴', '고객 관리', '영업 분석'] },
  { id: 'marketing', name: '마케팅팀', english: 'MARKETING', color: '#e3a33f', pale: '#fff6e7', icon: 'Megaphone', names: ['마크', '소라', '루나', '노아'], roles: ['마케팅 팀장', '콘텐츠 기획', '캠페인 관리', '시장 조사'] },
  { id: 'development', name: '개발팀', english: 'DEVELOPMENT', color: '#5a91dd', pale: '#edf4fd', icon: 'Code2', names: ['데브', '코디', '버그', '테오'], roles: ['개발 팀장', '프론트엔드', '품질 관리', '백엔드'] },
  { id: 'design', name: '디자인팀', english: 'DESIGN', color: '#df86a1', pale: '#fdf0f5', icon: 'Palette', names: ['드로', '모모', '피카', '비비'], roles: ['디자인 팀장', 'UI 디자인', '브랜드 디자인', '그래픽 디자인'] },
  { id: 'hr', name: '인사팀', english: 'PEOPLE', color: '#53a58c', pale: '#eaf6f1', icon: 'Users', names: ['피플', '하루', '온유', '미나'], roles: ['인사 팀장', '채용 관리', '조직 문화', '인사 운영'] },
  { id: 'operations', name: '경영지원팀', english: 'OPERATIONS', color: '#8390ae', pale: '#f0f2f7', icon: 'BriefcaseBusiness', names: ['오피', '핀', '정리', '보리'], roles: ['경영지원 팀장', '재무 관리', '문서 관리', '운영 지원'] },
];
export const statusLabels = { queued: '대기 중', in_progress: '진행 중', completed: '완료', cancelled: '취소됨' };
export const demoCompany = { name: '픽셀 컴퍼니', business_type: 'IT · 소프트웨어', departments: departments.map(d => d.id) };
const samples = [
  ['잠재 고객 리드 리스트 정리', 'sales', 'in_progress', 65, 'high', '레오'],
  ['9월 SNS 콘텐츠 캘린더 기획', 'marketing', 'in_progress', 40, 'normal', '소라'],
  ['랜딩 페이지 반응형 UI 개발', 'development', 'in_progress', 80, 'high', '코디'],
  ['브랜드 가이드라인 초안 작성', 'design', 'in_progress', 35, 'normal', '피카'],
  ['신규 입사자 온보딩 가이드', 'hr', 'completed', 100, 'normal', '하루'],
  ['월간 비용 내역 정리', 'operations', 'completed', 100, 'normal', '핀'],
  ['신규 서비스 경쟁사 리서치', 'marketing', 'queued', 0, 'normal', '루나'],
  ['고객 미팅 후속 메일 초안', 'sales', 'queued', 0, 'high', '제이'],
];
export const demoTasks = samples.map((s, i) => ({ id: `demo-${i}`, title: s[0], department: s[1], status: s[2], progress: s[3], priority: s[4], assignee: s[5], description: '대시보드 사용 방법을 보여주는 예시 작업입니다. 내 회사를 만들면 실제 업무를 등록하고 관리할 수 있습니다.', result: s[2] === 'completed' ? '예시 완료 내역입니다. 실제 외부 업무가 실행된 것은 아닙니다.' : '', created_date: new Date(Date.now() - (i + 1) * 3600000).toISOString(), updated_date: new Date(Date.now() - (i + 1) * 1800000).toISOString() }));
export function getDepartment(id) { return departments.find(d => d.id === id) || departments[0]; }
export function initialDepartments(type) { return type === '마케팅 · 에이전시' ? ['sales', 'marketing', 'design', 'hr', 'operations'] : type === '컨설팅 · 전문 서비스' ? ['sales', 'marketing', 'hr', 'operations'] : departments.map(d => d.id); }