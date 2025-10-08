import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Calendar, Users, FileText } from "lucide-react";
import { projectsAPI, defectsAPI, usersAPI } from "../utils/api";

interface ProjectsPageProps {
  accessToken: string;
}

export function ProjectsPage({ accessToken }: ProjectsPageProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New project form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [projectsData, defectsData, usersData] = await Promise.all([
        projectsAPI.getAll(accessToken),
        defectsAPI.getAll(accessToken),
        usersAPI.getAll(accessToken)
      ]);

      setProjects(projectsData.projects || []);
      setDefects(defectsData.defects || []);
      setUsers(usersData.users || []);
      
    } catch (err: any) {
      console.error('Projects fetch error:', err);
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await projectsAPI.create(accessToken, newProject);
      setNewProject({ name: "", description: "", startDate: "", endDate: "" });
      setIsCreateDialogOpen(false);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Create project error:', err);
      setError(err.message || 'Ошибка создания проекта');
    } finally {
      setCreateLoading(false);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectDefects = defects.filter(d => d.projectId === projectId);
    const totalDefects = projectDefects.length;
    const completedDefects = projectDefects.filter(d => d.status === 'Закрыта').length;
    const activeDefects = projectDefects.filter(d => d.status === 'В работе').length;
    const overdueDefects = projectDefects.filter(d => 
      d.dueDate && new Date(d.dueDate) < new Date() && d.status !== 'Закрыта'
    ).length;

    return { totalDefects, completedDefects, activeDefects, overdueDefects };
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Неизвестно';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Проекты</h1>
          <p className="text-muted-foreground">Управление строительными проектами</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать проект
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Создать новый проект</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Название проекта</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Название строительного объекта"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-description">Описание</Label>
                <Textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Описание проекта"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Дата начала</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={newProject.startDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">Дата окончания</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={newProject.endDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Создание..." : "Создать"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Проекты не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const stats = getProjectStats(project.id);
            const completionRate = stats.totalDefects > 0 
              ? Math.round((stats.completedDefects / stats.totalDefects) * 100) 
              : 0;

            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Создан: {getUserName(project.createdBy)}
                      </p>
                    </div>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status === 'active' ? 'Активный' : 'Завершен'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  
                  {/* Project Dates */}
                  {(project.startDate || project.endDate) && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.startDate && new Date(project.startDate).toLocaleDateString('ru')}
                        {project.startDate && project.endDate && ' - '}
                        {project.endDate && new Date(project.endDate).toLocaleDateString('ru')}
                      </span>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Дефекты</span>
                      </div>
                      <span className="font-medium">{stats.totalDefects}</span>
                    </div>
                    
                    {stats.totalDefects > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Завершено:</span>
                          <span className="text-green-600">{stats.completedDefects}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>В работе:</span>
                          <span className="text-yellow-600">{stats.activeDefects}</span>
                        </div>
                        
                        {stats.overdueDefects > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Просрочено:</span>
                            <span className="text-red-600">{stats.overdueDefects}</span>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Прогресс:</span>
                            <span>{completionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}