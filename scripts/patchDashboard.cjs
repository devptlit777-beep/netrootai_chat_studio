const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'DashboardPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update loadThreads to filter out empty/ghost threads
const targetLoadThreads = `  async function loadThreads() {
    const { data } = await supabase
      .from("threads")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!data) return;

    setThreads(data);

    if (threadId && !activeThread) {
      const selected = data.find(t => t.id === threadId);
      if (selected) {
        setActiveThread(selected);
      }
    }
  }`;

const replLoadThreads = `  async function loadThreads() {
    try {
      const { data } = await supabase
        .from("threads")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!data) return;

      const validThreads = data.filter(t => t.title && t.title.trim().length > 0);
      setThreads(validThreads);

      if (threadId && !activeThread) {
        const selected = validThreads.find(t => t.id === threadId);
        if (selected) {
          setActiveThread(selected);
        }
      }
    } catch (err) {
      console.warn("loadThreads error:", err);
    }
  }`;

// 2. Add RAG upload in handleAttachUpload
const targetAttach = `      if (inserted) setAttachedFiles(prev => [...prev, inserted]);
    }

    setUploadingAttach(false);`;

const replAttach = `      if (inserted) {
        setAttachedFiles(prev => [...prev, inserted]);

        // Auto-vectorize documents (PDF, DOCX, PPTX, TXT, CSV, MD) into RAG engine
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
        }
      }
    }

    setUploadingAttach(false);`;

// 3. Add renameThread & togglePinThread after deleteThread
const targetDeleteThread = `  async function deleteThread(id, e) {
    e.stopPropagation();
    await supabase.from('threads').delete().eq('id', id);
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThread?.id === id) newThread();
  }`;

const replDeleteThread = `  async function deleteThread(id, e) {
    e.stopPropagation();
    await supabase.from('threads').delete().eq('id', id);
    setThreads(prev => prev.filter(t => t.id !== id));
    if (activeThread?.id === id) newThread();
  }

  async function renameThread(id, newTitle) {
    if (!newTitle || !newTitle.trim()) return;
    const cleanTitle = newTitle.trim();
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, title: cleanTitle } : t)));
    if (activeThread?.id === id) {
      setActiveThread(prev => (prev ? { ...prev, title: cleanTitle } : prev));
    }
    try {
      await supabase.from('threads').update({ title: cleanTitle, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {
      console.warn('renameThread error:', e);
    }
  }

  async function togglePinThread(id, currentPinned) {
    const isPinned = !currentPinned;
    setThreads(prev => prev.map(t => (t.id === id ? { ...t, is_pinned: isPinned } : t)));
    if (activeThread?.id === id) {
      setActiveThread(prev => (prev ? { ...prev, is_pinned: isPinned } : prev));
    }
    try {
      await supabase.from('threads').update({ is_pinned: isPinned }).eq('id', id);
    } catch (e) {
      console.warn('togglePinThread error (run migration if is_pinned missing):', e);
    }
  }`;

// 4. Update parseMessageContent to extract __CITATIONS__
const targetParseMsg = `    let pptUpgradeNotice = null;
    const pptUpgradeMatch = text.match(/__PPT_PRO_UPGRADE__([\\s\\S]*?)__PPT_PRO_UPGRADE__/);
    if (pptUpgradeMatch) {
      try {
        pptUpgradeNotice = JSON.parse(pptUpgradeMatch[1]);
      } catch {}
      text = text.replace(/__PPT_PRO_UPGRADE__[\\s\\S]*?__PPT_PRO_UPGRADE__/, '').trim();
    }

    return { images, pptDeck, pptUpgradeNotice, text };
  }`;

const replParseMsg = `    let pptUpgradeNotice = null;
    const pptUpgradeMatch = text.match(/__PPT_PRO_UPGRADE__([\\s\\S]*?)__PPT_PRO_UPGRADE__/);
    if (pptUpgradeMatch) {
      try {
        pptUpgradeNotice = JSON.parse(pptUpgradeMatch[1]);
      } catch {}
      text = text.replace(/__PPT_PRO_UPGRADE__[\\s\\S]*?__PPT_PRO_UPGRADE__/, '').trim();
    }

    let citations = [];
    const citationsMatch = text.match(/__CITATIONS__([\\s\\S]*?)__CITATIONS__/);
    if (citationsMatch) {
      try {
        citations = JSON.parse(citationsMatch[1]);
      } catch {}
      text = text.replace(/__CITATIONS__[\\s\\S]*?__CITATIONS__/, '').trim();
    }

    return { images, pptDeck, pptUpgradeNotice, citations, text };
  }`;

// 5. Update messages.map to receive citations
const targetMsgMap = `                {messages.map((msg, msgIndex) => {
                  const { images, pptDeck, pptUpgradeNotice, text } = parseMessageContent(msg.content);`;

const replMsgMap = `                {messages.map((msg, msgIndex) => {
                  const { images, pptDeck, pptUpgradeNotice, citations, text } = parseMessageContent(msg.content);`;

// 6. Citations display before Action Toolbar
const targetActionToolbar = `                            {/* ChatGPT / Claude Style Action Toolbar */}
                            {text.trim().length > 0 && (`;

const replActionToolbar = `                            {/* Document Vectorization & RAG Citations */}
                            {citations && citations.length > 0 && (
                              <div className={\`mt-3 p-3 rounded-xl border text-xs \${darkMode ? 'bg-blue-950/20 border-blue-800/40 text-blue-200' : 'bg-blue-50/70 border-blue-200 text-blue-900'}\`}>
                                <div className="flex items-center gap-1.5 font-semibold mb-2">
                                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Sources & Citations ({citations.length}):</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {citations.map((cite, cIdx) => (
                                    <div
                                      key={cIdx}
                                      className={\`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all \${
                                        darkMode
                                          ? 'bg-[#131b2e] border-blue-500/30 text-blue-300 hover:border-blue-400'
                                          : 'bg-white border-blue-200 text-blue-800 shadow-sm'
                                      }\`}
                                      title={cite.docName}
                                    >
                                      <File className="w-3 h-3 text-blue-400 shrink-0" />
                                      <span className="truncate max-w-[200px]">{cite.docName}</span>
                                      {cite.similarity && (
                                        <span className={\`text-[10px] px-1.5 py-0.2 rounded-full \${
                                          darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700 font-bold'
                                        }\`}>
                                          {cite.similarity}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ChatGPT / Claude Style Action Toolbar */}
                            {text.trim().length > 0 && (`;

// 7. Replace old <aside> with <ChatHistorySidebar>
const targetAside = `        {showThreadPanel && (
          <aside className={\`w-64 border-r flex flex-col overflow-hidden shrink-0 \${darkMode ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'}\`}>
            <div className={\`flex items-center justify-between px-4 py-3 border-b \${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}\`}>
              <span className={\`text-xs font-semibold uppercase tracking-wider \${darkMode ? 'text-gray-400' : 'text-gray-500'}\`}>
                Threads
              </span>
              <button onClick={() => setShowThreadPanel(false)}>
                <X className={\`w-4 h-4 \${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}\`} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <p className={\`text-xs text-center mt-8 px-4 \${darkMode ? 'text-gray-600' : 'text-gray-400'}\`}>
                  No threads yet
                </p>
              ) : (
                filteredThreads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveThread(thread)}
                    className={\`w-full text-left px-4 py-3 transition-colors group flex items-center justify-between \${activeThread?.id === thread.id
                      ? darkMode
                        ? 'bg-white/8 border-r-2 border-[#3b82f6]'
                        : 'bg-blue-50 border-r-2 border-blue-500'
                      : darkMode
                        ? 'hover:bg-white/5'
                        : 'hover:bg-gray-50'
                      }\`}
                  >
                    <span className={\`text-sm truncate flex-1 \${darkMode ? 'text-gray-300' : 'text-gray-700'}\`}>
                      {thread.title}
                    </span>
                    <button
                      onClick={e => deleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 ml-2 shrink-0"
                    >
                      <X className={\`w-3.5 h-3.5 \${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}\`} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </aside>
        )}`;

const replAside = `        <ChatHistorySidebar
          threads={threads}
          activeThread={activeThread}
          onSelectThread={(t) => setActiveThread(t)}
          onNewChat={newThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
          onTogglePin={togglePinThread}
          isOpen={showThreadPanel}
          onToggleOpen={() => setShowThreadPanel(!showThreadPanel)}
          darkMode={darkMode}
        />`;

// Helper to normalize CRLF
function normalize(str) {
  return str.replace(/\r\n/g, '\n');
}

let normContent = normalize(content);

function replaceOnce(name, target, repl) {
  const normT = normalize(target);
  const normR = normalize(repl);
  if (!normContent.includes(normT)) {
    console.error(`FAILED to find: ${name}`);
    return false;
  }
  normContent = normContent.replace(normT, normR);
  console.log(`Successfully replaced: ${name}`);
  return true;
}

const ok1 = replaceOnce('loadThreads', targetLoadThreads, replLoadThreads);
const ok2 = replaceOnce('attachUpload', targetAttach, replAttach);
const ok3 = replaceOnce('deleteThread', targetDeleteThread, replDeleteThread);
const ok4 = replaceOnce('parseMessageContent', targetParseMsg, replParseMsg);
const ok5 = replaceOnce('msgMap', targetMsgMap, replMsgMap);
const ok6 = replaceOnce('actionToolbar', targetActionToolbar, replActionToolbar);
const ok7 = replaceOnce('aside', targetAside, replAside);

if (ok1 && ok2 && ok3 && ok4 && ok5 && ok6 && ok7) {
  fs.writeFileSync(filePath, normContent, 'utf8');
  console.log('ALL PATCHES APPLIED CLEANLY TO DashboardPage.jsx!');
} else {
  console.error('SOME PATCHES FAILED, CHECK LOGS!');
}

