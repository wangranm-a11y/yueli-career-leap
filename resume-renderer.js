/* ================================================================
   resume-renderer.js — A4 resume DOM builder + export
   Layout inspired by real professional resumes (WonderCV style)
   ================================================================ */

(function () {
  'use strict';

  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  const PREVIEW_SCALE = 0.38;

  const THEMES = {
    professional: { name: '专业商务', className: 'theme-professional' },
    modern: { name: '极简现代', className: 'theme-modern' },
    creative: { name: '创意暖色', className: 'theme-creative' },
  };

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Section header ──
  function sectionTitle(text) {
    return `<div class="rs-sec"><span class="rs-sec-title">${esc(text)}</span></div>`;
  }

  // ── Build resume HTML ──
  function buildResumeHTML(content, themeKey) {
    const c = content;
    const cls = THEMES[themeKey] ? THEMES[themeKey].className : 'theme-professional';
    const lines = [];
    lines.push(`<div class="${cls}">`);

    // ── Header: name + contact ──
    lines.push('<div class="rs-header">');
    if (c.name) lines.push(`<span class="rs-name">${esc(c.name)}</span>`);
    const contacts = [c.phone, c.email, ...(c.links || [])].filter(Boolean);
    if (contacts.length) {
      lines.push(`<span class="rs-contact">${contacts.map(x => esc(x)).join(' &nbsp;|&nbsp; ')}</span>`);
    }
    lines.push('</div>');

    // ── Education ──
    if (c.education && c.education.length) {
      lines.push(sectionTitle('教育经历'));
      c.education.forEach(e => {
        let line = '<div class="rs-edu">';
        line += `<span class="rs-edu-school">${esc(e.school)}</span>`;
        line += `<span class="rs-edu-meta">${esc(e.degree)} &nbsp;|&nbsp; ${esc(e.duration || '')}`;
        if (e.notes) line += ` &nbsp;|&nbsp; ${esc(e.notes)}`;
        line += '</span>';
        line += '</div>';
        lines.push(line);
      });
    }

    // ── Experiences ──
    if (c.experiences && c.experiences.length) {
      lines.push(sectionTitle('实习经历'));
      c.experiences.forEach(exp => {
        lines.push('<div class="rs-exp">');
        // Company — Role | Duration
        lines.push('<div class="rs-exp-line1">');
        lines.push(`<span class="rs-exp-company">${esc(exp.company)}</span>`);
        lines.push(`<span class="rs-exp-role">${esc(exp.role || '')}</span>`);
        lines.push(`<span class="rs-exp-date">${esc(exp.duration || '')}</span>`);
        lines.push('</div>');
        // Highlights
        if (exp.highlights && exp.highlights.length) {
          lines.push('<ul class="rs-bullets">');
          exp.highlights.forEach(h => lines.push(`<li>${esc(h)}</li>`));
          lines.push('</ul>');
        }
        lines.push('</div>');
      });
    }

    // ── Projects (if any) ──
    if (c.projects && c.projects.length) {
      lines.push(sectionTitle('项目经历'));
      c.projects.forEach(proj => {
        lines.push('<div class="rs-exp">');
        lines.push('<div class="rs-exp-line1">');
        lines.push(`<span class="rs-exp-company">${esc(proj.name)}</span>`);
        lines.push(`<span class="rs-exp-role">${esc(proj.role || '')}</span>`);
        lines.push(`<span class="rs-exp-date">${esc(proj.duration || '')}</span>`);
        lines.push('</div>');
        if (proj.highlights && proj.highlights.length) {
          lines.push('<ul class="rs-bullets">');
          proj.highlights.forEach(h => lines.push(`<li>${esc(h)}</li>`));
          lines.push('</ul>');
        }
        lines.push('</div>');
      });
    }

    // ── Skills ──
    if (c.skills && c.skills.length) {
      lines.push(sectionTitle('技能'));
      lines.push('<div class="rs-skills">');
      c.skills.forEach(s => {
        lines.push(`<span class="rs-skill-tag"><b>${esc(s.category)}</b>：${esc((s.items || []).join('、'))}</span>`);
      });
      lines.push('</div>');
    }

    // ── Summary (if fits) ──
    if (c.summary && c.summary.length < 200) {
      lines.push(sectionTitle('个人概述'));
      lines.push(`<div class="rs-summary">${esc(c.summary)}</div>`);
    }

    lines.push('</div>');
    return lines.join('\n');
  }

  // ── Build A4 export page ──
  function buildExportPage(content, themeKey) {
    const page = document.createElement('div');
    page.style.cssText = `
      width:${A4_WIDTH}px;min-height:${A4_HEIGHT}px;background:#fff;
      padding:50px 56px 40px;font-size:11px;line-height:1.55;
      box-sizing:border-box;position:relative;overflow:hidden;
      font-family:'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;
      color:#1a1a1a;
    `;
    page.innerHTML = buildResumeHTML(content, themeKey);
    return page;
  }

  // ── Render into preview container ──
  function renderPreview(container, content, themeKey) {
    if (!container || !content) return;
    container.innerHTML = buildResumeHTML(content, themeKey);
  }

  // ── Export to PNG ──
  async function exportToPNG(content, themeKey) {
    const page = buildExportPage(content, themeKey);
    page.style.position = 'fixed';
    page.style.left = '-9999px';
    page.style.top = '0';
    page.style.zIndex = '-1';
    page.style.height = 'auto';
    document.body.appendChild(page);
    await new Promise(r => setTimeout(r, 300));
    try {
      const canvas = await html2canvas(page, {
        width: A4_WIDTH,
        height: Math.min(page.scrollHeight, A4_HEIGHT + 100),
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } finally {
      document.body.removeChild(page);
    }
  }

  // ── Download ──
  async function downloadPDF(zhContent, enContent, themeKey) {
    if (zhContent) {
      const url = await exportToPNG(zhContent, themeKey);
      downloadURL(url, 'resume_中文.png');
    }
    if (enContent) {
      const url = await exportToPNG(enContent, themeKey);
      downloadURL(url, 'resume_EN.png');
    }
  }

  async function downloadPNG(content, themeKey, label) {
    const url = await exportToPNG(content, themeKey);
    downloadURL(url, `${label}.png`);
  }

  function downloadURL(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Markdown export ──
  function downloadMarkdown(zh, en) {
    const parts = [];
    if (zh) parts.push(contentToMD(zh, 'zh'));
    if (en) { parts.push(''); parts.push('---'); parts.push(''); parts.push(contentToMD(en, 'en')); }
    const blob = new Blob([parts.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadURL(url, 'resume.md');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function contentToMD(c, lang) {
    const L = [];
    if (c.name) L.push(`# ${c.name}`);
    const contacts = [c.phone, c.email, ...(c.links || [])].filter(Boolean);
    if (contacts.length) L.push(contacts.join(' | ') + '\n');

    if (c.education && c.education.length) {
      L.push(lang === 'zh' ? '## 教育经历' : '## Education');
      c.education.forEach(e => L.push(`- **${e.school}** — ${e.degree} | ${e.duration || ''}`));
      L.push('');
    }
    if (c.experiences && c.experiences.length) {
      L.push(lang === 'zh' ? '## 实习经历' : '## Experience');
      c.experiences.forEach(exp => {
        L.push(`### ${exp.company} — ${exp.role || ''} (${exp.duration || ''})`);
        (exp.highlights || []).forEach(h => L.push(`- ${h}`));
        L.push('');
      });
    }
    if (c.projects && c.projects.length) {
      L.push(lang === 'zh' ? '## 项目经历' : '## Projects');
      c.projects.forEach(p => {
        L.push(`### ${p.name} — ${p.role || ''} (${p.duration || ''})`);
        (p.highlights || []).forEach(h => L.push(`- ${h}`));
        L.push('');
      });
    }
    if (c.skills && c.skills.length) {
      L.push(lang === 'zh' ? '## 技能' : '## Skills');
      c.skills.forEach(s => L.push(`- **${s.category}**：${(s.items || []).join('、')}`));
      L.push('');
    }
    return L.join('\n');
  }

  // ── Overflow check ──
  function measureContentHeight(content, themeKey) {
    const page = buildExportPage(content, themeKey);
    page.style.position = 'fixed';
    page.style.left = '-9999px';
    page.style.top = '0';
    page.style.zIndex = '-1';
    page.style.height = 'auto';
    document.body.appendChild(page);
    const h = page.scrollHeight;
    document.body.removeChild(page);
    return {
      totalHeight: h,
      contentArea: A4_HEIGHT - 90,
      isOverflow: h > A4_HEIGHT - 90,
      overflowRatio: h / (A4_HEIGHT - 90)
    };
  }

  // ── Public ──
  window.ResumeRenderer = {
    THEMES, A4_WIDTH, A4_HEIGHT, PREVIEW_SCALE,
    buildResumeHTML, renderPreview, buildExportPage,
    exportToPNG, downloadPDF, downloadPNG, downloadMarkdown,
    measureContentHeight,
  };

})();
