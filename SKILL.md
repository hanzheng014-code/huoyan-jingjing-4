---
name: huoyan-jingjing-4
description: Use when optimizing Chinese SRT subtitles with “火眼金睛 4.0”, “字幕语义断句”, “修复字幕断句”, or “大模型校对并重断句”. First apply 火眼金睛 2.0 rules and 3.0 contextual proofreading, then use a large-language-model to repair only high-confidence semantic boundaries across adjacent cues. Produce an auditable final SRT, text review, and boundary review.
---

# 火眼金睛 4.0

在 3.0 的“规则清洗 + 全文上下文校对”后，先执行回归验证过的文本复核规则，再修复相邻字幕的语义断句。断句只改变已经确认错误的边界；不改写正文，不凭空删除或补充字符。

## 工作流

1. 运行火眼金睛 2.0，并保留 `stage-v2` 的全部产物。
2. 对 2.0 输出运行火眼金睛 3.0 的全文上下文复核，并保留每处文字改动依据。
3. 对 3.0 输出运行 `scripts/apply_regression_rules.js`。仅应用已有人工基准支持的文本规则，并输出修改清单。
4. 按连续的 2–4 条字幕审阅语义边界。仅在边界切在同一词、短语或完整句内部时提出重断句。
5. 每个候选断句组写入 `boundary-changes.json`，格式：

```json
[{"startCue":120,"endCue":121,"segments":["完整的第一句","完整的第二句"],"reason":"原边界切开了同一短语","confidence":"high"}]
```

6. `segments` 拼接后必须与原组字幕拼接后完全相同（忽略空白）。不满足时拒绝应用。
7. 使用 `scripts/apply_semantic_boundaries.js` 生成最终 SRT 和 HTML。当前脚本按字符比例重分配该组原有时长，并在 HTML 中标记“需试听复核”。有词级时间戳时，可人工据此校正时间轴。
8. 验收：输出所有文本与边界修改及依据；不在规则或 JSON 中的文字和边界不得变动。

## 回归文本规则

- 全局删除：`嗯、啊、呀、哈、哎、呃、诶、哦、噢、唉、啦、呐、啧、嘿`。
- 停顿语气词保留并隔开：`大家好` 后面紧接正文时加一个空格；`对吧、对不对、好吧` 用作停顿词时，前后均用一个空格隔开。`好、好的、是不是` 仅在一条字幕的开头或结尾作为独立停顿词时才留空格；位于句子中间时不处理，例如“你看是不是太小”“挺好的对不对”保持原样。`好` 在开头仅处理 `好那、好现在、好接下来、好我们、好那么、好然后、好今天、好后面、好继续、好首先、好稍微、好OK、好别、好这样、好不` 等固定引导语境。不能确认是停顿词时不加空格，例如 `好的照片`、`拍得好`、`好看`、`好在` 保持原样。`很好、挺好、得好、美好、更好、较好、还好`（及其“好的”形式）属于完整评价结构，绝不拆分；发现误空格时自动合并。
- 在副词后接动作或状态时，将“的”改为“地”，包括：`悠闲、完整、清楚、明显、自然、精细、尽可能、一目了然、非常、很好`。名词定语如“完整的绿色”不得改动。
- 摄影术语：`胶段` 改为 `焦段`。
- 剪辑搭配：`相接的顺序` 改为 `衔接的顺序`。
- 中文语境中的孤立英文词、重复起句和无法解释的短语不得自动删除；必须列入大模型上下文复核清单。

## 边界判断

- 修复：词内切断、短语拆开、主谓宾被硬切、明显的跨条粘连。
- 保留：正常的口语停顿、证据不足的省略、仅因一条过长而做的猜测性拆分。
- 不确定时列入复核，不自动重断句。

## 执行

```powershell
node "scripts/apply_semantic_boundaries.js" `
  --input "3.0输出.srt" `
  --changes "boundary-changes.json" `
  --output-dir "输出目录"
```

输出为 `<原文件名>_huoyan4.srt` 与 `<原文件名>_huoyan4_boundary_review.html`。
