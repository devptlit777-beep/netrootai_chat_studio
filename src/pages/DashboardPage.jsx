// import React, { useState, useEffect, useRef } from 'react';
// import { useParams, useNavigate } from "react-router-dom";
// import { Navigate } from 'react-router-dom';
// import {
//   Search,
//   Plus,
//   Moon,
//   Sun,
//   Paperclip,
//   ArrowUp,
//   ChevronDown,
//   X,
//   Loader2,
//   Bot,
//   Cpu,
//   ArrowUpRight,
//   File,
//   Image,
//   FileText,
//   Mic,
//   MicOff,
//   Lock,
//   Zap,
// } from 'lucide-react';
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabase';
// import { ensureCorePlugins } from '../lib/corePlugins';
// import { usePlan } from '../contexts/PlanContext';
// import API_BASE from '../lib/api';
// import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, normalizePlan } from '../lib/planLimits';

// const PLUGIN_ICONS = {
//   'web-search': '🌐', 'calculator': '🧮', 'pdf-search': '📄', 'arxiv': '📚', 'code-runner': '⚡',
//   'github': '🐙', 'notion': '📝', 'jira': '🎯', 'slack': '💬',
//   'postgres': '🐘', 'csv-analyzer': '📊', 'linear': '🔷',
// };

// const EXAMPLES = [
//   { title: 'Explore local attractions', prompt: 'What places do you want to visit?' },
//   { title: 'Describe health symptoms', prompt: 'What symptoms are you experiencing?' },
//   { title: 'Identify tough topics', prompt: 'What topic do you find difficult?' },
//   { title: 'Suggest design improvements', prompt: 'What changes would improve this design?' },
//   { title: 'Learn about KPI & Matrix, Trace', prompt: 'Explain KPI & Matrix Trace in Netroot AI and how to use them.' },
//   { title: 'Learn about log management', prompt: 'How does log management work in Netroot AI?' },
// ];
// const ALL_MODELS = [
//   { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', tag: '🥈 Fast' },
//   { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', tag: '🥉 Fast' },
//   { id: 'qwen/qwen3.6-27b', label: 'Qwen3.6 27B Vision', tag: '👁️ Vision' },
//   { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', tag: '⭐ Versatile' },
//   { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', tag: '⚡ Strong' },
// ];

// function getVisibleModels(plan, planLimits = DEFAULT_PLAN_LIMITS) {
//   const normalizedPlan = normalizePlan(plan);
//   const selected = planLimits[normalizedPlan] || planLimits.free;
//   const allowedModels = selected?.allowedModels || DEFAULT_PLAN_LIMITS[normalizedPlan]?.allowedModels || DEFAULT_PLAN_LIMITS.free.allowedModels;
//   return ALL_MODELS.filter(m => allowedModels.includes(m.id));
// }

// function getGreeting() {
//   const h = new Date().getHours();
//   if (h < 12) return 'Good Morning';
//   if (h < 18) return 'Good Afternoon';
//   return 'Good Evening';
// }

// function getFallbackAvatar(email) {
//   const seed = email || 'default';
//   return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=3b82f6,06b6d4`;
// }

// export default function DashboardPage({ darkMode, onToggleDark, onNavigate }) {
//   const { plan } = usePlan();
//   const { profile, user } = useAuth();
//   const [threads, setThreads] = useState([]);
//   const [activeThread, setActiveThread] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [enabledPlugins, setEnabledPlugins] = useState([]);
//   const [input, setInput] = useState('');
//   const [model, setModel] = useState('openai/gpt-oss-20b');
//   const [showModelMenu, setShowModelMenu] = useState(false);
//   const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
//   const visibleModels = getVisibleModels(plan, planLimits);
//   const visibleModelIds = new Set(visibleModels.map(m => m.id));
//   const [showThreadPanel, setShowThreadPanel] = useState(true);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sending, setSending] = useState(false);
//   const [showSearch, setShowSearch] = useState(false);
//   const [attachedFiles, setAttachedFiles] = useState([]);
//   const [uploadingAttach, setUploadingAttach] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [voiceError, setVoiceError] = useState('');
//   const { threadId } = useParams();
//   const navigate = useNavigate();
//   const messagesEndRef = useRef(null);
//   const textareaRef = useRef(null);
//   const attachInputRef = useRef(null);
//   const recognitionRef = useRef(null);
//   const voiceTranscriptRef = useRef('');
//   const sendingRef = useRef(false);

//   // ── Model limit check ──────────────────────────────────────────────────────
//   const MODEL_DAILY_LIMITS = {
//     'openai/gpt-oss-120b': 200000,
//     'openai/gpt-oss-20b': 200000,
//     'llama-3.1-8b-instant': 500000,
//     'qwen/qwen3.6-27b': 200000,
//     'llama-3.3-70b-versatile': 100000,
//   };
//   const [perModelTokens, setPerModelTokens] = useState({});
//   useEffect(() => {
//     let cancelled = false;
//     fetchPlanLimits().then((limits) => {
//       if (!cancelled) setPlanLimits(limits);
//     }).catch(() => { });
//     return () => { cancelled = true; };
//   }, []);
//   useEffect(() => {
//     fetch(`${API_BASE}/api/usage?period=1d`)
//       .then(r => r.json())
//       .then(d => setPerModelTokens(d.perModelTokens || {}))
//       .catch(() => { });
//   }, [sending]);
//   const activePlanLimits = planLimits[normalizePlan(plan)] || planLimits.free;
//   const planTokenLimit = activePlanLimits.dailyTokenLimit;
//   const modelLimit = planTokenLimit;
//   const modelUsed = perModelTokens[model] || 0;
//   const isModelBlocked = modelLimit != null && modelUsed >= modelLimit;

//   useEffect(() => {
//     if (!visibleModelIds.has(model) && visibleModels.length > 0) {
//       setModel(visibleModels[0].id);
//     }
//   }, [plan, visibleModels]);
//   // ───────────────────────────────────────────────────────────────────────────
//   const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
//   const freeModelsCount = planLimits.free?.allowedModels?.length || DEFAULT_PLAN_LIMITS.free.allowedModels.length;
//   const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
//   const proModelsCount = planLimits.pro?.allowedModels?.length || DEFAULT_PLAN_LIMITS.pro.allowedModels.length;
//   const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
//   const avatarUrl = profile?.avatar_url
//     ? `${profile.avatar_url}?v=${profile.updated_at}`
//     : getFallbackAvatar(user?.email);

//   useEffect(() => {
//     loadThreads();
//     loadEnabledPlugins();

//     // Re-fetch plugins whenever the window regains focus (user returns from Plugins page)
//     const onFocus = () => loadEnabledPlugins();
//     window.addEventListener('focus', onFocus);

//     // Realtime subscription — updates instantly when plugins are toggled on Plugins page
//     const channel = supabase
//       .channel('user_plugins_changes')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'user_plugins' }, () => {
//         loadEnabledPlugins();
//       })
//       .subscribe();

//     return () => {
//       window.removeEventListener('focus', onFocus);
//       supabase.removeChannel(channel);
//     };
//   }, []);

//   async function loadEnabledPlugins() {
//     try {
//       if (!user) return;
//       await ensureCorePlugins(user.id);
//       const { data, error } = await supabase
//         .from("user_plugins")
//         .select("plugin_id, config")
//         .eq("user_id", user.id)
//         .eq("enabled", true);

//       if (error) {
//         console.log(error);
//         return;
//       }

//       setEnabledPlugins(data || []);
//     } catch (err) {
//       console.log(err);
//     }
//   }
//   useEffect(() => {
//     loadThreads();

//     if (typeof loadEnabledPlugins === "function") {
//       loadEnabledPlugins().catch(console.error);
//     }
//   }, []);
//   useEffect(() => {
//     if (!threadId) return;

//     loadMessages(threadId);
//   }, [threadId]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   useEffect(() => {
//     sendingRef.current = sending;
//   }, [sending]);

//   useEffect(() => {
//     if (typeof window === 'undefined') return undefined;

//     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (!SpeechRecognition) {
//       setVoiceError('Voice input is not supported in this browser.');
//       return undefined;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.continuous = false;
//     recognition.interimResults = true;
//     recognition.lang = 'en-US';

//     recognition.onresult = event => {
//       const transcript = Array.from(event.results)
//         .map(result => result[0].transcript)
//         .join(' ')
//         .trim();

//       if (transcript) {
//         voiceTranscriptRef.current = transcript;
//         setInput(transcript);
//       }
//     };

//     recognition.onerror = event => {
//       setIsListening(false);
//       setVoiceError(event.error === 'not-allowed' ? 'Microphone access was denied.' : 'Voice input failed. Please try again.');
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//       const transcript = voiceTranscriptRef.current.trim();
//       voiceTranscriptRef.current = '';

//       if (transcript && !sendingRef.current) {
//         sendMessage(transcript);
//       }
//     };

//     recognitionRef.current = recognition;

//     return () => {
//       recognition.stop();
//     };
//   }, []);

//   // async function loadThreads() {
//   //   const { data } = await supabase
//   //     .from('threads')
//   //     .select('*')
//   //     .order('updated_at', { ascending: false });

//   //   if (data) setThreads(data);
//   // }
//   async function loadThreads() {
//     const { data } = await supabase
//       .from("threads")
//       .select("*")
//       .order("updated_at", { ascending: false });

//     if (!data) return;

//     setThreads(data);

//     // Open a thread only if a threadId exists in the URL
//     if (threadId && !activeThread) {
//       const selected = data.find(t => t.id === threadId);

//       if (selected) {
//         setActiveThread(selected);
//       }
//     }
//   }
//   useEffect(() => {
//     if (!threadId) {
//       setActiveThread(null);
//       setMessages([]);
//       return;
//     }

//     const selected = threads.find((t) => t.id === threadId);

//     if (selected) {
//       setActiveThread(selected);
//     }
//   }, [threadId, threads]);
//   async function loadMessages(threadId) {
//     const { data } = await supabase
//       .from('messages')
//       .select('*')
//       .eq('thread_id', threadId)
//       .order('created_at', { ascending: true });

//     if (data) setMessages(data);
//   }

//   async function createThread(firstMessage) {
//     const title = firstMessage.slice(0, 60) || "New Thread";

//     const { data, error } = await supabase
//       .from("threads")
//       .insert({
//         title,
//         model,
//         updated_at: new Date().toISOString(),
//       })
//       .select()
//       .single();

//     if (error) {
//       console.error(error);
//       return null;
//     }

//     setThreads(prev => [data, ...prev]);

//     return data;
//   }

//   async function handleAttachUpload(e) {
//     const fileList = e.target.files;
//     if (!fileList || !user) return;

//     const files = Array.from(fileList);
//     if (files.length === 0) return;

//     setUploadingAttach(true);

//     for (const file of files) {
//       // For images, read as base64 directly — no Supabase storage needed
//       if (file.type.startsWith('image/')) {
//         const base64 = await new Promise((resolve) => {
//           const reader = new FileReader();
//           reader.onload = () => resolve(reader.result); // data:image/...;base64,...
//           reader.readAsDataURL(file);
//         });
//         setAttachedFiles(prev => [...prev, {
//           id: crypto.randomUUID(),
//           name: file.name,
//           file_type: file.type,
//           size_bytes: file.size,
//           url: base64,
//           isBase64: true,
//         }]);
//         continue;
//       }

//       // Non-image files: upload to Supabase storage as before
//       const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
//       const { error: uploadError } = await supabase.storage
//         .from('attachments')
//         .upload(path, file, { cacheControl: '3600', upsert: false });
//       if (uploadError) continue;
//       const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
//       const { data: inserted } = await supabase
//         .from('attachments')
//         .insert({
//           name: file.name,
//           file_type: file.type || 'application/octet-stream',
//           size_bytes: file.size,
//           storage_path: path,
//           url: urlData.publicUrl,
//         })
//         .select()
//         .single();
//       if (inserted) setAttachedFiles(prev => [...prev, inserted]);
//     }

//     setUploadingAttach(false);
//     if (attachInputRef.current) attachInputRef.current.value = '';
//   }

//   function removeAttachedFile(id) {
//     setAttachedFiles(prev => prev.filter(a => a.id !== id));
//   }

//   async function sendMessage(contentOverride) {
//     try {
//       console.log("STEP 1");

//       const content = (contentOverride ?? input ?? "").trim();
//       const hasAttachments = attachedFiles.length > 0;

//       console.log({
//         content,
//         input,
//         contentOverride,
//         sending,
//         isModelBlocked,
//         activeThread,
//         hasAttachments,
//       });

//       if ((!content && !hasAttachments) || sending || isModelBlocked) {
//         console.log("RETURN 1");
//         return;
//       }

//       setSending(true);
//       setInput("");

//       let thread = activeThread;

//       console.log("STEP 2", thread);

//       if (!thread) {
//         console.log("Creating thread...");

//         thread = await createThread(content || "Attachment");

//         console.log("Thread created:", thread);

//         if (!thread) {
//           console.log("RETURN 2");
//           setSending(false);
//           return;
//         }

//         setActiveThread(thread);

//         navigate(`/dashboard/${thread.id}`, {
//           replace: true,
//         });
//       }

//       console.log("STEP 3");

//       const fullContent = hasAttachments
//         ? `${content}\n\n[Attached: ${attachedFiles
//           .map((a) => a.name)
//           .join(", ")}]`
//         : content;

//       const userMsg = {
//         id: crypto.randomUUID(),
//         thread_id: thread.id,
//         user_id: "",
//         role: "user",
//         content: fullContent,
//         created_at: new Date().toISOString(),
//       };

//       // Show user message immediately
//       setMessages(prev => {
//         return [...prev, userMsg];
//       });



//       await supabase.from("messages").insert({
//         thread_id: thread.id,
//         role: "user",
//         content: fullContent,
//       });

//       console.log("STEP 4");

//       const attachmentsSnapshot = [...attachedFiles];
//       setAttachedFiles([]);

//       console.log("CALLING API");

//       const response = await fetch("/api/chat", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           prompt: content,
//           attachments: attachmentsSnapshot,
//           history: [...messages, userMsg],
//           model,
//           plugins: enabledPlugins,
//           email: user?.email,
//         }),
//       });

//       console.log("API STATUS", response.status);

//       const data = await response.json();

//       console.log("API DATA", data);

//       let aiContent = data.answer || "No response from AI.";

//       if (data.imageUrl) {
//         aiContent = `__IMAGE__${data.imageUrl}`;
//       }

//       const aiMsg = {
//         id: crypto.randomUUID(),
//         thread_id: thread.id,
//         user_id: "",
//         role: "assistant",
//         content: aiContent,
//         created_at: new Date().toISOString(),
//       };

//       console.log("STEP 5 - ADD AI MESSAGE");

//       // Show AI response
//       setMessages(prev => {
//         return [...prev, aiMsg];
//       });



//       // Save AI response
//       await supabase.from("messages").insert({
//         thread_id: thread.id,
//         role: "assistant",
//         content: aiContent,
//       });
//       await loadMessages(thread.id);

//       console.log("STEP 6 - UPDATE THREAD");

//       await supabase
//         .from("threads")
//         .update({
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", thread.id);

//       await loadThreads();

//       console.log("STEP 7 - DONE");
//     } catch (err) {
//       console.error("SEND MESSAGE ERROR:", err);
//     } finally {
//       setSending(false);
//     }
//   }

//   function handleKeyDown(e) {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   }

//   function toggleVoiceInput() {
//     if (!recognitionRef.current) {
//       setVoiceError('Voice input is not supported in this browser.');
//       return;
//     }

//     if (isListening) {
//       recognitionRef.current.stop();
//       setIsListening(false);
//       return;
//     }

//     setVoiceError('');
//     voiceTranscriptRef.current = '';
//     setInput('');
//     recognitionRef.current.start();
//     setIsListening(true);
//   }

//   // function newThread() {
//   //   setActiveThread(null);
//   //   setMessages([]);
//   //   setInput('');
//   // }
//   function newThread() {
//     setActiveThread(null);
//     setMessages([]);
//     setInput("");

//     navigate("/dashboard");
//   }
//   async function deleteThread(id, e) {
//     e.stopPropagation();
//     await supabase.from('threads').delete().eq('id', id);
//     setThreads(prev => prev.filter(t => t.id !== id));
//     if (activeThread?.id === id) newThread();
//   }

//   const filteredThreads = threads.filter(t =>
//     t.title.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
//       <header className={`h-14 flex items-center justify-between px-6 border-b shrink-0 z-20 ${darkMode ? 'bg-[#0e0e0e] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
//         <div className="flex items-center gap-2">
//           {/* {activeThread && ( */}
//           {(
//             <h2 className={`text-xl font-medium truncate max-w-[300px] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//               {/* {activeThread.title} */} Netroot AI
//             </h2>
//           )}
//         </div>

//         <div className="flex items-center gap-2">
//           {showSearch ? (
//             <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-gray-50 border-gray-300'}`}>
//               <Search className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
//               <input
//                 autoFocus
//                 type="text"
//                 value={searchQuery}
//                 onChange={e => setSearchQuery(e.target.value)}
//                 placeholder="Search threads..."
//                 className={`bg-transparent text-sm outline-none w-40 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
//               />
//               <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
//                 <X className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`} />
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={() => { setShowSearch(true); setShowThreadPanel(true); }}
//               className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-all ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-gray-200' : 'bg-white border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700'}`}
//             >
//               <Search className="w-3.5 h-3.5" />
//               Search Thread
//             </button>
//           )}

//           <button
//             onClick={newThread}
//             className="flex items-center gap-1.5 bg-white text-black hover:bg-gray-100 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
//           >
//             <Plus className="w-3.5 h-3.5" />
//             New Thread
//           </button>

//           <button
//             onClick={onToggleDark}
//             className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
//           >
//             {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
//           </button>
//         </div>
//       </header>

//       <div className="flex flex-1 overflow-hidden">
//         {showThreadPanel && (
//           <aside className={`w-64 border-r flex flex-col overflow-hidden shrink-0 ${darkMode ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
//             <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
//               <span className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                 Threads
//               </span>
//               <button onClick={() => setShowThreadPanel(false)}>
//                 <X className={`w-4 h-4 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto">
//               {filteredThreads.length === 0 ? (
//                 <p className={`text-xs text-center mt-8 px-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
//                   No threads yet
//                 </p>
//               ) : (
//                 filteredThreads.map(thread => (
//                   <button
//                     key={thread.id}
//                     onClick={() => setActiveThread(thread)}
//                     className={`w-full text-left px-4 py-3 transition-colors group flex items-center justify-between ${activeThread?.id === thread.id
//                       ? darkMode
//                         ? 'bg-white/8 border-r-2 border-[#3b82f6]'
//                         : 'bg-blue-50 border-r-2 border-blue-500'
//                       : darkMode
//                         ? 'hover:bg-white/5'
//                         : 'hover:bg-gray-50'
//                       }`}
//                   >
//                     <span className={`text-sm truncate flex-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                       {thread.title}
//                     </span>
//                     <button
//                       onClick={e => deleteThread(thread.id, e)}
//                       className="opacity-0 group-hover:opacity-100 ml-2 shrink-0"
//                     >
//                       <X className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`} />
//                     </button>
//                   </button>
//                 ))
//               )}
//             </div>
//           </aside>
//         )}

//         <main className={`flex-1 flex flex-col ${activeThread ? 'overflow-hidden' : 'overflow-y-auto'}`}>
//           {activeThread ? (
//             <div className={`flex-1 overflow-y-auto px-6 py-6 space-y-6 ${darkMode ? '' : 'bg-gray-50'}`}>
//               {messages.map(msg => (
//                 <div key={msg.id} className={`flex gap-3 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//                   {msg.role === 'assistant' && (
//                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0 mt-0.5">
//                       <Bot className="w-4 h-4 text-white" />
//                     </div>
//                   )}

//                   <div className={`max-w-[72%] rounded-[24px] px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words shadow-sm ${msg.role === 'user'
//                     ? darkMode
//                       ? 'bg-blue-600 text-white border border-blue-700'
//                       : 'bg-blue-600 text-white border border-blue-600'
//                     : darkMode
//                       ? 'bg-[#111827] border border-[#27272a] text-gray-200'
//                       : 'bg-white border border-slate-200 text-slate-900'
//                     }`}>
//                     {msg.role === 'assistant' && msg.content.startsWith('__IMAGE__') ? (
//                       <div className="space-y-2">
//                         <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🎨 Generated image</p>
//                         <img
//                           src={msg.content.replace('__IMAGE__', '')}
//                           alt="Generated"
//                           className="rounded-2xl max-w-full shadow-lg"
//                           onError={e => { e.target.style.display = 'none'; }}
//                         />
//                       </div>
//                     ) : (
//                       <ReactMarkdown
//                         remarkPlugins={[remarkGfm]}
//                         components={{
//                           h1: ({ children }) => (
//                             <h1 className={`text-4xl font-bold mt-8 mb-4 border-b pb-2 ${darkMode ? 'text-white border-gray-800' : 'text-gray-900 border-gray-200'}`}>{children}</h1>
//                           ),
//                           h2: ({ children }) => (
//                             <h2 className={`text-3xl font-semibold mt-7 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h2>
//                           ),
//                           h3: ({ children }) => (
//                             <h3 className={`text-2xl font-semibold mt-6 mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h3>
//                           ),
//                           h4: ({ children }) => (
//                             <h4 className={`text-xl font-semibold mt-5 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h4>
//                           ),
//                           p: ({ children }) => (
//                             <p className={`leading-8 mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</p>
//                           ),
//                           strong: ({ children }) => (
//                             <strong className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</strong>
//                           ),
//                           em: ({ children }) => (
//                             <em className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</em>
//                           ),
//                           ul: ({ children }) => (
//                             <ul className={`list-disc pl-6 my-4 space-y-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</ul>
//                           ),
//                           ol: ({ children }) => (
//                             <ol className={`list-decimal pl-6 my-4 space-y-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</ol>
//                           ),
//                           li: ({ children }) => (
//                             <li className="leading-7">{children}</li>
//                           ),
//                           blockquote: ({ children }) => (
//                             <blockquote className={`border-l-4 border-green-500 p-4 rounded-r-lg italic my-5 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>{children}</blockquote>
//                           ),
//                           hr: () => (
//                             <hr className={`my-8 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
//                           ),
//                           a: ({ href, children }) => (
//                             <a
//                               href={href}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} underline`}
//                             >
//                               {children}
//                             </a>
//                           ),
//                           table: ({ children }) => (
//                             <div className="overflow-x-auto my-6">
//                               <table className={`w-full border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>{children}</table>
//                             </div>
//                           ),
//                           thead: ({ children }) => (
//                             <thead className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>{children}</thead>
//                           ),
//                           tbody: ({ children }) => (
//                             <tbody className={`${darkMode ? 'bg-gray-900' : 'bg-white'}`}>{children}</tbody>
//                           ),
//                           tr: ({ children }) => (
//                             <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>{children}</tr>
//                           ),
//                           th: ({ children }) => (
//                             <th className={`px-4 py-3 text-left font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</th>
//                           ),
//                           td: ({ children }) => (
//                             <td className={`px-4 py-3 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</td>
//                           ),
//                           img: ({ src, alt }) => (
//                             <img src={src} alt={alt} className="rounded-xl my-5 max-w-full shadow-lg" />
//                           ),
//                           code({ inline, children }) {
//                             if (inline) {
//                               return (
//                                 <code className={`${darkMode ? 'bg-gray-800 text-green-400' : 'bg-gray-100 text-green-600'} px-2 py-1 rounded text-sm`}>
//                                   {children}
//                                 </code>
//                               );
//                             }

//                             return (
//                               <pre className={`${darkMode ? 'bg-[#0d1117] text-green-400' : 'bg-gray-100 text-green-700'} rounded-xl p-5 overflow-x-auto my-5`}><code>{children}</code></pre>
//                             );
//                           },
//                         }}
//                       >
//                         {msg.content}
//                       </ReactMarkdown>
//                     )}
//                   </div>

//                   {msg.role === 'user' && (
//                     <img
//                       src={avatarUrl}
//                       alt="avatar"
//                       className={`w-8 h-8 rounded-full object-cover border shrink-0 mt-0.5 ${darkMode ? 'border-[#333]' : 'border-gray-300'}`}
//                     />
//                   )}
//                 </div>
//               ))}

//               {sending && (
//                 <div className="flex gap-3 justify-start">
//                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
//                     <Bot className="w-4 h-4 text-white" />
//                   </div>
//                   <div className={`rounded-2xl px-4 py-3 ${darkMode ? 'bg-[#161616] border border-[#222]' : 'bg-white border border-gray-200 shadow-sm'}`}>
//                     <Loader2 className={`w-4 h-4 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
//                   </div>
//                 </div>
//               )}

//               <div ref={messagesEndRef} />
//             </div>
//           ) : (
//             <div className={`flex-1 flex flex-col items-center justify-end pb-4 px-6 ${darkMode ? '' : 'bg-gray-50'}`}>
//               <img key={avatarUrl} src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 mb-5" />
//               <h1 className={`text-3xl font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                 {getGreeting()}, {firstName}
//               </h1>
//               <p className="text-xl font-semibold">
//                 What's on <span className="text-[#3b82f6]">your mind?</span>
//               </p>
//             </div>
//           )}

//           <div className="px-6 pb-6 shrink-0">
//             <div className="max-w-3xl mx-auto">
//               <div className={`relative border rounded-2xl transition-colors ${darkMode ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-white border-gray-300 shadow-sm'} ${!isModelBlocked ? darkMode ? 'focus-within:border-[#3a3a3a]' : 'focus-within:border-gray-400' : ''}`}>
//                 {isModelBlocked ? (
//                   <div className={`flex flex-col items-center justify-center gap-4 py-7 px-6 rounded-2xl ${darkMode ? 'bg-[#161616]' : 'bg-white'}`}>
//                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${darkMode ? 'bg-red-500/10 border-red-500/25' : 'bg-red-50 border-red-200'}`}>
//                       <Lock className="w-5 h-5 text-red-400" />
//                     </div>
//                     <div className="text-center">
//                       <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                         {visibleModels.find(m2 => m2.id === model)?.label || model} is blocked
//                       </p>
//                       <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
//                         {plan === 'pro' ? `Pro includes ${proLimit.toLocaleString()} daily tokens and ${proModelsCount} model${proModelsCount === 1 ? '' : 's'}.` : `Free includes ${freeLimit.toLocaleString()} daily tokens and ${freeModelsCount} model${freeModelsCount === 1 ? '' : 's'}. Upgrade to Pro for ${proLimit.toLocaleString()} daily tokens and ${proModelsCount} model${proModelsCount === 1 ? '' : 's'}.`}
//                       </p>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <button
//                         // onClick={() => navigate('/project-settings?tab=billing&upgrade=pro')}
//                         onClick={() => navigate('/project-settings?tab=billing')}
//                         className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all"
//                       >
//                         <Zap className="w-3.5 h-3.5" />
//                         Upgrade Plan
//                       </button>
//                       <button
//                         onClick={() => setModel(visibleModels.find(m2 => m2.id !== model)?.id || model)}
//                         className={`text-xs font-medium px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
//                       >
//                         Switch model
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <textarea
//                     ref={textareaRef}
//                     value={input}
//                     onChange={e => setInput(e.target.value)}
//                     onKeyDown={handleKeyDown}
//                     placeholder="Ask AI a question..."
//                     rows={3}
//                     className={`w-full bg-transparent px-5 pt-4 pb-2 outline-none resize-none text-sm leading-relaxed ${darkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
//                   />
//                 )}

//                 {!isModelBlocked && attachedFiles.length > 0 && (
//                   <div className="flex flex-wrap gap-2 px-5 pb-2 pt-1">
//                     {attachedFiles.map(att => (
//                       <div
//                         key={att.id}
//                         className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border ${darkMode ? 'bg-[#1a1a2a] border-[#2a2a3a] text-gray-300' : 'bg-blue-50 border-blue-200 text-gray-700'}`}
//                       >
//                         {att.file_type.startsWith('image/') ? (
//                           <Image className="w-3.5 h-3.5" />
//                         ) : att.file_type.startsWith('text/') ? (
//                           <FileText className="w-3.5 h-3.5" />
//                         ) : (
//                           <File className="w-3.5 h-3.5" />
//                         )}

//                         <span className="truncate max-w-[120px]">{att.name}</span>

//                         <button
//                           onClick={() => removeAttachedFile(att.id)}
//                           className="ml-0.5 hover:text-red-400 transition-colors"
//                         >
//                           <X className="w-3 h-3" />
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {!isModelBlocked && (
//                   <div className="flex items-center justify-between px-4 pb-3 pt-1">
//                     <div className="flex items-center gap-3">
//                       <input
//                         ref={attachInputRef}
//                         type="file"
//                         multiple
//                         className="hidden"
//                         onChange={handleAttachUpload}
//                       />

//                       <button
//                         onClick={() => attachInputRef.current?.click()}
//                         disabled={uploadingAttach}
//                         className={`flex items-center gap-1.5 transition-colors text-sm border rounded-lg px-3 py-1.5 ${darkMode ? 'text-gray-500 hover:text-gray-300 border-[#2a2a2a] hover:border-[#3a3a3a]' : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-400'}`}
//                       >
//                         {uploadingAttach ? (
//                           <Loader2 className="w-3.5 h-3.5 animate-spin" />
//                         ) : (
//                           <Paperclip className="w-3.5 h-3.5" />
//                         )}
//                         {uploadingAttach ? 'Uploading...' : 'Attach'}
//                       </button>

//                       {enabledPlugins.length > 0 && (
//                         <div className="flex items-center gap-1.5">
//                           {enabledPlugins.slice(0, 3).map(p => (
//                             <span key={p.plugin_id} title={p.plugin_id}
//                               className={`text-xs px-2 py-1 rounded-lg border font-medium ${darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
//                               {PLUGIN_ICONS[p.plugin_id] || '🔌'}
//                             </span>
//                           ))}
//                           {/* {enabledPlugins.length > 3 && (
//                             <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
//                               +{enabledPlugins.length - 3}
//                             </span>
//                           )} */}
//                         </div>
//                       )}



//                       <div className="relative">
//                         <button
//                           onClick={() => setShowModelMenu(v => !v)}
//                           className={`flex items-center gap-1.5 transition-colors text-sm border rounded-lg px-3 py-1.5 ${darkMode ? 'text-gray-400 hover:text-gray-200 border-[#2a2a2a] hover:border-[#3a3a3a]' : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-400'}`}
//                         >
//                           <Cpu className="w-3.5 h-3.5" />
//                           {visibleModels.find(m => m.id === model)?.label || model}
//                           <ChevronDown className="w-3.5 h-3.5" />
//                         </button>

//                         {showModelMenu && (
//                           <div className={`absolute bottom-full mb-2 left-0 border rounded-xl py-1.5 w-64 shadow-2xl z-50 max-h-80 overflow-y-auto ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
//                             <p className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
//                               Select model
//                             </p>

//                             {visibleModels.map(m => (
//                               <button
//                                 key={m.id}
//                                 onClick={() => {
//                                   setModel(m.id);
//                                   setShowModelMenu(false);
//                                 }}
//                                 className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors ${model === m.id
//                                   ? darkMode ? 'bg-blue-500/10 text-white' : 'bg-blue-50 text-gray-900'
//                                   : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
//                                   }`}
//                               >
//                                 <div className="flex items-center gap-2.5">
//                                   <Cpu className={`w-3.5 h-3.5 shrink-0 ${model === m.id ? 'text-blue-400' : darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
//                                   <span className="text-sm font-medium">{m.label}</span>
//                                 </div>

//                                 <span className={`text-xs shrink-0 rounded-full px-2 py-0.5 ${model === m.id
//                                   ? 'bg-blue-500/20 text-blue-400'
//                                   : darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-500'
//                                   }`}>
//                                   {m.tag}
//                                 </span>
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={toggleVoiceInput}
//                         disabled={sending}
//                         className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 text-white scale-110' : darkMode ? 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
//                         title={isListening ? 'Stop listening' : 'Speak to send'}
//                       >
//                         {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
//                       </button>

//                       <button
//                         onClick={() => sendMessage()}
//                         disabled={(!input.trim() && attachedFiles.length === 0) || sending}
//                         className="w-9 h-9 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
//                       >
//                         <ArrowUp className="w-4 h-4 text-black" />
//                       </button>
//                     </div>
//                   </div>
//                 )}

//                 {!isModelBlocked && isListening && (
//                   <p className={`mt-2 px-3 py-2 text-xs rounded-lg font-medium inline-block ${darkMode ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
//                     🎤 Listening… speak now
//                   </p>
//                 )}

//                 {!isModelBlocked && voiceError && (
//                   <p className={`mt-2 px-3 py-2 text-xs rounded-lg font-medium inline-block ${darkMode ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
//                     ⚠️ {voiceError}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {!activeThread && (
//               <div className="mt-6">
//                 <p className={`text-center text-xs font-semibold uppercase tracking-[0.18em] mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
//                   Get started with an example below
//                 </p>

//                 <div className="grid grid-cols-2 gap-3">
//                   {EXAMPLES.map(ex => (
//                     <button
//                       key={ex.title}
//                       onClick={() => {
//                         setInput(ex.prompt);
//                         textareaRef.current?.focus();
//                       }}
//                       className={`relative text-left rounded-2xl p-5 pr-14 transition-all group border ${darkMode
//                         ? 'bg-[#141414] border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]'
//                         : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm'
//                         }`}
//                     >
//                       <span className={`text-sm font-semibold leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
//                         {ex.title}
//                       </span>

//                       <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${darkMode
//                         ? 'bg-[#252525] group-hover:bg-[#333] text-gray-400 group-hover:text-white'
//                         : 'bg-gray-100 group-hover:bg-gray-200 text-gray-500 group-hover:text-gray-700'
//                         }`}>
//                         <ArrowUpRight className="w-4 h-4" />
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Paperclip,
  ArrowUp,
  Square,
  ChevronDown,
  X,
  Loader2,
  Bot,
  Cpu,
  ArrowUpRight,
  File,
  Image,
  FileText,
  Mic,
  MicOff,
  Lock,
  Zap,
  Download,
  Copy,
  FileType2,
  Check,
  Presentation,
  RotateCcw,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Sparkles,
  CreditCard,
} from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ensureCorePlugins } from '../lib/corePlugins';
import { usePlan } from '../contexts/PlanContext';
import API_BASE from '../lib/api';
import { DEFAULT_PLAN_LIMITS, fetchPlanLimits, normalizePlan } from '../lib/planLimits';
import { copyChatContext, downloadAsWord, downloadAsPdf, downloadAsPpt } from '../lib/chatExport';
import PptChatDeckCard from '../components/ppt/PptChatDeckCard';
import { getActiveDeckStorageKey, getSavedSlidesStorageKey } from '../components/ppt/pptConstants';
import { useTranslation } from 'react-i18next';
import ChatHistorySidebar from '../components/chat/ChatHistorySidebar';
import WalletTopUpModal from '../components/common/WalletTopUpModal';

const PLUGIN_ICONS = {
  'web-search': '🌐', 'calculator': '🧮', 'pdf-search': '📄', 'arxiv': '📚', 'code-runner': '⚡',
  'github': '🐙', 'notion': '📝', 'jira': '🎯', 'slack': '💬',
  'postgres': '🐘', 'csv-analyzer': '📊', 'linear': '🔷', 'json-transformer': '🔄',
};

const EXAMPLES = [
  { title: 'Explore local attractions', prompt: 'What places do you want to visit?' },
  { title: 'Describe health symptoms', prompt: 'What symptoms are you experiencing?' },
  { title: 'Identify tough topics', prompt: 'What topic do you find difficult?' },
  { title: 'Suggest design improvements', prompt: 'What changes would improve this design?' },
  {
    title: "Learn about analytics",
    prompt: "Explain the analytics features in Netroot AI and how to use them to monitor performance."
  },
  {
    title: "Learn about ppt management",
    prompt: "How does pipeline tracking (PPT) and management work in Netroot AI?"
  }
];
const ALL_MODELS = [
  { id: 'openai/gpt-oss-20b', label: 'GPT OSS 20B', tag: '🥈 Fast' },
  { id: 'allam-2-7b', label: 'ALLaM 2 7B', tag: '🥉 Fast' },
  { id: 'qwen/qwen3.8-27b', label: 'Qwen3.8 27B Vision', tag: '👁️ Vision' },
  { id: 'groq/compound-mini', label: 'Compound Mini', tag: '🤖 Chat' },
  { id: 'openai/gpt-oss-120b', label: 'GPT OSS 120B', tag: '⚡ Strong' },
  { id: 'black-forest-labs/FLUX.1-schnell', label: 'FLUX.1 Schnell', tag: '🎨 10 images/month' },
];

function getVisibleModels(plan, planLimits = DEFAULT_PLAN_LIMITS) {
  const normalizedPlan = normalizePlan(plan);
  const selected = planLimits[normalizedPlan] || planLimits.free;
  const allowedModels = selected?.allowedModels || DEFAULT_PLAN_LIMITS[normalizedPlan]?.allowedModels || DEFAULT_PLAN_LIMITS.free.allowedModels;
  return ALL_MODELS.filter(m => allowedModels.includes(m.id));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

function getFallbackAvatar(email) {
  const seed = email || 'default';
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=3b82f6,06b6d4`;
}

function ChatCodeBlock({ language, code, darkMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`my-4 rounded-xl overflow-hidden border ${darkMode ? 'bg-[#0d1117] border-white/10' : 'bg-gray-900 border-gray-800'} shadow-md`}>
      <div className={`flex items-center justify-between px-4 py-1.5 text-xs font-mono border-b ${darkMode ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
        <span className="uppercase text-[11px] font-bold tracking-wider text-sky-400">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-[11px] hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DashboardPage({ darkMode, onToggleDark, onNavigate }) {
  const { t } = useTranslation();
  const { plan, accessExpired, lifetimePptCount = 0, walletBalance = 0, refreshWallet, refresh: refreshPlan } = usePlan();
  const isPro = plan === 'pro' || plan === 'enterprise';
  const isFreeLimitReached = !isPro && lifetimePptCount >= 2;
  const { profile, user, session } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [enabledPlugins, setEnabledPlugins] = useState([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('openai/gpt-oss-20b');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [dynamicModels, setDynamicModels] = useState([]);
  const [modelSearch, setModelSearch] = useState('');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [planLimits, setPlanLimits] = useState(DEFAULT_PLAN_LIMITS);
  const visibleModels = getVisibleModels(plan, planLimits);
  const activeModelsList = dynamicModels.length > 0 ? dynamicModels : visibleModels;
  const activeModelIds = new Set(activeModelsList.map(m => m.id));
  const [showThreadPanel, setShowThreadPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const { threadId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const chatScrollContainerRef = useRef(null);
  const lastUserMsgRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const justSentRef = useRef(false);
  const textareaRef = useRef(null);
  const attachInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceTranscriptRef = useRef('');
  const sendingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const creatingThreadRef = useRef(false);

  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSending(false);
  }

  const MODEL_DAILY_LIMITS = {
    'openai/gpt-oss-120b': 200000,
    'openai/gpt-oss-20b': 200000,
    'allam-2-7b': 500000,
    'qwen/qwen3.8-27b': 200000,
    'groq/compound-mini': 100000,
  };
  const [perModelTokens, setPerModelTokens] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetchPlanLimits().then((limits) => {
      if (!cancelled) setPlanLimits(limits);
    }).catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Fetch full dynamic model catalog from /api/models (Strictly for Chat/Text/LLM models only)
  useEffect(() => {
    let cancelled = false;
    const CORE_MODEL_IDS = ['openai/gpt-oss-20b', 'allam-2-7b', 'qwen/qwen3.8-27b', 'groq/compound-mini', 'openai/gpt-oss-120b'];
    const CORE_TAGS = {
      'openai/gpt-oss-20b': '🥈 Fast',
      'allam-2-7b': '🥉 Fast',
      'qwen/qwen3.8-27b': '👁️ Vision',
      'groq/compound-mini': '🤖 Chat',
      'openai/gpt-oss-120b': '⚡ Strong',
    };

    fetch(`${API_BASE}/api/models`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.models && Array.isArray(d.models) && d.models.length > 0) {
          const list = d.models
            .filter(m => (
              m.is_visible !== false &&
              !m.id?.includes(':batch') &&
              !m.id?.startsWith('fal-ai/') &&
              !m.id?.toLowerCase().startsWith('thinkingmachines/') &&
              !m.id?.toLowerCase().includes('inkling') &&
              m.media_category !== 'video' &&
              m.media_category !== 'audio' &&
              m.media_category !== 'image' &&
              (m.context_length > 0 || (Array.isArray(m.modalities) && m.modalities.includes('text')))
            ))
            .map(m => ({
              id: m.id,
              label: m.display_name || m.name || m.id,
              tag: CORE_TAGS[m.id] || m.custom_badge || (m.is_free ? '100% Free' : (m.min_plan === 'pro' ? 'Pro' : '')),
              provider: m.provider || (m.id.includes('/') ? m.id.split('/')[0] : 'AI'),
              is_free: Boolean(m.is_free),
              is_featured: Boolean(m.is_featured || CORE_MODEL_IDS.includes(m.id)),
            }));

          // Sort core models to the top, then featured, then alphabetical
          list.sort((a, b) => {
            const aCore = CORE_MODEL_IDS.indexOf(a.id);
            const bCore = CORE_MODEL_IDS.indexOf(b.id);
            if (aCore !== -1 && bCore !== -1) return aCore - bCore;
            if (aCore !== -1) return -1;
            if (bCore !== -1) return 1;
            if (a.is_featured && !b.is_featured) return -1;
            if (!a.is_featured && b.is_featured) return 1;
            return a.label.localeCompare(b.label);
          });

          setDynamicModels(list);
        }
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  // Sync selected model from URL query parameter (e.g. ?model=...)
  useEffect(() => {
    const qModel = searchParams.get('model');
    if (qModel) {
      setModel(qModel);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!session?.access_token) return;
    fetch(`${API_BASE}/api/my-usage?period=1d`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(r => r.json())
      .then(d => setPerModelTokens(d.perModelTokens || {}))
      .catch(() => { });
  }, [sending, session?.access_token]);

  const activePlanLimits = planLimits[normalizePlan(plan)] || planLimits.free;
  const planTokenLimit = activePlanLimits.dailyTokenLimit;
  const modelLimit = planTokenLimit;
  const modelUsed = perModelTokens[model] || 0;
  const tokensUsedToday = Object.values(perModelTokens).reduce((total, value) => total + value, 0);
  const isModelBlocked = modelLimit != null && modelUsed >= modelLimit;

  useEffect(() => {
    if (model && activeModelIds.size > 0 && !activeModelIds.has(model) && !ALL_MODELS.some(m => m.id === model)) {
      setModel(activeModelsList[0].id);
    }
  }, [activeModelsList.length]);

  const freeLimit = planLimits.free?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.free.dailyTokenLimit;
  const freeModelsCount = planLimits.free?.allowedModels?.length || DEFAULT_PLAN_LIMITS.free.allowedModels.length;
  const proLimit = planLimits.pro?.dailyTokenLimit || DEFAULT_PLAN_LIMITS.pro.dailyTokenLimit;
  const proModelsCount = planLimits.pro?.allowedModels?.length || DEFAULT_PLAN_LIMITS.pro.allowedModels.length;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';
  const avatarUrl = profile?.avatar_url
    ? `${profile.avatar_url}?v=${profile.updated_at}`
    : getFallbackAvatar(user?.email);

  useEffect(() => {
    loadThreads();
    loadEnabledPlugins();

    const onFocus = () => loadEnabledPlugins();
    window.addEventListener('focus', onFocus);

    const channel = supabase
      .channel('user_plugins_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_plugins' }, () => {
        loadEnabledPlugins();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', onFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadEnabledPlugins() {
    try {
      if (!user) return;
      await ensureCorePlugins(user.id);
      const { data, error } = await supabase
        .from("user_plugins")
        .select("plugin_id, config")
        .eq("user_id", user.id)
        .eq("enabled", true);

      if (error) {
        console.log(error);
        return;
      }

      setEnabledPlugins(data || []);
    } catch (err) {
      console.log(err);
    }
  }

  useEffect(() => {
    loadThreads();

    if (typeof loadEnabledPlugins === "function") {
      loadEnabledPlugins().catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (!threadId) return;
    if (creatingThreadRef.current) {
      creatingThreadRef.current = false;
      return;
    }
    loadMessages(threadId);
  }, [threadId]);

  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    isUserScrolledUpRef.current = distanceFromBottom > 160;
  };

  useEffect(() => {
    if (justSentRef.current) {
      justSentRef.current = false;
      setTimeout(() => {
        if (lastUserMsgRef.current) {
          lastUserMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }

    if (!isUserScrolledUpRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Voice input is not supported in this browser.');
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ')
        .trim();

      if (transcript) {
        voiceTranscriptRef.current = transcript;
        setInput(transcript);
      }
    };

    recognition.onerror = event => {
      setIsListening(false);
      setVoiceError(event.error === 'not-allowed' ? 'Microphone access was denied.' : 'Voice input failed. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
      const transcript = voiceTranscriptRef.current.trim();
      voiceTranscriptRef.current = '';

      if (transcript && !sendingRef.current) {
        sendMessage(transcript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  async function loadThreads() {
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
  }

  useEffect(() => {
    if (!threadId) {
      setActiveThread(null);
      setMessages([]);
      return;
    }

    const selected = threads.find((t) => t.id === threadId);
    if (selected) {
      setActiveThread(selected);
    }
  }, [threadId, threads]);

  async function loadMessages(threadId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);

      // Auto-rename older threads if title is generic (e.g. Hello, Hi, Hy, etc.)
      const currentThread = threads.find(t => t.id === threadId) || activeThread;
      const genericTitles = ['new thread', 'hello', 'hi', 'hey', 'hii', 'hy', 'test', 'greeting', 'attachment', 'untitled conversation'];
      const curTitleLower = (currentThread?.title || '').trim().toLowerCase();
      if (currentThread && (genericTitles.includes(curTitleLower) || curTitleLower.length <= 4)) {
        const firstUser = data.find(m => m.role === 'user');
        const firstBot = data.find(m => m.role === 'assistant');
        if (firstUser?.content && firstUser.content.trim().length > 4) {
          fetch('/api/chat/auto-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              threadId,
              prompt: firstUser.content,
              answer: firstBot?.content?.slice(0, 300) || '',
            }),
          })
            .then(r => r.json())
            .then(res => {
              if (res?.title) {
                setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title: res.title } : t));
                setActiveThread(prev => prev && prev.id === threadId ? { ...prev, title: res.title } : prev);
              }
            })
            .catch(() => {});
        }
      }
    }
  }

  async function createThread(firstMessage) {
    const title = firstMessage.slice(0, 60) || "New Thread";

    const { data, error } = await supabase
      .from("threads")
      .insert({
        title,
        model,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return null;
    }

    setThreads(prev => [data, ...prev]);
    return data;
  }

  async function handleAttachUpload(e) {
    const fileList = e.target.files;
    if (!fileList || !user) return;

    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploadingAttach(true);

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        setAttachedFiles(prev => [...prev, {
          id: crypto.randomUUID(),
          name: file.name,
          file_type: file.type,
          size_bytes: file.size,
          url: base64,
          isBase64: true,
        }]);
        continue;
      }

      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) continue;

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(path);
      const { data: inserted } = await supabase
        .from('attachments')
        .insert({
          name: file.name,
          file_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
          storage_path: path,
          url: urlData.publicUrl,
        })
        .select()
        .single();

      if (inserted) {
        setAttachedFiles(prev => [...prev, inserted]);

        // Auto-vectorize documents (PDF, DOCX, PPTX, TXT, CSV, MD) into RAG engine
        const isDoc = /\.(pdf|docx?|pptx?|txt|csv|md|json)$/i.test(file.name);
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
        }
      }
    }

    setUploadingAttach(false);
    if (attachInputRef.current) attachInputRef.current.value = '';
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    setAttachedFiles(prev => [...prev, {
      id: crypto.randomUUID(),
      name: file.name,
      file_type: file.type,
      size_bytes: file.size,
      url: base64,
      isBase64: true,
    }]);
    setModel('qwen/qwen3.8-27b');
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function removeAttachedFile(id) {
    setAttachedFiles(prev => prev.filter(a => a.id !== id));
  }

  const switchVersion = (msgIndex, newIdx) => {
    setMessages(prev => {
      const copy = [...prev];
      const target = { ...copy[msgIndex] };
      if (!target.versions || newIdx < 0 || newIdx >= target.versions.length) return prev;
      target.versionIndex = newIdx;
      target.content = target.versions[newIdx];
      copy[msgIndex] = target;
      return copy;
    });
  };

  async function executeAiStream({
    prompt,
    thread,
    history,
    attachments = [],
    aiMsgId,
    isRegeneration = false,
    priorVersions = [],
  }) {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let aiContent = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt,
          threadId: thread.id,
          thread_id: thread.id,
          attachments,
          history,
          model,
          email: user?.email,
          userId: user?.id,
          stream: true,
        }),
      });

      console.log("API STATUS", response.status);
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream") && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(":")) continue;
              if (trimmed === "data: [DONE]") continue;
              if (trimmed.startsWith("data: ")) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed.choices?.[0]?.delta?.content || parsed.delta || parsed.content || "";
                  if (delta) {
                    aiContent += delta;
                    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m));
                  }
                } catch (_) {}
              }
            }
          }
        } catch (streamErr) {
          if (streamErr.name === 'AbortError') {
            console.log('Stream aborted by user');
          } else {
            console.warn('Stream reading warning:', streamErr);
          }
        }
      } else {
        const data = await response.json().catch(() => ({}));
        aiContent = data.answer || "";
        if (!aiContent) {
          if (typeof data.error === 'string') {
            aiContent = data.error;
          } else if (data.error?.message) {
            aiContent = data.error.message;
          } else if (response.status === 403) {
            aiContent = "This feature requires a Pro subscription. Please upgrade to NetRoot AI Pro to continue.";
          } else if (response.status === 429) {
            aiContent = "You have reached your daily token limit. Upgrade to Pro or try again tomorrow.";
          } else {
            aiContent = "No response from AI.";
          }
        }
        if (data.imageUrl) {
          aiContent = `__IMAGE__${data.imageUrl}`;
        }
        if (data.pptDeck) {
          try {
            const activeKey = getActiveDeckStorageKey(user?.id);
            const savedKey = getSavedSlidesStorageKey(user?.id);
            localStorage.setItem(activeKey, JSON.stringify({
              id: data.pptDeck.deckId,
              slides: data.pptDeck.slides,
              deckTitle: data.pptDeck.title,
              currentTheme: data.pptDeck.theme || 'midnight',
              currentSeed: data.pptDeck.seed_color || '#0EA5E9',
            }));
            const saved = JSON.parse(localStorage.getItem(savedKey) || '[]');
            const idx = saved.findIndex(d => d.id === data.pptDeck.deckId);
            const item = {
              id: data.pptDeck.deckId,
              title: data.pptDeck.title,
              slides: data.pptDeck.slides,
              theme: data.pptDeck.theme || 'midnight',
              seed_color: data.pptDeck.seed_color || '#0EA5E9',
              updated_at: new Date().toISOString(),
            };
            if (idx >= 0) saved[idx] = item;
            else saved.unshift(item);
            localStorage.setItem(savedKey, JSON.stringify(saved));
          } catch (e) {
            console.warn('Could not cache ppt deck:', e);
          }
        }
        if (data.pptDeck || data.pptLocked) {
          refreshPlan?.();
        }
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: aiContent } : m));
      }

      if (aiContent && aiContent.trim()) {
        const finalVersions = isRegeneration ? [...priorVersions, aiContent] : [aiContent];
        setMessages(prev => prev.map(m => m.id === aiMsgId ? {
          ...m,
          content: aiContent,
          versions: finalVersions,
          versionIndex: finalVersions.length - 1,
        } : m));

        if (isRegeneration) {
          await supabase.from("messages").update({ content: aiContent }).eq("id", aiMsgId);
        } else {
          await supabase.from("messages").insert({
            id: aiMsgId,
            thread_id: thread.id,
            role: "assistant",
            content: aiContent,
          });
        }

        await supabase
          .from("threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", thread.id);

        await loadThreads();

        // Auto-generate a smart topic title if thread title is generic (e.g. New Thread, Hello, Hi, Hey, or matches initial prompt slice)
        const genericTitles = ['new thread', 'hello', 'hi', 'hey', 'hii', 'hy', 'test', 'greeting', 'attachment', 'untitled conversation'];
        const currentTitleLower = (thread.title || '').trim().toLowerCase();
        const isGenericTitle = !thread.title ||
          genericTitles.includes(currentTitleLower) ||
          currentTitleLower.length <= 4 ||
          thread.title === prompt.slice(0, 60);

        if (isGenericTitle && prompt && aiContent) {
          fetch('/api/chat/auto-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              threadId: thread.id,
              prompt,
              answer: aiContent.slice(0, 300),
            }),
          })
            .then(r => r.json())
            .then(data => {
              if (data?.title) {
                setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, title: data.title } : t));
                setActiveThread(prev => prev && prev.id === thread.id ? { ...prev, title: data.title } : prev);
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("STREAM ERROR:", err);
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
      abortControllerRef.current = null;
    }
  }

  async function sendMessage(contentOverride) {
    if (sendingRef.current) return;

    try {
      const content = (contentOverride ?? input ?? "").trim();
      const hasAttachments = attachedFiles.length > 0;

      if ((!content && !hasAttachments) || isModelBlocked) return;

      sendingRef.current = true;
      setSending(true);
      setInput("");
      justSentRef.current = true;
      isUserScrolledUpRef.current = false;

      let thread = activeThread;
      if (!thread) {
        creatingThreadRef.current = true;
        thread = await createThread(content || "Attachment");
        if (!thread) {
          creatingThreadRef.current = false;
          setSending(false);
          sendingRef.current = false;
          return;
        }
        setActiveThread(thread);
        navigate(`/dashboard/${thread.id}`, { replace: true });
      }

      const imageAttachments = attachedFiles.filter(a => a.file_type?.startsWith('image/'));
      const nonImageAttachments = attachedFiles.filter(a => !a.file_type?.startsWith('image/'));

      let fullContent = content;
      if (nonImageAttachments.length > 0) {
        fullContent += `\n\n[Attached: ${nonImageAttachments.map(a => a.name).join(', ')}]`;
      }

      const imagePrefix = imageAttachments.length > 0
        ? `__IMAGES__${JSON.stringify(imageAttachments.map(a => ({ url: a.url, name: a.name })))}__IMAGES__`
        : '';
      const storedContent = imagePrefix + fullContent;

      const userMsg = {
        id: crypto.randomUUID(),
        thread_id: thread.id,
        user_id: "",
        role: "user",
        content: storedContent,
        versions: [storedContent],
        versionIndex: 0,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMsg]);

      await supabase.from("messages").insert({
        id: userMsg.id,
        thread_id: thread.id,
        role: "user",
        content: storedContent,
      });

      const attachmentsSnapshot = [...attachedFiles];
      setAttachedFiles([]);

      const aiMsgId = crypto.randomUUID();
      const placeholderMsg = {
        id: aiMsgId,
        thread_id: thread.id,
        user_id: "",
        role: "assistant",
        content: "",
        versions: [],
        versionIndex: 0,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, placeholderMsg]);

      await executeAiStream({
        prompt: content,
        thread,
        history: [...messages.slice(-4), userMsg],
        attachments: attachmentsSnapshot,
        aiMsgId,
        isRegeneration: false,
      });
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleSaveEdit(msgIndex, newText) {
    if (sending || sendingRef.current) return;
    const targetUserMsg = messages[msgIndex];
    if (!targetUserMsg || !newText.trim()) return;

    setEditingMsgId(null);
    sendingRef.current = true;
    setSending(true);
    justSentRef.current = true;
    isUserScrolledUpRef.current = false;

    const trimmedNew = newText.trim();
    const existingVersions = targetUserMsg.versions?.length
      ? targetUserMsg.versions
      : [targetUserMsg.content];
    const newVersions = [...existingVersions, trimmedNew];

    const updatedUserMsg = {
      ...targetUserMsg,
      content: trimmedNew,
      versions: newVersions,
      versionIndex: newVersions.length - 1,
    };

    await supabase.from("messages").update({ content: trimmedNew }).eq("id", targetUserMsg.id);

    const historyBefore = messages.slice(0, msgIndex);
    const aiMsgId = crypto.randomUUID();
    const thread = activeThread || { id: threadId };

    const placeholderMsg = {
      id: aiMsgId,
      thread_id: thread.id,
      user_id: "",
      role: "assistant",
      content: "",
      versions: [],
      versionIndex: 0,
      created_at: new Date().toISOString(),
    };

    setMessages([...historyBefore, updatedUserMsg, placeholderMsg]);

    await executeAiStream({
      prompt: trimmedNew,
      thread,
      history: [...historyBefore.slice(-3), updatedUserMsg],
      aiMsgId,
      isRegeneration: false,
    });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sendingRef.current) return;
      sendMessage();
    }
  }

  function toggleVoiceInput() {
    if (!recognitionRef.current) {
      setVoiceError('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setVoiceError('');
    voiceTranscriptRef.current = '';
    setInput('');
    recognitionRef.current.start();
    setIsListening(true);
  }

  function newThread() {
    setActiveThread(null);
    setMessages([]);
    setInput("");
    navigate("/dashboard");
  }

  async function deleteThread(id, e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    try {
      await supabase.from('threads').delete().eq('id', id);
      setThreads(prev => prev.filter(t => t.id !== id));
      if (activeThread?.id === id) newThread();
    } catch (err) {
      console.error('deleteThread error:', err);
    }
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
  }

  async function handleCopyChat() {
    if (!activeThread) return;
    const ok = await copyChatContext(messages, activeThread.title);
    if (ok) {
      setCopiedChat(true);
      setTimeout(() => setCopiedChat(false), 2000);
    }
    setShowExportMenu(false);
  }

  function handleDownloadWord() {
    if (!activeThread) return;
    downloadAsWord(messages, activeThread.title);
    setShowExportMenu(false);
  }

  function handleDownloadPdf() {
    if (!activeThread) return;
    downloadAsPdf(messages, activeThread.title);
    setShowExportMenu(false);
  }

  function handleDownloadPpt() {
    if (!activeThread) return;
    downloadAsPpt(messages, activeThread.title);
    setShowExportMenu(false);
  }

  const filteredThreads = threads.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatMathInText = (rawText) => {
    if (!rawText) return '';
    let text = rawText;
    // Normalize \[ ... \] to display math block with clean line breaks
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `\n\n$$\n${eq.trim()}\n$$\n\n`);
    // Normalize \( ... \) to inline math
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq.trim()}$`);
    // Normalize bracketed formulas like [ \Delta ... ] to display math block
    text = text.replace(/(?:^|\n)\[\s*(\\(?:Delta|frac|theta|alpha|beta|sum|int|sqrt|cdot|partial|mathbf|times|le|ge|neq)[\s\S]*?)\]/g, '\n\n$$\n$1\n$$\n\n');
    // Normalize unbracketed bare equations starting with LaTeX commands (e.g. \Delta x = ...)
    text = text.replace(/(?:^|\n)(\\(?:Delta|frac|sum|int|sqrt|vec|mathbf)[^\n]*?(?:=|\+|-|\*)[^\n]*)(?=\n|$)/g, '\n\n$$\n$1\n$$\n\n');
    return text;
  };

  const handleSpeak = (text, msgId) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\`\`\`[\s\S]*?\`\`\`/g, 'Code block omitted.').slice(0, 1500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (msgId, type) => {
    setFeedbackMap(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
  };

  const handleRegenerate = async (msgIndex) => {
    if (sending || sendingRef.current) return;
    const targetBotMsg = messages[msgIndex];
    if (!targetBotMsg) return;

    let promptText = '';
    let userMsgIdx = -1;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const { text } = parseMessageContent(messages[i].content);
        promptText = text;
        userMsgIdx = i;
        break;
      }
    }
    if (!promptText.trim()) return;

    sendingRef.current = true;
    setSending(true);

    const priorVersions = targetBotMsg.versions?.length
      ? targetBotMsg.versions
      : (targetBotMsg.content ? [targetBotMsg.content] : []);

    setMessages(prev => prev.map((m, idx) => {
      if (idx === msgIndex) {
        return { ...m, content: '', versions: priorVersions, versionIndex: priorVersions.length };
      }
      return m;
    }));

    const thread = activeThread || { id: threadId };
    const history = messages.slice(0, userMsgIdx + 1).slice(-4);

    await executeAiStream({
      prompt: promptText.trim(),
      thread,
      history,
      aiMsgId: targetBotMsg.id,
      isRegeneration: true,
      priorVersions,
    });
  };

  function parseMessageContent(content) {
    let images = [];
    let pptDeck = null;
    let text = content || '';

    const imgMatch = text.match(/^__IMAGES__(.*?)__IMAGES__([\s\S]*)$/);
    if (imgMatch) {
      try { images = JSON.parse(imgMatch[1]); } catch { }
      text = imgMatch[2];
    }

    const pptMatch = text.match(/__PPT_DECK__([\s\S]*?)__PPT_DECK__/);
    if (pptMatch) {
      try {
        pptDeck = JSON.parse(pptMatch[1]);
        if (pptDeck?.deckId && Array.isArray(pptDeck?.slides) && pptDeck.slides.length > 0) {
          const savedKey = getSavedSlidesStorageKey(user?.id);
          const saved = JSON.parse(localStorage.getItem(savedKey) || '[]');
          if (!saved.some((d) => d.id === pptDeck.deckId)) {
            saved.unshift({
              id: pptDeck.deckId,
              title: pptDeck.title || 'Untitled Presentation',
              slides: pptDeck.slides,
              theme: pptDeck.theme || 'midnight',
              seed_color: pptDeck.seed_color || '#0EA5E9',
              updated_at: new Date().toISOString(),
            });
            localStorage.setItem(savedKey, JSON.stringify(saved));
          }
        }
      } catch {}
    }

    let pptUpgradeNotice = null;
    const pptUpgradeMatch = text.match(/__PPT_PRO_UPGRADE__([\s\S]*?)__PPT_PRO_UPGRADE__/);
    if (pptUpgradeMatch) {
      try {
        pptUpgradeNotice = JSON.parse(pptUpgradeMatch[1]);
      } catch {}
      text = text.replace(/__PPT_PRO_UPGRADE__[\s\S]*?__PPT_PRO_UPGRADE__/, '').trim();
    }

    let citations = [];
    const citationsMatch = text.match(/__CITATIONS__([\s\S]*?)__CITATIONS__/);
    if (citationsMatch) {
      try {
        citations = JSON.parse(citationsMatch[1]);
      } catch {}
      text = text.replace(/__CITATIONS__[\s\S]*?__CITATIONS__/, '').trim();
    }

    return { images, pptDeck, pptUpgradeNotice, citations, text };
  }

  const lastUserMsgIndex = messages.map(m => m.role).lastIndexOf('user');

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${darkMode ? 'bg-[#0e0e0e] text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`h-14 flex items-center justify-between px-6 border-b shrink-0 z-20 ${darkMode ? 'bg-[#0e0e0e] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <h2 className={`text-xl font-medium truncate max-w-[300px] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Netroot AI
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {showSearch ? (
            <div className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-gray-50 border-gray-300'}`}>
              <Search className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.searchThreads')}
                className={`bg-transparent text-sm outline-none w-40 ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                <X className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setShowSearch(true); setShowThreadPanel(true); }}
              className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-sm transition-all ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-gray-200' : 'bg-white border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700'}`}
            >
              <Search className="w-3.5 h-3.5" />
              Search Thread
            </button>
          )}

          {activeThread && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(v => !v)}
                className={`flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-sm transition-all ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] text-gray-400 hover:text-gray-200' : 'bg-white border-gray-300 hover:border-gray-400 text-gray-500 hover:text-gray-700'}`}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('dashboard.export')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className={`absolute right-0 top-full mt-1.5 w-52 border rounded-xl py-1.5 shadow-2xl z-50 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                    <button
                      onClick={handleCopyChat}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      {copiedChat ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      {copiedChat ? 'Copied!' : 'Copy chat context'}
                    </button>
                    <button
                      onClick={handleDownloadWord}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <FileText className="w-4 h-4" />
                      Download as Word
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <FileType2 className="w-4 h-4" />
                      Download as PDF
                    </button>
                    <button
                      onClick={handleDownloadPpt}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <Presentation className="w-4 h-4" />
                      Download as PowerPoint
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Wallet Balance & Top Up */}
          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
            title="Wallet Balance - Click to Top Up"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>${Number(walletBalance || 0).toFixed(2)}</span>
            <span className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-300 ml-0.5 font-medium">+ Top Up</span>
          </button>

          <button
            onClick={onToggleDark}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>
      {accessExpired && (
        <div className="mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <div><strong className={darkMode ? 'text-amber-300' : 'text-amber-800'}>{t('dashboard.freePlanComplete')}</strong><span className={darkMode ? 'text-amber-200/80' : 'text-amber-700'}>{t('dashboard.upgradeToContinue')}</span></div>
          <button onClick={() => navigate('/pricing')} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">{t('dashboard.upgrade')}</button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <ChatHistorySidebar
          threads={threads}
          activeThread={activeThread}
          onSelectThread={(t) => {
            setActiveThread(t);
            navigate(`/dashboard/${t.id}`);
            loadMessages(t.id);
          }}
          onNewChat={newThread}
          onDeleteThread={deleteThread}
          onRenameThread={renameThread}
          onTogglePin={togglePinThread}
          isOpen={showThreadPanel}
          onToggleOpen={() => setShowThreadPanel(!showThreadPanel)}
          darkMode={darkMode}
        />

        <main className={`flex-1 flex flex-col ${activeThread ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeThread ? (
            <div ref={chatScrollContainerRef} onScroll={handleChatScroll} className={`flex-1 overflow-y-auto ${darkMode ? 'bg-[#0b0f17]/40' : 'bg-gray-50/60'}`}>
              <div className="max-w-3xl lg:max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-24 space-y-7 min-h-full flex flex-col justify-start">
                {messages.map((msg, msgIndex) => {
                  const { images, pptDeck, pptUpgradeNotice, citations, text } = parseMessageContent(msg.content);
                  const formattedText = formatMathInText(text);
                  const isLatestUserMsg = msg.role === 'user' && msgIndex === lastUserMsgIndex;

                  return (
                    <div
                      key={msg.id}
                      ref={isLatestUserMsg ? lastUserMsgRef : undefined}
                      className="w-full scroll-mt-6"
                    >
                      {msg.role === 'user' ? (
                        <div className="flex justify-end items-start gap-3 group">
                          <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[76%]">
                            {/* Attached images */}
                            {images.length > 0 && (
                              <div className="flex flex-wrap gap-2 justify-end mb-1">
                                {images.map((img, i) => (
                                  <img
                                    key={i}
                                    src={img.url}
                                    alt={img.name}
                                    className="rounded-2xl max-w-[260px] max-h-[260px] object-cover shadow-md border border-white/10"
                                  />
                                ))}
                              </div>
                            )}

                            {/* Sleek Modern User Bubble or Inline Editor */}
                            {editingMsgId === msg.id ? (
                              <div className={`w-full rounded-2xl p-3 border shadow-md transition-all ${
                                darkMode ? 'bg-[#27272a] border-[#3f3f46]' : 'bg-white border-gray-300'
                              }`}>
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className={`w-full bg-transparent text-sm leading-relaxed resize-none outline-none ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                  }`}
                                  rows={Math.min(6, Math.max(2, editingContent.split('\n').length))}
                                  autoFocus
                                />
                                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                                  <button
                                    type="button"
                                    onClick={() => setEditingMsgId(null)}
                                    className={`px-3 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                                      darkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!editingContent.trim() || sending}
                                    onClick={() => handleSaveEdit(msgIndex, editingContent)}
                                    className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition shadow-sm cursor-pointer"
                                  >
                                    Save & Submit
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`rounded-[22px] px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words transition-all ${
                                darkMode
                                  ? 'bg-[#27272a] text-[#f4f4f5] border border-white/10 shadow-sm'
                                  : 'bg-[#eef1f4] text-slate-900 border border-slate-200/90 shadow-xs'
                              }`}>
                                {text}
                              </div>
                            )}

                            {/* User message hover action & Version pagination */}
                            <div className="flex items-center gap-1.5 px-2">
                              {msg.versions && msg.versions.length > 1 && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 select-none mr-1">
                                  <button
                                    type="button"
                                    disabled={(msg.versionIndex ?? (msg.versions.length - 1)) === 0}
                                    onClick={() => switchVersion(msgIndex, (msg.versionIndex ?? (msg.versions.length - 1)) - 1)}
                                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                    title="Previous version"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                  <span className="text-[11px] font-mono px-0.5">
                                    {(msg.versionIndex ?? (msg.versions.length - 1)) + 1}/{msg.versions.length}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={(msg.versionIndex ?? (msg.versions.length - 1)) === msg.versions.length - 1}
                                    onClick={() => switchVersion(msgIndex, (msg.versionIndex ?? (msg.versions.length - 1)) + 1)}
                                    className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                    title="Next version"
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMsgId(msg.id);
                                    setEditingContent(text);
                                  }}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                                    darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                                  }`}
                                  title="Edit prompt"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(text);
                                    setCopiedMsgId(`user-${msg.id}`);
                                    setTimeout(() => setCopiedMsgId(null), 2000);
                                  }}
                                  className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                                    darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                                  }`}
                                  title="Copy prompt"
                                >
                                  {copiedMsgId === `user-${msg.id}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-medium">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* User Avatar */}
                          <img
                            src={avatarUrl}
                            alt="avatar"
                            className={`w-8 h-8 rounded-full object-cover border shrink-0 mt-0.5 shadow-xs ${darkMode ? 'border-[#333]' : 'border-gray-300'}`}
                          />
                        </div>
                      ) : (
                        /* Assistant message - Open, spacious, high-readability stream */
                        <div className="flex items-start gap-3.5 w-full group">
                          {/* Bot Avatar */}
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-blue-500/10">
                            <Bot className="w-4 h-4 text-white" />
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col gap-2">
                            {/* Generated image message */}
                            {msg.content.startsWith('__IMAGE__') ? (
                              <div className="space-y-3">
                                <p className={`text-xs font-medium flex items-center gap-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Generated image
                                </p>
                                <img
                                  src={msg.content.replace('__IMAGE__', '')}
                                  alt={t('dashboard.generatedImage')}
                                  className="rounded-2xl max-w-full sm:max-w-md shadow-xl border border-white/10"
                                  onError={e => { e.target.style.display = 'none'; }}
                                />
                                <a
                                  href={msg.content.replace('__IMAGE__', '')}
                                  download={`netroot-ai-image-${msg.id}.png`}
                                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                    darkMode ? 'border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  {t('dashboard.downloadImage')}
                                </a>
                              </div>
                            ) : (!formattedText.trim() && sending && msgIndex === messages.length - 1) ? (
                              <div className="flex items-center gap-3 py-1 px-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]"></span>
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]"></span>
                                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                                </div>
                                <span className={`text-xs font-medium tracking-wide ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Thinking & generating response...
                                </span>
                              </div>
                            ) : formattedText.trim() ? (
                              <div className={`text-[15px] sm:text-base leading-relaxed break-words font-normal ${
                                darkMode ? 'text-gray-100' : 'text-slate-800'
                              }`}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: 'inherit', strict: false }]]}
                                  components={{
                                    h1: ({ children }) => (
                                      <h1 className={`text-2xl font-bold mt-6 mb-3 pb-2 border-b tracking-tight ${darkMode ? 'text-white border-white/10' : 'text-gray-900 border-gray-200'}`}>{children}</h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className={`text-xl font-bold mt-5 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className={`text-lg font-semibold mt-4 mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{children}</h3>
                                    ),
                                    h4: ({ children }) => (
                                      <h4 className={`text-base font-semibold mt-3 mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</h4>
                                    ),
                                    p: ({ children }) => (
                                      <p className={`leading-7 mb-3.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</strong>
                                    ),
                                    em: ({ children }) => (
                                      <em className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</em>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className={`list-disc pl-5 my-3 space-y-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className={`list-decimal pl-5 my-3 space-y-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{children}</ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="leading-relaxed">{children}</li>
                                    ),
                                    blockquote: ({ children }) => (
                                      <blockquote className={`border-l-4 border-blue-500 pl-4 py-2.5 pr-3 rounded-r-xl my-4 text-sm leading-relaxed ${darkMode ? 'bg-blue-500/10 text-gray-200' : 'bg-blue-50/80 text-gray-800'}`}>{children}</blockquote>
                                    ),
                                    hr: () => (
                                      <hr className={`my-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />
                                    ),
                                    a: ({ href, children }) => (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} underline underline-offset-2 font-medium`}>{children}</a>
                                    ),
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto my-5 rounded-2xl border border-white/10 shadow-sm"><table className={`w-full text-sm border-collapse ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>{children}</table></div>
                                    ),
                                    thead: ({ children }) => (<thead className={`${darkMode ? 'bg-white/5 border-b border-white/10' : 'bg-gray-100 border-b border-gray-200'}`}>{children}</thead>),
                                    tbody: ({ children }) => (<tbody className={`${darkMode ? 'bg-transparent' : 'bg-white'}`}>{children}</tbody>),
                                    tr: ({ children }) => (<tr className={`border-b ${darkMode ? 'border-white/5' : 'border-gray-100'}`}>{children}</tr>),
                                    th: ({ children }) => (<th className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</th>),
                                    td: ({ children }) => (<td className={`px-4 py-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</td>),
                                    img: ({ src, alt }) => (<img src={src} alt={alt} className="rounded-2xl my-4 max-w-full shadow-lg border border-white/10" />),
                                    code({ inline, className, children }) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      const codeString = String(children).replace(/\n$/, '');
                                      if (!inline && (match || String(children).includes('\n'))) {
                                        return (
                                          <ChatCodeBlock
                                            language={match ? match[1] : ''}
                                            code={codeString}
                                            darkMode={darkMode}
                                          />
                                        );
                                      }
                                      return (
                                        <code className={`${darkMode ? 'bg-white/10 text-emerald-400 font-mono' : 'bg-gray-100 text-emerald-600 font-mono'} px-1.5 py-0.5 rounded text-xs font-semibold`}>
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {formattedText}
                                </ReactMarkdown>
                              </div>
                            ) : null}

                            {/* Render PPT Presentation Card if present */}
                            {pptDeck && (
                              <PptChatDeckCard pptDeck={pptDeck} darkMode={darkMode} />
                            )}

                            {/* Render PPT Pro Upgrade Card if present */}
                            {pptUpgradeNotice && (
                              <div className={`mt-3 p-4 rounded-2xl border transition-all ${
                                darkMode ? 'bg-[#151518] border-amber-500/40 shadow-lg shadow-amber-500/5' : 'bg-amber-50/60 border-amber-300'
                              }`}>
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                    <Sparkles className="w-5 h-5 text-amber-200" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                                        NetRoot AI PPT Studio
                                      </span>
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                        PRO FEATURE
                                      </span>
                                    </div>
                                    <h4 className={`text-sm font-bold mt-0.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                      Free Trial Limit Reached (2/2 Presentations)
                                    </h4>
                                    <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                      You have used both of your lifetime free AI presentations. Upgrade to NetRoot AI Pro to generate unlimited executive slide decks, PowerPoint (.pptx) downloads, and AI copilot edits directly from this chat.
                                    </p>
                                    <div className="mt-3 flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => navigate('/pricing')}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-amber-500/25 transition cursor-pointer"
                                      >
                                        <Zap className="w-3.5 h-3.5 text-amber-200 fill-current" />
                                        <span>Upgrade to Pro — $19/mo</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => navigate('/ppt-studio')}
                                        className={`text-xs font-semibold hover:underline ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600'}`}
                                      >
                                        View Past Presentations &rarr;
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}


                            {/* ChatGPT / Claude Style Action Toolbar */}
                            {text.trim().length > 0 && (
                              <div className="flex items-center gap-1 mt-1 pt-1">
                                {msg.versions && msg.versions.length > 1 && (
                                  <div className="flex items-center gap-1 text-xs text-gray-400 select-none mr-1.5">
                                    <button
                                      type="button"
                                      disabled={(msg.versionIndex ?? (msg.versions.length - 1)) === 0}
                                      onClick={() => switchVersion(msgIndex, (msg.versionIndex ?? (msg.versions.length - 1)) - 1)}
                                      className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                      title="Previous answer"
                                    >
                                      <ChevronLeft className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-[11px] font-mono px-0.5">
                                      {(msg.versionIndex ?? (msg.versions.length - 1)) + 1}/{msg.versions.length}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={(msg.versionIndex ?? (msg.versions.length - 1)) === msg.versions.length - 1}
                                      onClick={() => switchVersion(msgIndex, (msg.versionIndex ?? (msg.versions.length - 1)) + 1)}
                                      className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                      title="Next answer"
                                    >
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(text);
                                    setCopiedMsgId(msg.id);
                                    setTimeout(() => setCopiedMsgId(null), 2000);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    copiedMsgId === msg.id
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : darkMode
                                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Copy response to clipboard"
                                >
                                  {copiedMsgId === msg.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-[11px] font-semibold text-emerald-400">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span className="text-[11px]">Copy</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRegenerate(msgIndex)}
                                  disabled={sending}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer disabled:opacity-40 ${
                                    darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Regenerate this response"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">Retry</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSpeak(text, msg.id)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                    speakingMsgId === msg.id
                                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                      : darkMode
                                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title={speakingMsgId === msg.id ? "Stop reading aloud" : "Read aloud"}
                                >
                                  {speakingMsgId === msg.id ? (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                                      <span className="text-[11px] font-semibold text-blue-400">Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5" />
                                      <span className="text-[11px]">Listen</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'up')}
                                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                    feedbackMap[msg.id] === 'up'
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : darkMode
                                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Helpful response"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleFeedback(msg.id, 'down')}
                                  className={`p-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                                    feedbackMap[msg.id] === 'down'
                                      ? 'bg-red-500/15 text-red-400'
                                      : darkMode
                                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                  }`}
                                  title="Needs improvement"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className={`flex-1 flex flex-col items-center justify-end pb-4 px-6 ${darkMode ? '' : 'bg-gray-50'}`}>
              <img key={avatarUrl} src={avatarUrl} alt="avatar" className="w-16 h-16 rounded-full object-cover border-2 mb-5" />
              <h1 className={`text-3xl font-bold mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {t(getGreeting())}, {firstName}
              </h1>
              <p className="text-xl font-semibold">
                <span className="text-[#3b82f6]">{t('dashboard.whatsOnYourMind')}</span>
              </p>
            </div>
          )}

          <div className="px-6 pb-6 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className={`relative border rounded-2xl transition-colors ${darkMode ? 'bg-[#161616] border-[#2a2a2a]' : 'bg-white border-gray-300 shadow-sm'} ${!isModelBlocked ? darkMode ? 'focus-within:border-[#3a3a3a]' : 'focus-within:border-gray-400' : ''}`}>
                {isModelBlocked ? (
                  <div className={`flex flex-col items-center justify-center gap-4 py-7 px-6 rounded-2xl ${darkMode ? 'bg-[#161616]' : 'bg-white'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${darkMode ? 'bg-red-500/10 border-red-500/25' : 'bg-red-50 border-red-200'}`}>
                      <Lock className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {visibleModels.find(m2 => m2.id === model)?.label || model} is blocked
                      </p>
                      <p className={`text-xs mt-1 leading-relaxed ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {plan === 'pro' ? `Pro includes ${proLimit.toLocaleString()} daily tokens and ${proModelsCount} model${proModelsCount === 1 ? '' : 's'}.` : `Free includes ${freeLimit.toLocaleString()} daily tokens and ${freeModelsCount} model${freeModelsCount === 1 ? '' : 's'}. Upgrade to Pro for ${proLimit.toLocaleString()} daily tokens and ${proModelsCount} model${proModelsCount === 1 ? '' : 's'}.`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/project-settings?tab=billing')}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 text-white px-4 py-2 rounded-lg transition-all"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Upgrade Plan
                      </button>
                      <button
                        onClick={() => setModel(visibleModels.find(m2 => m2.id !== model)?.id || model)}
                        className={`text-xs font-medium px-4 py-2 rounded-lg border transition-colors ${darkMode ? 'border-[#3a3a3a] text-gray-300 hover:bg-white/5' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                      >
                        Switch model
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('dashboard.askQuestion')}
                    rows={3}
                    className={`w-full bg-transparent px-5 pt-4 pb-2 outline-none resize-none text-sm leading-relaxed ${darkMode ? 'text-gray-200 placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
                  />
                )}

                {!isModelBlocked && attachedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-5 pb-2 pt-1">
                    {attachedFiles.map(att => (
                      <div key={att.id} className="relative group">
                        {att.file_type.startsWith('image/') ? (
                          <div className="relative">
                            <img
                              src={att.url}
                              alt={att.name}
                              className="h-20 w-20 object-cover rounded-xl border border-white/10"
                            />
                            <button
                              onClick={() => removeAttachedFile(att.id)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs border ${darkMode ? 'bg-[#1a1a2a] border-[#2a2a3a] text-gray-300' : 'bg-blue-50 border-blue-200 text-gray-700'}`}>
                            {att.file_type.startsWith('text/') ? <FileText className="w-3.5 h-3.5" /> : <File className="w-3.5 h-3.5" />}
                            <span className="truncate max-w-[120px]">{att.name}</span>
                            <button onClick={() => removeAttachedFile(att.id)} className="ml-0.5 hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!isModelBlocked && (
                  <div className="flex items-center justify-between px-4 pb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <input
                        ref={attachInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachUpload}
                      />
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />

                      <button
                        onClick={() => imageInputRef.current?.click()}
                        title={t('dashboard.uploadVisionImage')}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors border ${darkMode ? 'text-purple-400 hover:text-purple-300 border-purple-500/30 bg-purple-500/10' : 'text-purple-600 hover:text-purple-700 border-purple-200 bg-purple-50'}`}
                      >
                        <Image className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => attachInputRef.current?.click()}
                        disabled={uploadingAttach}
                        className={`flex items-center gap-1.5 transition-colors text-sm border rounded-lg px-3 py-1.5 ${darkMode ? 'text-gray-500 hover:text-gray-300 border-[#2a2a2a] hover:border-[#3a3a3a]' : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-400'}`}
                      >
                        {uploadingAttach ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Paperclip className="w-3.5 h-3.5" />
                        )}
                        {uploadingAttach ? 'Uploading...' : 'Attach'}
                      </button>

                      {enabledPlugins.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {enabledPlugins.slice(0, 3).map(p => (
                            <span key={p.plugin_id} title={p.plugin_id}
                              className={`text-xs px-2 py-1 rounded-lg border font-medium ${darkMode ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                              {PLUGIN_ICONS[p.plugin_id] || '🔌'}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="relative">
                        <button
                          onClick={() => setShowModelMenu(v => !v)}
                          className={`flex items-center gap-1.5 transition-colors text-sm border rounded-lg px-3 py-1.5 ${darkMode ? 'text-gray-400 hover:text-gray-200 border-[#2a2a2a] hover:border-[#3a3a3a]' : 'text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-400'}`}
                        >
                          <Cpu className="w-3.5 h-3.5" />
                          <span className="max-w-[150px] truncate">
                            {activeModelsList.find(m => m.id === model)?.label || visibleModels.find(m => m.id === model)?.label || model}
                          </span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {showModelMenu && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => { setShowModelMenu(false); setModelSearch(''); }} />
                            <div className={`absolute bottom-full mb-2 left-0 border rounded-xl py-2 w-72 sm:w-80 shadow-2xl z-50 flex flex-col max-h-96 ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                              <div className="px-3 pb-2 pt-1 border-b border-inherit">
                                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-[#141414] border-[#2a2a2a] text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                                  <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Search models..."
                                    value={modelSearch}
                                    onChange={e => setModelSearch(e.target.value)}
                                    className="bg-transparent outline-none w-full text-xs"
                                    autoFocus
                                  />
                                  {modelSearch && (
                                    <button onClick={() => setModelSearch('')} className="opacity-60 hover:opacity-100">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="overflow-y-auto flex-1 divide-y divide-transparent py-1">
                                {activeModelsList
                                  .filter(m => {
                                    if (!modelSearch.trim()) return true;
                                    const q = modelSearch.toLowerCase();
                                    return (
                                      (m.label && m.label.toLowerCase().includes(q)) ||
                                      (m.id && m.id.toLowerCase().includes(q)) ||
                                      (m.provider && m.provider.toLowerCase().includes(q))
                                    );
                                  })
                                  .map((m, idx) => (
                                    <React.Fragment key={m.id}>
                                      {!modelSearch.trim() && idx === 5 && (
                                        <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-t border-inherit mt-1">
                                          More Models
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          setModel(m.id);
                                          setShowModelMenu(false);
                                          setModelSearch('');
                                        }}
                                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2.5 transition-colors ${model === m.id
                                          ? darkMode ? 'bg-blue-500/10 text-white' : 'bg-blue-50 text-gray-900'
                                          : darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                          }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <Cpu className={`w-3.5 h-3.5 shrink-0 ${model === m.id ? 'text-blue-400' : darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                          <div className="truncate">
                                            <p className="text-xs font-medium truncate">{m.label}</p>
                                            {m.provider && (
                                              <p className="text-[10px] text-gray-500 truncate">{m.provider}</p>
                                            )}
                                          </div>
                                        </div>

                                        {m.tag && (
                                          <span className={`text-[10px] shrink-0 rounded-full px-2 py-0.5 font-medium ${model === m.id
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {m.tag}
                                          </span>
                                        )}
                                      </button>
                                    </React.Fragment>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleVoiceInput}
                        disabled={sending}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 text-white scale-110' : darkMode ? 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                        title={isListening ? 'Stop listening' : 'Speak to send'}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      {sending ? (
                        <button
                          onClick={stopGeneration}
                          className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-md animate-pulse"
                          title="Stop generation"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => { if (!sendingRef.current) sendMessage(); }}
                          disabled={(!input.trim() && attachedFiles.length === 0) || sending}
                          className="w-9 h-9 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
                        >
                          <ArrowUp className="w-4 h-4 text-black" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {!isModelBlocked && isListening && (
                  <p className={`mt-2 px-3 py-2 text-xs rounded-lg font-medium inline-block ${darkMode ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                    🎤 Listening… speak now
                  </p>
                )}

                {!isModelBlocked && voiceError && (
                  <p className={`mt-2 px-3 py-2 text-xs rounded-lg font-medium inline-block ${darkMode ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                    ⚠️ {voiceError}
                  </p>
                )}
              </div>
            </div>

            {!activeThread && (
              <div className="mt-6">
                <p className={`text-center text-xs font-semibold uppercase tracking-[0.18em] mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                  Get started with an example below
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.title}
                      onClick={() => {
                        setInput(ex.prompt);
                        textareaRef.current?.focus();
                      }}
                      className={`relative text-left rounded-2xl p-5 pr-14 transition-all group border ${darkMode
                        ? 'bg-[#141414] border-[#1f1f1f] hover:border-[#2a2a2a] hover:bg-[#1a1a1a]'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md shadow-sm'
                        }`}
                    >
                      <span className={`text-sm font-semibold leading-snug ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {ex.title}
                      </span>

                      <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${darkMode
                        ? 'bg-[#252525] group-hover:bg-[#333] text-gray-400 group-hover:text-white'
                        : 'bg-gray-100 group-hover:bg-gray-200 text-gray-500 group-hover:text-gray-700'
                        }`}>
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <WalletTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => {
          setIsTopUpOpen(false);
          if (refreshWallet) refreshWallet();
        }}
        darkMode={darkMode}
      />
    </div>
  );
}
