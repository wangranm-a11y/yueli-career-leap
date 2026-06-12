/* ================================================================
   app.js — Main application
   ================================================================ */

(function () {
  'use strict';

  // ── State ──
  const state = {
    apiKey: '',
    jdMode: 'title',
    jdTitle: '',
    jd: '',
    effectiveJD: '',
    jdImages: [],
    photoDataUrl: '',  // base64-encoded photo
    sourceName: '',
    sourceProfile: { name: '', phone: '', email: '', links: [] },
    manualProfile: { name: '', phone: '', email: '', links: [] },
    experiences: '',
    manualExperiences: '',
    requirements: '',
    portfolioLinks: [],
    uploadedFiles: [],
    resumeZH: null,
    resumeEN: null,
    currentView: 'input',
    currentLang: 'zh',
    theme: 'professional',
    versions: [],
    editorHTML: { zh: '', en: '' },
    currentVersionIdx: -1,
    isGenerating: false,
    generateProgressTimer: null,
    selectedRange: null,
    selectionMark: null,
    draggedResumeItem: null,
  };

  const PAGE_FILL_TARGET = 98;
  const AUTO_FILL_MIN_INPUT_CHARS = 100;
  const RESUME_STORAGE_KEY = 'yueli_resume_state_v1';

  // ── Safe DOM helpers ──
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function on(id, event, fn) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.addEventListener(event, fn);
  }

  // ── Utilities ──
  function escHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/\n/g,'<br>');
  }
  function renderMaybeLink(value) {
    const text = String(value || '').trim();
    if (/^https?:\/\/[^\s]+$/i.test(text)) {
      return '<a class="resume-link" href="' + escHTML(text) + '" target="_blank" rel="noopener noreferrer">' + escHTML(text) + '</a>';
    }
    return escHTML(text);
  }
  function renderLinkedTitle(titleHTML, url) {
    if (!url) return titleHTML;
    return titleHTML + ' <a class="resume-title-link" href="' + escHTML(url) + '" target="_blank" rel="noopener noreferrer">' + escHTML(linkLabel(url)) + '</a>';
  }
  function renderResumeItem(titleHTML, duration, highlights, extraHTML) {
    const L = [];
    L.push('<section class="resume-item" draggable="true">');
    L.push('<div class="resume-item-tools" contenteditable="false" draggable="true" title="拖动整段经历排序"><span>拖动</span></div>');
    L.push('<div class="resume-meta-row"><div>' + titleHTML + '</div><time>' + escHTML(duration || '') + '</time></div>');
    if (extraHTML) L.push(extraHTML);
    if (highlights && highlights.length) {
      L.push('<ul>');
      highlights.forEach(h => L.push('<li>' + formatBullet(h) + '</li>'));
      L.push('</ul>');
    }
    L.push('</section>');
    return L.join('\n');
  }
  function formatBullet(text) {
    if (!text) return '';
    const safe = escHTML(text);
    const m = safe.match(/^([^：:\n]{2,18})([：:])\s*(.*)/);
    if (m) return `<strong>${m[1]}${m[2]}</strong> ${m[3]}`;
    return safe;
  }
  function debounce(fn, delay) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), delay); };
  }

  function asArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function pick(obj, keys) {
    for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    return '';
  }

  function findArray(obj, keys) {
    for (const key of keys) {
      const value = obj?.[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object') return Object.values(value).flat().filter(Boolean);
    }
    return [];
  }

  function normalizeHighlightList(item) {
    if (!item || typeof item !== 'object') return [];
    return asArray(pick(item, ['highlights', 'bullets', 'points', 'items', 'achievements', 'descriptions', 'responsibilities', '内容', '亮点', '要点', '职责', '成果']))
      .map(x => typeof x === 'object' ? pick(x, ['text', 'content', 'description', '内容']) || JSON.stringify(x) : String(x))
      .filter(Boolean);
  }

  function extractNameFromText(text, filename = '', meta = {}) {
    const topCandidates = asArray(meta.topNameCandidates || meta.topLines).map(cleanHeaderLine).filter(Boolean);
    for (const line of topCandidates) {
      const candidate = extractNameCandidateFromLine(line);
      if (candidate) return candidate;
    }
    const lines = String(text || '')
      .split(/\n+/)
      .map(cleanHeaderLine)
      .filter(Boolean)
      .slice(0, 36);
    const joined = lines.slice(0, 12).join(' ');
    const explicit = joined.match(/(?:姓名|Name)[:：\s]*([\u4e00-\u9fa5]{2,4}(?:\s+[A-Za-z][A-Za-z.'-]{1,20})?|[A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){0,2})/);
    if (explicit) return cleanName(explicit[1]);

    const contactIdx = lines.findIndex(line => /@|邮箱|邮件|手机|电话|1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}|\+\d/.test(line));
    const candidates = [];
    lines.forEach((line, index) => {
      const candidate = extractNameCandidateFromLine(line);
      if (!candidate) return;
      let score = 80 - index;
      if (contactIdx >= 0 && Math.abs(index - contactIdx) <= 3) score += 40;
      if (/[\u4e00-\u9fa5]{2,4}\s+[A-Za-z]/.test(candidate)) score += 25;
      if (/^[\u4e00-\u9fa5]{2,4}$/.test(candidate)) score += 12;
      if (/个人概述|教育经历|实习经历|项目经历|技能|大学|学院|专业|简历/.test(line)) score -= 55;
      candidates.push({ name: candidate, score });
    });
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]?.name || '';
  }

  function cleanHeaderLine(line) {
    return String(line || '')
      .replace(/\s+/g, ' ')
      .replace(/^[-—]{2,}.*?[-—]{2,}$/g, '')
      .replace(/^(photo|avatar|image|头像|照片)\s+/i, '')
      .replace(/^个人信息\s*/i, '')
      .trim();
  }

  function extractNameCandidateFromLine(line) {
    let s = cleanHeaderLine(line)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, ' ')
      .replace(/(?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}/g, ' ')
      .replace(/https?:\/\/\S+/ig, ' ')
      .replace(/(电话|手机|邮箱|邮件|Email|Tel|Mobile)[:：]?/ig, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!s || /(大学|学院|专业|教育|经历|简历|求职意向|个人概述|技能|GPA)/.test(s)) return '';
    const parts = s.split(/[｜|,，;；]/).map(x => x.trim()).filter(Boolean);
    for (const part of parts) {
      const cnWithEn = part.match(/^([\u4e00-\u9fa5]{2,4}\s+[A-Za-z][A-Za-z.'-]{1,20})\b/);
      if (cnWithEn) return cleanName(cnWithEn[1]);
      const cn = part.match(/^([\u4e00-\u9fa5]{2,4})(?:\s|$)/);
      if (cn) return cleanName(cn[1]);
      const en = part.match(/^([A-Z][a-zA-Z.'-]+(?:\s+[A-Z][a-zA-Z.'-]+){1,2})(?:\s|$)/);
      if (en) return cleanName(en[1]);
    }
    return '';
  }

  function cleanName(name) {
    return String(name || '')
      .replace(/^(photo|avatar|image|头像|照片)\s+/i, '')
      .replace(/\b(个人概述|教育经历|实习经历|项目经历|工作技能|技能)\b.*$/i, '')
      .replace(/\s+/g, ' ')
      .replace(/[｜|,，;；].*$/, '')
      .trim();
  }

  function extractProfileFromText(text, filename = '', meta = {}) {
    const s = String(text || '');
    const email = (s.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i) || [])[0] || '';
    const cnPhone = (s.match(/(?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}/) || [])[0] || '';
    const intlPhone = (s.match(/(?:\+\d{1,3}[-\s]?)?(?:\(?\d{3,4}\)?[-\s]?)\d{3,4}[-\s]?\d{4}/) || [])[0] || '';
    const links = [];
    const linkedin = (s.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s，,；;]+/i) || [])[0];
    if (linkedin) links.push(linkedin);
    return {
      name: extractNameFromText(s, filename, meta),
      phone: (cnPhone || intlPhone).replace(/\s+/g, ' '),
      email,
      links
    };
  }

  function mergeSourceProfile(next) {
    if (!next) return;
    const nextName = next.name || '';
    state.sourceProfile = {
      name: nextName || state.sourceProfile.name,
      phone: next.phone || state.sourceProfile.phone || '',
      email: next.email || state.sourceProfile.email || '',
      links: asArray(next.links).length ? asArray(next.links).filter(Boolean) : state.sourceProfile.links
    };
    state.sourceName = state.sourceProfile.name || state.sourceName;
    hydrateProfileInputsFromSource();
  }

  function syncManualProfileFromInputs() {
    const link = (document.getElementById('profileLinkInput')?.value || '').trim();
    const requirementText = document.getElementById('reqInput')?.value || '';
    const experienceText = document.getElementById('expInput')?.value || '';
    state.portfolioLinks = parseLinks(requirementText + '\n' + experienceText);
    state.manualProfile = {
      name: (document.getElementById('profileNameInput')?.value || '').trim(),
      phone: (document.getElementById('profilePhoneInput')?.value || '').trim(),
      email: (document.getElementById('profileEmailInput')?.value || '').trim(),
      links: [link].filter(Boolean)
    };
  }

  function linkLabel(url) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length) return parts[parts.length - 1].replace(/[-_]+/g, ' ');
      return u.hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
  }

  function parseLinks(text) {
    return String(text || '')
      .split(/\s+/)
      .map(x => x.trim())
      .filter(x => /^https?:\/\/[^\s]+$/i.test(x))
      .filter((x, i, arr) => arr.indexOf(x) === i);
  }

  function hydrateProfileInputsFromSource() {
    const fields = [
      ['profilePhoneInput', state.sourceProfile.phone],
      ['profileEmailInput', state.sourceProfile.email],
      ['profileLinkInput', state.sourceProfile.links?.[0] || '']
    ];
    fields.forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && !el.value && value) el.value = value;
    });
    syncManualProfileFromInputs();
  }

  function normalizeResume(content) {
    if (!content) return null;
    if (typeof content === 'string') {
      const parsed = parseResumeString(content);
      if (parsed) return normalizeResume(parsed);
      if (looksLikeJSONResume(content)) return null;
      return { name: '', phone: '', email: '', links: [], summary: content, skills: [], experiences: [], education: [], projects: [], campus: [] };
    }
    if (typeof content !== 'object') return null;
    const c = { ...content };
    if (c.zh || c.cn || c.chinese || c.resume) return normalizeResume(c.zh || c.cn || c.chinese || c.resume);

    const profile = state.manualProfile.name ? state.manualProfile : (state.sourceProfile.name ? state.sourceProfile : extractProfileFromText(state.experiences));
    c.name = profile.name || state.sourceName || pick(c, ['name', '姓名', 'fullName']);
    c.phone = profile.phone || pick(c, ['phone', 'mobile', 'tel', '手机号', '电话']);
    c.email = profile.email || pick(c, ['email', 'mail', '邮箱']);
    c.links = (profile.links && profile.links.length ? profile.links : asArray(pick(c, ['links', 'link', '链接']))).filter(Boolean);
    c.summary = pick(c, ['summary', 'profile', 'overview', 'personalSummary', 'coreCompetencies', '个人概述', '核心能力', '自我评价']);

    c.education = findArray(c, ['education', 'educations', '教育背景', '教育经历']).filter(Boolean);
    c.experiences = findArray(c, ['experiences', 'experience', 'workExperience', 'internships', 'internshipExperience', '实习经历', '工作经历', '相关经历']).filter(Boolean);
    c.projects = findArray(c, ['projects', 'projectExperience', '项目经历', '项目']).filter(Boolean);
    c.campus = findArray(c, ['campus', 'campusExperience', 'entrepreneurship', 'startupExperience', 'schoolExperience', '创业经历', '校园经历', '创业/校园经历', '校园/创业经历']).filter(Boolean);
    c.skills = findArray(c, ['skills', 'skill', '工作技能', '技能', '相关技能']).filter(Boolean);

    c.education = c.education.map(e => {
      if (typeof e !== 'object') return { school: String(e) };
      return {
        school: pick(e, ['school', 'university', 'name', '学校', '院校']),
        degree: pick(e, ['degree', 'major', '专业', '学历']),
        duration: pick(e, ['duration', 'time', 'date', '时间']),
        notes: pick(e, ['notes', 'detail', 'details', '成绩', '补充'])
      };
    });
    const sourceEducation = inferEducationFromText(state.experiences);
    if (sourceEducation.length && sourceEducation.some(e => e.school)) c.education = sourceEducation;
    c.experiences = c.experiences.map(e => {
      if (typeof e !== 'object') return { company: String(e), highlights: [] };
      const item = {
        company: pick(e, ['company', 'organization', 'org', 'name', '公司', '机构']),
        role: pick(e, ['role', 'title', 'position', '岗位', '职位']),
        duration: pick(e, ['duration', 'time', 'date', '时间']),
        highlights: normalizeHighlightList(e)
      };
      if (!item.duration) item.duration = inferDurationForItem(item.company, item.role, state.experiences);
      return item;
    });
    c.projects = c.projects.map(p => {
      if (typeof p !== 'object') return { name: String(p), highlights: [] };
      const item = {
        name: pick(p, ['name', 'projectName', 'title', '项目名称', '项目']),
        role: pick(p, ['role', 'title', 'position', '角色', '职责']),
        duration: pick(p, ['duration', 'time', 'date', '时间']),
        highlights: normalizeHighlightList(p)
      };
      if (!item.duration) item.duration = inferDurationForItem(item.name, item.role, state.experiences);
      return item;
    });
    const reclassified = reclassifyCompanyProjects(c.projects);
    if (reclassified.experiences.length) c.experiences = c.experiences.concat(reclassified.experiences);
    c.projects = reclassified.projects;
    c.campus = c.campus.map(p => {
      if (typeof p !== 'object') return { name: String(p), highlights: [] };
      const item = {
        name: pick(p, ['name', 'projectName', 'title', 'organization', '项目名称', '项目', '组织']),
        role: pick(p, ['role', 'title', 'position', '角色', '职责']),
        duration: pick(p, ['duration', 'time', 'date', '时间']),
        highlights: normalizeHighlightList(p)
      };
      if (!item.duration) item.duration = inferDurationForItem(item.name, item.role, state.experiences);
      return item;
    });
    c.skills = c.skills.map(s => {
      if (typeof s !== 'object') return { category: '其他', items: [String(s)] };
      return {
        category: pick(s, ['category', 'name', 'type', '类别', '分类']) || '其他',
        items: asArray(pick(s, ['items', 'skills', 'values', 'content', '内容', '技能'])).filter(Boolean)
      };
    });
    c.experiences = sortByRecent(c.experiences);
    c.projects = sortByRecent(c.projects);
    c.campus = sortByRecent(c.campus);
    return c;
  }

  function sortByRecent(items) {
    return asArray(items).slice().sort((a, b) => getDurationSortValue(b.duration) - getDurationSortValue(a.duration));
  }

  function getDurationSortValue(duration) {
    const s = String(duration || '');
    if (/至今|现在|Present|Current/i.test(s)) return 999999;
    const matches = Array.from(s.matchAll(/(20\d{2})[年./-]?\s*(0?[1-9]|1[0-2])?/g));
    if (!matches.length) return 0;
    const last = matches[matches.length - 1];
    const year = parseInt(last[1], 10);
    const month = parseInt(last[2] || '12', 10);
    return year * 100 + month;
  }

  function inferDurationForItem(title, role, text) {
    const keys = [title, role].filter(Boolean).map(x => String(x).trim()).filter(x => x.length >= 2);
    if (!keys.length) return '';
    const lines = String(text || '').split(/\n+/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const dateRe = /(?:20\d{2}|19\d{2})[年./-]?\s*(?:0?[1-9]|1[0-2])?\s*(?:-|–|—|至|~|～)\s*(?:至今|现在|Present|Current|(?:20\d{2}|19\d{2})[年./-]?\s*(?:0?[1-9]|1[0-2])?)|(?:20\d{2}|19\d{2})[年./-]\s*(?:0?[1-9]|1[0-2])/i;
    for (let i = 0; i < lines.length; i++) {
      if (!keys.some(key => lines[i].includes(key))) continue;
      const windowText = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 4)).join(' ');
      const match = windowText.match(dateRe);
      if (match) return normalizeDuration(match[0]);
    }
    return '';
  }

  function normalizeDuration(value) {
    return String(value || '')
      .replace(/\s+/g, '')
      .replace(/[年/]/g, '.')
      .replace(/月/g, '')
      .replace(/[–—~～至]/g, ' - ')
      .replace(/\.+/g, '.')
      .replace(/\s*-\s*/g, ' - ')
      .trim();
  }

  function inferEducationFromText(text) {
    const allLines = String(text || '').split(/\n+/).map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const section = extractSectionLines(allLines, /(教育背景|教育经历|Education)/i, /(实习经历|工作经历|项目经历|校园经历|创业经历|技能|个人概述|Experience|Project|Skills)/i);
    const lines = section.length ? section : allLines;
    const eduLines = lines.filter(line => /(大学|学院|本科|硕士|博士|专业|GPA|绩点|排名|奖学金|CET|六级|四级|主修|辅修|学士|Master|Bachelor|University|College)/i.test(line)).slice(0, 8);
    if (!eduLines.length) return [];
    const first = eduLines.find(line => /(大学|学院)/.test(line)) || eduLines[0];
    const joined = eduLines.join(' | ');
    const school = (joined.match(/([\u4e00-\u9fa5A-Za-z·.\s]+?(?:大学|学院|University|College))/i) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
    const major = (joined.match(/((?:主修|辅修)?[\u4e00-\u9fa5A-Za-z·\s]{2,24}(?:专业|本科|学士|硕士|博士|Bachelor|Master))/i) || [])[1]?.replace(/\s+/g, ' ').trim() || '';
    const duration = (joined.match(/20\d{2}[年.\-/]?\d{0,2}\s*(?:-|–|—|至|~|～)\s*(?:至今|20\d{2}[年.\-/]?\d{0,2})/) || [])[0] || '';
    const notes = eduLines
      .filter(line => line !== first)
      .filter(line => /(GPA|绩点|排名|奖学金|CET|六级|四级|辅修|主修|荣誉|课程|专业前|排名)/i.test(line))
      .join('；');
    return [{
      school,
      degree: major || first.replace(school, '').replace(duration, '').trim(),
      duration,
      notes
    }];
  }

  function extractSectionLines(lines, startRe, stopRe) {
    const start = lines.findIndex(line => startRe.test(line));
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < lines.length; i++) {
      if (stopRe.test(lines[i])) break;
      out.push(lines[i]);
    }
    return out;
  }

  function reclassifyCompanyProjects(projects) {
    const result = { projects: [], experiences: [] };
    asArray(projects).forEach(project => {
      const name = project.name || '';
      const role = project.role || '';
      const text = [name, role, ...(project.highlights || [])].join(' ');
      if (looksLikeInternshipExperience(text, name, role)) {
        result.experiences.push({
          company: name,
          role: role || '实习生',
          duration: project.duration || '',
          highlights: project.highlights || []
        });
      } else {
        result.projects.push(project);
      }
    });
    return result;
  }

  function looksLikeInternshipExperience(text, name, role) {
    const companySignal = /(公司|集团|科技|传媒|微博|字节|腾讯|阿里|百度|美团|京东|网易|新浪|小红书|抖音|快手|银行|证券|咨询|律所|工作室|实验室|研究院|中心|协会|基金|资本|投资|有限|Inc\.?|Ltd\.?|LLC|Agency|Studio|Office)/i;
    const roleSignal = /(实习|Intern|运营|产品|市场|品牌|增长|用户|商业|数据|分析|助理|专员|总裁办|战略|咨询|研究)/i;
    const projectOnlySignal = /(课程|比赛|竞赛|论文|课题|毕设|课堂|社团|校园|创业|小屋|平台|社群)/;
    if (roleSignal.test(role || text) && companySignal.test(name || text)) return true;
    if (companySignal.test(name) && !projectOnlySignal.test(name)) return true;
    return false;
  }

  function parseResumeString(text) {
    let s = String(text || '').trim();
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) s = fenced[1].trim();
    const balancedZH = extractBalancedObjectForKey(s, 'zh');
    if (balancedZH) return { zh: balancedZH };
    const balancedResume = extractBalancedObjectForKey(s, 'resume');
    if (balancedResume) return balancedResume;
    const candidates = [s];
    const objStart = s.indexOf('{');
    const objEnd = s.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) candidates.push(s.slice(objStart, objEnd + 1));
    const arrStart = s.indexOf('[');
    const arrEnd = s.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) candidates.push(s.slice(arrStart, arrEnd + 1));
    for (const item of candidates) {
      try { return JSON.parse(item); } catch (e) {}
    }
    return null;
  }

  function extractBalancedObjectForKey(text, key) {
    const re = new RegExp('["“]?' + key + '["”]?\\s*[:：]\\s*\\{');
    const match = re.exec(text);
    if (!match) return null;
    const open = text.indexOf('{', match.index);
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = open; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      if (ch === '}') depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(open, i + 1)); } catch (e) { return null; }
      }
    }
    return null;
  }

  function looksLikeJSONResume(text) {
    const s = String(text || '').trim();
    return /[{[]\s*"?zh"?\s*[:：]/.test(s) ||
      /"(education|experiences|projects|campus|skills|summary)"\s*:/.test(s) ||
      /^\s*(photo|avatar|image)?\s*\{/.test(s);
  }

  // ── Toast ──
  function showToast(msg, type) {
    type = type || 'info';
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function hasResumeContent() {
    return !!(
      state.resumeZH ||
      state.resumeEN ||
      (state.editorHTML.zh && !state.editorHTML.zh.includes('resume-empty-state')) ||
      (state.editorHTML.en && !state.editorHTML.en.includes('resume-empty-state'))
    );
  }

  // ── State persistence ──
  function loadState() {
    state.apiKey = AIService.getApiKey();
    try {
      const prefs = JSON.parse(localStorage.getItem('cs_prefs') || '{}');
      if (prefs.theme) state.theme = prefs.theme;
    } catch (e) {}
    return restoreResumeState();
  }

  function savePrefs() { localStorage.setItem('cs_prefs', JSON.stringify({ theme: state.theme })); }

  function persistResumeState() {
    if (!hasResumeContent()) return;
    try {
      localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({
        resumeZH: state.resumeZH,
        resumeEN: state.resumeEN,
        editorHTML: state.editorHTML,
        effectiveJD: state.effectiveJD,
        jdTitle: state.jdTitle,
        jd: state.jd,
        currentLang: state.currentLang,
        theme: state.theme,
        versions: state.versions.slice(-12),
        currentVersionIdx: Math.min(state.currentVersionIdx, 11),
        photoDataUrl: state.photoDataUrl,
        sourceName: state.sourceName,
        sourceProfile: state.sourceProfile,
        manualProfile: state.manualProfile,
        portfolioLinks: state.portfolioLinks,
        savedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Persist resume state failed:', e);
    }
  }

  function restoreResumeState() {
    try {
      const raw = localStorage.getItem(RESUME_STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      const editorHTML = saved.editorHTML || {};
      const hasSavedResume = !!(saved.resumeZH || saved.resumeEN || editorHTML.zh || editorHTML.en);
      if (!hasSavedResume) return false;
      state.resumeZH = saved.resumeZH || null;
      state.resumeEN = saved.resumeEN || null;
      state.editorHTML = {
        zh: editorHTML.zh && !editorHTML.zh.includes('resume-empty-state') ? editorHTML.zh : '',
        en: editorHTML.en && !editorHTML.en.includes('resume-empty-state') ? editorHTML.en : ''
      };
      state.effectiveJD = saved.effectiveJD || '';
      state.jdTitle = saved.jdTitle || '';
      state.jd = saved.jd || '';
      state.currentLang = saved.currentLang || 'zh';
      state.theme = saved.theme || state.theme;
      state.versions = Array.isArray(saved.versions) ? saved.versions : [];
      state.currentVersionIdx = Number.isInteger(saved.currentVersionIdx) ? saved.currentVersionIdx : state.versions.length - 1;
      state.photoDataUrl = saved.photoDataUrl || '';
      state.sourceName = saved.sourceName || '';
      state.sourceProfile = saved.sourceProfile || state.sourceProfile;
      state.manualProfile = saved.manualProfile || state.manualProfile;
      state.portfolioLinks = Array.isArray(saved.portfolioLinks) ? saved.portfolioLinks : [];
      return hasResumeContent();
    } catch (e) {
      console.warn('Restore resume state failed:', e);
      localStorage.removeItem(RESUME_STORAGE_KEY);
      return false;
    }
  }

  function validateVisibleView() {
    const editingVisible = document.getElementById('viewEditing')?.style.display !== 'none';
    const resultVisible = editingVisible ||
      document.getElementById('viewScore')?.style.display !== 'none' ||
      document.getElementById('viewHistory')?.style.display !== 'none';
    if (resultVisible && !state.isGenerating && !hasResumeContent()) {
      switchView('input');
    }
  }

  // ── File handlers (MUST run first, independent of everything) ──
  function setupFileHandlers() {
    const dropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('fileInput');
    if (!dropZone || !fileInput) return;
    dropZone.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener('change', e => { if (e.target.files.length) { handleFiles(e.target.files); e.target.value = ''; } });
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });
  }

  async function handleFiles(files) {
    if (!files || !files.length) return;
    showToast(files.length > 1 ? '开始批量解析 ' + files.length + ' 个文件' : '开始解析文件', 'info');
    const expElBefore = document.getElementById('expInput');
    if (expElBefore) {
      const currentText = expElBefore.value.trim();
      const currentFileText = state.uploadedFiles.map(f => '--- ' + f.name + ' ---\n' + f.text).join('\n\n').trim();
      if (currentText && currentText !== currentFileText) {
        state.manualExperiences = currentFileText ? currentText.replace(currentFileText, '').trim() : currentText;
      }
    }
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
        showToast('照片请在“简历照片”区域单独上传：' + file.name, 'warning');
        continue;
      }
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) { showToast('不支持: ' + file.name, 'warning'); continue; }
      try {
        showToast('解析中: ' + file.name, 'info');
        const text = await AIService.parseFile(file);
        const meta = AIService.getLastParseMeta ? AIService.getLastParseMeta() : {};
        state.uploadedFiles.push({ name: file.name, text });
        mergeSourceProfile(extractProfileFromText(text, file.name, meta));
        showToast(file.name + ' 完成', 'success');
      } catch (err) {
        console.error(err);
        showToast('解析失败: ' + file.name, 'error');
      }
    }
    refreshExpInput();
  }

  function refreshExpInput() {
    const fileTexts = state.uploadedFiles.map(f => '--- ' + f.name + ' ---\n' + f.text).join('\n\n');
    const combined = [state.manualExperiences, fileTexts].filter(Boolean).join('\n\n');
    const expEl = document.getElementById('expInput');
    if (expEl) {
      expEl.value = combined;
      state.experiences = combined;
    }
    renderFileList();
    updateCharCount();
  }

  function renderFileList() {
    const c = document.getElementById('fileList');
    if (!c) return;
    c.innerHTML = state.uploadedFiles.map((f, i) => '<div class="file-tag">📎 ' + escHTML(f.name) + ' <span class="file-remove" data-idx="' + i + '">×</span></div>').join('');
    c.querySelectorAll('.file-remove').forEach(el => {
      el.addEventListener('click', () => {
        state.uploadedFiles.splice(parseInt(el.dataset.idx), 1);
        refreshExpInput();
      });
    });
  }

  function updateCharCount() {
    const el = document.getElementById('charCount');
    if (!el) return;
    const n = state.experiences.length;
    el.textContent = n + ' 字';
    el.style.color = n > 15000 ? '#c7512e' : '';
  }

  function updateJDCharCount() {
    const el = document.getElementById('jdCharCount');
    if (!el) return;
    const n = state.jd.length;
    el.textContent = n ? n + ' 字' : '';
  }

  function getCurrentResumeText() {
    const editor = document.getElementById('editorArea');
    if (editor && editor.innerText.trim()) return editor.innerText.trim();
    const content = state.currentLang === 'zh' ? state.resumeZH : state.resumeEN;
    return content ? JSON.stringify(content) : '';
  }

  function clearEditorDrafts() {
    state.editorHTML = { zh: '', en: '' };
  }

  function getLangKey() {
    return state.currentLang === 'en' ? 'en' : 'zh';
  }

  function saveCurrentEditorDraft() {
    const editor = document.getElementById('editorArea');
    if (!editor) return;
    state.editorHTML[getLangKey()] = editor.innerHTML;
  }

  function syncEditorAfterManualChange() {
    saveCurrentEditorDraft();
    renderPreview();
    checkPageFill();
    persistResumeState();
  }

  function handleEditorPaste(e) {
    const editor = document.getElementById('editorArea');
    if (!editor || !editor.contains(e.target)) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData)?.getData('text/plain') || '';
    const lines = text.split(/\n+/).map(x => x.trim()).filter(Boolean);
    const html = lines.map(line => {
      if (/^[-•*]\s+/.test(line)) return '<li>' + escHTML(line.replace(/^[-•*]\s+/, '')) + '</li>';
      return '<p>' + escHTML(line) + '</p>';
    }).join('');
    document.execCommand('insertHTML', false, html || escHTML(text));
    setTimeout(syncEditorAfterManualChange, 0);
  }

  function handleEditorDragStart(e) {
    const item = e.target.closest?.('.resume-item');
    if (!item) return;
    if (!e.target.closest?.('.resume-item-tools')) {
      e.preventDefault();
      return;
    }
    state.draggedResumeItem = item;
    item.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'resume-item');
  }

  function handleEditorDragOver(e) {
    const item = e.target.closest?.('.resume-item');
    if (!item || !state.draggedResumeItem || item === state.draggedResumeItem) return;
    e.preventDefault();
    const rect = item.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    item.classList.toggle('drop-after', after);
    item.classList.toggle('drop-before', !after);
  }

  function handleEditorDrop(e) {
    const target = e.target.closest?.('.resume-item');
    const dragged = state.draggedResumeItem;
    if (!target || !dragged || target === dragged) return;
    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    target.classList.remove('drop-before', 'drop-after');
    target.parentNode.insertBefore(dragged, after ? target.nextSibling : target);
    dragged.classList.remove('is-dragging');
    state.draggedResumeItem = null;
    syncEditorAfterManualChange();
  }

  function handleEditorDragEnd() {
    document.querySelectorAll('.resume-item').forEach(el => el.classList.remove('is-dragging', 'drop-before', 'drop-after'));
    state.draggedResumeItem = null;
  }

  // ── JD image upload ──
  async function handleJDImageSelect(e) {
    if (!e.target.files || !e.target.files.length) return;
    for (const file of e.target.files) {
      try {
        const dataUrl = await readFileAsDataURL(file);
        const item = { name: file.name, dataUrl, status: '识别中…', text: '' };
        state.jdImages.push(item);
        renderJDImages();
        showToast('正在识别 JD 截图文字…', 'info');
        const text = await recognizeImageText(dataUrl);
        item.text = text;
        item.status = text ? '已识别' : '未识别到文字';
        renderJDImages();
        if (text) {
          appendJDText(text);
          showToast('已把截图文字加入 JD', 'success');
        } else {
          showToast('截图里没有识别到清晰文字，可以手动粘贴 JD', 'warning');
        }
      } catch (err) {
        console.error(err);
        showToast(err.message || '截图识别失败，请手动粘贴 JD', 'warning');
      }
    }
    e.target.value = '';
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function recognizeImageText(dataUrl) {
    if (!window.Tesseract?.recognize) {
      throw new Error('OCR 组件还没加载完成，请稍后再试或先粘贴文字');
    }
    const result = await window.Tesseract.recognize(dataUrl, 'chi_sim+eng');
    return cleanupOCRText(result?.data?.text || '');
  }

  function cleanupOCRText(text) {
    return String(text || '')
      .replace(/\r/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function appendJDText(text) {
    const el = document.getElementById('jdInput');
    if (!el) return;
    const prefix = el.value.trim() ? '\n\n--- 截图识别 JD ---\n' : '';
    el.value = (el.value.trim() + prefix + text).trim();
    state.jd = el.value;
    updateJDCharCount();
  }

  function renderJDImages() {
    const c = document.getElementById('jdImagePreview');
    if (!c) return;
    c.innerHTML = state.jdImages.map((img, i) => '<span style="position:relative;display:inline-block;"><img src="' + img.dataUrl + '" alt="' + escHTML(img.name) + '" style="max-height:60px;border-radius:4px;border:1px solid #e5ddd0;"><small style="display:block;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9b8d78;">' + escHTML(img.status || '已添加') + '</small><span style="position:absolute;top:-6px;right:-6px;cursor:pointer;background:#c7512e;color:#fff;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:11px;" data-img-idx="' + i + '">×</span></span>').join('');
    c.querySelectorAll('[data-img-idx]').forEach(el => {
      el.addEventListener('click', () => { state.jdImages.splice(parseInt(el.dataset.imgIdx), 1); renderJDImages(); });
    });
  }

  // ── Event listeners ──
  function setupEventListeners() {
    on('apiKeyBtn', 'click', openAPIKeyModal);
    on('apiKeySave', 'click', saveAPIKey);
    on('apiKeyCancel', 'click', closeAPIKeyModal);
    on('apiKeyInput', 'keydown', e => { if (e.key === 'Enter') saveAPIKey(); });
    on('generateBtn', 'click', handleGenerate);
    on('themeSelect', 'change', e => { state.theme = e.target.value; savePrefs(); });
    on('themeSelect2', 'change', e => { state.theme = e.target.value; savePrefs(); renderPreview(); });
    on('downloadBtn', 'click', handleDownload);
    on('downloadBtn2', 'click', handleDownload);
    on('viewTabs', 'click', e => { if (e.target.classList.contains('tb-tab')) switchView(e.target.dataset.view); });
    document.addEventListener('click', e => {
      if (e.target && e.target.id === 'emptyBackToInput') switchView('input');
    });
    const langTabs = document.querySelector('.et-lang-tabs');
    if (langTabs) langTabs.addEventListener('click', e => { if (e.target.classList.contains('et-tab')) switchLanguage(e.target.dataset.lang); });
    on('backToInputBtn', 'click', () => switchView('input'));
    on('refineBtn', 'click', openRefineModal);
    on('rewriteSelectedBtn', 'click', () => {
      const sel = window.getSelection();
      const editor = document.getElementById('editorArea');
      if (sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed && editor && editor.contains(sel.anchorNode)) {
        state.selectedRange = sel.getRangeAt(0);
        openRewritePopover(state.selectedRange);
      } else if (state.selectedRange && editor && editor.contains(state.selectedRange.commonAncestorContainer)) {
        openRewritePopover(state.selectedRange);
      } else {
        showToast('请先在编辑区选中要改写的文字', 'info');
      }
    });
    on('refineGo', 'click', handleRefine);
    on('refineCancel', 'click', closeRefineModal);
    on('rewriteGo', 'click', handleRewrite);
    on('rewriteCancel', 'click', closeRewritePopover);
    on('rewriteInput', 'keydown', e => { if (e.key === 'Enter') handleRewrite(); if (e.key === 'Escape') closeRewritePopover(); });
    on('boldBtn', 'click', handleBoldSelection);
    on('clearJD', 'click', () => {
      const a = document.getElementById('jdTitleInput'); if (a) a.value = '';
      const b = document.getElementById('jdInput'); if (b) b.value = '';
      state.jdTitle = ''; state.jd = ''; state.jdImages = [];
      state.effectiveJD = '';
      const p = document.getElementById('jdImagePreview'); if (p) p.innerHTML = '';
      updateJDCharCount();
    });
    on('clearExp', 'click', () => {
      const e = document.getElementById('expInput'); if (e) e.value = '';
      state.experiences = ''; state.manualExperiences = ''; state.uploadedFiles = [];
      syncManualProfileFromInputs();
      renderFileList(); updateCharCount();
    });
    document.querySelectorAll('input[name="jdMode"]').forEach(r => {
      r.addEventListener('change', () => {
        state.jdMode = r.value;
        const tg = document.getElementById('jdTitleGroup'); if (tg) tg.style.display = r.value === 'title' ? '' : 'none';
        const fg = document.getElementById('jdFullGroup'); if (fg) fg.style.display = r.value === 'full' ? '' : 'none';
      });
    });
    on('jdTitleInput', 'input', () => { state.jdTitle = (document.getElementById('jdTitleInput')?.value || '').trim(); });
    on('jdImageBtn', 'click', () => { const inp = document.getElementById('jdImageInput'); if (inp) inp.click(); });
    on('jdImageInput', 'change', handleJDImageSelect);
    on('jdInput', 'input', () => { state.jd = document.getElementById('jdInput')?.value || ''; updateJDCharCount(); });
    on('expInput', 'input', () => {
      state.experiences = document.getElementById('expInput')?.value || '';
      state.manualExperiences = state.experiences;
      syncManualProfileFromInputs();
      updateCharCount();
    });
    on('reqInput', 'input', () => {
      state.requirements = document.getElementById('reqInput')?.value || '';
      syncManualProfileFromInputs();
    });
    ['profileNameInput', 'profilePhoneInput', 'profileEmailInput', 'profileLinkInput'].forEach(id => {
      on(id, 'input', syncManualProfileFromInputs);
    });
    document.querySelectorAll('.btn-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById('followupInput');
        if (input) {
          input.value = btn.dataset.followup || btn.textContent.trim();
          input.focus();
        }
      });
    });
    on('followupGo', 'click', handleFollowupRefine);

    // Editor mouseup → track selection
    document.addEventListener('mouseup', () => {
      setTimeout(() => {
        const sel = window.getSelection();
        const ed = document.getElementById('editorArea');
        const popover = document.getElementById('rewritePopover');
        if (sel.rangeCount > 0 && ed && ed.contains(sel.anchorNode)) {
          const range = sel.getRangeAt(0);
          if (!range.collapsed) {
            state.selectedRange = range.cloneRange();
            if (state.currentView === 'edit' && popover && popover.style.display === 'none') {
              openRewritePopover(state.selectedRange);
            }
          }
        }
      }, 40);
    });

    // Editor input → live preview sync
    const editorArea = document.getElementById('editorArea');
    if (editorArea) {
      editorArea.addEventListener('input', debounce(() => {
        syncEditorAfterManualChange();
      }, 400));
      editorArea.addEventListener('paste', handleEditorPaste);
      editorArea.addEventListener('dragstart', handleEditorDragStart);
      editorArea.addEventListener('dragover', handleEditorDragOver);
      editorArea.addEventListener('drop', handleEditorDrop);
      editorArea.addEventListener('dragend', handleEditorDragEnd);
      editorArea.addEventListener('dragleave', e => {
        e.target.closest?.('.resume-item')?.classList.remove('drop-before', 'drop-after');
      });
    }

    // Photo upload
    const photoArea = document.getElementById('photoUploadArea');
    const photoInput = document.getElementById('photoInput');
    if (photoArea && photoInput) {
      photoArea.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = () => {
            state.photoDataUrl = reader.result;
            const preview = document.getElementById('photoPreview');
            if (preview) preview.innerHTML = '<img src="' + reader.result + '" alt="">';
          };
          reader.readAsDataURL(e.target.files[0]);
        }
      });
    }

    on('addMoreBtn', 'click', () => switchView('input'));
    on('aiFillBtn', 'click', handleAIFill);

    // Ctrl+S download
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (state.currentView === 'edit') handleDownload(); }
    });
  }

  // ── API Key ──
  function openAPIKeyModal() { document.getElementById('apiKeyInput').value = AIService.getApiKey(); document.getElementById('apiKeyModal').style.display = 'flex'; }
  function closeAPIKeyModal() { document.getElementById('apiKeyModal').style.display = 'none'; }
  function saveAPIKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) {
      AIService.setApiKey('');
      state.apiKey = '';
      document.getElementById('apiKeyBtn')?.classList.remove('needs-key');
      closeAPIKeyModal();
      showToast('已使用网站默认 Key', 'success');
      return;
    }
    if (!key.startsWith('sk-')) { showToast('Key 应以 sk- 开头', 'warning'); return; }
    AIService.setApiKey(key); state.apiKey = key;
    document.getElementById('apiKeyBtn')?.classList.remove('needs-key');
    closeAPIKeyModal(); showToast('Key 已保存', 'success');
  }
  function checkAPIKey() {
    const btn = document.getElementById('apiKeyBtn');
    if (btn) btn.classList.toggle('needs-key', !!AIService.hasUserApiKey());
  }

  // ── Generate ──
  async function handleGenerate() {
    if (!AIService.hasApiKey()) { openAPIKeyModal(); return; }
    state.jdMode = document.querySelector('input[name="jdMode"]:checked')?.value || 'title';
    state.jdTitle = (document.getElementById('jdTitleInput')?.value || '').trim();
    state.jd = (document.getElementById('jdInput')?.value || '').trim();
    state.experiences = (document.getElementById('expInput')?.value || '').trim();
    state.requirements = (document.getElementById('reqInput')?.value || '').trim();
    syncManualProfileFromInputs();
    const portfolioContext = state.portfolioLinks.length
      ? '\n\n--- 作品集链接（第一版仅展示链接，不读取外网内容）---\n' + state.portfolioLinks.join('\n')
      : '';
    const experiencesForAI = state.experiences + portfolioContext;

    if (!state.jdTitle && !state.jd) { showToast('请输入岗位名或 JD', 'warning'); return; }
    if (!state.manualProfile.name) { showToast('请先填写姓名', 'warning'); document.getElementById('profileNameInput')?.focus(); return; }
    if (!state.experiences) { showToast('请提供经历素材', 'warning'); return; }

    let effectiveJD = state.jd;
    if (state.jdMode === 'title' && state.jdTitle) {
      effectiveJD = '目标岗位：' + state.jdTitle + '\n（仅提供了岗位名称，请根据行业通用标准生成匹配简历）';
    }
    if (state.jdImages.length) {
      showToast('JD 截图还不能自动 OCR，请确认已粘贴图片中的岗位文字。', 'warning');
      effectiveJD += '\n[用户上传了 JD 截图，但当前应用无法读取图片文字；只能依据已输入的岗位名/JD 文本生成。]';
    }
    state.effectiveJD = effectiveJD;

    state.isGenerating = true;
    const btn = document.getElementById('generateBtn');
    btn.disabled = true; btn.textContent = '⏳ 分析中…';
    if (state.resumeZH || state.resumeEN) saveSnapshot('生成前备份');
    setGenerateProgress(12, '正在整理岗位和经历素材，预计 30-60 秒。可以去接杯水，但别跑太远。');

    try {
      startGenerateProgressLoop();
      const result = await AIService.generateResume({ jd: effectiveJD, experiences: experiencesForAI, requirements: state.requirements });
      stopGenerateProgressLoop();
      setGenerateProgress(68, '正在解析 AI 返回结果…');
      if (result.raw) {
        showToast('AI 返回了非标准格式', 'warning');
        state.resumeZH = normalizeResume(result.raw);
        state.resumeEN = null;
      } else {
        state.resumeZH = normalizeResume(result.zh || (result.name ? result : null));
        state.resumeEN = normalizeResume(result.en || null);
        if (!state.resumeZH) state.resumeZH = normalizeResume(result);
      }
      if (!state.resumeZH) throw new Error('AI 返回内容不完整，请重试一次或减少英文/无关素材。');
      setGenerateProgress(82, '正在排版到 A4 预览…');
      clearEditorDrafts();
      switchView('edit');
      renderEditor(); renderPreview();
      setGenerateProgress(88, '正在把内容自动铺满 A4，一杯咖啡的最后几口。');
      startAutoFillProgressLoop();
      const fill = checkPageFill();
      if (fill.needsFill) {
        await autoFillToFit(4, { silent: true });
      }
      stopGenerateProgressLoop();
      saveSnapshot(state.jdTitle ? '岗位: ' + state.jdTitle : '初始生成');
      persistResumeState();
      setGenerateProgress(100, '生成完成，已默认整理成一页 A4。');
      setTimeout(() => setGenerateProgress(0, ''), 700);
      showToast('简历生成完成！', 'success');
    } catch (err) {
      stopGenerateProgressLoop();
      console.error(err);
      let msg = err.message || '生成失败';
      if (err.message === 'API_KEY_MISSING') { msg = '站点还没有配置服务器 Key，请联系站点管理员'; }
      else if (err.message === 'API_KEY_INVALID') { msg = '自定义 Key 无效'; openAPIKeyModal(); }
      else if (err.message === 'SERVER_API_KEY_INVALID') { msg = '站点服务器 Key 无效，请联系站点管理员'; }
      setGenerateProgress(0, '<span style="color:#c7512e;">' + escHTML(msg) + '</span>', true);
      showToast(msg, 'error');
      if (hasResumeContent()) {
        switchView('edit');
        renderEditor();
        renderPreview();
      } else {
        clearEditorDrafts();
        switchView('input');
      }
    } finally {
      state.isGenerating = false;
      btn.disabled = false; btn.textContent = '🚀 生成简历';
    }
  }

  function setGenerateProgress(percent, message, isHTML) {
    const progress = document.getElementById('generateProgress');
    const bar = document.getElementById('generateProgressBar');
    const status = document.getElementById('generateStatus');
    const editingProgress = document.getElementById('editingProgress');
    const editingBar = document.getElementById('editingProgressBar');
    const editingText = document.getElementById('editingProgressText');
    const pct = Math.max(0, Math.min(100, percent || 0));
    if (progress && bar && status) {
      progress.style.display = pct > 0 ? 'block' : 'none';
      bar.style.width = pct + '%';
      if (isHTML) status.innerHTML = message || '';
      else status.innerHTML = message ? '<span class="spinner"></span>' + escHTML(message) : '';
    }
    if (editingProgress && editingBar && editingText) {
      editingProgress.style.display = pct > 0 ? 'flex' : 'none';
      editingBar.style.width = pct + '%';
      editingText.textContent = stripHTML(message || '') || '正在处理简历内容，可以先去喝口咖啡。';
    }
    updateGenerationStage(isHTML ? stripHTML(message || '') : message);
  }

  function startGenerateProgressLoop() {
    const copy = [
      '正在拆经历事实：AI 现在像 HR 一样挑重点，稍微有点挑剔。',
      '正在把不相关经历翻译成可迁移能力，不浪费你任何一段努力。',
      '正在给 bullet 补 STAR，不是拖延，是在给简历长肌肉。',
      '正在压实 A4 版面，让它看起来不是“刚毕业的空白感”。',
      '最后检查时间、排序和一页密度，咖啡可以喝到第三口了。'
    ];
    startProgressDrip({ startPct: 18, maxPct: 76, messages: copy, tickMs: 850, messageMs: 12000 });
  }

  function startAutoFillProgressLoop() {
    const copy = [
      '正在把内容压进一页 A4：先别急，它在和版面较劲。',
      '这一段稍微久一点：正在检查每条经历是不是接近两行、又不显得啰嗦。',
      '还在微调密度：让实习和项目更饱满，尽量少用技能/概述凑数。',
      '正在做最后版面巡检：照片、标题、日期和 bullet 都要站好队。',
      '快好了：现在是在确认预览和导出的 PDF 尽量长得一模一样。'
    ];
    startProgressDrip({ startPct: 88, maxPct: 96, messages: copy, tickMs: 900, messageMs: 7000 });
  }

  function startProgressDrip(options) {
    stopGenerateProgressLoop();
    const startedAt = Date.now();
    const startPct = options.startPct || 10;
    const maxPct = options.maxPct || 90;
    const messages = options.messages || [];
    const tickMs = options.tickMs || 1000;
    const messageMs = options.messageMs || 10000;
    state.generateProgressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const pct = Math.min(maxPct, startPct + Math.floor(elapsed / tickMs));
      const idx = Math.min(messages.length - 1, Math.floor(elapsed / messageMs));
      setGenerateProgress(pct, messages[idx]);
    }, tickMs);
  }

  function stopGenerateProgressLoop() {
    if (state.generateProgressTimer) {
      clearInterval(state.generateProgressTimer);
      state.generateProgressTimer = null;
    }
  }

  function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  function updateGenerationStage(message) {
    const el = document.getElementById('generationStage');
    if (el && message) el.textContent = message;
  }

  function showResumeSkeleton(message) {
    const skeleton = [
      '<div class="resume-skeleton">',
      '<h2>跃历正在生成中</h2>',
      '<p class="generation-stage" id="generationStage">' + escHTML(message || '正在准备简历骨架…') + '</p>',
      '<div class="skeleton-block"><div class="skeleton-line short"></div><div class="skeleton-line mid"></div></div>',
      '<h3>教育经历</h3>',
      '<div class="skeleton-line long"></div><div class="skeleton-line mid"></div>',
      '<h3>实习经历</h3>',
      '<div class="skeleton-line long"></div><div class="skeleton-line long"></div><div class="skeleton-line mid"></div>',
      '<div class="skeleton-line long"></div><div class="skeleton-line long"></div><div class="skeleton-line mid"></div>',
      '<h3>项目经历</h3>',
      '<div class="skeleton-line long"></div><div class="skeleton-line mid"></div>',
      '</div>'
    ].join('');
    const editor = document.getElementById('editorArea');
    const preview = document.getElementById('previewA4');
    if (editor) editor.innerHTML = skeleton;
    if (preview) preview.innerHTML = skeleton;
  }

  // ── Rendering (left editor + right preview) ──
  function renderEditor() {
    let content = state.currentLang === 'zh' ? state.resumeZH : state.resumeEN;
    const el = document.getElementById('editorArea');
    if (!el) return;
    const draft = state.editorHTML[getLangKey()];
    if (draft) { el.innerHTML = draft; return; }
    if (!content && state.currentLang === 'en' && state.resumeZH) {
      content = state.resumeZH;
      showToast('英文版暂未生成，先显示中文版内容', 'info');
    }
    if (!content) {
      el.innerHTML = [
        '<div class="resume-empty-state">',
        '<strong>还没有生成简历</strong>',
        '<p>先回到输入页填写目标岗位和经历素材，生成成功后这里会显示可编辑内容。</p>',
        '<button type="button" class="btn-sm btn-sm-primary" id="emptyBackToInput">回到输入页</button>',
        '</div>'
      ].join('');
      return;
    }
    const c = content;
    const portfolioLinks = state.portfolioLinks.filter(Boolean);
    let projectLinkIdx = 0;
    const takeProjectLink = () => portfolioLinks[projectLinkIdx++] || '';
    const L = [];
    L.push('<div class="resume-head' + (state.photoDataUrl ? ' has-photo' : '') + '">');
    if (state.photoDataUrl) {
      L.push('<div class="resume-photo" contenteditable="false" aria-hidden="true"><img src="' + state.photoDataUrl + '" alt=""></div>');
    }
    L.push('<div class="resume-head-text"><h2>' + escHTML(c.name || state.sourceName || '') + '</h2>');
    const contacts = [c.phone, c.email, ...asArray(c.links)].filter(Boolean);
    if (contacts.length) L.push('<p class="resume-contact">' + contacts.map(x => renderMaybeLink(x)).join(' | ') + '</p>');
    L.push('</div></div>');

    if (c.education && c.education.length) {
      L.push('<h3>教育经历</h3>');
      c.education.forEach(e => {
        L.push(renderResumeItem(
          '<strong>' + escHTML(e.school) + '</strong>' + (e.degree ? ' — ' + escHTML(e.degree) : ''),
          e.duration || '',
          [],
          e.notes ? '<p class="resume-edu-notes">' + escHTML(e.notes) + '</p>' : ''
        ));
      });
    }
    if (c.experiences && c.experiences.length) {
      L.push('<h3>实习经历</h3>');
      c.experiences.forEach(exp => {
        L.push(renderResumeItem(
          '<strong>' + escHTML(exp.company) + '</strong>' + (exp.role ? ' — ' + escHTML(exp.role) : ''),
          exp.duration || '',
          exp.highlights || []
        ));
      });
    }
    if (c.projects && c.projects.length) {
      L.push('<h3>项目经历</h3>');
      c.projects.forEach(p => {
        L.push(renderResumeItem(
          renderLinkedTitle('<strong>' + escHTML(p.name) + '</strong>' + (p.role ? ' — ' + escHTML(p.role) : ''), takeProjectLink()),
          p.duration || '',
          p.highlights || []
        ));
      });
    }
    if (c.campus && c.campus.length) {
      L.push('<h3>创业/校园经历</h3>');
      c.campus.forEach(p => {
        L.push(renderResumeItem(
          renderLinkedTitle('<strong>' + escHTML(p.name) + '</strong>' + (p.role ? ' — ' + escHTML(p.role) : ''), takeProjectLink()),
          p.duration || '',
          p.highlights || []
        ));
      });
    }
    const remainingLinks = portfolioLinks.slice(projectLinkIdx);
    if (remainingLinks.length) {
      L.push('<h3>其他作品链接</h3>');
      L.push('<div class="resume-links-block">');
      remainingLinks.forEach(url => {
        L.push('<a class="resume-link-pill" href="' + escHTML(url) + '" target="_blank" rel="noopener noreferrer">' + escHTML(linkLabel(url)) + '</a>');
      });
      L.push('</div>');
    }
    const showSupplementary = shouldShowSupplementary(c);
    if (showSupplementary && c.skills && c.skills.length) {
      const validSkills = c.skills.filter(s => s.category && (Array.isArray(s.items) ? s.items.length > 0 : s.items));
      if (validSkills.length > 0) {
        L.push('<h3>技能</h3><div class="resume-skills">');
        validSkills.forEach(s => {
          const items = Array.isArray(s.items) ? s.items.join('、') : String(s.items || '');
          L.push('<p><strong>' + escHTML(s.category) + '：</strong>' + escHTML(items) + '</p>');
        });
        L.push('</div>');
      }
    }
    if (showSupplementary && c.summary) {
      L.push('<h3>个人概述</h3><p>' + escHTML(c.summary) + '</p>');
    }
    if (!L.some(part => /<h3>|<p>|<ul>/.test(part)) && content) {
      L.push('<p>' + escHTML(typeof content === 'string' ? content : JSON.stringify(content, null, 2)) + '</p>');
    }
    el.innerHTML = L.join('\n');
  }

  function shouldShowSupplementary(c) {
    const coreItems = [...asArray(c.experiences), ...asArray(c.projects), ...asArray(c.campus)];
    const bulletCount = coreItems.reduce((sum, item) => sum + asArray(item.highlights).length, 0);
    return coreItems.length < 4 || bulletCount < 12;
  }

  function renderPreview() {
    const editorEl = document.getElementById('editorArea');
    const previewEl = document.getElementById('previewA4');
    if (!previewEl) return;
    previewEl.classList.remove('theme-professional', 'theme-modern', 'theme-creative');
    previewEl.classList.add('theme-' + (state.theme || 'professional'));
    if (!editorEl || !editorEl.innerHTML.trim() || editorEl.querySelector('.resume-empty-state')) {
      previewEl.innerHTML = '<div class="resume-empty-state resume-empty-state--preview"><strong>等待生成</strong><p>生成完成后会在这里预览一页 A4 简历。</p></div>';
      return;
    }
    previewEl.innerHTML = editorEl.innerHTML;
  }

  function checkPageFill() {
    const preview = document.getElementById('previewA4');
    const prompt = document.getElementById('fillPrompt');
    if (!preview || !prompt) return { pct: 100, needsFill: false };
    const children = Array.from(preview.children).filter(el => el.offsetParent !== null);
    let bottom = 0;
    const pageTop = preview.getBoundingClientRect().top;
    children.forEach(el => {
      const rect = el.getBoundingClientRect();
      bottom = Math.max(bottom, rect.bottom - pageTop);
    });
    const contentHeight = Math.max(0, bottom - 44);
    const usableHeight = ResumeRenderer.A4_HEIGHT - 96;
    const pct = Math.min(150, Math.round(contentHeight / usableHeight * 100));
    prompt.style.display = 'none';
    return { pct, needsFill: pct < PAGE_FILL_TARGET };
  }

  async function autoFillToFit(maxRetries, options) {
    maxRetries = maxRetries || 2;
    options = options || {};
    try {
      for (let i = 0; i < maxRetries; i++) {
        const { needsFill } = checkPageFill();
        if (!needsFill) return;
        if (!options.silent) showToast('AI 正在自动补满一页 (' + (i+1) + '/' + maxRetries + ')…', 'info');
        const result = await AIService.generateResume({
          jd: state.effectiveJD || state.jd || (state.jdTitle ? '目标岗位：' + state.jdTitle : ''),
          experiences: state.experiences,
          requirements: (state.requirements || '') + ' 必须输出更高密度的一页 A4 简历：优先扩写实习经历，真实公司/岗位经历必须放入实习经历，不能放入项目经历；再扩写项目、创业/校园经历，补足 20-26 条 STAR bullet；每条中文 bullet 尽量 70-95 个汉字，在预览区约一行半到两行，结尾自然总结能力价值。最相关经历放前面，不太相关经历也要包装成目标岗位迁移能力，不要完全删除。教育经历补充奖项、GPA、排名、语言能力等。不要用技能与个人概述凑版面，除非经历素材极少。不要提示用户内容不足，不要让用户自行选择，不要编造事实。',
          previousContent: getCurrentResumeText()
        });
        if (result.raw) {
          state.resumeZH = normalizeResume(result.raw) || state.resumeZH;
          state.resumeEN = null;
          clearEditorDrafts();
        } else {
          if (result.zh) state.resumeZH = normalizeResume(result.zh);
          else if (!result.en) state.resumeZH = normalizeResume(result) || state.resumeZH;
          if (result.en) state.resumeEN = normalizeResume(result.en);
          clearEditorDrafts();
        }
        renderEditor(); renderPreview();
      }
    } catch (err) {
      console.error(err);
      if (!options.silent) showToast('AI 补充失败', 'error');
    }
    checkPageFill();
  }

  async function handleAIFill() {
    if (!AIService.hasApiKey()) { openAPIKeyModal(); return; }
    showToast('AI 正在补充…', 'info');
    await autoFillToFit(2);
    if (!checkPageFill().needsFill) showToast('补充完成', 'success');
  }

  // ── Download ──
  async function handleDownload() {
    saveCurrentEditorDraft();
    const preview = document.getElementById('previewA4');
    if (!preview || !preview.textContent.trim()) { showToast('请先生成简历', 'warning'); return; }
    const btns = [document.getElementById('downloadBtn'), document.getElementById('downloadBtn2')].filter(Boolean);
    btns.forEach(b => { b.textContent = '导出中…'; b.disabled = true; });
    try {
      await document.fonts?.ready;
      const rect = preview.getBoundingClientRect();
      const canvas = await html2canvas(preview, {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: document.documentElement.clientWidth,
        windowHeight: document.documentElement.clientHeight
      });
      const jsPDF = window.jspdf?.jsPDF;
      if (jsPDF) {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight);
        addPdfLinks(pdf, preview, pageWidth, pageHeight);
        pdf.save('resume.pdf');
      } else {
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'resume.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('PDF 组件未加载，已降级导出 PNG', 'warning');
      }
      showToast('下载完成', 'success');
    } catch (err) { console.error(err); showToast('导出失败', 'error'); }
    finally { btns.forEach(b => { b.textContent = '下载 PDF'; b.disabled = false; }); }
  }

  function addPdfLinks(pdf, preview, pageWidth, pageHeight) {
    const pageRect = preview.getBoundingClientRect();
    if (!pageRect.width || !pageRect.height || !pdf.link) return;
    preview.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const r = a.getBoundingClientRect();
      const x = (r.left - pageRect.left) / pageRect.width * pageWidth;
      const y = (r.top - pageRect.top) / pageRect.height * pageHeight;
      const w = r.width / pageRect.width * pageWidth;
      const h = r.height / pageRect.height * pageHeight;
      if (w > 0 && h > 0) pdf.link(x, y, w, h, { url: href });
    });
  }

  function handleBoldSelection() {
    const editor = document.getElementById('editorArea');
    const sel = window.getSelection();
    if (!editor || !sel || !sel.rangeCount || sel.getRangeAt(0).collapsed || !editor.contains(sel.anchorNode)) {
      showToast('请先选中要加粗的文字', 'info');
      return;
    }
    editor.focus();
    document.execCommand('bold', false, null);
    syncEditorAfterManualChange();
  }

  // ── Rewrite ──
  function openRewritePopover(range) {
    markSelectedRange(range);
    const p = document.getElementById('rewritePopover');
    const rect = (state.selectionMark || range).getBoundingClientRect();
    p.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    p.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 340) + 'px';
    p.style.display = 'block';
    document.getElementById('rewriteInput').value = '';
    setTimeout(() => document.getElementById('rewriteInput').focus(), 100);
  }
  function clearSelectionMark(keepText) {
    const mark = state.selectionMark;
    if (!mark || !mark.parentNode) { state.selectionMark = null; return; }
    if (keepText) {
      const text = document.createTextNode(mark.textContent || '');
      mark.parentNode.replaceChild(text, mark);
    } else {
      const frag = document.createDocumentFragment();
      while (mark.firstChild) frag.appendChild(mark.firstChild);
      mark.parentNode.replaceChild(frag, mark);
    }
    state.selectionMark = null;
  }
  function markSelectedRange(range) {
    clearSelectionMark(false);
    const mark = document.createElement('mark');
    mark.className = 'rewrite-selection-mark';
    try {
      range.surroundContents(mark);
      state.selectionMark = mark;
      state.selectedRange = null;
    } catch (e) {
      state.selectedRange = range.cloneRange();
    }
    saveCurrentEditorDraft();
    renderPreview();
  }
  function closeRewritePopover() {
    document.getElementById('rewritePopover').style.display = 'none';
    setRewriteBusy(false);
    clearSelectionMark(false);
    state.selectedRange = null;
  }

  function setRewriteBusy(isBusy) {
    const popover = document.getElementById('rewritePopover');
    const input = document.getElementById('rewriteInput');
    const go = document.getElementById('rewriteGo');
    const cancel = document.getElementById('rewriteCancel');
    const progress = document.getElementById('rewriteProgress');
    if (!popover || !input || !go || !cancel || !progress) return;
    popover.classList.toggle('is-busy', isBusy);
    progress.style.display = isBusy ? 'block' : 'none';
    input.disabled = isBusy;
    go.disabled = isBusy;
    cancel.disabled = isBusy;
    go.textContent = isBusy ? '改写中' : '改写';
  }

  async function handleRewrite() {
    const instruction = document.getElementById('rewriteInput').value.trim();
    const mark = state.selectionMark;
    const range = state.selectedRange ? state.selectedRange.cloneRange() : null;
    if (!instruction || (!mark && !range)) { showToast('请先选中文字再输入指令', 'warning'); return; }
    const selectedText = mark ? mark.textContent : (range ? range.toString() : '');
    if (!selectedText) { showToast('请选中要改写的文字', 'warning'); return; }
    const fullContext = (document.getElementById('editorArea')?.innerText || '');
    setRewriteBusy(true);
    showToast('AI 改写中…', 'info');
    try {
      saveSnapshot('改写前');
      const rewritten = await AIService.rewriteSection({ selectedText, instruction, fullContext });
      if (rewritten) {
        if (mark && mark.parentNode) {
          mark.parentNode.replaceChild(document.createTextNode(rewritten), mark);
          state.selectionMark = null;
        } else if (range) {
          range.deleteContents();
          range.insertNode(document.createTextNode(rewritten));
        }
        saveCurrentEditorDraft();
        renderPreview(); checkPageFill();
        persistResumeState();
        state.selectedRange = null;
        document.getElementById('rewritePopover').style.display = 'none';
        showToast('改写完成', 'success');
      } else {
        showToast('AI 没有返回改写内容，请换个指令再试', 'warning');
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || '改写失败';
      if (err.message === 'API_KEY_MISSING') msg = '站点还没有配置服务器 Key，请联系站点管理员';
      if (err.message === 'API_KEY_INVALID') msg = '自定义 API Key 无效';
      if (err.message === 'SERVER_API_KEY_INVALID') msg = '站点服务器 Key 无效，请联系站点管理员';
      showToast(msg, 'error');
    }
    finally { setRewriteBusy(false); }
  }

  // ── Refine ──
  function openRefineModal() { document.getElementById('refineModal').style.display = 'flex'; }
  function closeRefineModal() { document.getElementById('refineModal').style.display = 'none'; }
  async function handleRefine() {
    const newJD = document.getElementById('refineJDInput').value.trim();
    if (!newJD) { showToast('请粘贴新 JD', 'warning'); return; }
    closeRefineModal();
    showToast('精修中…', 'info');
    try {
      saveSnapshot('精修前');
      const result = await AIService.generateResume({ jd: newJD, experiences: state.experiences, requirements: state.requirements, previousContent: getCurrentResumeText() });
      state.resumeZH = normalizeResume(result.zh) || state.resumeZH;
      state.resumeEN = normalizeResume(result.en) || state.resumeEN;
      state.jd = newJD;
      state.effectiveJD = newJD;
      clearEditorDrafts();
      saveSnapshot('新JD精修');
      persistResumeState();
      renderEditor(); renderPreview(); checkPageFill();
      showToast('精修完成', 'success');
    } catch (err) { console.error(err); showToast('精修失败', 'error'); }
  }

  async function handleFollowupRefine() {
    const input = document.getElementById('followupInput');
    const instruction = (input?.value || '').trim();
    if (!instruction) { showToast('先告诉 AI 你想怎么改', 'warning'); return; }
    if (!AIService.hasApiKey()) { openAPIKeyModal(); return; }
    const btn = document.getElementById('followupGo');
    if (btn) { btn.disabled = true; btn.textContent = '优化中…'; }
    showToast('收到，AI 正在继续打磨这一版…', 'info');
    try {
      saveSnapshot('继续优化前');
      const result = await AIService.generateResume({
        jd: state.effectiveJD || state.jd || (state.jdTitle ? '目标岗位：' + state.jdTitle : ''),
        experiences: state.experiences,
        requirements: (state.requirements || '') + '\n\n用户对当前版本的继续修改要求：' + instruction + '\n事实优先：只能使用用户已提供的学校、公司、岗位、时间、奖项、数据、技能和链接；不确定的信息留空或弱化表达，绝不能为了显得更丰富而编造。\n请在现有简历基础上调整，不要改变事实；优先改经历，不要用技能/个人概述凑数。',
        previousContent: getCurrentResumeText()
      });
      state.resumeZH = normalizeResume(result.zh || result.raw || result) || state.resumeZH;
      if (result.en) state.resumeEN = normalizeResume(result.en) || state.resumeEN;
      clearEditorDrafts();
      renderEditor(); renderPreview();
      await autoFillToFit(2, { silent: true });
      saveSnapshot('继续优化');
      if (input) input.value = '';
      showToast('优化完成', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || '继续优化失败', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '继续优化'; }
    }
  }

  // ── Versions ──
  function saveSnapshot(label) {
    saveCurrentEditorDraft();
    state.versions.push({
      zh: state.resumeZH ? JSON.parse(JSON.stringify(state.resumeZH)) : null,
      en: state.resumeEN ? JSON.parse(JSON.stringify(state.resumeEN)) : null,
      editorHTML: JSON.parse(JSON.stringify(state.editorHTML)),
      effectiveJD: state.effectiveJD,
      time: new Date().toISOString(),
      label
    });
    state.currentVersionIdx = state.versions.length - 1;
    persistResumeState();
  }

  function renderHistory() {
    const c = document.getElementById('historyContent');
    if (!c) return;
    if (!state.versions.length) { c.innerHTML = '<p style="text-align:center;color:#9b8d78;padding:40px;">暂无历史版本</p>'; return; }
    c.innerHTML = state.versions.map((v, i) => {
      const t = new Date(v.time);
      const ts = (t.getMonth()+1) + '/' + t.getDate() + ' ' + t.getHours() + ':' + String(t.getMinutes()).padStart(2,'0');
      return '<div class="history-item' + (i === state.currentVersionIdx ? ' active' : '') + '"><div class="history-item-info"><div class="history-item-label">' + escHTML(v.label) + '</div><div class="history-item-time">' + ts + '</div></div><button class="btn-sm restore-btn" data-idx="' + i + '">恢复</button></div>';
    }).join('');
    c.querySelectorAll('.restore-btn').forEach(b => b.addEventListener('click', () => restoreVersion(parseInt(b.dataset.idx))));
  }

  function restoreVersion(idx) {
    const v = state.versions[idx]; if (!v) return;
    saveSnapshot('恢复前备份');
    state.resumeZH = v.zh ? JSON.parse(JSON.stringify(v.zh)) : null;
    state.resumeEN = v.en ? JSON.parse(JSON.stringify(v.en)) : null;
    state.editorHTML = v.editorHTML ? JSON.parse(JSON.stringify(v.editorHTML)) : { zh: '', en: '' };
    state.effectiveJD = v.effectiveJD || state.effectiveJD;
    saveSnapshot('恢复: ' + v.label);
    persistResumeState();
    renderEditor(); renderPreview(); checkPageFill(); renderHistory();
    showToast('已恢复', 'success');
  }

  async function renderScore() {
    const c = document.getElementById('scoreContent');
    if (!c) return;
    if (!state.resumeZH || !(state.effectiveJD || state.jd || state.jdTitle)) { c.innerHTML = '<p style="text-align:center;color:#9b8d78;padding:40px;">请先生成简历</p>'; return; }
    c.innerHTML = '<div class="score-loading"><span class="spinner"></span>分析中…</div>';
    try {
      const zhText = (document.getElementById('editorArea')?.innerText || JSON.stringify(state.resumeZH));
      const score = await AIService.scoreResume(zhText, '', state.effectiveJD || state.jd || state.jdTitle);
      if (score.totalScore !== undefined) {
        const dims = score.dimensions || {};
        const labels = { keywords: '关键词匹配', relevance: '经历相关性', quantification: '量化成果', starStructure: 'STAR结构', overallImpression: '整体印象' };
        c.innerHTML =
          '<div class="score-head"><div><h2>JD 匹配度</h2><p>从岗位关键词、经历相关性和表达质量看当前版本</p></div>' +
          '<div class="score-total ' + (score.totalScore >= 80 ? 'is-good' : 'is-mid') + '"><strong>' + score.totalScore + '</strong><span>/100</span></div></div>' +
          '<div class="score-dim-list">' +
          Object.entries(dims).map(([k, v]) =>
            '<div class="score-dim"><div class="score-dim-top"><span>' + escHTML(labels[k] || k) + '</span><b>' + escHTML(v.score ?? '-') + '/20</b></div>' +
            '<p>' + escHTML(v.comment || '') + '</p></div>'
          ).join('') +
          '</div>' +
          (score.topSuggestions ? '<div class="score-section"><h3>改进建议</h3><ul>' + score.topSuggestions.map(s => '<li>' + escHTML(s) + '</li>').join('') + '</ul></div>' : '') +
          (score.jdGapAnalysis ? '<div class="score-section"><h3>差距分析</h3><p>' + escHTML(score.jdGapAnalysis) + '</p></div>' : '');
      }
    } catch (err) { c.innerHTML = '<p class="score-error">评分失败</p>'; }
  }

  // ── View switching ──
  function switchView(view) {
    if (['edit', 'score', 'history'].includes(view) && !state.isGenerating && !hasResumeContent()) {
      view = 'input';
      showToast('请先生成简历', 'info');
    }
    state.currentView = view;
    $$('.tb-tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
    document.getElementById('viewInput').style.display = view === 'input' ? '' : 'none';
    document.getElementById('viewEditing').style.display = view === 'edit' ? '' : 'none';
    document.getElementById('viewScore').style.display = view === 'score' ? '' : 'none';
    document.getElementById('viewHistory').style.display = view === 'history' ? '' : 'none';
    const inResultViews = ['edit', 'score', 'history'].includes(view);
    document.getElementById('viewTabs').style.display = inResultViews ? '' : 'none';
    document.getElementById('downloadBtn').style.display = inResultViews ? '' : 'none';
    document.getElementById('themeSelect').style.display = 'none';
    if (view === 'edit') { renderEditor(); renderPreview(); checkPageFill(); }
    else if (view === 'score') renderScore();
    else if (view === 'history') renderHistory();
  }

  function switchLanguage(lang) {
    saveCurrentEditorDraft();
    state.currentLang = lang;
    $$('.et-tab').forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
    renderEditor(); renderPreview(); checkPageFill();
    persistResumeState();
  }

  // ── Init ──
  function init() {
    setupFileHandlers();
    try {
      const restored = loadState();
      setupEventListeners();
      checkAPIKey();
      if (restored) {
        switchView('edit');
        showToast('已恢复上次生成的简历', 'success');
      } else {
        validateVisibleView();
      }
    }
    catch (e) { console.error('Init error:', e); }
  }

  document.addEventListener('DOMContentLoaded', init);
  window.addEventListener('pageshow', () => {
    setTimeout(validateVisibleView, 0);
  });
  window.addEventListener('beforeunload', () => {
    saveCurrentEditorDraft();
    persistResumeState();
  });

  // Global keyboard: Cmd+Shift+R for AI rewrite
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
        state.selectedRange = sel.getRangeAt(0);
        openRewritePopover(state.selectedRange);
      } else showToast('请先选中要改写的文字', 'info');
    }
  });

})();
