import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { roomParticipants, chatMessages, type ChatMessage, type TodoItem } from "@/lib/mock-data";
import { Play, Pause, RotateCcw, Send, Swords, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function StudyRoom() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(chatMessages);
  const [newMsg, setNewMsg] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 't1', text: 'مراجعة الفصل الأول', done: true },
    { id: 't2', text: 'حل تمارين الفصل الثاني', done: false },
    { id: 't3', text: 'قراءة ملخص الفصل الثالث', done: false },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!isBreak) {
            toast.success("انتهى وقت الدراسة! وقت الاستراحة 🎉");
            setIsBreak(true);
            return 5 * 60;
          } else {
            toast.info("انتهت الاستراحة! يلا نرجع للمذاكرة 💪");
            setIsBreak(false);
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const sendMessage = () => {
    if (!newMsg.trim()) return;
    setMessages((prev) => [...prev, { id: `c${Date.now()}`, user: 'أحمد', text: newMsg, time: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) }]);
    setNewMsg("");
    setTimeout(() => chatRef.current?.scrollTo(0, chatRef.current.scrollHeight), 50);
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    setTodos((prev) => [...prev, { id: `t${Date.now()}`, text: newTodo, done: false }]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const timerPercent = isBreak ? (timeLeft / (5 * 60)) * 100 : (timeLeft / (25 * 60)) * 100;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold glow-text-purple">غرفة الرياضيات المتقدمة</h1>
        <Button
          variant="outline"
          className="gap-2 border-secondary/50 text-secondary hover:bg-secondary/10"
          onClick={() => toast.info("تم إرسال طلب التحدي! ⚔️")}
        >
          <Swords className="h-4 w-4" />
          تحدي
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Timer + Participants Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pomodoro Timer */}
          <Card className={`border-border/50 ${isRunning ? 'animate-pulse-glow' : ''}`}>
            <CardContent className="pt-6 text-center">
              <Badge variant={isBreak ? "secondary" : "default"} className="mb-4">
                {isBreak ? "🧘 استراحة" : "📖 وقت الدراسة"}
              </Badge>
              <motion.div
                className="text-6xl md:text-7xl font-bold font-mono bg-gradient-to-l from-neon-purple to-neon-blue bg-clip-text text-transparent"
                key={timeLeft}
                initial={{ scale: 1.02 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.1 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
              {/* Simple progress bar */}
              <div className="w-full h-2 bg-muted rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${timerPercent}%`,
                    background: 'linear-gradient(90deg, hsl(263 70% 66%), hsl(187 94% 43%))',
                  }}
                />
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  className="bg-primary hover:bg-primary/90 gap-2"
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isRunning ? "إيقاف" : "ابدأ"}
                </Button>
                <Button size="lg" variant="outline" onClick={resetTimer} className="border-border/50">
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">المتواجدون ({roomParticipants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roomParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="text-xl">{p.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs">
                        {p.status === 'studying' ? (
                          <span className="text-green-400">🟢 يذاكر</span>
                        ) : (
                          <span className="text-yellow-400">🟡 استراحة</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Todo List */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">قائمة المهام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                    <Checkbox
                      checked={todo.done}
                      onCheckedChange={() => toggleTodo(todo.id)}
                    />
                    <span className={`text-sm flex-1 ${todo.done ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="أضف مهمة جديدة..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  className="bg-muted/30 border-border/50"
                />
                <Button size="icon" onClick={addTodo} variant="outline" className="border-border/50 shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Column */}
        <Card className="border-border/50 flex flex-col h-[600px] lg:h-auto">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">الدردشة</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-3 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-medium text-primary">{msg.user}</span>
                  <span className="text-muted-foreground text-xs mx-2">{msg.time}</span>
                  <p className="text-foreground/90 mt-0.5">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="اكتب رسالة..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                className="bg-muted/30 border-border/50"
              />
              <Button size="icon" onClick={sendMessage} className="bg-primary shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
