import { Home, FileText, BarChart3, Settings, Building, Users, LogOut, Shield } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "./ui/sidebar";

const allMenuItems = [
  {
    title: "Дашборд",
    url: "/",
    icon: Home,
    roles: ["observer", "engineer", "manager", "admin"]
  },
  {
    title: "Дефекты",
    url: "/defects",
    icon: FileText,
    roles: ["observer", "engineer", "manager", "admin"]
  },
  {
    title: "Проекты",
    url: "/projects",
    icon: Building,
    roles: ["observer", "engineer", "manager", "admin"]
  },
  {
    title: "Аналитика",
    url: "/analytics",
    icon: BarChart3,
    roles: ["observer", "engineer", "manager", "admin"]
  },
  {
    title: "Администратор",
    url: "/admin",
    icon: Shield,
    roles: ["admin"]
  },
];

interface AppSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userInfo?: { name: string; role: string } | null;
}

export function AppSidebar({ currentPage, onNavigate, onLogout, userInfo }: AppSidebarProps) {
  const userRole = userInfo?.role || 'observer';
  
  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Дефектолог</h2>
          <p className="text-sm text-muted-foreground">Управление дефектами</p>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => onNavigate(item.url)}
                    isActive={currentPage === item.url}
                    className="h-10"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-5">
        {userInfo && (
          <div className="mb-3">
            <p className="text-sm font-medium">{userInfo.name}</p>
            <p className="text-xs text-muted-foreground">{userInfo.role}</p>
          </div>
        )}
        <SidebarMenuButton onClick={onLogout} className="w-full h-10">
          <LogOut className="h-5 w-5" />
          <span>Выйти</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}