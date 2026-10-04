import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

const sections = [
    {
        id: "introduction",
        title: "Introduction",
        group: "Get started",
        summary: "Find your way around NetrootAI and learn what each area does.",
        steps: [
            "Use the icon rail on the far left to move between Home, Threads, Files, Plugins, and Image Studio.",
            "Open Project Settings for model limits, billing, API keys, and usage. Use the help icon above your profile to return to this guide.",
            "Your available models and features depend on your current plan and account access.",
        ],
    },
    {
        id: "chat",
        title: "Chat with AI",
        group: "Get started",
        summary: "Start a conversation, choose a model, and use enabled tools.",
        route: "/dashboard",
        routeLabel: "Open Home",
        steps: [
            "Select Home from the left rail to open the chat workspace. Start a new conversation from the composer when needed.",
            "Choose one of the models available to your plan, then enter a question or task in the message box and send it.",
            "Use the attachment control to include files with a prompt. Enable relevant plugins first if you want the assistant to use tools such as web search or calculations.",
            "If a model reaches its usage limit, check Project Settings → Limits for usage details or choose another available model.",
        ],
    },
    {
        id: "threads",
        title: "Threads",
        group: "Get started",
        summary: "Search, reopen, and remove saved conversations.",
        route: "/threads",
        routeLabel: "Open Threads",
        steps: [
            "Open Threads from the left rail to see saved conversations, most recently updated first.",
            "Use the search field to filter conversations by title.",
            "Select a thread to continue it, or choose New Thread to return to Home and begin a conversation.",
            "Use the delete control to permanently remove a conversation after confirming.",
        ],
    },
    {
        id: "files",
        title: "Files",
        group: "Learn",
        summary: "Upload and manage files in your personal storage.",
        route: "/files",
        routeLabel: "Open Files",
        steps: [
            "Open Files and choose Upload, or drag files into the upload area.",
            "Search by filename and sort the list by name, size, or upload date.",
            "Download a file when you need a local copy, or delete it to free storage space.",
            "Storage is limited to 256 MB per account. Chat attachments can also be added directly from the Home composer.",
        ],
    },
    {
        id: "plugins",
        title: "Plugins",
        group: "Learn",
        summary: "Turn on optional tools that extend chat capabilities.",
        route: "/plugins",
        routeLabel: "Open Plugins",
        steps: [
            "Open Plugins and use search or the category filters to find a tool.",
            "Switch on a plugin. If configuration is required, enter its credentials and select Save & Enable.",
            "Plugins without configuration, such as Calculator and PDF.js Search, can be enabled immediately.",
            "Some plugins are plan-restricted. Once enabled, ask for a task that clearly needs the tool in a new or existing chat.",
        ],
        details: [
            "Available tools include web search, calculator, PDF search, JSON/YAML conversion, arXiv search, and code execution. Some tools require Pro access.",
        ],
    },
    {
        id: "image-studio",
        title: "Image Studio",
        group: "Learn",
        summary: "Create images from a description and browse your generated gallery.",
        route: "/image-studio",
        routeLabel: "Open Image Studio",
        steps: [
            "Open Image Studio and enter a clear description of the image you want.",
            "Choose an aspect ratio and an optional visual style, then select Generate.",
            "Open an item in your gallery to preview it, download it, or remove it.",
            "Video mode is also shown in the studio, but it requires an Open-Sora deployment to be configured by the service operator.",
        ],
    },
    {
        id: "project-settings",
        title: "Project Settings",
        group: "Learn",
        summary: "Manage project preferences, model access, billing, and usage tools.",
        route: "/project-settings",
        routeLabel: "Open Project Settings",
        steps: [
            "Open Project Settings from the gear icon near the bottom of the left rail.",
            "General shows the project name, project ID, service tier, and user API key setting.",
            "Limits shows model usage and allows you to allow or block models. Select Billing to review your plan or manage an upgrade.",
            "API Keys contains project API key tools. Token Dashboard provides usage information for API activity.",
        ],
    },
    {
        id: "account-settings",
        title: "Account Settings",
        group: "Learn",
        summary: "Update your profile, secure your account, and manage personal API keys.",
        route: "/settings",
        routeLabel: "Open Account Settings",
        steps: [
            "Select your profile avatar at the bottom of the left rail to open account Settings.",
            "On the User tab, update your name, phone number, default organization, or profile photo, then select Save.",
            "On the Security tab, create a named API key and copy it immediately. The full key is only shown once.",
            "Revoke or delete keys you no longer use, and use the sign-out control when you are finished on a shared device.",
        ],
    },
];

const groups = [...new Set(sections.map((section) => section.group))];

export default function HelpPage() {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeSection, setActiveSection] = useState("introduction");
    const darkMode = theme === "dark";

    const visibleSections = sections.filter((section) =>
        `${section.title} ${section.summary}`.toLowerCase().includes(search.toLowerCase())
    );
    const palette = darkMode
        ? {
            page: "bg-black text-[#e5e5e5]",
            sidebar: "bg-[#090909] border-[#202020]",
            muted: "text-[#969696]",
            faint: "text-[#676767]",
            border: "border-[#202020]",
            hover: "hover:bg-white/[0.06]",
            active: "bg-white/[0.1] text-white",
            input: "bg-black border-[#272727] text-white placeholder:text-[#777]",
            callout: "bg-white/[0.04] border-[#292929] text-[#bdbdbd]",
        }
        : {
            page: "bg-white text-[#202124]",
            sidebar: "bg-[#f8f8f8] border-[#e7e7e7]",
            muted: "text-[#64676b]",
            faint: "text-[#85888c]",
            border: "border-[#e7e7e7]",
            hover: "hover:bg-black/[0.04]",
            active: "bg-black/[0.07] text-[#171717]",
            input: "bg-white border-[#dedede] text-[#202124] placeholder:text-[#85888c]",
            callout: "bg-[#f7f7f7] border-[#e5e5e5] text-[#55585c]",
        };

    function navigateTo(id) {
        setActiveSection(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return (
        <div className={`min-h-screen ${palette.page}`}>
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[224px_minmax(0,1fr)]">
                <aside className={`hidden border-r lg:flex lg:flex-col ${palette.sidebar}`}>
                    <div className={`sticky top-0 flex h-screen flex-col px-3 py-4`}>
                        <label className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${palette.input}`}>
                            <Search className={`h-4 w-4 shrink-0 ${palette.muted}`} />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search docs..."
                                aria-label="Search help topics"
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                        </label>

                        <nav className="mt-7 space-y-7 overflow-y-auto" aria-label="Help topics">
                            {groups.map((group) => {
                                const groupSections = visibleSections.filter((section) => section.group === group);
                                if (!groupSections.length) return null;
                                return (
                                    <div key={group}>
                                        <h2 className="mb-2 px-2 text-sm font-semibold">{group}</h2>
                                        <div className="space-y-1">
                                            {groupSections.map((section) => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => navigateTo(section.id)}
                                                    className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${activeSection === section.id ? palette.active : `${palette.muted} ${palette.hover}`}`}
                                                >
                                                    {section.title}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {visibleSections.length === 0 && <p className={`px-2 text-sm ${palette.muted}`}>No topics found.</p>}
                        </nav>

                        <div className={`mt-auto border-t pt-4 ${palette.border}`}>
                            <button onClick={() => navigate("/dashboard")} className={`flex items-center gap-2 px-2 py-2 text-sm ${palette.muted} ${palette.hover} rounded-lg`}>
                                <ChevronRight className="h-4 w-4 rotate-180" />
                                Back to Home
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,760px)_150px] xl:justify-center xl:gap-12">
                    <main className="min-w-0 px-6 py-10 sm:px-10 lg:px-12 xl:px-4">
                        <div className={`mb-9 flex items-center gap-2 text-sm ${palette.muted}`}>
                            <BookOpen className="h-4 w-4" />
                            <span>NetrootAI docs</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>Get started</span>
                        </div>

                        <header id="introduction" className="scroll-mt-8">
                            <p className={`mb-2 text-sm ${palette.muted}`}>Get started</p>
                            <h1 className="text-4xl font-semibold tracking-tight sm:text-[42px]">Introduction</h1>
                            <p className={`mt-3 max-w-2xl text-lg leading-7 ${palette.muted}`}>
                                A practical guide to chatting, managing your files, and getting more from NetrootAI.
                            </p>
                            <div className={`mt-8 rounded-lg border px-4 py-3 text-sm leading-6 ${palette.callout}`}>
                                Follow the steps below to explore each feature. You can jump to any topic from the docs menu or open its feature directly.
                            </div>
                        </header>

                        <section className="mt-12" aria-labelledby="quickstart-heading">
                            <h2 id="quickstart-heading" className="mb-4 text-2xl font-semibold">Quickstart</h2>
                            <ol className={`list-decimal space-y-3 pl-6 leading-7 ${palette.muted}`}>
                                <li>Start on Home and send a prompt to begin a conversation.</li>
                                <li>Open Plugins to enable tools you want to use with chat.</li>
                                <li>Find saved conversations in Threads and uploaded content in Files.</li>
                                <li>Use Image Studio to create images, or Project Settings to review your plan and usage.</li>
                            </ol>
                        </section>

                        <div className={`my-12 border-t ${palette.border}`} />

                        <div className="space-y-14">
                            {sections.slice(1).map((section, index) => (
                                <section key={section.id} id={section.id} className="scroll-mt-8">
                                    <p className={`mb-2 text-sm ${palette.muted}`}>{section.group}</p>
                                    <h2 className="text-2xl font-semibold">{section.title}</h2>
                                    <p className={`mt-2 leading-7 ${palette.muted}`}>{section.summary}</p>
                                    <ol className={`mt-5 list-decimal space-y-3 pl-6 leading-7 ${palette.muted}`}>
                                        {section.steps.map((step) => <li key={step}>{step}</li>)}
                                    </ol>
                                    {section.details?.map((detail) => (
                                        <p key={detail} className={`mt-5 rounded-lg border px-4 py-3 text-sm leading-6 ${palette.callout}`}>{detail}</p>
                                    ))}
                                    {section.route && (
                                        <button
                                            onClick={() => navigate(section.route)}
                                            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-500 hover:text-blue-400"
                                        >
                                            {section.routeLabel}
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    )}
                                    {index < sections.length - 2 && <div className={`mt-12 border-t ${palette.border}`} />}
                                </section>
                            ))}
                        </div>

                        <footer className={`mt-16 border-t pt-5 text-sm ${palette.faint} ${palette.border}`}>
                            NetrootAI Help Center
                        </footer>
                    </main>

                    <aside className="sticky top-0 hidden h-fit pt-[72px] xl:block" aria-label="On this page">
                        <h2 className={`mb-3 text-sm font-semibold ${palette.muted}`}>On this page</h2>
                        <nav className={`space-y-1 border-l ${palette.border}`}>
                            {[{ id: "quickstart-heading", title: "Quickstart" }, ...sections.map(({ id, title }) => ({ id, title }))].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigateTo(item.id)}
                                    className={`block w-full border-l-2 -ml-px px-3 py-1.5 text-left text-sm transition-colors ${activeSection === item.id || (item.id === "quickstart-heading" && activeSection === "introduction") ? "border-blue-500 text-current" : `border-transparent ${palette.muted} hover:text-current`}`}
                                >
                                    {item.title}
                                </button>
                            ))}
                        </nav>
                    </aside>
                </div>
            </div>
        </div>
    );
}