import { useEffect, useState } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useTheme } from "../contexts/ThemeContext";

export default function ThreadsPage() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";

  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    const { data } = await supabase
      .from("threads")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) setThreads(data);
  }

  async function deleteThread(id) {
    if (!window.confirm("Delete this thread?")) return;

    await supabase
      .from("threads")
      .delete()
      .eq("id", id);

    setThreads((prev) => prev.filter((t) => t.id !== id));
  }

  function newThread() {
    navigate("/dashboard");
  }

  function openThread(thread) {
    navigate("/dashboard", {
      state: {
        threadId: thread.id,
      },
    });
  }

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen ${darkMode ? "bg-[#0e0e0e]" : "bg-gray-50"
        }`}
    >
      {/* Header */}
      <div
        className={`px-8 py-6 border-b flex items-center justify-between ${darkMode
            ? "bg-[#111111] border-[#222]"
            : "bg-white border-gray-200"
          }`}
      >
        <h1
          className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-900"
            }`}
        >
          Threads
        </h1>

        <button
          onClick={newThread}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          New Thread
        </button>
      </div>

      {/* Search */}
      <div className="p-6">
        <div className="relative mb-6">
          <Search
            className={`absolute left-3 top-3 w-4 h-4 ${darkMode ? "text-gray-500" : "text-gray-400"
              }`}
          />

          <input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${darkMode
                ? "bg-[#151515] border-[#333] text-white"
                : "bg-white border-gray-300"
              }`}
          />
        </div>

        {/* Thread List */}

        <div className="space-y-3">
          {filteredThreads.length === 0 ? (
            <div
              className={`text-center py-16 ${darkMode ? "text-gray-500" : "text-gray-400"
                }`}
            >
              No threads found
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => navigate(`/dashboard/${thread.id}`)}
                className={`cursor-pointer rounded-xl border p-5 transition flex justify-between items-center ${darkMode
                    ? "bg-[#111111] border-[#222] hover:bg-[#181818]"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div>
                  <h3
                    className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"
                      }`}
                  >
                    {thread.title}
                  </h3>

                  <p
                    className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                  >
                    {new Date(thread.updated_at).toLocaleString()}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteThread(thread.id);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}