'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, Check, ChevronRight, ClipboardCheck, Download, Eye, EyeOff, FileArchive, FileText, GraduationCap, Import, KeyRound, Link2, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { programs as seedPrograms } from './data';
import { deleteMaterialFile, deleteProjectFiles, getMaterialFile, listMaterialFiles, putMaterialFile, restoreMaterialFile, type StoredMaterialFile } from './workspace-storage';

type ProjectStatus = 'planning' | 'preparing' | 'ready' | 'submitted' | 'offer';
type MaterialStatus = 'todo' | 'draft' | 'review' | 'ready' | 'submitted' | 'not-needed';
type MaterialRecord = { id: string; label: string; requirement: string; owner: string; required: boolean; status: MaterialStatus; fileName?: string; fileType?: string; fileSize?: number; updatedAt?: string };
type ProjectRecord = { id: string; university: string; program: string; region: string; city: string; round: string; deadline: string; applicationUrl: string; notes: string; status: ProjectStatus; materials: MaterialRecord[] };
type Credentials = Record<string, { username: string; password: string }>;
type BackupFile = Omit<StoredMaterialFile, 'blob'> & { dataUrl: string };

const WORKSPACE_KEY = 'application-workbench-v2';
const CREDENTIALS_KEY = 'application-workbench-credentials-v1';
const projectStatusLabels: Record<ProjectStatus, string> = { planning: '规划中', preparing: '准备材料', ready: '待提交', submitted: '已提交', offer: '已录取' };
const materialStatusLabels: Record<MaterialStatus, string> = { todo: '待准备', draft: '草稿中', review: '待确认', ready: '已就绪', submitted: '已提交', 'not-needed': '不需要' };
const statusTone: Record<MaterialStatus, string> = { todo: 'bg-slate-100 text-slate-600', draft: 'bg-amber-50 text-amber-700', review: 'bg-blue-50 text-blue-700', ready: 'bg-emerald-50 text-emerald-700', submitted: 'bg-[#153f36] text-white', 'not-needed': 'bg-white text-slate-400' };
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const defaultMaterials = (): MaterialRecord[] => [
  ['CV', '项目定制版 PDF', '共同'],
  ['Personal Statement / Essay', '按项目题目和字数要求准备', '共同'],
  ['成绩单', '中英文正式成绩单', '我'],
  ['推荐信', '按项目要求确认数量与推荐人', '推荐人'],
  ['语言成绩', 'IELTS / TOEFL 成绩报告', '我'],
].map(([label, requirement, owner]) => ({ id: newId('mat'), label, requirement, owner, required: true, status: 'todo' }));

function initialProjects(): ProjectRecord[] {
  return seedPrograms.map((project) => ({
    id: project.id, university: project.university, program: project.program, region: project.region, city: project.city, round: project.round, deadline: project.deadlineSort, applicationUrl: project.applicationUrl, notes: project.strategy, status: 'preparing',
    materials: project.materials.map((material) => ({
      id: material.key, label: material.label, requirement: material.requirement, owner: material.owner, required: material.initialStatus !== 'na',
      status: material.initialStatus === 'ready' ? 'ready' : material.initialStatus === 'progress' ? 'draft' : material.initialStatus === 'na' ? 'not-needed' : 'todo',
    })),
  }));
}

function loadProjects() {
  if (typeof window === 'undefined') return initialProjects();
  try { const saved = window.localStorage.getItem(WORKSPACE_KEY); return saved ? (JSON.parse(saved) as ProjectRecord[]) : initialProjects(); } catch { return initialProjects(); }
}

function formatBytes(value?: number) { if (!value) return ''; if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB`; }
function base64ToBytes(value: string): Uint8Array<ArrayBuffer> { const binary = atob(value); const bytes = new Uint8Array(binary.length); for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index); return bytes; }
function blobToDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read file')); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }

function loadCredentials(): Credentials {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(CREDENTIALS_KEY) ?? '{}') as Credentials; } catch { return {}; }
}

export default function Home() {
  const [projects, setProjects] = useState<ProjectRecord[]>(loadProjects);
  const [selectedId, setSelectedId] = useState(() => loadProjects()[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [projectDialog, setProjectDialog] = useState<'add' | 'edit' | null>(null);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [credentials, setCredentials] = useState<Credentials>(loadCredentials);
  const [showPassword, setShowPassword] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => { window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(projects)); }, [projects]);
  useEffect(() => {
    type ToolInput = { university?: unknown; program?: unknown; region?: unknown; deadline?: unknown; applicationUrl?: unknown };
    type ModelContext = { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: ToolInput) => Promise<object> }, options: { signal: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'create_application_project',
      title: '添加申请项目',
      description: '在当前申请工作台中添加一个院校项目，并创建默认材料清单。',
      inputSchema: {
        type: 'object',
        properties: {
          university: { type: 'string', minLength: 1 },
          program: { type: 'string', minLength: 1 },
          region: { type: 'string' },
          deadline: { type: 'string', description: 'YYYY-MM-DD' },
          applicationUrl: { type: 'string' },
        },
        required: ['university', 'program'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        if (typeof input.university !== 'string' || !input.university.trim() || typeof input.program !== 'string' || !input.program.trim()) throw new Error('university and program are required');
        const project: ProjectRecord = { ...blankProject(), university: input.university.trim(), program: input.program.trim(), region: typeof input.region === 'string' ? input.region.trim() : '', deadline: typeof input.deadline === 'string' ? input.deadline : '', applicationUrl: typeof input.applicationUrl === 'string' ? input.applicationUrl : '' };
        setProjects((current) => [...current, project]);
        setSelectedId(project.id);
        setNotice('项目已添加，可以开始整理材料。');
        return { id: project.id, university: project.university, program: project.program, materialCount: project.materials.length };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  const selected = projects.find((item) => item.id === selectedId) ?? projects[0];
  const filtered = useMemo(() => { const query = search.trim().toLowerCase(); return projects.filter((item) => `${item.university} ${item.program} ${item.region}`.toLowerCase().includes(query)); }, [projects, search]);
  const submitted = projects.filter((item) => item.status === 'submitted').length;

  function updateSelected(update: (project: ProjectRecord) => ProjectRecord) { if (!selected) return; setProjects((current) => current.map((project) => project.id === selected.id ? update(project) : project)); }
  function saveCredential(username: string, password: string) { if (!selected) return; const next = { ...credentials, [selected.id]: { username, password } }; window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next)); setCredentials(next); setNotice('网申账户名和密码已保存在当前浏览器，不会进入导出文件。'); }

  async function exportWorkspace() {
    try {
      const files = await listMaterialFiles();
      const exportedFiles: BackupFile[] = await Promise.all(files.map(async ({ blob, ...file }) => ({ ...file, dataUrl: await blobToDataUrl(blob) })));
      const payload = { version: 2, exportedAt: new Date().toISOString(), projects, files: exportedFiles, credentialsIncluded: false };
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `申请工作台备份-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); setNotice('工作区已导出；账号密码未包含在备份中。');
    } catch { setNotice('导出失败，请稍后重试。'); }
  }

  async function importWorkspace(file?: File) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as { projects: ProjectRecord[]; files?: BackupFile[] };
      if (!Array.isArray(payload.projects)) throw new Error('Invalid backup');
      for (const fileRecord of payload.files ?? []) { const [header, content] = fileRecord.dataUrl.split(','); const type = header.match(/data:(.*?);/)?.[1] || fileRecord.type; await restoreMaterialFile({ ...fileRecord, type, blob: new Blob([base64ToBytes(content)], { type }) }); }
      setProjects(payload.projects); setSelectedId(payload.projects[0]?.id ?? ''); setNotice('工作区及文件已导入当前浏览器。');
    } catch { setNotice('导入失败，请选择由本工作台导出的 JSON 文件。'); } finally { if (importRef.current) importRef.current.value = ''; }
  }

  async function openFile(material: MaterialRecord) { if (!selected) return; const stored = await getMaterialFile(selected.id, material.id); if (!stored) return setNotice('没有在当前浏览器找到这个文件。'); const url = URL.createObjectURL(stored.blob); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  async function downloadFile(material: MaterialRecord) { if (!selected) return; const stored = await getMaterialFile(selected.id, material.id); if (!stored) return setNotice('没有在当前浏览器找到这个文件。'); const url = URL.createObjectURL(stored.blob); const link = document.createElement('a'); link.href = url; link.download = stored.name; link.click(); URL.revokeObjectURL(url); }
  async function uploadFile(materialId: string, file?: File) { if (!selected || !file) return; await putMaterialFile(selected.id, materialId, file); updateSelected((project) => ({ ...project, materials: project.materials.map((material) => material.id === materialId ? { ...material, fileName: file.name, fileType: file.type, fileSize: file.size, updatedAt: new Date().toISOString(), status: material.status === 'todo' ? 'review' : material.status } : material) })); setNotice(`${file.name} 已保存在当前浏览器。`); }
  async function removeFile(materialId: string) { if (!selected) return; await deleteMaterialFile(selected.id, materialId); updateSelected((project) => ({ ...project, materials: project.materials.map((material) => material.id === materialId ? { ...material, fileName: undefined, fileType: undefined, fileSize: undefined, updatedAt: undefined } : material) })); setNotice('文件已从当前浏览器移除。'); }
  async function removeProject() { if (!selected) return; await deleteProjectFiles(selected.id); const next = projects.filter((project) => project.id !== selected.id); setProjects(next); setSelectedId(next[0]?.id ?? ''); setDeleteProjectOpen(false); setNotice('项目及其本地文件已删除。'); }

  return (
    <main className="min-h-screen bg-[#f3f5f2] text-[#17201d]">
      <div className="mx-auto min-h-screen max-w-[1540px] lg:grid lg:grid-cols-[310px_1fr]">
        <aside className="border-b border-[#dfe5df] bg-[#173b35] text-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:border-white/10">
          <div className="flex items-center justify-between px-5 py-5 lg:px-6 lg:py-7">
            <div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-[#d9efdd] text-[#173b35]"><FileArchive className="size-5" /></div><div><p className="text-[11px] uppercase tracking-[0.18em] text-white/55">2027 Fall</p><h1 className="font-semibold tracking-tight">申请工作台</h1></div></div>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" aria-label="添加申请项目" onClick={() => setProjectDialog('add')}><Plus /></Button>
          </div>
          <div className="px-4 pb-4 lg:px-5"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索院校或专业" className="border-white/10 bg-white/8 pl-9 text-white placeholder:text-white/38" /></div></div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-5 lg:block lg:h-[calc(100vh-260px)] lg:space-y-1 lg:overflow-y-auto lg:px-4" aria-label="申请项目">
            {filtered.map((project) => <button key={project.id} onClick={() => setSelectedId(project.id)} className={`min-w-[230px] rounded-xl px-3 py-3 text-left transition lg:w-full lg:min-w-0 ${selected?.id === project.id ? 'bg-white text-[#173b35]' : 'text-white/72 hover:bg-white/8 hover:text-white'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{project.university}</p><p className={`mt-1 truncate text-xs ${selected?.id === project.id ? 'text-[#52736b]' : 'text-white/46'}`}>{project.program}</p><p className={`mt-2 text-[11px] ${selected?.id === project.id ? 'text-[#52736b]' : 'text-white/42'}`}>{projectStatusLabels[project.status]}</p></div><ChevronRight className="mt-0.5 size-4 shrink-0 opacity-40" /></div></button>)}
            {!filtered.length && <p className="px-3 py-5 text-sm text-white/50">没有匹配的项目</p>}
          </nav>
          <div className="hidden border-t border-white/10 px-6 py-5 lg:block"><div className="flex items-center justify-between text-xs text-white/50"><span>{projects.length} 个项目</span><span>{submitted} 个已提交</span></div><Button variant="ghost" className="mt-3 w-full justify-start text-white/70 hover:bg-white/8 hover:text-white" onClick={() => setProjectDialog('add')}><Plus /> 添加项目</Button></div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe5df] bg-white/90 px-5 py-4 backdrop-blur md:px-8"><div><p className="text-sm font-medium">杨琪勇 · 个人申请工作区</p><p className="mt-0.5 text-xs text-slate-500">数据与文件只保存在当前浏览器</p></div><div className="flex flex-wrap gap-2"><input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(event) => importWorkspace(event.target.files?.[0])} /><Button variant="outline" onClick={() => importRef.current?.click()}><Import /> 导入工作区</Button><Button variant="outline" onClick={exportWorkspace}><Download /> 导出工作区</Button><Button onClick={() => setProjectDialog('add')}><Plus /> 添加项目</Button></div></header>
          <div className="px-5 py-6 md:px-8 md:py-8">
            {notice && <div className="mb-5 flex items-center justify-between gap-4 border-l-4 border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span>{notice}</span><button className="text-xs underline underline-offset-4" onClick={() => setNotice('')}>关闭</button></div>}
            {selected ? <ProjectWorkspace key={selected.id} project={selected} credential={credentials[selected.id]} showPassword={showPassword} onShowPassword={setShowPassword} onEdit={() => setProjectDialog('edit')} onDelete={() => setDeleteProjectOpen(true)} onSaveCredential={saveCredential} onStatus={(status) => updateSelected((project) => ({ ...project, status }))} onMaterialStatus={(materialId, status) => updateSelected((project) => ({ ...project, materials: project.materials.map((material) => material.id === materialId ? { ...material, status } : material) }))} onUpload={uploadFile} onOpenFile={openFile} onDownloadFile={downloadFile} onRemoveFile={removeFile} onAddMaterial={() => setMaterialDialog(true)} /> : <div className="grid min-h-[60vh] place-items-center border border-dashed border-slate-300 bg-white p-8 text-center"><div><GraduationCap className="mx-auto size-8 text-emerald-700" /><h2 className="mt-4 text-xl font-semibold">先添加第一个申请项目</h2><p className="mt-2 text-sm text-slate-500">填写院校、专业和网申链接，即可开始整理材料。</p><Button className="mt-5" onClick={() => setProjectDialog('add')}><Plus /> 添加项目</Button></div></div>}
          </div>
        </section>
      </div>

      <ProjectDialog key={`${projectDialog}:${selected?.id ?? 'none'}`} mode={projectDialog} project={projectDialog === 'edit' ? selected : undefined} onClose={() => setProjectDialog(null)} onSave={(project) => { if (projectDialog === 'edit') setProjects((current) => current.map((item) => item.id === project.id ? project : item)); else { setProjects((current) => [...current, project]); setSelectedId(project.id); } setProjectDialog(null); setNotice(projectDialog === 'edit' ? '项目信息已更新。' : '项目已添加，可以开始整理材料。'); }} />
      <MaterialDialog open={materialDialog} onClose={() => setMaterialDialog(false)} onSave={(material) => { updateSelected((project) => ({ ...project, materials: [...project.materials, material] })); setMaterialDialog(false); setNotice('材料项目已添加。'); }} />
      <AlertDialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>删除这个申请项目？</AlertDialogTitle><AlertDialogDescription>项目信息和当前浏览器中的关联文件都会被删除，此操作无法撤销。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={removeProject}>确认删除</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </main>
  );
}

function ProjectWorkspace({ project, credential, showPassword, onShowPassword, onEdit, onDelete, onSaveCredential, onStatus, onMaterialStatus, onUpload, onOpenFile, onDownloadFile, onRemoveFile, onAddMaterial }: { project: ProjectRecord; credential?: { username: string; password: string }; showPassword: boolean; onShowPassword: (value: boolean) => void; onEdit: () => void; onDelete: () => void; onSaveCredential: (username: string, password: string) => void; onStatus: (status: ProjectStatus) => void; onMaterialStatus: (materialId: string, status: MaterialStatus) => void; onUpload: (materialId: string, file?: File) => void; onOpenFile: (material: MaterialRecord) => void; onDownloadFile: (material: MaterialRecord) => void; onRemoveFile: (materialId: string) => void; onAddMaterial: () => void }) {
  const [username, setUsername] = useState(credential?.username ?? ''); const [password, setPassword] = useState(credential?.password ?? '');
  return <div className="space-y-6">
    <section className="border border-[#dfe5df] bg-white p-5 md:p-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{project.region}{project.city ? ` · ${project.city}` : ''}</Badge><span className="text-sm text-slate-500">{project.round || '暂未填写轮次'}</span></div><h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">{project.university}</h2><p className="mt-2 text-base text-slate-600">{project.program}</p></div><div className="flex flex-wrap gap-2">{project.applicationUrl && <a className={buttonVariants()} href={project.applicationUrl} target="_blank" rel="noreferrer">打开网申 <ArrowUpRight /></a>}<Button variant="outline" onClick={onEdit}><Pencil /> 编辑</Button><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="icon" aria-label="更多项目操作" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onClick={onDelete}><Trash2 /> 删除项目</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div>
      <div className="mt-7 grid gap-px overflow-hidden border border-[#e2e7e2] bg-[#e2e7e2] sm:grid-cols-2"><SummaryCell label="项目状态"><Select value={project.status} onValueChange={(value) => onStatus((value ?? 'preparing') as ProjectStatus)}><SelectTrigger className="mt-2 w-full border-0 bg-transparent px-0 text-base font-semibold shadow-none"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(projectStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></SummaryCell><SummaryCell label="截止日期"><p className="mt-3 text-lg font-semibold">{project.deadline || '待确认'}</p></SummaryCell></div>
    </section>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
      <section className="border border-[#dfe5df] bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 md:px-6"><div><h3 className="font-semibold">申请材料</h3><p className="mt-1 text-xs text-slate-500">上传后保存在本机，可预览、下载或随备份导出</p></div><Button variant="outline" onClick={onAddMaterial}><Plus /> 添加材料</Button></div><div className="divide-y divide-slate-100">{project.materials.map((material) => <MaterialRow key={material.id} material={material} onStatus={(status) => onMaterialStatus(material.id, status)} onUpload={(file) => onUpload(material.id, file)} onOpen={() => onOpenFile(material)} onDownload={() => onDownloadFile(material)} onRemoveFile={() => onRemoveFile(material.id)} />)}{!project.materials.length && <p className="px-6 py-12 text-center text-sm text-slate-500">还没有材料，先添加 CV、PS 或成绩单。</p>}</div></section>
      <div className="space-y-6">
        <section className="border border-[#dfe5df] bg-white p-5 md:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><KeyRound className="size-4 text-emerald-700" /><h3 className="font-semibold">网申账户</h3></div><Badge variant="secondary">仅本机</Badge></div><div className="mt-5 space-y-4"><div><Label htmlFor="portal-user">账户名</Label><Input id="portal-user" className="mt-2" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="邮箱或申请账号" /></div><div><Label htmlFor="portal-password">密码</Label><div className="relative mt-2"><Input id="portal-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={showPassword ? '隐藏密码' : '显示密码'} onClick={() => onShowPassword(!showPassword)}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><Button className="w-full" onClick={() => onSaveCredential(username, password)}><Check /> 保存账户信息</Button><p className="text-xs leading-5 text-slate-500">账户信息直接保存在当前浏览器，不会放进导出的工作区文件。</p></div></section>
        <section className="border border-[#dfe5df] bg-white p-5 md:p-6"><div className="flex items-center gap-2"><ClipboardCheck className="size-4 text-emerald-700" /><h3 className="font-semibold">项目备注</h3></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{project.notes || '暂无备注。可以在“编辑项目”中记录文书要求、奖学金和下一步。'}</p>{project.applicationUrl && <a className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-emerald-700 hover:underline" href={project.applicationUrl} target="_blank" rel="noreferrer"><Link2 className="size-4" />{project.applicationUrl.replace(/^https?:\/\//, '').slice(0, 42)}…</a>}</section>
        <section className="border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><div className="flex gap-3"><AlertCircle className="mt-1 size-4 shrink-0" /><p><strong>工作区导入导出：</strong>导出会把项目、材料状态和已上传文件一起写入一个 JSON 文件。中介老师导入后可以恢复相同内容；网申账户和密码不会包含。文件越多，JSON 会越大。</p></div></section>
      </div>
    </div>
  </div>;
}

function SummaryCell({ label, children }: { label: string; children: React.ReactNode }) { return <div className="min-h-28 bg-[#fbfcfa] p-4 md:p-5"><p className="text-xs font-medium text-slate-500">{label}</p>{children}</div>; }

function MaterialRow({ material, onStatus, onUpload, onOpen, onDownload, onRemoveFile }: { material: MaterialRecord; onStatus: (status: MaterialStatus) => void; onUpload: (file?: File) => void; onOpen: () => void; onDownload: () => void; onRemoveFile: () => void }) {
  return <div className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_150px_auto] md:items-center md:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><FileText className="size-4 text-emerald-700" /><p className="font-medium">{material.label}</p>{material.required && <span className="text-xs text-rose-600">必需</span>}</div><p className="mt-1 text-sm leading-5 text-slate-500">{material.requirement || '暂无具体要求'}</p><p className="mt-2 text-xs text-slate-400">负责人：{material.owner || '未分配'}</p>{material.fileName && <p className="mt-2 truncate text-xs font-medium text-emerald-700">{material.fileName} · {formatBytes(material.fileSize)}</p>}</div><Select value={material.status} onValueChange={(value) => onStatus((value ?? 'todo') as MaterialStatus)}><SelectTrigger className={`${statusTone[material.status]} border-0 shadow-none`}><SelectValue /></SelectTrigger><SelectContent>{Object.entries(materialStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><div className="flex flex-wrap gap-2 md:justify-end">{material.fileName ? <><Button size="icon" variant="outline" aria-label={`预览 ${material.fileName}`} onClick={onOpen}><Eye /></Button><Button size="icon" variant="outline" aria-label={`下载 ${material.fileName}`} onClick={onDownload}><Download /></Button><DropdownMenu><DropdownMenuTrigger render={<Button size="icon" variant="outline" aria-label="更多文件操作" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"><Upload className="size-4" />替换文件<input type="file" className="hidden" onChange={(event) => onUpload(event.target.files?.[0])} /></label><DropdownMenuItem variant="destructive" onClick={onRemoveFile}><Trash2 />移除文件</DropdownMenuItem></DropdownMenuContent></DropdownMenu></> : <label className={buttonVariants({ variant: 'outline' })}><Upload /> 上传<input type="file" className="hidden" onChange={(event) => onUpload(event.target.files?.[0])} /></label>}</div></div>;
}

function ProjectDialog({ mode, project, onClose, onSave }: { mode: 'add' | 'edit' | null; project?: ProjectRecord; onClose: () => void; onSave: (project: ProjectRecord) => void }) {
  const [form, setForm] = useState<ProjectRecord>(() => project ?? blankProject());
  return <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{mode === 'edit' ? '编辑申请项目' : '添加申请项目'}</DialogTitle><DialogDescription>填写基础信息后即可开始上传和跟踪材料。</DialogDescription></DialogHeader><div className="grid gap-4 py-2 sm:grid-cols-2"><FormField label="学校" id="university"><Input id="university" value={form.university} onChange={(event) => setForm({ ...form, university: event.target.value })} placeholder="Nanyang Technological University" /></FormField><FormField label="专业" id="program"><Input id="program" value={form.program} onChange={(event) => setForm({ ...form, program: event.target.value })} placeholder="MSc Business Analytics" /></FormField><FormField label="国家或地区" id="region"><Input id="region" value={form.region} onChange={(event) => setForm({ ...form, region: event.target.value })} placeholder="新加坡" /></FormField><FormField label="城市" id="city"><Input id="city" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} placeholder="Singapore" /></FormField><FormField label="申请轮次" id="round"><Input id="round" value={form.round} onChange={(event) => setForm({ ...form, round: event.target.value })} placeholder="Round 1" /></FormField><FormField label="截止日期" id="deadline"><Input id="deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></FormField><FormField label="网申网站" id="application-url" className="sm:col-span-2"><Input id="application-url" type="url" value={form.applicationUrl} onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })} placeholder="https://..." /></FormField><FormField label="项目备注" id="notes" className="sm:col-span-2"><Textarea id="notes" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="记录文书要求、奖学金、推荐信数量或下一步" rows={4} /></FormField></div><DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!form.university.trim() || !form.program.trim()} onClick={() => onSave(form)}><Check /> 保存项目</Button></DialogFooter></DialogContent></Dialog>;
}

function blankProject(): ProjectRecord { return { id: newId('project'), university: '', program: '', region: '', city: '', round: '', deadline: '', applicationUrl: '', notes: '', status: 'planning', materials: defaultMaterials() }; }

function MaterialDialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (material: MaterialRecord) => void }) {
  const [label, setLabel] = useState(''); const [requirement, setRequirement] = useState(''); const [owner, setOwner] = useState('共同');
  return <Dialog open={open} onOpenChange={(value) => !value && onClose()}><DialogContent><DialogHeader><DialogTitle>添加申请材料</DialogTitle><DialogDescription>可以添加作品集、奖学金 Essay、WES、视频面试等项目特有材料。</DialogDescription></DialogHeader><div className="space-y-4 py-2"><FormField label="材料名称" id="material-label"><Input id="material-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Scholarship Essay" /></FormField><FormField label="具体要求" id="material-requirement"><Textarea id="material-requirement" value={requirement} onChange={(event) => setRequirement(event.target.value)} placeholder="最多 400 词，与主申请同时提交" /></FormField><FormField label="负责人" id="material-owner"><Input id="material-owner" value={owner} onChange={(event) => setOwner(event.target.value)} /></FormField></div><DialogFooter><Button variant="outline" onClick={onClose}>取消</Button><Button disabled={!label.trim()} onClick={() => onSave({ id: newId('mat'), label, requirement, owner, required: true, status: 'todo' })}><Plus /> 添加</Button></DialogFooter></DialogContent></Dialog>;
}

function FormField({ label, id, className = '', children }: { label: string; id: string; className?: string; children: React.ReactNode }) { return <div className={className}><Label htmlFor={id}>{label}</Label><div className="mt-2">{children}</div></div>; }
