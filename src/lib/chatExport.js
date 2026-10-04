// // Utilities for exporting a chat thread as plain text, Word (.doc), or PDF.

// function isImageMessage(content) {
//   return typeof content === 'string' && content.startsWith('__IMAGE__');
// }

// function extractImageUrl(content) {
//   return content.replace('__IMAGE__', '');
// }

// function formatTimestamp(iso) {
//   if (!iso) return '';
//   try {
//     return new Date(iso).toLocaleString(undefined, {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   } catch {
//     return '';
//   }
// }

// function sanitizeFilename(name) {
//   return (name || 'chat')
//     .replace(/[^a-z0-9-_ ]/gi, '')
//     .replace(/\s+/g, '_')
//     .slice(0, 80) || 'chat';
// }

// // ── Plain text (used for clipboard copy) ─────────────────────────────────────

// export function buildPlainText(messages, title = 'Chat Export') {
//   const lines = [`# ${title}`, ''];

//   for (const msg of messages) {
//     const who = msg.role === 'user' ? 'You' : 'AI Assistant';
//     const ts = formatTimestamp(msg.created_at);

//     if (isImageMessage(msg.content)) {
//       lines.push(`${who}${ts ? `  (${ts})` : ''}:`);
//       lines.push(`[Generated image] ${extractImageUrl(msg.content)}`);
//       lines.push('');
//       continue;
//     }

//     lines.push(`${who}${ts ? `  (${ts})` : ''}:`);
//     lines.push(msg.content || '');
//     lines.push('');
//   }

//   return lines.join('\n').trim();
// }

// export async function copyChatContext(messages, title) {
//   const text = buildPlainText(messages, title);
//   if (navigator.clipboard?.writeText) {
//     await navigator.clipboard.writeText(text);
//     return true;
//   }

//   const textarea = document.createElement('textarea');
//   textarea.value = text;
//   textarea.style.position = 'fixed';
//   textarea.style.opacity = '0';
//   document.body.appendChild(textarea);
//   textarea.select();
//   const ok = document.execCommand('copy');
//   document.body.removeChild(textarea);
//   return ok;
// }

// // ── Minimal markdown -> HTML ─────────────────────────────────────────────────

// function escapeHtml(str) {
//   return String(str)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;');
// }

// function markdownToHtml(md) {
//   if (!md) return '';
//   let html = escapeHtml(md);

//   html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
//     `<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:13px;">${code.trim()}</pre>`
//   );

//   html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 5px;border-radius:4px;font-family:monospace;">$1</code>');

//   html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

//   html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

//   html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

//   html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
//   html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
//   html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

//   html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
//   html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

//   html = html
//     .split(/\n{2,}/)
//     .map((block) => {
//       if (/^<(h[1-3]|pre|ul|ol|table)/.test(block.trim())) return block;
//       return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
//     })
//     .join('\n');

//   return html;
// }

// function buildChatHtml(messages, title) {
//   const blocks = [];

//   for (const msg of messages) {
//     const who = msg.role === 'user' ? 'You' : 'AI Assistant';
//     const ts = formatTimestamp(msg.created_at);
//     const bg = msg.role === 'user' ? '#e8f0fe' : '#f9f9f9';

//     let body;
//     if (isImageMessage(msg.content)) {
//       const url = extractImageUrl(msg.content);
//       body = `<p><em>[Generated image]</em></p><img src="${url}" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" />`;
//     } else {
//       body = markdownToHtml(msg.content);
//     }

//     blocks.push(`
//       <div style="margin-bottom:20px;padding:14px 18px;border-radius:12px;background:${bg};border:1px solid #e0e0e0;">
//         <div style="font-weight:600;margin-bottom:8px;color:#333;">${who}${ts ? ` <span style="font-weight:400;font-size:12px;color:#888;">&nbsp;${ts}</span>` : ''}</div>
//         <div style="font-size:14px;line-height:1.6;color:#222;">${body}</div>
//       </div>
//     `);
//   }

//   return `
//     <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;">
//       <h1 style="font-size:22px;margin-bottom:6px;color:#111;">${escapeHtml(title)}</h1>
//       <p style="font-size:12px;color:#999;margin-bottom:28px;">Exported from Netroot AI on ${new Date().toLocaleString()}</p>
//       ${blocks.join('')}
//     </div>
//   `;
// }

// // ── Word (.doc) download ─────────────────────────────────────────────────────

// export function downloadAsWord(messages, title = 'Chat Export') {
//   const html = buildChatHtml(messages, title);
//   const docHtml = `
//     <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
//       <head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
//       <body>${html}</body>
//     </html>
//   `;

//   const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
//   triggerDownload(blob, `${sanitizeFilename(title)}.doc`);
// }

// // ── PowerPoint (.pptx) download ─────────────────────────────────────────────
// // Builds a branded 16:9 deck that preserves markdown structure (headings,
// // bullets, numbered lists, code blocks, quotes) and pairs each user question
// // with its AI answer so slides keep their context.

// const PPT_ACCENT = '3B82F6';
// const PPT_DARK_ACCENT = '2563EB';
// const PPT_TITLE_CLR = '1F2937';
// const PPT_QUESTION_CLR = '2563EB';
// const PPT_BODY_CLR = '374151';
// const PPT_CODE_CLR = '334155';
// const PPT_QUOTE_CLR = '6B7280';
// const PPT_FOOTER_CLR = '9CA3AF';
// const PPT_WHITE = 'FFFFFF';

// const EMU = 914400;
// const SLIDE_W = 12192000;
// const SLIDE_H = 6858000;
// const MARGIN = 685800;
// const CONTENT_W = SLIDE_W - 2 * MARGIN;

// function truncateText(text, max) {
//   if (!text) return '';
//   const clean = String(text).replace(/\s+/g, ' ').trim();
//   return clean.length <= max ? clean : clean.slice(0, max - 1).trim() + '\u2026';
// }

// function cleanInline(text) {
//   if (!text) return '';
//   return String(text)
//     .replace(/\*\*([^*]+)\*\*/g, '$1')
//     .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
//     .replace(/`([^`]+)`/g, '$1')
//     .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
//     .trim();
// }

// function parseMarkdownBlocks(md) {
//   if (!md) return [];
//   const rawLines = String(md).replace(/\r/g, '').split('\n');
//   const blocks = [];
//   let i = 0;
//   let paraBuffer = [];

//   const flushPara = () => {
//     if (paraBuffer.length) {
//       const text = paraBuffer.join(' ').trim();
//       if (text) blocks.push({ type: 'paragraph', text });
//       paraBuffer = [];
//     }
//   };

//   while (i < rawLines.length) {
//     const line = rawLines[i];

//     if (/^```/.test(line.trim())) {
//       flushPara();
//       const lang = line.trim().replace(/^```/, '').trim();
//       const codeLines = [];
//       i += 1;
//       while (i < rawLines.length && !/^```/.test(rawLines[i].trim())) {
//         codeLines.push(rawLines[i]);
//         i += 1;
//       }
//       i += 1;
//       blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
//       continue;
//     }

//     const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
//     if (hMatch) {
//       flushPara();
//       blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2].trim() });
//       i += 1;
//       continue;
//     }

//     if (/^>\s?/.test(line)) {
//       flushPara();
//       const quoteLines = [];
//       while (i < rawLines.length && /^>\s?/.test(rawLines[i])) {
//         quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
//         i += 1;
//       }
//       const text = quoteLines.join(' ').trim();
//       if (text) blocks.push({ type: 'quote', text });
//       continue;
//     }

//     if (/^\s*[-*]\s+/.test(line)) {
//       flushPara();
//       const items = [];
//       while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i])) {
//         const itemText = rawLines[i].replace(/^\s*[-*]\s+/, '').trim();
//         if (itemText) items.push(itemText);
//         i += 1;
//       }
//       if (items.length) blocks.push({ type: 'bullet', items });
//       continue;
//     }

//     if (/^\s*\d+\.\s+/.test(line)) {
//       flushPara();
//       const items = [];
//       while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
//         const itemText = rawLines[i].replace(/^\s*\d+\.\s+/, '').trim();
//         if (itemText) items.push(itemText);
//         i += 1;
//       }
//       if (items.length) blocks.push({ type: 'numbered', items });
//       continue;
//     }

//     if (line.trim() === '') {
//       flushPara();
//       i += 1;
//       continue;
//     }

//     paraBuffer.push(line.trim());
//     i += 1;
//   }
//   flushPara();
//   return blocks;
// }

// function blockWeight(block) {
//   switch (block.type) {
//     case 'heading': return 1.5;
//     case 'code': return Math.max(2, Math.ceil(block.text.length / 58) + 1);
//     case 'quote': return Math.ceil(block.text.length / 80) + 0.5;
//     case 'bullet': return block.items.length + 0.5;
//     case 'numbered': return block.items.length + 0.5;
//     case 'paragraph': return Math.ceil(block.text.length / 85) + 0.5;
//     default: return 1;
//   }
// }

// function chunkBlocks(blocks, budget) {
//   const chunks = [];
//   let current = [];
//   let weight = 0;
//   for (const block of blocks) {
//     const w = blockWeight(block);
//     if (current.length && weight + w > budget) {
//       chunks.push(current);
//       current = [];
//       weight = 0;
//     }
//     current.push(block);
//     weight += w;
//   }
//   if (current.length) chunks.push(current);
//   return chunks;
// }

// function buildSlides(messages, title) {
//   const slides = [{
//     kind: 'title',
//     title: title || 'Chat Export',
//     subtitle: `Exported from Netroot AI \u00b7 ${new Date().toLocaleString()}`,
//   }];

//   const pairs = [];
//   let pendingQuestion = null;
//   for (const msg of messages) {
//     if (isImageMessage(msg.content)) continue;
//     if (msg.role === 'user') {
//       pendingQuestion = msg.content.trim();
//     } else if (msg.role === 'assistant') {
//       pairs.push({ question: pendingQuestion, answer: msg.content });
//       pendingQuestion = null;
//     }
//   }
//   if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: '' });

//   for (const pair of pairs) {
//     const blocks = parseMarkdownBlocks(pair.answer);
//     const firstHeading = blocks.find(b => b.type === 'heading');
//     let slideTitle = firstHeading ? cleanInline(firstHeading.text) : '';
//     if (!slideTitle && pair.question) slideTitle = truncateText(cleanInline(pair.question), 60);
//     if (!slideTitle) slideTitle = 'AI Response';

//     const bodyBlocks = firstHeading ? blocks.filter(b => b !== firstHeading) : blocks;
//     const questionText = pair.question ? truncateText(cleanInline(pair.question), 180) : null;
//     const chunks = chunkBlocks(bodyBlocks, 10);

//     if (chunks.length === 0) {
//       slides.push({ kind: 'content', title: slideTitle, question: questionText, blocks: [], continued: false });
//       continue;
//     }
//     chunks.forEach((chunk, idx) => {
//       slides.push({
//         kind: 'content',
//         title: idx === 0 ? slideTitle : `${slideTitle} (continued)`,
//         question: idx === 0 ? questionText : null,
//         blocks: chunk,
//         continued: idx > 0,
//       });
//     });
//   }

//   slides.push({ kind: 'closing', title: 'Thank You', subtitle: 'Generated by Netroot AI' });
//   return slides;
// }

// // ── PPTX slide XML helpers ───────────────────────────────────────────────────

// function pptRun(text, { size = 1600, bold = false, italic = false, color = PPT_BODY_CLR, font = 'Calibri' } = {}) {
//   return `<a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ''}${italic ? ' i="1"' : ''}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${font}"/></a:rPr><a:t>${escapeHtml(text)}</a:t></a:r>`;
// }

// function pptPara(runsXml, { marL = 0, indent = 0, bullet = false, numbered = false, spaceBefore = 0, spaceAfter = 0, align } = {}) {
//   const attrs = [];
//   if (marL) attrs.push(`marL="${marL}"`);
//   if (indent) attrs.push(`indent="${indent}"`);
//   if (align) attrs.push(`algn="${align}"`);
//   let children = '';
//   if (spaceBefore) children += `<a:spcBef><a:spcPts val="${spaceBefore}"/></a:spcBef>`;
//   if (spaceAfter) children += `<a:spcAft><a:spcPts val="${spaceAfter}"/></a:spcAft>`;
//   if (bullet) children += '<a:buChar char="&#x2022;"/>';
//   else if (numbered) children += '<a:buAutoNum type="arabicPeriod"/>';
//   const pPr = (attrs.length || children) ? `<a:pPr ${attrs.join(' ')}>${children}</a:pPr>` : '';
//   return `<a:p>${pPr}${runsXml}</a:p>`;
// }

// function blockToParagraphs(block) {
//   switch (block.type) {
//     case 'heading': {
//       const sz = block.level <= 2 ? 2200 : 2000;
//       return [pptPara(pptRun(cleanInline(block.text), { size: sz, bold: true, color: PPT_TITLE_CLR }), { spaceBefore: 400, spaceAfter: 200 })];
//     }
//     case 'paragraph':
//       return [pptPara(pptRun(cleanInline(block.text), { size: 1600, color: PPT_BODY_CLR }), { spaceAfter: 200 })];
//     case 'quote':
//       return [pptPara(pptRun(cleanInline(block.text), { size: 1500, italic: true, color: PPT_QUOTE_CLR }), { marL: 228600, spaceBefore: 200, spaceAfter: 200 })];
//     case 'bullet':
//       return block.items.map(item =>
//         pptPara(pptRun(cleanInline(item), { size: 1500, color: PPT_BODY_CLR }), { marL: 342900, indent: -228600, bullet: true, spaceAfter: 80 })
//       );
//     case 'numbered':
//       return block.items.map(item =>
//         pptPara(pptRun(cleanInline(item), { size: 1500, color: PPT_BODY_CLR }), { marL: 342900, indent: -228600, numbered: true, spaceAfter: 80 })
//       );
//     case 'code':
//       return block.text.split('\n').map(line =>
//         pptPara(pptRun(line || ' ', { size: 1200, color: PPT_CODE_CLR, font: 'Consolas' }), { spaceAfter: 0 })
//       );
//     default:
//       return [];
//   }
// }

// function pptTextBox(id, name, x, y, cx, cy, paragraphsXml, { anchor = 't' } = {}) {
//   return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="${anchor}"/><a:lstStyle/>${paragraphsXml}</p:txBody></p:sp>`;
// }

// function pptRect(id, name, x, y, cx, cy, fill, { rounded = false } = {}) {
//   const geom = rounded
//     ? '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 50000"/></a:avLst></a:prstGeom>'
//     : '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
//   return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>${geom}<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
// }

// const PPT_SLIDE_OPEN = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">';
// const PPT_SLIDE_CLOSE = '\n</p:sld>';
// const PPT_SP_TREE_WHITE = '\n<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
// const PPT_SP_TREE_DARK = '\n<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="111827"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
// const PPT_SP_TREE_CLOSE = '\n</p:spTree></p:cSld>';

// function buildSlideXml(slide, slideNum) {
//   if (slide.kind === 'title') return buildTitleSlideXml(slide);
//   if (slide.kind === 'closing') return buildClosingSlideXml(slide);
//   return buildContentSlideXml(slide, slideNum);
// }

// function buildTitleSlideXml(slide) {
//   const cy = Math.round(SLIDE_H / 2);
//   const shapes = [
//     pptRect(2, 'AccentBar', MARGIN, cy - 500000, 91440, 1000000, PPT_ACCENT, { rounded: true }),
//     pptTextBox(3, 'Title', MARGIN + 200000, cy - 500000, SLIDE_W - 2 * MARGIN - 200000, 600000,
//       pptPara(pptRun(slide.title || 'Chat Export', { size: 4400, bold: true, color: PPT_WHITE, font: 'Calibri Light' })), { anchor: 'ctr' }),
//     pptTextBox(4, 'Subtitle', MARGIN + 200000, cy + 150000, SLIDE_W - 2 * MARGIN - 200000, 300000,
//       pptPara(pptRun(slide.subtitle || '', { size: 1600, color: PPT_FOOTER_CLR })), { anchor: 't' }),
//   ];
//   return PPT_SLIDE_OPEN + PPT_SP_TREE_DARK + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
// }

// function buildContentSlideXml(slide, slideNum) {
//   const titleY = 400000;
//   const titleH = 500000;
//   const accentY = titleY + titleH + 50000;
//   const hasQuestion = !!slide.question;
//   const bodyY = accentY + 80000 + (hasQuestion ? 580000 : 0);
//   const bodyH = SLIDE_H - bodyY - 400000;

//   const shapes = [
//     pptRect(2, 'AccentBar', MARGIN, accentY, 457200, 22860, PPT_ACCENT),
//     pptTextBox(3, 'Title', MARGIN, titleY, CONTENT_W, titleH,
//       pptPara(pptRun(slide.title, { size: 2800, bold: true, color: PPT_TITLE_CLR, font: 'Calibri Light' })), { anchor: 't' }),
//   ];

//   let nextId = 4;
//   if (hasQuestion) {
//     shapes.push(pptTextBox(nextId, 'Question', MARGIN, accentY + 80000, CONTENT_W, 500000,
//       pptPara(pptRun('Q: ', { size: 1500, bold: true, color: PPT_QUESTION_CLR }) + pptRun(slide.question, { size: 1500, italic: true, color: PPT_QUESTION_CLR })), { anchor: 't' }));
//     nextId += 1;
//   }

//   if (slide.blocks && slide.blocks.length > 0) {
//     const allParas = slide.blocks.flatMap(blockToParagraphs).join('');
//     shapes.push(pptTextBox(nextId, 'Content', MARGIN, bodyY, CONTENT_W, bodyH, allParas, { anchor: 't' }));
//   }

//   shapes.push(pptTextBox(nextId + 1, 'Footer', MARGIN, SLIDE_H - 350000, CONTENT_W, 200000,
//     pptPara(pptRun(`Netroot AI  |  ${slideNum}`, { size: 1000, color: PPT_FOOTER_CLR }), { align: 'r' }), { anchor: 'ctr' }));

//   return PPT_SLIDE_OPEN + PPT_SP_TREE_WHITE + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
// }

// function buildClosingSlideXml(slide) {
//   const cy = Math.round(SLIDE_H / 2);
//   const shapes = [
//     pptRect(2, 'AccentBar', Math.round(SLIDE_W / 2 - 45720), cy - 600000, 91440, 500000, PPT_ACCENT, { rounded: true }),
//     pptTextBox(3, 'Title', MARGIN, cy - 400000, CONTENT_W, 500000,
//       pptPara(pptRun(slide.title, { size: 4400, bold: true, color: PPT_WHITE, font: 'Calibri Light' }), { align: 'ctr' }), { anchor: 'ctr' }),
//     pptTextBox(4, 'Subtitle', MARGIN, cy + 200000, CONTENT_W, 300000,
//       pptPara(pptRun(slide.subtitle, { size: 1600, color: PPT_FOOTER_CLR }), { align: 'ctr' }), { anchor: 't' }),
//   ];
//   return PPT_SLIDE_OPEN + PPT_SP_TREE_DARK + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
// }

// function buildPptxXml(slides) {
//   let slideFiles = '';
//   let slideRels = '';
//   let presentationSlides = '';

//   slides.forEach((_, i) => {
//     const id = i + 1;
//     slideFiles += `
//     <Override PartName="/ppt/slides/slide${id}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
//     slideRels += `
//     <Relationship Id="rId${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${id}.xml"/>`;
//     presentationSlides += `
//         <p:sldId id="${256 + i}" r:id="rId${id}"/>`;
//   });

//   const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
//   <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
//   <Default Extension="xml" ContentType="application/xml"/>
//   <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
//   <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
//   <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
//   <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
//   <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
//   <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slideFiles}
// </Types>`;

//   const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
//   <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
//   <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
//   <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
// </Relationships>`;

//   const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
//   <dc:title>${escapeHtml(slides[0]?.title || 'Chat Export')}</dc:title>
//   <dc:creator>Netroot AI</dc:creator>
//   <cp:lastModifiedBy>Netroot AI</cp:lastModifiedBy>
//   <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
//   <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
// </cp:coreProperties>`;

//   const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
//   <Application>Netroot AI</Application>
//   <Slides>${slides.length}</Slides>
// </Properties>`;

//   const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
//   <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
//   <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>${slideRels}
// </Relationships>`;

//   const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
//   <p:sldMasterIdLst><p:sldMasterId id="1" r:id="rId1"/></p:sldMasterIdLst>
//   <p:sldIdLst>${presentationSlides}
//   </p:sldIdLst>
//   <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
//   <p:notesSz cx="6858000" cy="9144000"/>
// </p:presentation>`;

//   const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
//   <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
//   <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
// </Relationships>`;

//   const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
//   <p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
//     <p:spTree>
//       <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
//       <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
//     </p:spTree>
//   </p:cSld>
//   <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
//   <p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>
// </p:sldMaster>`;

//   const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
//   <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
// </Relationships>`;

//   const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title" preserve="1">
//   <p:cSld>
//     <p:spTree>
//       <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
//       <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
//     </p:spTree>
//   </p:cSld>
// </p:sldLayout>`;

//   const themeRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
//   <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
// </Relationships>`;

//   const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
// <a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
//   <a:clrScheme name="Office">
//     <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
//     <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
//     <a:dk2><a:srgbClr val="44556A"/></a:dk2>
//     <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
//     <a:accent1><a:srgbClr val="3B82F6"/></a:accent1>
//     <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
//     <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
//     <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
//     <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
//     <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
//     <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
//     <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
//   </a:clrScheme>
//   <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
//   <a:fmtScheme name="Office">
//     <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
//     <a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>
//     <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
//   </a:fmtScheme>
// </a:theme>`;

//   const slideXmlArray = slides.map((slide, idx) => buildSlideXml(slide, idx + 1));

//   const files = {
//     '[Content_Types].xml': contentTypes,
//     '_rels/.rels': rootRels,
//     'docProps/core.xml': coreProps,
//     'docProps/app.xml': appProps,
//     'ppt/presentation.xml': presentation,
//     'ppt/_rels/presentation.xml.rels': presentationRels,
//     'ppt/slideMasters/slideMaster1.xml': slideMaster,
//     'ppt/slideMasters/_rels/slideMaster1.xml.rels': slideMasterRels,
//     'ppt/slideLayouts/slideLayout1.xml': slideLayout,
//     'ppt/slideLayouts/_rels/slideLayout1.xml.rels': slideLayoutRels,
//     'ppt/theme/theme1.xml': theme,
//     'ppt/theme/_rels/theme1.xml.rels': themeRels,
//   };

//   slideXmlArray.forEach((xml, i) => {
//     files[`ppt/slides/slide${i + 1}.xml`] = xml;
//   });

//   return files;
// }

// // Minimal ZIP writer (STORE, no compression) for .pptx packaging
// function crc32(data) {
//   let crc = 0xffffffff;
//   for (let i = 0; i < data.length; i++) {
//     crc ^= data[i];
//     for (let j = 0; j < 8; j++) {
//       crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
//     }
//   }
//   return (crc ^ 0xffffffff) >>> 0;
// }

// function uint16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
// function uint32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }

// function buildZip(files) {
//   const enc = new TextEncoder();
//   const entries = Object.entries(files);
//   const localParts = [];
//   const centralParts = [];
//   let offset = 0;

//   for (const [name, content] of entries) {
//     const nameBytes = enc.encode(name);
//     const dataBytes = enc.encode(content);
//     const crc = crc32(dataBytes);

//     const local = [
//       uint32(0x04034b50), uint16(20), uint16(0), uint16(0),
//       uint16(0), uint16(0), uint32(crc), uint32(dataBytes.length), uint32(dataBytes.length),
//       uint16(nameBytes.length), uint16(0),
//       nameBytes, dataBytes,
//     ];
//     const localBytes = concatU8(local);
//     localParts.push(localBytes);

//     const central = [
//       uint32(0x02014b50), uint16(20), uint16(20), uint16(0), uint16(0),
//       uint16(0), uint16(0), uint32(crc), uint32(dataBytes.length), uint32(dataBytes.length),
//       uint16(nameBytes.length), uint16(0), uint16(0), uint16(0), uint16(0),
//       uint32(0), uint32(offset),
//       nameBytes,
//     ];
//     centralParts.push(concatU8(central));

//     offset += localBytes.length;
//   }

//   const centralBytes = concatU8(centralParts);
//   const endRecord = concatU8([
//     uint32(0x06054b50), uint16(0), uint16(0),
//     uint16(entries.length), uint16(entries.length),
//     uint32(centralBytes.length), uint32(offset),
//     uint16(0),
//   ]);

//   return new Blob([concatU8(localParts), centralBytes, endRecord], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
// }

// function concatU8(arrays) {
//   const total = arrays.reduce((s, a) => s + a.length, 0);
//   const result = new Uint8Array(total);
//   let pos = 0;
//   for (const a of arrays) { result.set(a, pos); pos += a.length; }
//   return result;
// }

// export function downloadAsPpt(messages, title = 'Chat Export') {
//   const slides = buildSlides(messages, title);
//   const files = buildPptxXml(slides);
//   const blob = buildZip(files);
//   triggerDownload(blob, `${sanitizeFilename(title)}.pptx`);
// }

// // ── PDF via print window ─────────────────────────────────────────────────────

// export function downloadAsPdf(messages, title = 'Chat Export') {
//   const html = buildChatHtml(messages, title);
//   const printDoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
//     <style>
//       @media print { body { margin: 0; } }
//       body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
//     </style>
//   </head><body>${html}
//     <script>
//       window.onload = function() {
//         setTimeout(function() { window.print(); }, 300);
//       };
//     </script>
//   </body></html>`;

//   const w = window.open('', '_blank');
//   if (!w) {
//     alert('Please allow popups to download the PDF.');
//     return;
//   }
//   w.document.open();
//   w.document.write(printDoc);
//   w.document.close();
// }

// function triggerDownload(blob, filename) {
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   setTimeout(() => URL.revokeObjectURL(url), 1000);
// }


// Utilities for exporting a chat thread as plain text, Word (.doc), or PDF.

function isImageMessage(content) {
  return typeof content === 'string' && content.startsWith('__IMAGE__');
}

function extractImageUrl(content) {
  return content.replace('__IMAGE__', '');
}

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function sanitizeFilename(name) {
  return (name || 'chat')
    .replace(/[^a-z0-9-_ ]/gi, '')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'chat';
}

// ── Plain text (used for clipboard copy) ─────────────────────────────────────

export function buildPlainText(messages, title = 'Chat Export') {
  const lines = [`# ${title}`, ''];

  for (const msg of messages) {
    const who = msg.role === 'user' ? 'You' : 'AI Assistant';
    const ts = formatTimestamp(msg.created_at);

    if (isImageMessage(msg.content)) {
      lines.push(`${who}${ts ? `  (${ts})` : ''}:`);
      lines.push(`[Generated image] ${extractImageUrl(msg.content)}`);
      lines.push('');
      continue;
    }

    lines.push(`${who}${ts ? `  (${ts})` : ''}:`);
    lines.push(msg.content || '');
    lines.push('');
  }

  return lines.join('\n').trim();
}

export async function copyChatContext(messages, title) {
  const text = buildPlainText(messages, title);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand('copy');
  document.body.removeChild(textarea);
  return ok;
}

// ── Minimal markdown -> HTML ─────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Escape only the characters that are NOT inside a block-level placeholder
// token (delimited by \x00...\x00). Code blocks and tables are pre-escaped.
function escapeMarkdownInline(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyInlineFormatting(html) {
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 5px;border-radius:4px;font-family:monospace;">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

function parseTable(lines) {
  if (lines.length < 2) return null;
  const splitRow = (row) => row.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1 || c !== '');
  const cleanSplit = (row) => {
    const raw = row.replace(/^\||\|$/g, '');
    return raw.split('|').map(c => c.trim());
  };

  const headers = cleanSplit(lines[0]);
  if (headers.length === 0) return null;

  const separatorLine = lines[1];
  if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(separatorLine) || !separatorLine.includes('-') || !separatorLine.includes('|')) return null;

  const aligns = cleanSplit(separatorLine).map(spec => {
    if (/^:.*:$/.test(spec)) return 'center';
    if (/^:/.test(spec)) return 'left';
    if (/:$/.test(spec)) return 'right';
    return 'left';
  });

  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = cleanSplit(lines[i]);
    if (cells.length === 1 && cells[0] === '') continue;
    rows.push(cells);
  }

  return { headers, aligns, rows };
}

function tableToHtml(table) {
  const cellStyle = 'padding:6pt 10pt;mso-border-alt:solid #BFBFBF .5pt;border:solid #BFBFBF 1.0pt;';
  const alignStyle = (align) => `text-align:${align};`;

  const headerCells = table.headers.map((h, idx) =>
    `<th style="${cellStyle}background:#F3F4F6;font-weight:bold;${alignStyle(table.aligns[idx] || 'left')}">${applyInlineFormatting(escapeMarkdownInline(h))}</th>`
  ).join('');

  const bodyRows = table.rows.map(row =>
    `<tr>${row.map((cell, idx) =>
      `<td style="${cellStyle}${alignStyle(table.aligns[idx] || 'left')}">${applyInlineFormatting(escapeMarkdownInline(cell))}</td>`
    ).join('')}</tr>`
  ).join('');

  return `<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;width:100%;margin:10pt 0;border:solid #BFBFBF 1.0pt;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function markdownToHtml(md) {
  if (!md) return '';

  const rawLines = String(md).replace(/\r/g, '').split('\n');
  const output = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length === 0) return '';
    const text = buf.join(' ');
    return `<p>${applyInlineFormatting(escapeMarkdownInline(text))}</p>`;
  };

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // Code block
    if (/^```/.test(trimmed)) {
      const codeLines = [];
      i += 1;
      while (i < rawLines.length && !/^```/.test(rawLines[i].trim())) {
        codeLines.push(rawLines[i]);
        i += 1;
      }
      i += 1;
      output.push(`<pre style="background:#f4f4f4;padding:12px;border-radius:8px;overflow-x:auto;font-family:monospace;font-size:13px;">${escapeHtml(codeLines.join('\n').trim())}</pre>`);
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const tag = `h${Math.min(level, 3)}`;
      const sizeMap = { 1: '24px', 2: '20px', 3: '16px' };
      const sz = sizeMap[tag] || '16px';
      output.push(`<${tag} style="font-size:${sz};font-weight:700;color:#1f2937;margin:18px 0 8px;">${applyInlineFormatting(escapeMarkdownInline(hMatch[2].trim()))}</${tag}>`);
      i += 1;
      continue;
    }

    // Block quote
    if (/^>\s?/.test(line)) {
      const quoteLines = [];
      while (i < rawLines.length && /^>\s?/.test(rawLines[i])) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      const quoteText = quoteLines.join(' ');
      output.push(`<blockquote style="border-left:4px solid #3b82f6;margin:12px 0;padding:8px 16px;background:#f9fafb;color:#555;font-style:italic;">${applyInlineFormatting(escapeMarkdownInline(quoteText))}</blockquote>`);
      continue;
    }

    // Table — look for header row, separator row, then body rows
    if (trimmed.includes('|') && i + 1 < rawLines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(rawLines[i + 1]) && rawLines[i + 1].includes('-')) {
      const tableLines = [line, rawLines[i + 1]];
      let j = i + 2;
      while (j < rawLines.length && rawLines[j].trim().includes('|')) {
        tableLines.push(rawLines[j]);
        j += 1;
      }
      const table = parseTable(tableLines);
      if (table) {
        output.push(tableToHtml(table));
        i = j;
        continue;
      }
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i])) {
        const itemText = rawLines[i].replace(/^\s*[-*]\s+/, '').trim();
        if (itemText) items.push(`<li>${applyInlineFormatting(escapeMarkdownInline(itemText))}</li>`);
        i += 1;
      }
      if (items.length) output.push(`<ul style="padding-left:24px;margin:8px 0;">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
        const itemText = rawLines[i].replace(/^\s*\d+\.\s+/, '').trim();
        if (itemText) items.push(`<li>${applyInlineFormatting(escapeMarkdownInline(itemText))}</li>`);
        i += 1;
      }
      if (items.length) output.push(`<ol style="padding-left:24px;margin:8px 0;">${items.join('')}</ol>`);
      continue;
    }

    // Blank line — paragraph break
    if (trimmed === '') {
      i += 1;
      continue;
    }

    // Accumulate consecutive non-blank lines into a paragraph
    const paraBuf = [trimmed];
    i += 1;
    while (i < rawLines.length
      && rawLines[i].trim() !== ''
      && !/^```/.test(rawLines[i].trim())
      && !/^(#{1,6})\s+/.test(rawLines[i])
      && !/^>\s?/.test(rawLines[i])
      && !/^\s*[-*]\s+/.test(rawLines[i])
      && !/^\s*\d+\.\s+/.test(rawLines[i])
      && !(rawLines[i].trim().includes('|') && i + 1 < rawLines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(rawLines[i + 1]) && rawLines[i + 1].includes('-'))
    ) {
      paraBuf.push(rawLines[i].trim());
      i += 1;
    }
    output.push(flushParagraph(paraBuf));
  }

  return output.join('\n');
}

function buildChatHtml(messages, title) {
  const blocks = [];

  for (const msg of messages) {
    const who = msg.role === 'user' ? 'You' : 'AI Assistant';
    const ts = formatTimestamp(msg.created_at);
    const bg = msg.role === 'user' ? '#e8f0fe' : '#f9f9f9';

    let body;
    if (isImageMessage(msg.content)) {
      const url = extractImageUrl(msg.content);
      body = `<p><em>[Generated image]</em></p><img src="${url}" style="max-width:100%;border-radius:8px;border:1px solid #ddd;" />`;
    } else {
      body = markdownToHtml(msg.content);
    }

    blocks.push(`
      <div style="margin-bottom:20px;padding:14px 18px;border-radius:12px;background:${bg};border:1px solid #e0e0e0;">
        <div style="font-weight:600;margin-bottom:8px;color:#333;">${who}${ts ? ` <span style="font-weight:400;font-size:12px;color:#888;">&nbsp;${ts}</span>` : ''}</div>
        <div style="font-size:14px;line-height:1.6;color:#222;">${body}</div>
      </div>
    `);
  }

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;padding:24px;">
      <h1 style="font-size:22px;margin-bottom:6px;color:#111;">${escapeHtml(title)}</h1>
      <p style="font-size:12px;color:#999;margin-bottom:28px;">Exported from Netroot AI on ${new Date().toLocaleString()}</p>
      ${blocks.join('')}
    </div>
  `;
}

// ── Word (.doc) download ─────────────────────────────────────────────────────

export function downloadAsWord(messages, title = 'Chat Export') {
  const html = buildChatHtml(messages, title);
  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
        <style>
          @page { margin: 1in; }
          body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #222; }
          h1 { font-size: 18pt; font-weight: bold; color: #1f2937; margin: 16pt 0 6pt; }
          h2 { font-size: 15pt; font-weight: bold; color: #1f2937; margin: 14pt 0 5pt; }
          h3 { font-size: 13pt; font-weight: bold; color: #1f2937; margin: 12pt 0 4pt; }
          p { margin: 6pt 0; }
          table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; margin: 10pt 0; }
          th { mso-border-alt: solid #BFBFBF .5pt; border: solid #BFBFBF 1.0pt; padding: 6pt 10pt; background: #F3F4F6; font-weight: bold; }
          td { mso-border-alt: solid #BFBFBF .5pt; border: solid #BFBFBF 1.0pt; padding: 6pt 10pt; }
          ul, ol { padding-left: 24pt; margin: 6pt 0; }
          li { margin: 3pt 0; }
          pre { background: #f4f4f4; padding: 10pt; border: 1pt solid #e0e0e0; font-family: 'Consolas', 'Courier New', monospace; font-size: 9pt; }
          blockquote { border-left: 3pt solid #3b82f6; margin: 8pt 0; padding: 6pt 12pt; background: #f9fafb; color: #555; font-style: italic; }
          code { font-family: 'Consolas', 'Courier New', monospace; font-size: 9.5pt; background: #f0f0f0; padding: 1pt 3pt; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
  triggerDownload(blob, `${sanitizeFilename(title)}.doc`);
}

// ── PowerPoint (.pptx) download ─────────────────────────────────────────────
// Builds a branded 16:9 deck that preserves markdown structure (headings,
// bullets, numbered lists, code blocks, quotes) and pairs each user question
// with its AI answer so slides keep their context.

const PPT_ACCENT = '3B82F6';
const PPT_DARK_ACCENT = '2563EB';
const PPT_TITLE_CLR = '1F2937';
const PPT_QUESTION_CLR = '2563EB';
const PPT_BODY_CLR = '374151';
const PPT_CODE_CLR = '334155';
const PPT_QUOTE_CLR = '6B7280';
const PPT_FOOTER_CLR = '9CA3AF';
const PPT_WHITE = 'FFFFFF';

const EMU = 914400;
const SLIDE_W = 12192000;
const SLIDE_H = 6858000;
const MARGIN = 685800;
const CONTENT_W = SLIDE_W - 2 * MARGIN;

function truncateText(text, max) {
  if (!text) return '';
  const clean = String(text).replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max - 1).trim() + '\u2026';
}

function cleanInline(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .trim();
}

function parseMarkdownBlocks(md) {
  if (!md) return [];
  const rawLines = String(md).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  let paraBuffer = [];

  const flushPara = () => {
    if (paraBuffer.length) {
      const text = paraBuffer.join(' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      paraBuffer = [];
    }
  };

  while (i < rawLines.length) {
    const line = rawLines[i];

    if (/^```/.test(line.trim())) {
      flushPara();
      const lang = line.trim().replace(/^```/, '').trim();
      const codeLines = [];
      i += 1;
      while (i < rawLines.length && !/^```/.test(rawLines[i].trim())) {
        codeLines.push(rawLines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: 'code', lang, text: codeLines.join('\n') });
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      flushPara();
      blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2].trim() });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushPara();
      const quoteLines = [];
      while (i < rawLines.length && /^>\s?/.test(rawLines[i])) {
        quoteLines.push(rawLines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      const text = quoteLines.join(' ').trim();
      if (text) blocks.push({ type: 'quote', text });
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < rawLines.length && /^\s*[-*]\s+/.test(rawLines[i])) {
        const itemText = rawLines[i].replace(/^\s*[-*]\s+/, '').trim();
        if (itemText) items.push(itemText);
        i += 1;
      }
      if (items.length) blocks.push({ type: 'bullet', items });
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items = [];
      while (i < rawLines.length && /^\s*\d+\.\s+/.test(rawLines[i])) {
        const itemText = rawLines[i].replace(/^\s*\d+\.\s+/, '').trim();
        if (itemText) items.push(itemText);
        i += 1;
      }
      if (items.length) blocks.push({ type: 'numbered', items });
      continue;
    }

    if (line.trim() === '') {
      flushPara();
      i += 1;
      continue;
    }

    paraBuffer.push(line.trim());
    i += 1;
  }
  flushPara();
  return blocks;
}

function blockWeight(block) {
  switch (block.type) {
    case 'heading': return 1.5;
    case 'code': return Math.max(2, Math.ceil(block.text.length / 58) + 1);
    case 'quote': return Math.ceil(block.text.length / 80) + 0.5;
    case 'bullet': return block.items.length + 0.5;
    case 'numbered': return block.items.length + 0.5;
    case 'paragraph': return Math.ceil(block.text.length / 85) + 0.5;
    default: return 1;
  }
}

function chunkBlocks(blocks, budget) {
  const chunks = [];
  let current = [];
  let weight = 0;
  for (const block of blocks) {
    const w = blockWeight(block);
    if (current.length && weight + w > budget) {
      chunks.push(current);
      current = [];
      weight = 0;
    }
    current.push(block);
    weight += w;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

function buildSlides(messages, title) {
  const slides = [{
    kind: 'title',
    title: title || 'Chat Export',
    subtitle: `Exported from Netroot AI \u00b7 ${new Date().toLocaleString()}`,
  }];

  const pairs = [];
  let pendingQuestion = null;
  for (const msg of messages) {
    if (isImageMessage(msg.content)) continue;
    if (msg.role === 'user') {
      pendingQuestion = msg.content.trim();
    } else if (msg.role === 'assistant') {
      pairs.push({ question: pendingQuestion, answer: msg.content });
      pendingQuestion = null;
    }
  }
  if (pendingQuestion) pairs.push({ question: pendingQuestion, answer: '' });

  for (const pair of pairs) {
    const blocks = parseMarkdownBlocks(pair.answer);
    const firstHeading = blocks.find(b => b.type === 'heading');
    let slideTitle = firstHeading ? cleanInline(firstHeading.text) : '';
    if (!slideTitle && pair.question) slideTitle = truncateText(cleanInline(pair.question), 60);
    if (!slideTitle) slideTitle = 'AI Response';

    const bodyBlocks = firstHeading ? blocks.filter(b => b !== firstHeading) : blocks;
    const questionText = pair.question ? truncateText(cleanInline(pair.question), 180) : null;
    const chunks = chunkBlocks(bodyBlocks, 10);

    if (chunks.length === 0) {
      slides.push({ kind: 'content', title: slideTitle, question: questionText, blocks: [], continued: false });
      continue;
    }
    chunks.forEach((chunk, idx) => {
      slides.push({
        kind: 'content',
        title: idx === 0 ? slideTitle : `${slideTitle} (continued)`,
        question: idx === 0 ? questionText : null,
        blocks: chunk,
        continued: idx > 0,
      });
    });
  }

  slides.push({ kind: 'closing', title: 'Thank You', subtitle: 'Generated by Netroot AI' });
  return slides;
}

// ── PPTX slide XML helpers ───────────────────────────────────────────────────

function pptRun(text, { size = 1600, bold = false, italic = false, color = PPT_BODY_CLR, font = 'Calibri' } = {}) {
  return `<a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ''}${italic ? ' i="1"' : ''}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="${font}"/></a:rPr><a:t>${escapeHtml(text)}</a:t></a:r>`;
}

function pptPara(runsXml, { marL = 0, indent = 0, bullet = false, numbered = false, spaceBefore = 0, spaceAfter = 0, align } = {}) {
  const attrs = [];
  if (marL) attrs.push(`marL="${marL}"`);
  if (indent) attrs.push(`indent="${indent}"`);
  if (align) attrs.push(`algn="${align}"`);
  let children = '';
  if (spaceBefore) children += `<a:spcBef><a:spcPts val="${spaceBefore}"/></a:spcBef>`;
  if (spaceAfter) children += `<a:spcAft><a:spcPts val="${spaceAfter}"/></a:spcAft>`;
  if (bullet) children += '<a:buChar char="&#x2022;"/>';
  else if (numbered) children += '<a:buAutoNum type="arabicPeriod"/>';
  const pPr = (attrs.length || children) ? `<a:pPr ${attrs.join(' ')}>${children}</a:pPr>` : '';
  return `<a:p>${pPr}${runsXml}</a:p>`;
}

function blockToParagraphs(block) {
  switch (block.type) {
    case 'heading': {
      const sz = block.level <= 2 ? 2200 : 2000;
      return [pptPara(pptRun(cleanInline(block.text), { size: sz, bold: true, color: PPT_TITLE_CLR }), { spaceBefore: 400, spaceAfter: 200 })];
    }
    case 'paragraph':
      return [pptPara(pptRun(cleanInline(block.text), { size: 1600, color: PPT_BODY_CLR }), { spaceAfter: 200 })];
    case 'quote':
      return [pptPara(pptRun(cleanInline(block.text), { size: 1500, italic: true, color: PPT_QUOTE_CLR }), { marL: 228600, spaceBefore: 200, spaceAfter: 200 })];
    case 'bullet':
      return block.items.map(item =>
        pptPara(pptRun(cleanInline(item), { size: 1500, color: PPT_BODY_CLR }), { marL: 342900, indent: -228600, bullet: true, spaceAfter: 80 })
      );
    case 'numbered':
      return block.items.map(item =>
        pptPara(pptRun(cleanInline(item), { size: 1500, color: PPT_BODY_CLR }), { marL: 342900, indent: -228600, numbered: true, spaceAfter: 80 })
      );
    case 'code':
      return block.text.split('\n').map(line =>
        pptPara(pptRun(line || ' ', { size: 1200, color: PPT_CODE_CLR, font: 'Consolas' }), { spaceAfter: 0 })
      );
    default:
      return [];
  }
}

function pptTextBox(id, name, x, y, cx, cy, paragraphsXml, { anchor = 't' } = {}) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="0" tIns="0" rIns="0" bIns="0" anchor="${anchor}"/><a:lstStyle/>${paragraphsXml}</p:txBody></p:sp>`;
}

function pptRect(id, name, x, y, cx, cy, fill, { rounded = false } = {}) {
  const geom = rounded
    ? '<a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 50000"/></a:avLst></a:prstGeom>'
    : '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>';
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>${geom}<a:solidFill><a:srgbClr val="${fill}"/></a:solidFill></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
}

const PPT_SLIDE_OPEN = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">';
const PPT_SLIDE_CLOSE = '\n</p:sld>';
const PPT_SP_TREE_WHITE = '\n<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const PPT_SP_TREE_DARK = '\n<p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="111827"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>';
const PPT_SP_TREE_CLOSE = '\n</p:spTree></p:cSld>';

function buildSlideXml(slide, slideNum) {
  if (slide.kind === 'title') return buildTitleSlideXml(slide);
  if (slide.kind === 'closing') return buildClosingSlideXml(slide);
  return buildContentSlideXml(slide, slideNum);
}

function buildTitleSlideXml(slide) {
  const cy = Math.round(SLIDE_H / 2);
  const shapes = [
    pptRect(2, 'AccentBar', MARGIN, cy - 500000, 91440, 1000000, PPT_ACCENT, { rounded: true }),
    pptTextBox(3, 'Title', MARGIN + 200000, cy - 500000, SLIDE_W - 2 * MARGIN - 200000, 600000,
      pptPara(pptRun(slide.title || 'Chat Export', { size: 4400, bold: true, color: PPT_WHITE, font: 'Calibri Light' })), { anchor: 'ctr' }),
    pptTextBox(4, 'Subtitle', MARGIN + 200000, cy + 150000, SLIDE_W - 2 * MARGIN - 200000, 300000,
      pptPara(pptRun(slide.subtitle || '', { size: 1600, color: PPT_FOOTER_CLR })), { anchor: 't' }),
  ];
  return PPT_SLIDE_OPEN + PPT_SP_TREE_DARK + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
}

function buildContentSlideXml(slide, slideNum) {
  const titleY = 400000;
  const titleH = 500000;
  const accentY = titleY + titleH + 50000;
  const hasQuestion = !!slide.question;
  const bodyY = accentY + 80000 + (hasQuestion ? 580000 : 0);
  const bodyH = SLIDE_H - bodyY - 400000;

  const shapes = [
    pptRect(2, 'AccentBar', MARGIN, accentY, 457200, 22860, PPT_ACCENT),
    pptTextBox(3, 'Title', MARGIN, titleY, CONTENT_W, titleH,
      pptPara(pptRun(slide.title, { size: 2800, bold: true, color: PPT_TITLE_CLR, font: 'Calibri Light' })), { anchor: 't' }),
  ];

  let nextId = 4;
  if (hasQuestion) {
    shapes.push(pptTextBox(nextId, 'Question', MARGIN, accentY + 80000, CONTENT_W, 500000,
      pptPara(pptRun('Q: ', { size: 1500, bold: true, color: PPT_QUESTION_CLR }) + pptRun(slide.question, { size: 1500, italic: true, color: PPT_QUESTION_CLR })), { anchor: 't' }));
    nextId += 1;
  }

  if (slide.blocks && slide.blocks.length > 0) {
    const allParas = slide.blocks.flatMap(blockToParagraphs).join('');
    shapes.push(pptTextBox(nextId, 'Content', MARGIN, bodyY, CONTENT_W, bodyH, allParas, { anchor: 't' }));
  }

  shapes.push(pptTextBox(nextId + 1, 'Footer', MARGIN, SLIDE_H - 350000, CONTENT_W, 200000,
    pptPara(pptRun(`Netroot AI  |  ${slideNum}`, { size: 1000, color: PPT_FOOTER_CLR }), { align: 'r' }), { anchor: 'ctr' }));

  return PPT_SLIDE_OPEN + PPT_SP_TREE_WHITE + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
}

function buildClosingSlideXml(slide) {
  const cy = Math.round(SLIDE_H / 2);
  const shapes = [
    pptRect(2, 'AccentBar', Math.round(SLIDE_W / 2 - 45720), cy - 600000, 91440, 500000, PPT_ACCENT, { rounded: true }),
    pptTextBox(3, 'Title', MARGIN, cy - 400000, CONTENT_W, 500000,
      pptPara(pptRun(slide.title, { size: 4400, bold: true, color: PPT_WHITE, font: 'Calibri Light' }), { align: 'ctr' }), { anchor: 'ctr' }),
    pptTextBox(4, 'Subtitle', MARGIN, cy + 200000, CONTENT_W, 300000,
      pptPara(pptRun(slide.subtitle, { size: 1600, color: PPT_FOOTER_CLR }), { align: 'ctr' }), { anchor: 't' }),
  ];
  return PPT_SLIDE_OPEN + PPT_SP_TREE_DARK + shapes.join('') + PPT_SP_TREE_CLOSE + PPT_SLIDE_CLOSE;
}

function buildPptxXml(slides) {
  let slideFiles = '';
  let slideRels = '';
  let presentationSlides = '';

  slides.forEach((_, i) => {
    const id = i + 1;
    slideFiles += `
    <Override PartName="/ppt/slides/slide${id}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
    slideRels += `
    <Relationship Id="rId${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${id}.xml"/>`;
    presentationSlides += `
        <p:sldId id="${256 + i}" r:id="rId${id}"/>`;
  });

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${slideFiles}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

  const coreProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeHtml(slides[0]?.title || 'Chat Export')}</dc:title>
  <dc:creator>Netroot AI</dc:creator>
  <cp:lastModifiedBy>Netroot AI</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

  const appProps = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Netroot AI</Application>
  <Slides>${slides.length}</Slides>
</Properties>`;

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>${slideRels}
</Relationships>`;

  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" saveSubsetFonts="1">
  <p:sldMasterIdLst><p:sldMasterId id="1" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${presentationSlides}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;

  const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;

  const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;

  const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title" preserve="1">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>`;

  const themeRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;

  const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:clrScheme name="Office">
    <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
    <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
    <a:dk2><a:srgbClr val="44556A"/></a:dk2>
    <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
    <a:accent1><a:srgbClr val="3B82F6"/></a:accent1>
    <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
    <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
    <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
    <a:accent5><a:srgbClr val="5B9BD5"/></a:accent5>
    <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
    <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
    <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
  </a:clrScheme>
  <a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>
  <a:fmtScheme name="Office">
    <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
    <a:lnStyleLst><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="9525" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst>
    <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
  </a:fmtScheme>
</a:theme>`;

  const slideXmlArray = slides.map((slide, idx) => buildSlideXml(slide, idx + 1));

  const files = {
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rootRels,
    'docProps/core.xml': coreProps,
    'docProps/app.xml': appProps,
    'ppt/presentation.xml': presentation,
    'ppt/_rels/presentation.xml.rels': presentationRels,
    'ppt/slideMasters/slideMaster1.xml': slideMaster,
    'ppt/slideMasters/_rels/slideMaster1.xml.rels': slideMasterRels,
    'ppt/slideLayouts/slideLayout1.xml': slideLayout,
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels': slideLayoutRels,
    'ppt/theme/theme1.xml': theme,
    'ppt/theme/_rels/theme1.xml.rels': themeRels,
  };

  slideXmlArray.forEach((xml, i) => {
    files[`ppt/slides/slide${i + 1}.xml`] = xml;
  });

  return files;
}

// Minimal ZIP writer (STORE, no compression) for .pptx packaging
function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
function uint32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }

function buildZip(files) {
  const enc = new TextEncoder();
  const entries = Object.entries(files);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of entries) {
    const nameBytes = enc.encode(name);
    const dataBytes = enc.encode(content);
    const crc = crc32(dataBytes);

    const local = [
      uint32(0x04034b50), uint16(20), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(crc), uint32(dataBytes.length), uint32(dataBytes.length),
      uint16(nameBytes.length), uint16(0),
      nameBytes, dataBytes,
    ];
    const localBytes = concatU8(local);
    localParts.push(localBytes);

    const central = [
      uint32(0x02014b50), uint16(20), uint16(20), uint16(0), uint16(0),
      uint16(0), uint16(0), uint32(crc), uint32(dataBytes.length), uint32(dataBytes.length),
      uint16(nameBytes.length), uint16(0), uint16(0), uint16(0), uint16(0),
      uint32(0), uint32(offset),
      nameBytes,
    ];
    centralParts.push(concatU8(central));

    offset += localBytes.length;
  }

  const centralBytes = concatU8(centralParts);
  const endRecord = concatU8([
    uint32(0x06054b50), uint16(0), uint16(0),
    uint16(entries.length), uint16(entries.length),
    uint32(centralBytes.length), uint32(offset),
    uint16(0),
  ]);

  return new Blob([concatU8(localParts), centralBytes, endRecord], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}

function concatU8(arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let pos = 0;
  for (const a of arrays) { result.set(a, pos); pos += a.length; }
  return result;
}

export function downloadAsPpt(messages, title = 'Chat Export') {
  const slides = buildSlides(messages, title);
  const files = buildPptxXml(slides);
  const blob = buildZip(files);
  triggerDownload(blob, `${sanitizeFilename(title)}.pptx`);
}

// ── PDF via print window ─────────────────────────────────────────────────────

export function downloadAsPdf(messages, title = 'Chat Export') {
  const html = buildChatHtml(messages, title);
  const printDoc = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <style>
      @media print { body { margin: 0; } }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
    </style>
  </head><body>${html}
    <script>
      window.onload = function() {
        setTimeout(function() { window.print(); }, 300);
      };
    </script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow popups to download the PDF.');
    return;
  }
  w.document.open();
  w.document.write(printDoc);
  w.document.close();
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
