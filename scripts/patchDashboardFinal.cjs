const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'DashboardPage.jsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update handleAttachUpload to send JSON base64 to /api/rag/upload
const targetAttach = `        // Auto-vectorize documents (PDF, DOCX, PPTX, TXT, CSV, MD) into RAG engine
        const isDoc = /\\.(pdf|docx?|pptx?|txt|csv|md|json)$/i.test(file.name);
        if (isDoc) {
          try {
            const ragForm = new FormData();
            ragForm.append('file', file);
            ragForm.append('thread_id', activeThread?.id || 'default');
            ragForm.append('user_id', user?.id || 'default');
            fetch('/api/rag/upload', {
              method: 'POST',
              body: ragForm,
            }).catch(e => console.warn('RAG auto-index notice:', e));
          } catch (e) {
            console.warn('RAG upload prep error:', e);
          }
        }`;

const replAttach = `        // Auto-vectorize documents (PDF, DOCX, PPTX, TXT, CSV, MD) into RAG engine
        const isDoc = /\\.(pdf|docx?|pptx?|txt|csv|md|json)$/i.test(file.name);
        if (isDoc) {
          try {
            const reader = new FileReader();
            reader.onload = () => {
              fetch('/api/rag/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileName: file.name,
                  mimeType: file.type || 'text/plain',
                  fileData: reader.result,
                  thread_id: activeThread?.id || null,
                  user_id: user?.id || null,
                }),
              }).catch(e => console.warn('RAG auto-index notice:', e));
            };
            reader.readAsDataURL(file);
          } catch (e) {
            console.warn('RAG upload prep error:', e);
          }
        }`;

// 2. Add threadId in handleSend
const targetChatBody = `        body: JSON.stringify({
          prompt: content,
          attachments: attachmentsSnapshot,
          history: [...messages, userMsg],
          model,
          email: user?.email,
          userId: user?.id,
        }),`;

const replChatBody = `        body: JSON.stringify({
          prompt: content,
          threadId: thread.id,
          attachments: attachmentsSnapshot,
          history: [...messages, userMsg],
          model,
          email: user?.email,
          userId: user?.id,
        }),`;

// 3. Update citation rendering chips to handle fileName and numeric similarity
const targetCiteRender = `                                      <File className="w-3 h-3 text-blue-400 shrink-0" />
                                      <span className="truncate max-w-[200px]">{cite.docName}</span>
                                      {cite.similarity && (
                                        <span className={\`text-[10px] px-1.5 py-0.2 rounded-full \${
                                          darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700 font-bold'
                                        }\`}>
                                          {cite.similarity}
                                        </span>
                                      )}`;

const replCiteRender = `                                      <File className="w-3 h-3 text-blue-400 shrink-0" />
                                      <span className="truncate max-w-[200px]">{cite.fileName || cite.docName}</span>
                                      {cite.similarity && (
                                        <span className={\`text-[10px] px-1.5 py-0.2 rounded-full font-bold \${
                                          darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                                        }\`}>
                                          {typeof cite.similarity === 'number' ? \`\${cite.similarity}%\` : cite.similarity}
                                        </span>
                                      )}`;

if (!content.includes(targetAttach)) {
  console.error('Target attach not found');
} else {
  content = content.replace(targetAttach, replAttach);
  console.log('Attach replaced successfully');
}

if (!content.includes(targetChatBody)) {
  console.error('Target chat body not found');
} else {
  content = content.replace(targetChatBody, replChatBody);
  console.log('Chat body replaced successfully');
}

if (!content.includes(targetCiteRender)) {
  console.error('Target cite render not found');
} else {
  content = content.replace(targetCiteRender, replCiteRender);
  console.log('Cite render replaced successfully');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('patchDashboardFinal completed!');

