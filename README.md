# 2027 Fall 申请归档台

一个脱敏、纯前端的留学申请材料看板，当前内置杨琪勇的 13 个 2027 Fall 项目。它用于查看截止日期、逐项目材料、推荐信分配、奖学金机制与负责人，不保存真实申请文件。

## 当前能力

- 13 个项目总览、国家/地区筛选与项目搜索
- 每个项目的文书、CV、推荐信、成绩单、GRE/WES 等逐项要求
- 预计日期与 2027 官方日期分开标记
- 推荐信数量和三位推荐人的叙事分工
- 浏览器本地修改状态；JSON 导入/导出用于无后端协作
- GitHub Pages 静态构建与自动部署工作流

## 隐私边界

仓库只存脱敏元数据。不要提交以下内容：

- 护照、身份证、证件照
- 成绩单、排名证明、在读或学位证明
- IELTS/GRE 成绩报告、WES reference
- 推荐信正文、推荐人私信
- Portal 账号、密码、申请号、付款收据

真实文件应放在权限受控的私密云盘。页面未来可以添加私密分享链接，但不要添加公开链接。

## 本地运行

```bash
pnpm install
pnpm run dev
```

生产构建：

```bash
pnpm run build
```

GitHub Pages 静态构建：

```bash
pnpm run build:pages
```

输出目录为 `pages-dist/`。

## 修改项目数据

所有个人项目数据集中在 `app/data.ts`。更新截止日期时，同时维护：

- `deadline`：界面显示文本
- `deadlineSort`：`YYYY-MM-DD` 排序值
- `verified`：只有 2027 官方页面明确发布后才能设为 `true`
- `applicationUrl` / `scholarshipUrl`：只使用学校官方页面

## GitHub Pages

仓库已包含 `.github/workflows/deploy-pages.yml`。在 GitHub 仓库 Settings → Pages 中把 Source 设为 **GitHub Actions** 后，推送到 `main` 即会自动构建。

建议先保持仓库私有。若账户套餐不支持私有 Pages，需要决定：升级套餐，或另建一个只含更少个人信息的公开展示仓库。

## 无后端协作方式

页面状态保存在浏览器 `localStorage`，不会自动在两台设备间同步。任一方更新后可点“导出进度”，将 JSON 发给另一方导入。需要实时协作时，再接入 Supabase/Airtable 等后端。
