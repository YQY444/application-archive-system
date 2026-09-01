'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArrowUpRight, BookOpenCheck, CheckCircle2, ChevronRight, CircleDashed, Download, FileCheck2, FileText, FolderLock, GraduationCap, Import, LayoutDashboard, ListFilter, Search, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { commonMaterials, programs, recommenders, statusLabels, type MaterialStatus, type Program } from './data';

type View = 'overview' | 'programs' | 'materials' | 'recommenders' | 'guide';
type SavedState = Record<string, MaterialStatus>;
const STORAGE_KEY = 'yqy-application-archive-v1';

const views: { key: View; label: string; icon: typeof Archive }[] = [
  { key: 'overview', label: '总览', icon: LayoutDashboard },
  { key: 'programs', label: '13 个项目', icon: GraduationCap },
  { key: 'materials', label: '通用材料', icon: FolderLock },
  { key: 'recommenders', label: '推荐信分配', icon: Users },
  { key: 'guide', label: '协作与隐私', icon: ShieldCheck },
];

const statusStyles: Record<MaterialStatus, string> = {
  ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  progress: 'border-amber-200 bg-amber-50 text-amber-700',
  todo: 'border-slate-200 bg-slate-50 text-slate-600',
  na: 'border-slate-200 bg-white text-slate-400',
};

const materialId = (programId: string, key: string) => `${programId}:${key}`;
const getStatus = (state: SavedState, programId: string, key: string, fallback: MaterialStatus) => state[materialId(programId, key)] ?? fallback;

function programProgress(program: Program, state: SavedState) {
  const applicable = program.materials.filter((item) => getStatus(state, program.id, item.key, item.initialStatus) !== 'na');
  const ready = applicable.filter((item) => getStatus(state, program.id, item.key, item.initialStatus) === 'ready').length;
  return applicable.length ? Math.round((ready / applicable.length) * 100) : 0;
}

function daysUntil(date: string) {
  const target = new Date(`${date}T23:59:59+08:00`).getTime();
  const now = new Date('2026-09-01T12:00:00+08:00').getTime();
  return Math.ceil((target - now) / 86400000);
}

function StatusBadge({ status }: { status: MaterialStatus }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${statusStyles[status]}`}>{status === 'ready' ? <CheckCircle2 className="size-3.5" /> : <CircleDashed className="size-3.5" />}{statusLabels[status]}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>('overview');
  const [selected, setSelected] = useState<Program | null>(null);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('全部');
  const [saved, setSaved] = useState<SavedState>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  });
  const [notice, setNotice] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }, [saved]);

  const filtered = useMemo(() => programs.filter((item) => {
    const text = `${item.shortName} ${item.university} ${item.program} ${item.city}`.toLowerCase();
    return (region === '全部' || item.region === region) && text.includes(search.toLowerCase().trim());
  }), [region, search]);
  const ordered = useMemo(() => [...programs].sort((a, b) => a.deadlineSort.localeCompare(b.deadlineSort)), []);
  const verifiedCount = programs.filter((item) => item.verified).length;
  const overall = Math.round(programs.reduce((sum, item) => sum + programProgress(item, saved), 0) / programs.length);
  const urgent = ordered.filter((item) => daysUntil(item.deadlineSort) <= 60).slice(0, 4);

  function setMaterialStatus(programId: string, key: string, status: MaterialStatus) {
    setSaved((current) => ({ ...current, [materialId(programId, key)]: status }));
    setNotice('进度已保存在这台设备的浏览器中。');
  }

  function exportState() {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), statuses: saved }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `application-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('进度 JSON 已导出，可发给协作方导入。');
  }

  async function importState(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setSaved(parsed.statuses ?? parsed);
      setNotice('进度已导入，并保存在当前浏览器。');
    } catch {
      setNotice('导入失败：请选择本系统导出的 JSON 文件。');
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f5] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[238px_1fr]">
        <aside className="border-b border-slate-200 bg-[#102a2e] px-5 py-5 text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10 lg:px-4 lg:py-7">
          <div className="flex items-center gap-3 px-2"><div className="grid size-10 place-items-center rounded-lg bg-[#d9efdd] text-[#153f36]"><Archive className="size-5" /></div><div><p className="text-[11px] uppercase tracking-[0.18em] text-white/55">2027 Fall</p><h1 className="font-semibold tracking-tight">申请归档台</h1></div></div>
          <nav className="mt-5 flex gap-1 overflow-x-auto pb-1 lg:mt-9 lg:block lg:space-y-1" aria-label="主导航">
            {views.map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => setView(item.key)} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition lg:w-full ${view === item.key ? 'bg-white/13 text-white' : 'text-white/66 hover:bg-white/7 hover:text-white'}`}><Icon className="size-4" />{item.label}</button>; })}
          </nav>
          <div className="mt-7 hidden border-t border-white/10 px-2 pt-6 lg:block"><p className="text-xs text-white/50">当前总进度</p><div className="mt-2 flex items-end justify-between"><span className="text-2xl font-semibold">{overall}%</span><span className="text-xs text-white/45">13 项目</span></div><Progress value={overall} className="mt-3 [&_[data-slot=progress-track]]:bg-white/15 [&_[data-slot=progress-indicator]]:bg-[#9ed6ad]" /><p className="mt-5 text-xs leading-5 text-white/45">材料原件保留在私密云盘；本站只记录状态、要求与私密链接。</p></div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-col gap-3 border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between md:px-8"><div><p className="text-xs font-medium text-emerald-700">杨琪勇 · 个人版</p><p className="mt-0.5 text-sm text-slate-500">数据核验至 2026-08-27 · 今日基准 2026-09-01</p></div><div className="flex flex-wrap gap-2"><input aria-label="导入申请进度 JSON" ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => importState(event.target.files?.[0])} /><Button variant="outline" onClick={() => importRef.current?.click()}><Import />导入进度</Button><Button variant="outline" onClick={exportState}><Download />导出进度</Button></div></header>

          <div className="px-5 py-7 md:px-8 md:py-9">
            {notice && <div className="mb-5 flex items-center justify-between border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>{notice}</span><button onClick={() => setNotice('')} className="text-xs underline underline-offset-4">关闭</button></div>}
            {view === 'overview' && <Overview urgent={urgent} saved={saved} overall={overall} verifiedCount={verifiedCount} onSelect={setSelected} onShowPrograms={() => setView('programs')} onShowGuide={() => setView('guide')} />}
            {view === 'programs' && <ProgramsView filtered={filtered} saved={saved} search={search} region={region} onSearch={setSearch} onRegion={setRegion} onSelect={setSelected} />}
            {view === 'materials' && <MaterialsView />}
            {view === 'recommenders' && <RecommendersView />}
            {view === 'guide' && <GuideView />}
          </div>
        </section>
      </div>

      <ProgramDialog program={selected} saved={saved} onClose={() => setSelected(null)} onStatus={setMaterialStatus} />
    </main>
  );
}

function Overview({ urgent, saved, overall, verifiedCount, onSelect, onShowPrograms, onShowGuide }: { urgent: Program[]; saved: SavedState; overall: number; verifiedCount: number; onSelect: (program: Program) => void; onShowPrograms: () => void; onShowGuide: () => void }) {
  const stats = [
    { label: '确认项目', value: '13', note: '英 6 · 美 5 · 新 2', icon: GraduationCap },
    { label: '2027 官方日期', value: verifiedCount.toString(), note: `${13 - verifiedCount} 个待官网更新`, icon: BookOpenCheck },
    { label: '整体材料进度', value: `${overall}%`, note: '按浏览器保存状态计算', icon: FileCheck2 },
    { label: '三封推荐项目', value: '4', note: 'Oxford · Penn · Yale · Cornell', icon: Users },
  ];
  return <div className="space-y-7"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-medium text-emerald-700">Good afternoon, Qiyong</p><h2 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">先把最近的节点稳稳推进。</h2></div><p className="max-w-xl text-sm leading-6 text-slate-500">当前最优先是 Imperial R1；预计日期会用“待核验”标记，不把上一周期时间误当正式截止。</p></div><div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <div key={item.label} className="bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{item.label}</p><item.icon aria-hidden="true" className="size-4 text-slate-400" /></div><p className="mt-4 text-3xl font-semibold tracking-tight">{item.value}</p><p className="mt-1 text-xs text-slate-400">{item.note}</p></div>)}</div><div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]"><section className="border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h3 className="font-semibold">最近 60 天</h3><p className="mt-1 text-xs text-slate-500">按当前规划日期排序</p></div><Button aria-label="查看全部申请项目" variant="ghost" onClick={onShowPrograms}>查看全部 <ChevronRight /></Button></div><div className="divide-y divide-slate-100">{urgent.map((program) => <button aria-label={`查看 ${program.shortName} 项目详情`} key={program.id} onClick={() => onSelect(program)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[54px_1fr_auto] sm:items-center"><div className="text-center"><p className="text-xl font-semibold text-[#1f5b50]">{daysUntil(program.deadlineSort)}</p><p className="text-[10px] uppercase text-slate-400">天</p></div><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{program.shortName}</p>{!program.verified && <Badge variant="secondary">待核验</Badge>}</div><p className="mt-1 text-sm text-slate-500">{program.round} · {program.deadline}</p></div><div className="sm:text-right"><p className="text-sm font-medium">{programProgress(program, saved)}%</p><p className="text-xs text-slate-400">材料就绪</p></div></button>)}</div></section><section className="border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Sparkles className="size-4 text-amber-500" /><h3 className="font-semibold">本周建议</h3></div><ol className="mt-5 space-y-4">{[['01','锁定 Imperial R1 文书','完成 350 / 500 / 500 词三题初稿与素材核验。'],['02','确认推荐人执行节奏','黄老师定稿；戴老师、杨老师提纲交中介成稿。'],['03','推进 GRE 与 WES','GRE 覆盖 Berkeley / Yale；WES 重点覆盖三个美国项目。']].map(([num,title,body]) => <li key={num} className="grid grid-cols-[30px_1fr] gap-3"><span className="font-mono text-xs text-emerald-700">{num}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{body}</p></div></li>)}</ol><button aria-label="查看协作与隐私说明" onClick={onShowGuide} className="mt-6 flex w-full items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600 hover:text-slate-900"><span>查看协作更新方式</span><ArrowUpRight className="size-4" /></button></section></div></div>;
}

function ProgramsView({ filtered, saved, search, region, onSearch, onRegion, onSelect }: { filtered: Program[]; saved: SavedState; search: string; region: string; onSearch: (value: string) => void; onRegion: (value: string) => void; onSelect: (program: Program) => void }) {
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold tracking-tight">13 个申请项目</h2><p className="mt-1 text-sm text-slate-500">点击项目查看逐项材料；材料状态可直接修改并保存在当前浏览器。</p></div><div className="flex flex-col gap-3 border border-slate-200 bg-white p-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="搜索院校、专业或城市" className="pl-9" /></div><Select value={region} onValueChange={(value) => onRegion(value ?? '全部')}><SelectTrigger className="w-full sm:w-40"><ListFilter className="size-4" /><SelectValue /></SelectTrigger><SelectContent>{['全部','英国','美国','新加坡'].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((program) => { const progress = programProgress(program, saved); return <button key={program.id} onClick={() => onSelect(program)} className="group border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_12px_30px_rgba(16,42,46,0.08)]"><div className="flex items-start justify-between gap-4"><span className="font-mono text-xs text-emerald-700">{program.id}</span><span className="text-xs text-slate-400">{program.region} · {program.city}</span></div><h3 className="mt-4 font-semibold leading-5">{program.shortName}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{program.program}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">{program.round}</p><p className="mt-1 text-sm font-medium">{program.deadline}</p></div><div className="text-right"><p className="text-sm font-semibold text-emerald-700">{progress}%</p><p className="text-xs text-slate-400">就绪</p></div></div><Progress value={progress} className="mt-3 [&_[data-slot=progress-indicator]]:bg-emerald-600" /></button>; })}</div></div>;
}

function MaterialsView() {
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold tracking-tight">通用材料库</h2><p className="mt-1 text-sm text-slate-500">这里只显示文件类别与私密目录，不展示或上传原件。</p></div><div className="overflow-x-auto border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3 font-medium">材料</th><th className="px-5 py-3 font-medium">当前状态</th><th className="px-5 py-3 font-medium">建议位置</th><th className="px-5 py-3 font-medium">下一动作</th></tr></thead><tbody className="divide-y divide-slate-100">{commonMaterials.map((item) => <tr key={item.name}><td className="px-5 py-4 font-medium">{item.name}</td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4 text-slate-500">{item.location}</td><td className="px-5 py-4 text-slate-500">{item.action}</td></tr>)}</tbody></table></div><div className="border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><strong>文件原则：</strong>原始件只读，editable 与 submitted 分开；提交版禁止覆盖；申请号、付款凭证、护照、成绩单和推荐信绝不进入公开仓库。</div></div>;
}

function RecommendersView() {
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold tracking-tight">推荐信分配</h2><p className="mt-1 text-sm text-slate-500">三位老师侧重点互补，避免重复叙述同一段经历。</p></div><div className="grid gap-4 lg:grid-cols-3">{recommenders.map((person) => <article key={person.name} className="border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><div className="grid size-10 place-items-center bg-emerald-50 font-semibold text-emerald-700">{person.name.slice(0, 1)}</div><Badge variant="secondary">{person.role}</Badge></div><h3 className="mt-5 text-lg font-semibold">{person.name}</h3><p className="mt-1 text-sm text-emerald-700">{person.status}</p><dl className="mt-5 space-y-4 border-t border-slate-100 pt-4 text-sm"><div><dt className="text-xs text-slate-400">叙事重点</dt><dd className="mt-1 leading-5 text-slate-600">{person.focus}</dd></div><div><dt className="text-xs text-slate-400">建议覆盖</dt><dd className="mt-1 leading-5 text-slate-600">{person.suggested}</dd></div></dl></article>)}</div><div className="border border-slate-200 bg-white p-5"><h3 className="font-semibold">数量规则</h3><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><div className="bg-slate-50 p-4"><p className="text-slate-400">0 封</p><p className="mt-2 font-medium">NUS DSS</p></div><div className="bg-slate-50 p-4"><p className="text-slate-400">1–2 封</p><p className="mt-2 font-medium">UCL、Edinburgh、JHU；其余多数 2 封</p></div><div className="bg-emerald-50 p-4"><p className="text-emerald-700">3 封</p><p className="mt-2 font-medium">Oxford、Penn、Yale、Cornell</p></div></div></div></div>;
}

function GuideView() {
  return <div className="space-y-6"><div><h2 className="text-2xl font-semibold tracking-tight">协作与隐私边界</h2><p className="mt-1 text-sm text-slate-500">第一版是可共享查看的静态站，不是假装成有后端的多人系统。</p></div><div className="grid gap-4 lg:grid-cols-2"><article className="border border-slate-200 bg-white p-6"><FolderLock className="size-5 text-emerald-700" /><h3 className="mt-4 font-semibold">文件放在哪里</h3><p className="mt-2 text-sm leading-6 text-slate-500">敏感原件放私密云盘或本地受控目录；页面只放文件名、状态、负责人和私密分享链接。GitHub 仓库不保存任何护照、成绩单、推荐信或申请号。</p></article><article className="border border-slate-200 bg-white p-6"><Users className="size-5 text-emerald-700" /><h3 className="mt-4 font-semibold">如何共同更新</h3><p className="mt-2 text-sm leading-6 text-slate-500">当前状态默认只在每个人自己的浏览器里。更新后导出 JSON 发给对方导入，或由你修改单一数据文件并提交。下一阶段可接入 Supabase / Airtable 实现账号与实时同步。</p></article></div><div className="border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-semibold">建议目录</h3></div><div className="grid gap-px bg-slate-100 sm:grid-cols-2">{['00_admin / 项目元数据与截止日期','01_profile / CV 与通用经历库','02_academic / 成绩、排名、在读证明','03_tests / IELTS、GRE、送分记录','04_recommendations / 推荐人 brief','05_projects / 每项目文书与提交版','06_scholarships / 奖学金材料','07_submissions / 回执与 portal 截图','99_archive / 历史版本'].map((item) => <div key={item} className="bg-white px-5 py-3 font-mono text-xs text-slate-600">{item}</div>)}</div></div><div className="border-l-4 border-emerald-500 bg-emerald-50 p-5"><h3 className="font-semibold text-emerald-900">后续通用版路线</h3><p className="mt-2 text-sm leading-6 text-emerald-900/75">把“项目类型”扩展为留学、保研、奖学金三类；共用材料主档、截止日期、负责人、版本与提交回执；再增加权限、评论和变更记录。个人版跑顺后再抽象，不急着一次做大。</p></div></div>;
}

function ProgramDialog({ program, saved, onClose, onStatus }: { program: Program | null; saved: SavedState; onClose: () => void; onStatus: (programId: string, key: string, status: MaterialStatus) => void }) {
  return <Dialog open={!!program} onOpenChange={(open) => !open && onClose()}>{program && <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><div className="flex items-center gap-2"><Badge variant="secondary">{program.id}</Badge><Badge variant={program.verified ? 'default' : 'outline'}>{program.verified ? '2027 官方' : '预计 / 待更新'}</Badge></div><DialogTitle className="mt-2 text-xl">{program.university}</DialogTitle><DialogDescription>{program.program} · {program.city}</DialogDescription></DialogHeader><div className="grid gap-4 border-y border-slate-100 py-4 sm:grid-cols-2"><div><p className="text-xs text-slate-400">当前策略节点</p><p className="mt-1 text-sm font-medium">{program.round} · {program.deadline}</p></div><div><p className="text-xs text-slate-400">奖学金机制</p><p className="mt-1 text-sm font-medium">{program.scholarshipMode}</p></div><div className="sm:col-span-2"><p className="text-xs text-slate-400">申请策略</p><p className="mt-1 text-sm leading-6 text-slate-600">{program.strategy}</p></div></div><div><div className="mb-3 flex items-center justify-between"><h4 className="font-semibold">材料清单</h4><span className="text-sm font-medium text-emerald-700">{programProgress(program, saved)}% 就绪</span></div><div className="space-y-2">{program.materials.map((item) => { const current = getStatus(saved, program.id, item.key, item.initialStatus); return <div key={item.key} className="grid gap-3 border border-slate-100 p-3 sm:grid-cols-[1fr_116px] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{item.label}</p><span className="text-[11px] text-slate-400">负责人：{item.owner}</span></div><p className="mt-1 text-xs leading-5 text-slate-500">{item.requirement}</p></div><Select value={current} onValueChange={(value) => onStatus(program.id, item.key, value as MaterialStatus)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{(['ready','progress','todo','na'] as MaterialStatus[]).map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}</SelectContent></Select></div>; })}</div></div><div className="flex flex-wrap gap-2"><a className={buttonVariants()} href={program.applicationUrl} target="_blank" rel="noreferrer"><ArrowUpRight />申请官网</a><a className={buttonVariants({ variant: 'outline' })} href={program.scholarshipUrl} target="_blank" rel="noreferrer"><FileText />奖学金官网</a></div></DialogContent>}</Dialog>;
}
