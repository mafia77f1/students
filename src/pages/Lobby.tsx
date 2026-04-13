import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { studyRooms, categories } from "@/lib/mock-data";
import { Search, Plus, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Lobby() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = studyRooms.filter((room) => {
    const matchCat = filter === "all" || room.category === filter;
    const matchSearch = room.name.includes(search) || room.host.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold glow-text-purple">صالة الغرف</h1>
        <Button className="bg-gradient-to-l from-neon-purple to-neon-blue hover:opacity-90 gap-2">
          <Plus className="h-4 w-4" />
          إنشاء غرفة
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ابحث عن غرفة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 bg-card border-border/50"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={filter === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(cat.id)}
            className={filter === cat.id ? "bg-primary" : "border-border/50"}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className="cursor-pointer hover:glow-purple transition-all duration-300 border-border/50 hover:border-primary/30"
              onClick={() => navigate(`/room/${room.id}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{room.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">المضيف: {room.host}</p>
                  </div>
                  <Badge variant="secondary" className="bg-secondary/20 text-secondary shrink-0">
                    {categories.find((c) => c.id === room.category)?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{room.participants}/{room.maxParticipants}</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary text-sm font-medium">
                    <span>انضمام</span>
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
