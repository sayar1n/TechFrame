import React, { useState, useEffect } from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
import { SidebarProvider, SidebarInset } from "./components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { DefectsPage } from "./components/DefectsPage";
import { CreateDefectPage } from "./components/CreateDefectPage";
import { DefectDetailPage } from "./components/DefectDetailPage";
import { ProjectsPage } from "./components/ProjectsPage";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { AdminPage } from "./components/AdminPage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState("/");
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const { projectId, publicAnonKey } = await import("./utils/supabase/info");
        
        const supabase = createClient(
          `https://${projectId}.supabase.co`,
          publicAnonKey
        );

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          setAccessToken(session.access_token);
          setUserInfo({
            name: session.user.user_metadata?.name || session.user.email,
            role: session.user.user_metadata?.role || 'observer'
          });
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (token: string) => {
    setAccessToken(token);
    toast.success("Вход выполнен успешно");
    
    // Get user info from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserInfo({
        name: payload.user_metadata?.name || payload.email,
        role: payload.user_metadata?.role || 'observer'
      });
    } catch (error) {
      console.error('Error parsing token:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const { projectId, publicAnonKey } = await import("./utils/supabase/info");
      
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );

      await supabase.auth.signOut();
      setAccessToken(null);
      setUserInfo(null);
      setCurrentPage("/");
      toast.success("Выход выполнен успешно");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Ошибка при выходе");
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    setSelectedDefectId(null);
  };

  const handleCreateDefect = () => {
    setCurrentPage("/create-defect");
  };

  const handleViewDefect = (defectId: string) => {
    setSelectedDefectId(defectId);
    setCurrentPage("/defect-detail");
  };

  const handleDefectCreated = () => {
    setCurrentPage("/defects");
    toast.success("Дефект успешно создан");
  };

  const handleBackToDefects = () => {
    setCurrentPage("/defects");
    setSelectedDefectId(null);
  };

  // If not authenticated, show auth page
  if (!accessToken) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "/":
        return <Dashboard accessToken={accessToken} />;
      case "/defects":
        return (
          <DefectsPage 
            accessToken={accessToken} 
            onCreateDefect={handleCreateDefect}
            onViewDefect={handleViewDefect}
            userRole={userInfo?.role}
          />
        );
      case "/create-defect":
        return (
          <CreateDefectPage 
            accessToken={accessToken} 
            onBack={handleBackToDefects}
            onDefectCreated={handleDefectCreated}
          />
        );
      case "/defect-detail":
        return selectedDefectId ? (
          <DefectDetailPage 
            accessToken={accessToken} 
            defectId={selectedDefectId}
            onBack={handleBackToDefects}
            userRole={userInfo?.role}
          />
        ) : (
          <DefectsPage 
            accessToken={accessToken} 
            onCreateDefect={handleCreateDefect}
            onViewDefect={handleViewDefect}
            userRole={userInfo?.role}
          />
        );
      case "/projects":
        return <ProjectsPage accessToken={accessToken} />;
      case "/analytics":
        return <AnalyticsPage accessToken={accessToken} />;
      case "/admin":
        return <AdminPage accessToken={accessToken} />;
      default:
        return <Dashboard accessToken={accessToken} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <AppSidebar 
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userInfo={userInfo}
        />
        
        <SidebarInset className="flex-1 overflow-auto">
          {renderCurrentPage()}
        </SidebarInset>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </SidebarProvider>
  );
}