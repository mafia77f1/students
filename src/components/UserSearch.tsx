import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface UserHit {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  role: string;
}

export function UserSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserHit[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      const term = q.trim();
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, role")
        .or(`name.ilike.%${term}%,username.ilike.%${term}%`)
        .limit(10);
      setResults((data as any) || []);
      setOpen(true);
    }, 250);
  }, [q]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder="ابحث عن طالب أو أستاذ..."
          className="pr-10 pl-10"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setResults([]); setOpen(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute z-30 mt-2 w-full bg-popover border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  navigate(`/user/${u.id}`);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted text-right"
              >
                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-black text-sm overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (u.name || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{u.name || "بدون اسم"}</p>
                  {u.username && <p className="text-[11px] text-muted-foreground" dir="ltr">@{u.username}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground">{u.role === "teacher" ? "أستاذ" : "طالب"}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
