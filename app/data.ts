export type MaterialStatus = 'ready' | 'progress' | 'todo' | 'na';

export type Material = {
  key: string;
  label: string;
  requirement: string;
  owner: '我' | '中介' | '推荐人' | '共同';
  initialStatus: MaterialStatus;
};

export type Program = {
  id: string;
  shortName: string;
  university: string;
  program: string;
  region: '英国' | '美国' | '新加坡';
  city: string;
  round: string;
  deadline: string;
  deadlineSort: string;
  verified: boolean;
  strategy: string;
  applicationUrl: string;
  scholarship: string;
  scholarshipMode: string;
  scholarshipUrl: string;
  recommenders: number;
  materials: Material[];
};

const common = {
  transcript: { key: 'transcript', label: '成绩单', requirement: '中英文正式成绩单', owner: '我', initialStatus: 'ready' },
  cv: { key: 'cv', label: 'CV', requirement: '更新并导出学校定制 PDF', owner: '共同', initialStatus: 'progress' },
  english: { key: 'english', label: '英语成绩', requirement: '按项目核对豁免、总分与单项', owner: '我', initialStatus: 'ready' },
  proof: { key: 'proof', label: '在读证明', requirement: '在读阶段替代学位证', owner: '我', initialStatus: 'ready' },
} satisfies Record<string, Material>;

const m = (key: string, label: string, requirement: string, owner: Material['owner'], initialStatus: MaterialStatus = 'todo'): Material => ({ key, label, requirement, owner, initialStatus });
const base = (...items: Material[]) => [common.transcript, common.proof, common.english, ...items];

export const programs: Program[] = [
  {
    id: 'P01', shortName: 'Oxford SDS', university: 'University of Oxford', program: 'MSc Social Data Science', region: '英国', city: 'Oxford', round: '主截止 / funding', deadline: '预计 2027-01 上旬', deadlineSort: '2027-01-08', verified: false, strategy: '12 月完成，等 2027/28 官网发布日期后复核。', applicationUrl: 'https://www.ox.ac.uk/admissions/graduate/courses/msc-social-data-science', scholarship: 'Clarendon 等', scholarshipMode: '多数在课程截止前提交即自动考虑', scholarshipUrl: 'https://www.ox.ac.uk/admissions/graduate/fees-and-funding/oxford-funding', recommenders: 3,
    materials: base(m('essays', '双 Essay', '研究计划与技术准备，各 ≤500 词', '共同', 'progress'), m('rl', '推荐信', '3 封学术推荐信', '推荐人', 'progress'), m('writing', '学术写作', '1 篇，≤2,000 词', '我')),
  },
  {
    id: 'P02', shortName: 'Cambridge SciComp', university: 'University of Cambridge', program: 'MPhil in Scientific Computing', region: '英国', city: 'Cambridge', round: 'Funding deadline', deadline: '预计 2027-01 上旬', deadlineSort: '2027-01-08', verified: false, strategy: '按 funding deadline 倒排；Gates 需额外第 3 位推荐人。', applicationUrl: 'https://www.postgraduate.study.cam.ac.uk/courses/directory/pcphmpscm/apply', scholarship: 'Funding Competition / Gates', scholarshipMode: '申请表内主动勾选；Gates 有额外材料', scholarshipUrl: 'https://www.postgraduate.study.cam.ac.uk/courses/directory/pcphmpscm/finance', recommenders: 2,
    materials: base(common.cv, m('statement', '申请陈述', 'Statement 1,500 字符 + 短答', '共同'), m('rl', '推荐信', '2 封；Gates 为 3 封', '推荐人', 'progress'), m('samples', '课程作品', '2 份课程作业或论文样本', '我')),
  },
  {
    id: 'P03', shortName: 'Imperial BA & AI', university: 'Imperial College London', program: 'MSc Business Analytics & AI', region: '英国', city: 'London', round: 'Round 1', deadline: '2026-09-29', deadlineSort: '2026-09-29', verified: true, strategy: '当前最紧急；优先完成 3 篇文书与推荐人 portal 信息。', applicationUrl: 'https://www.imperial.ac.uk/business-school/masters/business-analytics/admissions/', scholarship: 'Imperial Excellence / 专项奖', scholarshipMode: 'Excellence 自动；部分专项需额外 essay', scholarshipUrl: 'https://www.imperial.ac.uk/business-school/masters/business-analytics/fees-and-funding/', recommenders: 2,
    materials: base(common.cv, m('essays', '三篇 Essay', 'Career 350 词；Why Imperial 500 词；Values 500 词', '共同', 'progress'), m('rl', '推荐信', '2 封：2 学术或 1 学术 + 1 职业', '推荐人', 'progress'), m('gre', 'GRE/GMAT', '可选；强数理成绩可增益', '我', 'progress')),
  },
  {
    id: 'P04', shortName: 'UCL BA', university: 'University College London', program: 'MSc Business Analytics', region: '英国', city: 'London', round: '预计 Round 1', deadline: '预计 2026-12 上旬', deadlineSort: '2026-12-08', verified: false, strategy: '开放后核验首轮日期；PS 必须覆盖官网五问。', applicationUrl: 'https://www.ucl.ac.uk/prospective-students/graduate/taught-degrees/business-analytics-msc', scholarship: 'BA Scholarship / Global Masters', scholarshipMode: '项目奖自动；Global Masters 通常单独申请', scholarshipUrl: 'https://www.mgmt.ucl.ac.uk/business-analytics', recommenders: 1,
    materials: base(common.cv, m('ps', 'Personal Statement', '回答项目页 5 个指定问题', '共同'), m('rl', '推荐信', '1 封，应届生使用学术推荐', '推荐人', 'progress')),
  },
  {
    id: 'P05', shortName: 'Edinburgh BA', university: 'University of Edinburgh', program: 'MSc Business Analytics', region: '英国', city: 'Edinburgh', round: '预计 Round 1', deadline: '预计 2026-10 中旬', deadlineSort: '2026-10-15', verified: false, strategy: '尽量首轮；推荐信最终数量以 portal 为准。', applicationUrl: 'https://study.ed.ac.uk/programmes/postgraduate-taught/929-business-analytics', scholarship: "Dean's Excellence 等", scholarshipMode: '先获 offer，再单独申请', scholarshipUrl: 'https://www.business-school.ed.ac.uk/msc/business-analytics/scholarships-funding', recommenders: 1,
    materials: base(m('ps', 'Personal Statement', '≤3,500 字符', '共同'), m('skills', 'Skills Statement', '相关知识与训练，≤3,500 字符', '共同'), m('rl', '推荐信', '通常 1 封，以 portal 为准', '推荐人', 'progress')),
  },
  {
    id: 'P06', shortName: 'NUS DSS', university: 'National University of Singapore', program: 'MSc Data Science for Sustainability', region: '新加坡', city: 'Singapore', round: 'Regular', deadline: '2027-01-31', deadlineSort: '2027-01-31', verified: true, strategy: '10 月 1 日开放；不误交 PS/推荐信，重点准备财力证明。', applicationUrl: 'https://www.stat.nus.edu.sg/education/graduate/msc-in-data-science-for-sustainability/prospective-students/', scholarship: 'ASEAN MSc / GRTII', scholarshipMode: '中国籍通常不符 ASEAN；GRTII 需主动联系且有服务期', scholarshipUrl: 'https://www.stat.nus.edu.sg/education/graduate/msc-in-data-science-for-sustainability/prospective-students/', recommenders: 0,
    materials: base(m('ranking', '排名/GPA证明', '如适用上传', '我', 'ready'), m('finance', '财力证明', '银行存款不少于 SGD 30,000；资助信如适用', '我'), m('passport', '护照信息页', '只存私密盘，不上传公开仓库', '我', 'ready'), m('ps', 'PS / 推荐信', '官网明确不要求', '我', 'na')),
  },
  {
    id: 'P07', shortName: 'NTU MSBA', university: 'Nanyang Technological University', program: 'MSc Business Analytics', region: '新加坡', city: 'Singapore', round: 'Round 1', deadline: '2026-11-30', deadlineSort: '2026-11-30', verified: true, strategy: 'R1 申请同时完成奖学金勾选与奖学金 essay。', applicationUrl: 'https://www.ntu.edu.sg/business/admissions/graduate-studies/msc-business-analytics/admissions', scholarship: 'Merit / Diversity', scholarshipMode: '申请表内主动选择并完成奖学金 essay', scholarshipUrl: 'https://www.ntu.edu.sg/business/admissions/graduate-studies/msc-business-analytics/admissions', recommenders: 2,
    materials: base(common.cv, m('essays', '两篇 Essay', 'Career 200 词；Analytics experience 300 词', '共同'), m('rl', '推荐信', '2 封，使用机构邮箱', '推荐人', 'progress'), m('photo', '证件照/身份核验', '近 3 个月证件照、护照与视频身份核验', '我', 'ready'), m('gre', 'GRE/GMAT', '可选', '我', 'progress')),
  },
  {
    id: 'P08', shortName: 'JHU BAAI', university: 'Johns Hopkins University', program: 'MS Business Analytics and Artificial Intelligence', region: '美国', city: 'Baltimore', round: 'Round 1', deadline: '2026-10-21', deadlineSort: '2026-10-21', verified: true, strategy: 'R1 优先；WES 和 Kira 视频并行准备。', applicationUrl: 'https://carey.jhu.edu/admissions/how-to-apply/ms-full-time', scholarship: 'Carey merit scholarships', scholarshipMode: '所有申请人自动考虑，早申机会更充分', scholarshipUrl: 'https://carey.jhu.edu/programs/master-science/business-analytics-artificial-intelligence', recommenders: 1,
    materials: base(common.cv, m('essays', '申请 Essay', '2 篇必答 + 1 篇可选，各 300–500 词', '共同'), m('rl', '推荐信', '1 封必需；最多审阅 2 封', '推荐人', 'progress'), m('wes', 'WES', 'Course-by-course 国际成绩评估', '我', 'progress'), m('kira', 'Kira 视频', '按 portal 题型练习并提交', '我')),
  },
  {
    id: 'P09', shortName: 'Berkeley Analytics', university: 'University of California, Berkeley', program: 'Master of Analytics', region: '美国', city: 'Berkeley', round: 'Priority', deadline: '2026-12-15', deadlineSort: '2026-12-15', verified: true, strategy: '必须提交 GRE；Priority 与 Final 仅相差约 3 周。', applicationUrl: 'https://analytics.berkeley.edu/how-to-apply/', scholarship: 'Excellence Award / Opportunity Grant', scholarshipMode: '完整申请自动考虑', scholarshipUrl: 'https://analytics.berkeley.edu/costs-and-financing/', recommenders: 2,
    materials: base(common.cv, m('essays', 'SOP + PHS', '各约 500–1,000 词', '共同'), m('rl', '推荐信', '2 封', '推荐人', 'progress'), m('gre', 'GRE', '必需', '我', 'progress'), m('video', '音/视频', '1–2 分钟，可选但强烈建议', '我')),
  },
  {
    id: 'P10', shortName: 'Penn SMART', university: 'University of Pennsylvania', program: 'M.S.Ed. SMART', region: '美国', city: 'Philadelphia', round: 'Priority', deadline: '2027-01-15', deadlineSort: '2027-01-15', verified: true, strategy: 'Priority 前完成可进入 merit scholarship 自动评估。', applicationUrl: 'https://www.gse.upenn.edu/admissions-and-aid/how-to-apply?program=Statistics,+Measurement,+Assessment,+and+Research+Technology,+M.S.Ed.', scholarship: 'Merit / Need-based', scholarshipMode: 'Merit 自动；Need-based 需在申请内填写问卷', scholarshipUrl: 'https://www.gse.upenn.edu/admissions-and-aid/financial-aid/masters-degree-funding', recommenders: 3,
    materials: base(common.cv, m('sop', 'Statement of Purpose', '≤750 词', '共同'), m('rl', '推荐信', '3 封', '推荐人', 'progress'), m('wes', '国际学历评估', '按 Penn 要求完成第三方评估', '我', 'progress'), m('video', '视频', 'Word 记录 ≤5 分钟；2027 portal 再复核', '我')),
  },
  {
    id: 'P11', shortName: 'Yale Biostat', university: 'Yale University', program: 'MS Biostatistics', region: '美国', city: 'New Haven', round: 'Single deadline', deadline: '2026-12-01', deadlineSort: '2026-12-01', verified: true, strategy: 'GRE 为硬要求；这是 GSAS 的 MS，不要与 MPH 材料混淆。', applicationUrl: 'https://gsas.yale.edu/programs-of-study/public-health', scholarship: 'Yale master funding', scholarshipMode: '硕士资金有限，按项目/GSAS 页面核验', scholarshipUrl: 'https://gsas.yale.edu/graduate-financial-support-fellowships/funding-masters-students', recommenders: 3,
    materials: base(common.cv, m('sop', 'Academic Purpose', '500–1,000 词 + 项目短答', '共同'), m('rl', '推荐信', '3 封', '推荐人', 'progress'), m('gre', 'GRE', '必需；送分代码 3987', '我', 'progress')),
  },
  {
    id: 'P12', shortName: 'Cornell/WCM Biostat', university: 'Weill Cornell Medicine / Cornell', program: 'MS Biostatistics and Data Science', region: '美国', city: 'New York', round: 'Single deadline', deadline: '2027 日期待发布', deadlineSort: '2027-02-01', verified: false, strategy: '开放后第一时间核对 deadline；提前完成课程先修映射。', applicationUrl: 'https://gradschool.weill.cornell.edu/academics/biostatistics-and-data-science/admissions-requirements', scholarship: 'WCM financial support', scholarshipMode: '以项目资金页面和录取通知为准', scholarshipUrl: 'https://gradschool.weill.cornell.edu/financial-support', recommenders: 3,
    materials: base(common.cv, m('ps', 'Personal Statement', '2–3 页', '共同'), m('rl', '推荐信', '3 封，正式抬头', '推荐人', 'progress'), m('wes', '国际学历评估', 'Course-by-course；WES/SpanTran/IEE/NACES 等', '我', 'progress'), m('prereq', '先修课映射', '2 学期微积分、线代、编程', '我', 'progress'), m('gre', 'GRE', '可选', '我', 'progress')),
  },
  {
    id: 'P13', shortName: 'LSE OR&A', university: 'London School of Economics', program: 'MSc Operations Research & Analytics', region: '英国', city: 'London', round: 'Rolling', deadline: '预计 2026-10 开放', deadlineSort: '2026-12-20', verified: false, strategy: '滚动且满位即关；开放后尽早提交，不等固定截止。', applicationUrl: 'https://www.lse.ac.uk/study-at-lse/graduate/msc-operations-research-and-analytics', scholarship: 'LSE funding', scholarshipMode: '部分资金需在 funding deadline 前另完成申请', scholarshipUrl: 'https://www.lse.ac.uk/study-at-lse/graduate/fees-and-funding', recommenders: 2,
    materials: base(common.cv, m('sop', 'Academic Purpose', '通常 1,000–1,500 词，建议 ≤2–3 页', '共同'), m('rl', '推荐信', '2 封；到齐后才进入处理', '推荐人', 'progress')),
  },
];

export const commonMaterials = [
  { name: '官方中英文成绩单', status: 'ready' as const, location: '私密盘 / 02_academic', action: '保留原始 PDF，只读' },
  { name: '评分说明与排名证明', status: 'ready' as const, location: '私密盘 / 02_academic', action: '仅在 portal 允许时上传排名' },
  { name: '在读证明 / 学籍验证', status: 'ready' as const, location: '私密盘 / 02_academic', action: '提交前核对有效期' },
  { name: 'IELTS 成绩单', status: 'ready' as const, location: '私密盘 / 03_tests', action: '逐项目核对单项与有效期' },
  { name: 'CV', status: 'progress' as const, location: '01_profile / cv', action: '更新为 PDF，并保留 1 页/2 页版' },
  { name: 'GRE', status: 'progress' as const, location: '03_tests / gre', action: 'Berkeley、Yale 为必需' },
  { name: 'WES / 国际成绩评估', status: 'progress' as const, location: '02_academic / evaluation', action: '重点覆盖 JHU、Penn、Cornell' },
  { name: '护照 / 证件照', status: 'ready' as const, location: '严格私密，不进仓库', action: 'NTU 照片需近 3 个月' },
];

export const recommenders = [
  { name: '黄老师', role: '主推荐人', status: '推荐信已有定稿', focus: '科研、量化能力与长期指导', suggested: '全部需要推荐信的项目' },
  { name: '戴韬老师', role: '第二推荐人', status: '提纲已完成，待中介成稿', focus: '课程表现、管理科学训练与系主任视角', suggested: 'Imperial、NTU、Berkeley、LSE 等 2 封项目' },
  { name: '杨荣辉老师', role: '第三推荐人', status: '提纲已完成，待中介成稿', focus: '跨学科、人文素养、课堂参与和表达', suggested: 'Oxford、Penn、Yale、Cornell 等 3 封项目' },
];

export const statusLabels: Record<MaterialStatus, string> = {
  ready: '已就绪', progress: '进行中', todo: '待开始', na: '不适用',
};
