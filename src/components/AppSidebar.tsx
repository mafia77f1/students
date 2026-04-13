import { LayoutDashboard, Users, Trophy, User, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "صالة الغرف", url: "/lobby", icon: Users },
  { title: "غرفة الدراسة", url: "/room/r1", icon: BookOpen },
  { title: "لوحة الصدارة", url: "/leaderboard", icon: Trophy },
  { title: "الملف الشخصي", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarContent className="pt-4">
        <div className="px-4 pb-4 mb-2 border-b border-border">
          {!collapsed ? (
            <h1 className="text-xl font-bold bg-gradient-to-l from-neon-purple to-neon-blue bg-clip-text text-transparent">
              ستدي زون
            </h1>
          ) : (
            <span className="text-2xl block text-center">📚</span>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/50 flex items-center gap-3"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
