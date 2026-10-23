# 火眼金睛 4.0

中文 SRT 字幕校对与语义断句 Skill。先完成火眼金睛 2.0 的保守清洗和 3.0 的上下文复核，再应用回归文本规则，最后只修复高置信度的相邻字幕断句。

## 内容

- `SKILL.md`：工作流与判断规则。
- `scripts/apply_regression_rules.js`：应用回归文本规则并输出修改清单。
- `scripts/apply_semantic_boundaries.js`：根据人工确认的断句清单生成最终 SRT 和 HTML 复核页。
- `boundary-changes.example.json`：断句清单的空白示例。

## 使用前提

- Node.js 18 或更新版本。
- 已安装并完成火眼金睛 2.0、3.0；本仓库只包含 4.0。
- 输入文件为 UTF-8 编码的标准 SRT。

将本仓库目录放入 Codex 的 Skills 目录后，按 `SKILL.md` 执行。脚本也可单独运行：

```powershell
node scripts/apply_regression_rules.js --input "3.0输出.srt" --output-dir "输出目录"
node scripts/apply_semantic_boundaries.js --input "回归规则输出.srt" --changes "boundary-changes.json" --output-dir "输出目录"
```

断句清单中的每组 `segments` 拼接后必须与原字幕文字一致（忽略空白），否则脚本会拒绝应用。当前脚本按字符比例重新分配修改组的时间；请对照音频复核时间点。

原本机目录中的 `test-output/` 是运行结果，本仓库不收录。
