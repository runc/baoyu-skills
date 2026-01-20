---
name: baoyu-comic
description: 知识漫画创作技能，支持多种风格（Logicomix/欧漫清线派、Ohmsha 漫画指南）。创作原创教育漫画，包含详细分镜和连续图像生成。当用户要求创建"知识漫画"、"教育漫画"、"传记漫画"、"教程漫画"或"Logicomix 风格漫画"时使用。
---

# 知识漫画创作器

创作多种视觉风格的原创知识漫画。

## 用法

```bash
/baoyu-comic posts/turing-story/source.md
/baoyu-comic  # 然后粘贴内容
```

## 选项

| 选项 | 值 |
|------|-----|
| `--style` | classic（默认）、dramatic、warm、tech、sepia、vibrant、ohmsha、realistic 或自定义描述 |
| `--layout` | standard（默认）、cinematic、dense、splash、mixed、webtoon |
| `--aspect` | 3:4（默认，竖版）、4:3（横版）、16:9（宽屏） |
| `--lang` | auto（默认）、zh、en、ja 等 |

风格 × 布局 × 比例可自由组合。自定义风格可用自然语言描述。

**整部漫画的宽高比保持一致。**

## 自动选择

| 内容信号 | 风格 | 布局 |
|----------|------|------|
| 教程、操作指南、入门 | ohmsha | webtoon |
| 计算机、AI、编程 | tech | dense |
| 1950年前、古典、古代 | sepia | cinematic |
| 个人故事、导师 | warm | standard |
| 冲突、突破 | dramatic | splash |
| 葡萄酒、美食、商业、生活方式、专业 | realistic | cinematic |
| 传记、平衡 | classic | mixed |

## 脚本目录

**重要**：所有脚本位于此技能的 `scripts/` 子目录中。

**Agent 执行说明**：
1. 确定此 SKILL.md 文件的目录路径为 `SKILL_DIR`
2. 脚本路径 = `${SKILL_DIR}/scripts/<脚本名>.ts`
3. 将本文档中所有 `${SKILL_DIR}` 替换为实际路径

**脚本参考**：
| 脚本 | 用途 |
|------|------|
| `scripts/merge-to-pdf.ts` | 将漫画页面合并为 PDF |

## 文件结构

```
[target]/
├── source.md                      # 源内容（如果是粘贴的，不是文件）
├── analysis.md                    # 深度分析结果（YAML+MD）
├── storyboard-chronological.md    # 变体 A（保留）
├── storyboard-thematic.md         # 变体 B（保留）
├── storyboard-character.md        # 变体 C（保留）
├── characters-chronological/      # 变体 A 角色（保留）
│   ├── characters.md
│   └── characters.png
├── characters-thematic/           # 变体 B 角色（保留）
│   ├── characters.md
│   └── characters.png
├── characters-character/          # 变体 C 角色（保留）
│   ├── characters.md
│   └── characters.png
├── storyboard.md                  # 最终选定
├── characters/                    # 最终选定
│   ├── characters.md
│   └── characters.png
├── prompts/
│   ├── 00-cover-[slug].md
│   └── NN-page-[slug].md
├── 00-cover-[slug].png
├── NN-page-[slug].png
└── {topic-slug}.pdf
```

**目标目录**：
- 有源文件路径：`[source-dir]/[source-name-no-ext]/comic/`
  - 示例：`/posts/turing-story.md` → `/posts/turing-story/comic/`
- 无源文件：`./comic/[topic-slug]/`

**目录备份**：
- 如果目标目录已存在，将现有目录重命名为 `<dirname>-backup-YYYYMMDD-HHMMSS`

## 工作流程

### 步骤 1：分析内容 → `analysis.md`

读取源内容，必要时保存，并进行深度分析。

**操作**：
1. **保存源内容**（如果还不是文件）：
   - 如果用户提供文件路径：直接使用
   - 如果用户粘贴内容：保存到目标目录的 `source.md`
2. 读取源内容
3. **深度分析**，遵循 `references/analysis-framework.md`：
   - 目标受众识别
   - 读者价值主张
   - 核心主题和叙事潜力
   - 关键人物及其故事弧
4. 检测源语言
5. 确定推荐页数：
   - 短篇故事：5-8 页
   - 中等复杂度：9-15 页
   - 完整传记：16-25 页
6. 分析内容信号以获取风格/布局建议
7. **保存到 `analysis.md`**

**analysis.md 格式**：

```yaml
---
title: "艾伦·图灵：计算机之父"
topic: 传记
time_span: 1912-1954
source_language: en
user_language: zh
aspect_ratio: "3:4"
recommended_page_count: 12
---

## 目标受众

- **主要**：对计算机历史感兴趣的技术爱好者
- **次要**：学习科学突破的学生
- **第三**：对传记故事感兴趣的普通读者

## 价值主张

读者将获得：
1. 理解现代计算机是如何诞生的
2. 与一位杰出但悲剧性人物的情感连接
3. 欣赏创新的人性代价

## 核心主题

| 主题 | 叙事潜力 | 视觉机会 |
|------|----------|----------|
| 天才与社会 | 高冲突，戏剧性弧线 | 对比场景 |
| 密码破译 | 悬疑，张力 | 技术图表作为艺术 |
| 个人悲剧 | 情感深度 | 亲密、肃穆的画面 |

## 关键人物与故事弧

### 艾伦·图灵（主角）
- **弧线**：被误解的天才 → 战争英雄 → 悲剧结局
- **视觉特征**：凌乱的学者，深邃的眼神
- **关键时刻**：恩尼格玛突破、逮捕、最后的日子

### 克里斯托弗·莫科姆（催化剂）
- **角色**：早期朋友，其去世影响了图灵
- **视觉特征**：年轻、明亮
- **关键时刻**：校园友谊、突然离世

## 内容信号

- "传记" → classic + mixed
- "计算机历史" → tech + dense
- "个人悲剧" → dramatic + splash

## 推荐方案

1. **时间顺序** - 按生平时间线（传记推荐）
2. **主题式** - 按贡献组织（适合教育重点）
3. **人物中心** - 关系驱动叙事（适合情感冲击）
```

### 步骤 2：生成 3 个故事板变体

创建三个不同的变体，每个结合一种叙事方法和推荐风格。

| 变体 | 叙事方法 | 推荐风格 | 布局 |
|------|----------|----------|------|
| A | 时间顺序 | sepia | cinematic |
| B | 主题式 | tech | dense |
| C | 人物中心 | warm | standard |

**对于每个变体**：

1. **生成故事板**（`storyboard-{approach}.md`）：
   - YAML 前置元数据，包含 narrative_approach、recommended_style、recommended_layout、aspect_ratio
   - 封面设计
   - 每页：布局、分镜、视觉提示
   - **使用用户首选语言编写**
   - 参考：`references/storyboard-template.md`

2. **生成匹配的角色**（`characters-{approach}/`）：
   - `characters.md` - 匹配推荐风格的视觉规格（使用用户首选语言）
   - `characters.png` - 角色参考图
   - 参考：`references/character-template.md`

**所有变体在选择后保留以供参考。**

### 步骤 3：用户确认所有选项

**重要**：在单个确认步骤中使用 AskUserQuestion 呈现所有选项。不要用多个单独的确认中断工作流程。

**确定要询问哪些问题**：

| 问题 | 何时询问 |
|------|----------|
| 故事板变体 | 始终（必需） |
| 视觉风格 | 始终（必需） |
| 语言 | 仅当 `source_language ≠ user_language` 时 |
| 宽高比 | 仅当用户可能偏好非默认值时（如横版内容） |

**语言处理**：
- 如果源语言 = 用户语言：仅通知用户（如"漫画将使用中文"）
- 如果不同：询问使用哪种语言

**所有故事板和提示都使用用户选择/首选的语言生成。**

**宽高比处理**：
- 默认：3:4（竖版）- 标准漫画格式
- 如果内容适合，提供 4:3（横版）（如全景场景、技术图表）
- 为电影感内容提供 16:9（宽屏）

**AskUserQuestion 格式**（包含所有问题的示例）：

```
问题 1（故事板）：选择哪个故事板变体？
- A：时间顺序 + sepia（推荐）
- B：主题式 + tech
- C：人物中心 + warm
- 自定义

问题 2（风格）：选择哪种视觉风格？
- sepia（变体推荐）
- classic / dramatic / warm / tech / vibrant / ohmsha / realistic
- 自定义描述

问题 3（语言）- 仅在不匹配时：
- 中文（源材料语言）
- 英文（您的偏好）

问题 4（比例）- 仅在相关时：
- 3:4 竖版（推荐）
- 4:3 横版
- 16:9 宽屏
```

**确认后**：
1. 复制选定的故事板 → `storyboard.md`
2. 复制选定的角色 → `characters/`
3. 更新 YAML 前置元数据，包含确认的风格、语言、宽高比
4. 如果风格与变体推荐不同：重新生成 `characters/characters.png`
5. 用户可直接编辑文件进行微调

### 步骤 4：生成图像

使用确认的故事板 + 风格 + 宽高比：

**对于每一页（封面 + 内页）**：
1. 将提示保存到 `prompts/NN-{cover|page}-[slug].md`（使用用户首选语言）
2. 使用确认的风格和宽高比生成图像
3. 每次生成后报告进度

**图像生成技能选择**：
- 检查可用的图像生成技能
- 如果有多个技能可用，询问用户偏好

**角色参考处理**：
- 如果技能支持参考图像：传递 `characters/characters.png`
- 如果技能不支持参考图像：在提示中包含 `characters/characters.md` 内容

**会话管理**：
如果图像生成技能支持 `--sessionId`：
1. 生成唯一会话 ID：`comic-{topic-slug}-{timestamp}`
2. 所有页面使用相同的会话 ID
3. 确保生成图像的视觉一致性

### 步骤 5：合并为 PDF

所有图像生成后：

```bash
npx -y bun ${SKILL_DIR}/scripts/merge-to-pdf.ts <comic-dir>
```

创建 `{topic-slug}.pdf`，所有页面作为全页图像。

### 步骤 6：完成报告

```
漫画完成！
标题：[title] | 风格：[style] | 页数：[count] | 比例：[ratio] | 语言：[lang]
位置：[path]
✓ analysis.md
✓ characters.png
✓ 00-cover-[slug].png ... NN-page-[slug].png
✓ {topic-slug}.pdf
```

## 页面修改

支持在初始生成后修改单个页面。

### 编辑单页

使用修改后的提示重新生成特定页面：

1. 确定要编辑的页面（如 `03-page-enigma-machine.png`）
2. 如需要，更新 `prompts/03-page-enigma-machine.md` 中的提示
3. 如果内容有重大变化，更新文件名中的 slug
4. 使用相同的会话 ID 和宽高比重新生成图像
5. 重新生成 PDF

### 添加新页

在指定位置插入新页面：

1. 指定插入位置（如第 3 页之后）
2. 创建带有适当 slug 的新提示（如 `04-page-bletchley-park.md`）
3. 生成新页面图像（相同宽高比）
4. **重新编号文件**：所有后续页面的 NN 加 1
   - `04-page-tragedy.png` → `05-page-tragedy.png`
   - slug 保持不变
5. 更新 `storyboard.md`，添加新页面条目
6. 重新生成 PDF

### 删除页面

删除页面并重新编号：

1. 确定要删除的页面（如 `03-page-enigma-machine.png`）
2. 删除图像文件和提示文件
3. **重新编号文件**：所有后续页面的 NN 减 1
   - `04-page-tragedy.png` → `03-page-tragedy.png`
   - slug 保持不变
4. 更新 `storyboard.md`，删除页面条目
5. 重新生成 PDF

### 文件命名规范

文件使用有意义的 slug 以提高可读性：
```
NN-cover-[slug].png / NN-page-[slug].png
NN-cover-[slug].md / NN-page-[slug].md（在 prompts/ 中）
```

示例：
- `00-cover-turing-story.png`
- `01-page-early-life.png`
- `02-page-cambridge-years.png`
- `03-page-enigma-machine.png`

**slug 规则**：
- 从页面标题/内容派生（kebab-case）
- 在漫画中必须唯一
- 当页面内容有重大变化时，相应更新 slug

**重新编号**：
- 添加/删除后，更新受影响页面的 NN 前缀
- 除非内容变化，否则 slug 保持不变
- 保持连续编号，无间隙

## 风格特定指南

### Ohmsha 风格（`--style ohmsha`）

教育漫画的额外要求：
- **默认：直接使用哆啦A梦角色** - 无需创建新角色
  - 大雄（Nobita）：学生角色，好奇的学习者
  - 哆啦A梦（Doraemon）：导师角色，用道具解释概念
  - 胖虎（Gian）：对手/挑战角色，代表障碍或误解
  - 静香（Shizuka）：辅助角色，提出澄清问题
- 仅在明确要求时使用自定义角色：`--characters "Student:小明,Mentor:教授"`
- 必须使用视觉隐喻（道具、动作场景）- 不要只画说话的头像
- 页面标题：叙事风格，而非"第 X 页：主题"

**参考**：`references/ohmsha-guide.md` 获取详细指南。

## 参考资料

`references/` 目录中的详细模板和指南：
- `analysis-framework.md` - 漫画改编的深度内容分析
- `character-template.md` - 角色定义格式和示例
- `storyboard-template.md` - 故事板结构和分镜
- `ohmsha-guide.md` - Ohmsha 漫画风格详情
- `styles/` - 详细风格定义
- `layouts/` - 详细布局定义

## 扩展支持

通过 EXTEND.md 自定义风格和配置。

**检查路径**（优先顺序）：
1. `.baoyu-skills/baoyu-comic/EXTEND.md`（项目）
2. `~/.baoyu-skills/baoyu-comic/EXTEND.md`（用户）

如果找到，在步骤 1 之前加载。扩展内容覆盖默认值。
