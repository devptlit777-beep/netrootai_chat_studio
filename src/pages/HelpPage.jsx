import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight, Search } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { helpSections as sections } from "../data/helpSections";

const groups = [...new Set(sections.map((section) => section.group))];

export default function HelpPage() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeSection, setActiveSection] = useState("introduction");
    const darkMode = theme === "dark";

    const localizedSections = sections.map((section) => ({
        ...section,
        ...t(`help.sections.${section.id}`, { returnObjects: true }),
    }));
    const localizedGroups = groups.map((group) => t(group === "Get started" ? "help.getStarted" : "help.learn"));
    const visibleSections = localizedSections.filter((section) =>
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
                                placeholder={t("help.search")}
                                aria-label={t("help.searchLabel")}
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />
                        </label>

                        <nav className="mt-7 space-y-7 overflow-y-auto" aria-label={t("help.searchLabel")}>
                            {localizedGroups.map((group) => {
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
                            {visibleSections.length === 0 && <p className={`px-2 text-sm ${palette.muted}`}>{t("help.noTopics")}</p>}
                        </nav>

                        <div className={`mt-auto border-t pt-4 ${palette.border}`}>
                            <button onClick={() => navigate("/dashboard")} className={`flex items-center gap-2 px-2 py-2 text-sm ${palette.muted} ${palette.hover} rounded-lg`}>
                                <ChevronRight className="h-4 w-4 rotate-180" />
                                {t("help.backHome")}
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,760px)_150px] xl:justify-center xl:gap-12">
                    <main className="min-w-0 px-4 py-7 sm:px-10 sm:py-10 lg:px-12 xl:px-4">
                        <div className={`mb-9 flex items-center gap-2 text-sm ${palette.muted}`}>
                            <BookOpen className="h-4 w-4" />
                            <span>{t("help.docs")}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                            <span>{t("help.getStarted")}</span>
                        </div>

                        <header id="introduction" className="scroll-mt-8">
                            <p className={`mb-2 text-sm ${palette.muted}`}>{t("help.getStarted")}</p>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-[42px]">{t("help.introduction")}</h1>
                            <p className={`mt-3 max-w-2xl text-lg leading-7 ${palette.muted}`}>
                                {t("help.introDescription")}
                            </p>
                            <div className={`mt-8 rounded-lg border px-4 py-3 text-sm leading-6 ${palette.callout}`}>
                                {t("help.introCallout")}
                            </div>
                        </header>

                        <section className="mt-12" aria-labelledby="quickstart-heading">
                            <h2 id="quickstart-heading" className="mb-4 text-2xl font-semibold">{t("help.quickstart")}</h2>
                            <ol className={`list-decimal space-y-3 pl-6 leading-7 ${palette.muted}`}>
                                {t("help.quickstartSteps", { returnObjects: true }).map((step) => <li key={step}>{step}</li>)}
                            </ol>
                        </section>

                        <div className={`my-12 border-t ${palette.border}`} />

                        <div className="space-y-14">
                            {localizedSections.slice(1).map((section, index) => (
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
                            {t("help.footer")}
                        </footer>
                    </main>

                    <aside className="sticky top-0 hidden h-fit pt-[72px] xl:block" aria-label={t("help.onThisPage")}>
                        <h2 className={`mb-3 text-sm font-semibold ${palette.muted}`}>{t("help.onThisPage")}</h2>
                        <nav className={`space-y-1 border-l ${palette.border}`}>
                            {[{ id: "quickstart-heading", title: t("help.quickstart") }, ...localizedSections.map(({ id, title }) => ({ id, title }))].map((item) => (
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