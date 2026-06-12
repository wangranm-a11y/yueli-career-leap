/* ================================================================
   ai-service.js — DeepSeek API integration + Prompt engineering
   Exposes: window.AIService
   ================================================================ */

(function () {
  'use strict';

  const DEEPSEEK_BASE = 'https://api.deepseek.com/v1';
  const DEEPSEEK_PROXY = '/api/deepseek';
  const DEFAULT_MODEL = 'deepseek-v4-pro';  // V4-Pro — much better at creative rewriting
  const PRO_MODEL = 'deepseek-v4-pro';
  let lastParseMeta = {};

  // ── Prompt Templates ──

  const SYSTEM_PROMPT_RESUME = `你是帮转行者改简历的 AI。你会收到一份"经历事实清单"（已从原始简历中提取的中性事实）。你的任务：基于这些事实 + 目标 JD，从零撰写一份全新简历。

## 铁律
1. **从事实重建，不参考原文**：你收到的只有事实数据，没有原始措辞。每一句话都必须是自己新写的。
2. **先重组再写作**：先在心里把事实池按目标岗位需要的能力重新分组（如用户洞察、数据分析、项目推进、商业判断、内容/增长等），不要沿用原简历的经历顺序和重点。
3. **取舍与包装**：最相关经历放在最前面并写得最充分；高相关实习经历写 4 条 bullet，其他高相关项目/校园经历写 3 条 bullet。低相关经历也不能完全不写，要通过语言重组往目标岗位能力靠，至少保留 1-2 条能体现迁移能力的 bullet，用来增强简历厚度。真实实习经历永远不要改写成项目经历；公司/机构经历必须放在 experiences。
4. **禁止第一人称**：不要写"我"、"这证明了我"、"使我能够"。
5. **禁止写目标岗位名称**：不要在简历里出现"产品经理"、"运营"等岗位名。用能力描述代替——如"为理解用户留存与活跃指标提供了实操经验"而非"为产品经理理解指标提供了实操经验"。
6. **bullet 格式**：四字标题 + 简洁内容，结尾句和前面用逗号衔接。如"竞品分析: 调研 20+ 款竞品从定位/交互/商业化维度输出报告，为 GTM 策略提供依据"。不要写成两句分开的话。
7. **STAR + 适配总结**：每条 bullet 都要包含「场景/问题 + 行动 + 结果/产出 + 能力总结」。每条必须写到中文简历预览约一行半到两行之间，不能短于一行，不能写成大段话；页面整体要呈现信息密集、经验丰富的观感。最后半句必须回归到目标岗位需要的能力，如用户洞察、需求拆解、数据复盘、跨部门推进、商业判断、项目闭环等；不要写"这证明了..."，而是自然接在句尾。
8. **量化优先**：能用数字就用数字；没有数字时写清动作、对象、方法和产出，不要写空泛品质。
9. **高密度一页**：中文简历必须占满 A4 一页，这是硬指标。参考正式求职简历的高信息密度，教育 1-3 行，实习/项目/创业校园经历合计 6-8 段，bullet 合计 20-26 条。不要生成半页简历，也不要让版面显得空。
10. **填充优先级**：经历事实足够时，只写教育、实习经历、项目经历、创业/校园经历。优先扩写过往经历，尤其是实习经历；不太相关的经历也要包装成目标岗位可迁移能力。只有经历素材极少、无法形成完整一页时，才允许补充「工作技能」和「个人概述」。技能/个人评价永远放最后，不能作为常规模块输出。
11. **事实优先机制**：只能改写、筛选、重组用户事实，不能编造公司、岗位、学历、奖项、数据、技能、作品链接或时间。用户没有提供的信息不要写成确定事实；不确定内容要弱化为可验证动作/产出，或留空。
12. **数据可信度**：尽量使用用户素材中已有数字（样本量、报告字数、项目数量、用户数、转化/阅读/报名/成本等）。如果素材没有数字，不要硬编；改写为可验证产出，如"输出需求文档/竞品矩阵/交互脚本/测试记录"。如果用户要求"更数据化"，也只能优先挖掘已有数据，不能凭空补数字。
13. **模块分类（绝对不能犯错）**：真实实习/工作必须放在 experiences/实习经历，不要为了贴合岗位改名塞进 projects/项目经历。只要经历标题或内容里有公司/机构名称、岗位名称、实习生/Intern/运营/产品/市场等职能，必须归入 experiences。课程项目、比赛、side project 才放 projects；创业、社团、校园活动、学生组织、志愿者经历放 campus。
14. **标题命名**：experiences 的 company 字段写公司/组织名称，role 字段写岗位/职能名称；不要把 company 写成"参与某某项目"。projects 的 name 字段写项目正式名称。
15. **时间准确**：duration 必须从用户原始材料提取，不要推测、补造或改写年份月份；如果只有年份就只写年份，如果没有时间就留空。经历按时间倒序组织，最近的经历在上面。
16. **教育完善**：教育经历必须尽量提取并写入 GPA、排名、国家奖学金、个人奖项、荣誉、核心课程、语言能力等。若正文经历仍不足以撑满一页，可以把专业技能、语言能力融入对应大学的 notes 中，而不是优先新增技能/个人概述模块。
17. **排序原则**：整体优先按目标岗位相关性排序，最相关经历放前面；相关性接近时，再按时间倒序排列。

## 格式
返回 JSON：{"zh":{"name":"","phone":"","email":"","links":[],"education":[{"school":"","degree":"","duration":"","notes":""}],"experiences":[{"company":"","role":"","duration":"","highlights":["四字标题: 内容"]}],"projects":[{"name":"","role":"","duration":"","highlights":["四字标题: 内容"]}],"campus":[{"name":"","role":"","duration":"","highlights":["四字标题: 内容"]}],"skills":[{"category":"","items":[]}],"summary":""}}
中文严格一页 A4。顺序：教育背景 → 实习经历 → 项目经历 → 创业/校园经历 → 技能/个人概述（最后补充）。`;

  const SYSTEM_PROMPT_REWRITE = `你是简历精修专家。用户选中了一段简历文字并给出了修改指令。

## 规则
1. 只改写用户选中的部分，不要动其他内容
2. 只从用户已有的经历素材中提取信息——绝不编造
3. 遵循 STAR 结构和量化原则
4. 如果用户指令与简历上下文冲突，优先保证真实性
5. 如果改写 bullet，控制在中文简历预览两行左右，最后半句自然总结与目标岗位能力的关联
6. 返回改写后的纯文本（不要 JSON），可以直接替换到原位置

用户会给你的上下文包括：完整的简历内容 + 选中的文字 + 修改指令。`;

  const SYSTEM_PROMPT_SCORE = `你是简历评审专家（HR 视角）。请对简历与 JD 的匹配度进行评分。

## 评分维度（每项 0-20 分，总分 100）
1. **关键词匹配**：JD 中的核心技能和要求在简历中的覆盖程度
2. **经历相关性**：经历描述是否针对 JD 岗位做了有效筛选和强调
3. **量化成果**：经历要点中数据化、结果化的程度
4. **STAR 结构**：经历描述的结构完整性和叙事质量
5. **整体印象**：排版建议、语言专业度、以及作为转行简历的亮点突出程度

返回 JSON：
{
  "totalScore": 85,
  "dimensions": {
    "keywords": { "score": 18, "comment": "..." },
    "relevance": { "score": 16, "comment": "..." },
    "quantification": { "score": 15, "comment": "..." },
    "starStructure": { "score": 18, "comment": "..." },
    "overallImpression": { "score": 18, "comment": "..." }
  },
  "topSuggestions": ["最重要的改进建议1", "建议2"],
  "jdGapAnalysis": "你的经历与 JD 之间最大的差距是什么，如何弥补"
}`;

  // ── API Call ──

  async function callDeepSeek({ model = DEFAULT_MODEL, systemPrompt, userMessage, temperature = 0.7, maxTokens = 8192, jsonMode = true }) {
    const apiKey = getApiKey();

    const isReasoner = model === 'deepseek-reasoner';
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: maxTokens
    };
    if (!isReasoner) {
      body.temperature = temperature;
      if (jsonMode) body.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    let response;
    try {
      response = await fetch(apiKey ? `${DEEPSEEK_BASE}/chat/completions` : DEEPSEEK_PROXY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === 'AbortError') throw new Error('请求超时（60秒），请检查网络后重试');
      throw new Error(`网络请求失败: ${e.message}`);
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (response.status === 401) throw new Error(apiKey ? 'API_KEY_INVALID' : 'SERVER_API_KEY_INVALID');
      if (response.status === 429) throw new Error('API_RATE_LIMIT');
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const msg = data.choices?.[0]?.message;
    const content = msg?.content;
    if (!content) throw new Error('API_EMPTY_RESPONSE');
    if (!jsonMode) return { raw: content.trim() };

    // Try to parse JSON from content
    try {
      let jsonStr = content.trim();
      // Handle markdown-wrapped JSON
      const m = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (m) jsonStr = m[1].trim();
      // If it starts with JSON, try to parse the whole thing
      if (jsonStr.startsWith('{') || jsonStr.startsWith('[')) {
        return JSON.parse(jsonStr);
      }
      // Find the first { and last }
      const objStart = jsonStr.indexOf('{');
      const objEnd = jsonStr.lastIndexOf('}');
      if (objStart >= 0 && objEnd > objStart) {
        return JSON.parse(jsonStr.slice(objStart, objEnd + 1));
      }
      const arrStart = jsonStr.indexOf('[');
      const arrEnd = jsonStr.lastIndexOf(']');
      if (arrStart >= 0 && arrEnd > arrStart) {
        return JSON.parse(jsonStr.slice(arrStart, arrEnd + 1));
      }
      return { raw: content };
    } catch (e) {
      console.warn('JSON parse failed, returning raw:', e.message);
      return { raw: content };
    }
  }

  // ── Key Management ──

  function getApiKey() {
    return localStorage.getItem('cs_apiKey') || '';
  }

  function setApiKey(key) {
    localStorage.setItem('cs_apiKey', key.trim());
  }

  function hasApiKey() {
    return true;
  }

  function hasUserApiKey() {
    return !!getApiKey();
  }

  // ── File Parsing ──

  async function parseFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    lastParseMeta = { filename: file.name, ext, topLines: [], topNameCandidates: [] };

    switch (ext) {
      case 'txt':
      case 'md':
        return await parsePlainText(file);

      case 'pdf':
        return await parsePDF(file);

      case 'docx':
        return await parseDOCX(file);

      default:
        return await parsePlainText(file); // fallback
    }
  }

  function readAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function parsePlainText(file) {
    const text = await readAsText(file);
    const topLines = String(text || '').split(/\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 24);
    lastParseMeta.topLines = topLines;
    lastParseMeta.topNameCandidates = topLines.slice(0, 8);
    return text;
  }

  // Init pdf.js worker once
  let pdfWorkerInit = false;
  function initPDFWorker() {
    if (!pdfWorkerInit) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      pdfWorkerInit = true;
    }
  }

  async function parsePDF(file) {
    initPDFWorker();
    const arrayBuffer = await file.arrayBuffer();
    try {
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const texts = [];
      // Try to extract photo from first page
      if (!window.__extractedPhoto) {
        try {
          const page1 = await pdf.getPage(1);
          const opList = await page1.getOperatorList();
          // Look for image painting ops — crude but works for simple PDFs
          for (let i = 0; i < opList.fnArray.length; i++) {
            if (
              opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
              opList.fnArray[i] === pdfjsLib.OPS.paintJpegXObject ||
              opList.fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject
            ) {
              const imgKey = opList.argsArray[i][0];
              try {
                const img = await new Promise((resolve, reject) => {
                  page1.objs.get(imgKey, (img) => img ? resolve(img) : reject('no img'));
                });
                if (img && img.data && img.width > 60 && img.height > 60) {
                  const canvas = document.createElement('canvas');
                  canvas.width = img.width; canvas.height = img.height;
                  const ctx = canvas.getContext('2d');
                  const imgData = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
                  ctx.putImageData(imgData, 0, 0);
                  window.__extractedPhoto = canvas.toDataURL('image/jpeg', 0.85);
                  break; // Take first suitable image
                }
              } catch(e) { /* skip this image */ }
            }
          }
        } catch(e) { /* photo extraction is best-effort */ }
      }
      // Extract text
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        if (i === 1) {
          const topMeta = extractPDFTopTextMeta(content.items);
          lastParseMeta.topLines = topMeta.topLines;
          lastParseMeta.topNameCandidates = topMeta.topNameCandidates;
        }
        const pageText = extractPDFLines(content.items).join('\n');
        texts.push(pageText);
      }
      if (!window.__extractedPhoto) {
        try { window.__extractedPhoto = await extractTopRightPhotoFallback(pdf); }
        catch (e) { /* fallback is best-effort */ }
      }
      const extractedText = cleanupExtractedText(texts.join('\n'));
      if (!extractedText.trim()) throw new Error('PDF 中未提取到文字，可能是扫描件或图片型 PDF');
      if (looksGarbled(extractedText)) {
        throw new Error('PDF 文字编码异常，提取结果可能是乱码。请改用 DOCX/TXT，或直接复制简历文字粘贴到经历素材框。');
      }
      return extractedText;
    } catch (e) {
      console.error('PDF parse error:', e);
      throw new Error(`PDF 解析失败: ${e.message || '未知错误'}`);
    }
  }

  async function parseDOCX(file) {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (!result.value || !result.value.trim()) {
        throw new Error('DOCX 中未提取到文字内容');
      }
      const topLines = result.value.split(/\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 24);
      lastParseMeta.topLines = topLines;
      lastParseMeta.topNameCandidates = topLines.slice(0, 8);
      return result.value;
    } catch (e) {
      console.error('DOCX parse error:', e);
      throw new Error(`DOCX 解析失败: ${e.message || '未知错误'}`);
    }
  }

  function extractPDFTopTextMeta(items) {
    const positioned = (items || [])
      .map(item => ({
        text: String(item.str || '').replace(/\s+/g, ' ').trim(),
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0,
        size: Math.max(Math.abs(item.transform?.[0] || 0), Math.abs(item.transform?.[3] || 0), item.height || 0)
      }))
      .filter(item => item.text);
    if (!positioned.length) return { topLines: [], topNameCandidates: [] };
    const maxY = Math.max(...positioned.map(item => item.y));
    const minY = Math.min(...positioned.map(item => item.y));
    const topCut = maxY - (maxY - minY) * 0.22;
    const topItems = positioned.filter(item => item.y >= topCut).sort((a, b) => {
      if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });
    const groups = [];
    topItems.forEach(item => {
      let group = groups.find(g => Math.abs(g.y - item.y) <= 3);
      if (!group) {
        group = { y: item.y, size: item.size, items: [] };
        groups.push(group);
      }
      group.size = Math.max(group.size, item.size);
      group.items.push(item);
    });
    const lines = groups
      .sort((a, b) => b.y - a.y)
      .map(g => ({
        text: g.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ').replace(/\s+/g, ' ').trim(),
        size: g.size
      }))
      .filter(line => line.text);
    const largest = Math.max(...lines.map(line => line.size));
    const bigLines = lines.filter(line => line.size >= largest * 0.85).map(line => line.text);
    return {
      topLines: lines.map(line => line.text).slice(0, 12),
      topNameCandidates: bigLines.concat(lines.map(line => line.text)).slice(0, 10)
    };
  }

  function extractPDFLines(items) {
    const positioned = (items || [])
      .map(item => ({
        text: String(item.str || '').replace(/\s+/g, ' ').trim(),
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0
      }))
      .filter(item => item.text);
    if (!positioned.length) return [];
    const groups = [];
    positioned.forEach(item => {
      let group = groups.find(g => Math.abs(g.y - item.y) <= 3);
      if (!group) {
        group = { y: item.y, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    });
    return groups
      .sort((a, b) => b.y - a.y)
      .map(g => g.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }

  function cleanupExtractedText(text) {
    return String(text || '')
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function looksGarbled(text) {
    const s = String(text || '');
    if (!s.trim()) return true;
    const replacement = (s.match(/\uFFFD/g) || []).length;
    const cid = (s.match(/\(cid:\d+\)/gi) || []).length;
    const visible = s.replace(/\s/g, '').length || 1;
    const cjk = (s.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latin = (s.match(/[A-Za-z]/g) || []).length;
    const digits = (s.match(/\d/g) || []).length;
    if ((replacement + cid * 4) / visible > 0.08) return true;
    if (visible > 80 && cjk + latin + digits < visible * 0.35) return true;
    return false;
  }

  async function extractTopRightPhotoFallback(pdf) {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    const cropW = Math.round(canvas.width * 0.18);
    const cropH = Math.round(canvas.height * 0.16);
    const sx = Math.round(canvas.width * 0.74);
    const sy = Math.round(canvas.height * 0.07);
    const image = ctx.getImageData(sx, sy, cropW, cropH);
    let nonWhite = 0;
    let dark = 0;
    const total = image.data.length / 4;
    for (let i = 0; i < image.data.length; i += 4) {
      const r = image.data[i], g = image.data[i + 1], b = image.data[i + 2];
      const avg = (r + g + b) / 3;
      if (avg < 245) nonWhite++;
      if (avg < 210) dark++;
    }
    if (nonWhite / total < 0.08 || dark / total < 0.015) return '';

    const out = document.createElement('canvas');
    out.width = cropW;
    out.height = cropH;
    out.getContext('2d').drawImage(canvas, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    return out.toDataURL('image/jpeg', 0.88);
  }

  // ── Preprocess: Handle super-long text ──

  async function preprocessExperiences(rawExperiences, jd) {
    // If total input is under ~10K chars, no preprocessing needed
    const totalLen = rawExperiences.length + jd.length;
    if (totalLen < 10000) return rawExperiences;

    // For very long input, use a quick Haiku call to summarize
    // For DeepSeek, we use the same model but a short prompt
    try {
      const result = await callDeepSeek({
        model: DEFAULT_MODEL,
        systemPrompt: '你是一个文本摘要助手。从以下经历素材中提取信息，优先保留与目标 JD 相关的部分，同时保留可包装成目标岗位迁移能力的不完全相关经历。必须保留关键信息（公司名、职位、时间、奖项、教育荣誉、语言能力、量化成果），不要把经历删到太少。输出纯文本摘要。',
        userMessage: `## 目标 JD\n${jd}\n\n## 经历素材\n${rawExperiences}\n\n请提取相关经历摘要：`,
        maxTokens: 3000,
        jsonMode: false
      });
      return result.raw || rawExperiences;
    } catch (e) {
      console.warn('Preprocessing failed, using raw text:', e);
      // Fallback: truncate intelligently
      return rawExperiences.slice(0, 15000);
    }
  }

  function normalizeFacts(result) {
    if (Array.isArray(result)) return result;
    if (!result || typeof result !== 'object') return null;
    const candidates = [result.facts, result.items, result.atomicFacts, result.experiences];
    for (const item of candidates) {
      if (Array.isArray(item)) return item;
    }
    return null;
  }

  function fallbackFactsFromText(text) {
    return String(text || '')
      .split(/\n+/)
      .map(line => line.trim())
      .filter(line => line.length >= 8)
      .slice(0, 80);
  }

  // ── Public API ──

  window.AIService = {
    // ── Generate Resume ──
    async generateResume({ jd, experiences, requirements = '', previousContent = null }) {
      let processedExp = await preprocessExperiences(experiences, jd);

      // ── Step 0: If title-only, enrich JD with AI-generated typical requirements ──
      let enrichedJD = jd;
      if (jd.startsWith('目标岗位：')) {
        try {
          const jdResult = await callDeepSeek({
            model: DEFAULT_MODEL,
            systemPrompt: '你是一个 JD 生成器。根据岗位名称，输出该岗位的典型 JD，包含：核心职责（5-8条）、硬技能要求、软技能要求、行业常用术语。返回纯 JSON：{"responsibilities":[],"hardSkills":[],"softSkills":[],"keywords":[]}。只输出 JSON。',
            userMessage: `岗位：${jd}\n请生成该岗位的典型 JD。`,
            temperature: 0.3,
            maxTokens: 2000
          });
          if (!jdResult.raw) {
            const parts = [];
            if (jdResult.responsibilities) parts.push('核心职责：\n' + jdResult.responsibilities.map((r,i) => (i+1)+'. '+r).join('\n'));
            if (jdResult.hardSkills) parts.push('硬技能：' + jdResult.hardSkills.join('、'));
            if (jdResult.softSkills) parts.push('软技能：' + jdResult.softSkills.join('、'));
            if (jdResult.keywords) parts.push('行业关键词：' + jdResult.keywords.join('、'));
            if (parts.length) enrichedJD = jd + '\n\n[AI 生成的该岗位典型要求]\n' + parts.join('\n');
          }
        } catch (e) { console.warn('JD enrichment failed', e); }
      }

      // ── Pass 1: Deconstruct — extract atomic facts, strip all original wording ──
      let facts;
      try {
        const deconResult = await callDeepSeek({
          model: DEFAULT_MODEL,
          systemPrompt: '将用户的所有经历打散成原子事实，每个事实写一句短话。每条事实必须尽量保留原始时间、公司/机构名、岗位/角色、经历类型（实习/项目/校园/创业）和量化结果。不要照抄原句，不保留原文结构。只输出 JSON 对象，格式为 {"facts":["事实1","事实2"]}。',
          userMessage: '打散这些经历为事实数组：\n' + processedExp,
          temperature: 0.1,
          maxTokens: 4000
        });
        facts = normalizeFacts(deconResult);
        if (!facts && deconResult.raw) {
          try { const m = deconResult.raw.match(/\[[\s\S]*\]/); if (m) facts = JSON.parse(m[0]); } catch(e) {}
        }
      } catch (e) {
        console.warn('Deconstruct failed, using raw text', e);
        facts = null;
      }
      if (!facts || !facts.length) facts = fallbackFactsFromText(processedExp);

      // ── Pass 2: Rebuild — from facts + JD, write a fresh resume ──
      const factsStr = facts && Array.isArray(facts) ? facts.join('\n- ') : processedExp;
      const isFactMode = facts && Array.isArray(facts) && facts.length > 0;

      let userMessage = isFactMode
        ? `## 目标岗位\n${enrichedJD}\n\n## 经历事实池（这些是打散后的原子事实，不含原文结构。请从中挑选最相关的，从零撰写全新简历。必须生成接近完整一页 A4 的内容：如果首选经历不够，深挖其他事实的相关侧面；如果经历仍不足，补充核心能力和技能，但不能编造）\n- ${factsStr}`
        : `## 目标岗位\n${enrichedJD}\n\n## 我的经历\n${processedExp}\n\n**请彻底重写每一句话，不要复制原文。尽量写满一页 A4。**`;

      userMessage += `\n\n## 生成前请遵循的内部流程\n1. 从目标岗位提炼 5-7 个核心能力关键词。\n2. 将事实池重新映射到这些能力关键词，形成新的经历重点。\n3. 先做事实校验：公司、学校、岗位、时间、奖项、数据、技能、链接只能来自事实池或用户特殊要求；不确定就留空或弱化，不要补造。\n4. 删除或弱化不相关事实，保留能证明能力迁移的事实。\n5. 输出时不要解释流程，只返回符合 schema 的 JSON。`;
      userMessage += `\n\n## 一页纸硬性要求\n- 如果用户素材不少于 100 字，初稿就必须接近完整 A4 一页，不要只写半页。\n- 实习/项目/创业校园 bullet 合计不少于 18 条；素材明显很少时至少 14 条，并补充技能和个人概述。\n- 优先展示教育经历、实习经历、项目经历、创业/校园经历；技能和个人概述放最后。\n- 每个 bullet 结尾必须有能力归纳，但不要出现第一人称和目标岗位名称。`;
      userMessage += `\n\n## 输出约束\n- 只生成中文 zh 对象，不要生成英文 en，避免 JSON 因过长被截断。\n- 不要在 JSON 前后输出解释、Markdown、代码块或任何额外文字。`;

      if (requirements) userMessage += `\n\n## 特殊要求\n${requirements}`;
      if (previousContent) userMessage += `\n\n## 上一版（只用于判断版面长度和避免重复，不要照抄）\n${typeof previousContent === 'string' ? previousContent : JSON.stringify(previousContent)}`;

      const result = await callDeepSeek({
        model: DEFAULT_MODEL,
        systemPrompt: SYSTEM_PROMPT_RESUME,
        userMessage,
        temperature: 0.8,
        maxTokens: 10000
      });
      return result;
    },

    // ── Rewrite Section ──
    async rewriteSection({ selectedText, instruction, fullContext }) {
      const result = await callDeepSeek({
        model: DEFAULT_MODEL,
        systemPrompt: SYSTEM_PROMPT_REWRITE,
        userMessage: `## 完整简历上下文\n${fullContext}\n\n## 用户选中的文字\n"""${selectedText}"""\n\n## 修改指令\n${instruction}\n\n请返回改写后的文字（纯文本，可直接替换）：`,
        temperature: 0.5,
        maxTokens: 2000,
        jsonMode: false
      });
      return result.raw || '';
    },

    // ── Score Resume ──
    async scoreResume(zhContent, enContent, jd) {
      const result = await callDeepSeek({
        model: DEFAULT_MODEL,
        systemPrompt: SYSTEM_PROMPT_SCORE,
        userMessage: `## 岗位 JD\n${jd}\n\n## 中文简历\n${zhContent}\n\n## 英文简历\n${enContent}`,
        temperature: 0.3,
        maxTokens: 3000
      });
      return result;
    },

    // ── Utilities ──
    getApiKey,
    setApiKey,
    hasApiKey,
    hasUserApiKey,
    parseFile,
    getLastParseMeta() { return { ...lastParseMeta }; },
    preprocessExperiences,
    callDeepSeek,
    DEFAULT_MODEL,
    PRO_MODEL
  };

})();
