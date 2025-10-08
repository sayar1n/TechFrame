import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Plus, Search, Filter, Eye, Edit } from "lucide-react";
import { defectsAPI, projectsAPI, usersAPI } from "../utils/api";

interface DefectsPageProps {
  accessToken: string;
  onCreateDefect: () => void;
  onViewDefect: (defectId: string) => void;
  userRole?: string;
}

export function DefectsPage({ accessToken, onCreateDefect, onViewDefect, userRole = 'observer' }: DefectsPageProps) {
  const [defects, setDefects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [defectsData, projectsData, usersData] = await Promise.all([
          defectsAPI.getAll(accessToken),
          projectsAPI.getAll(accessToken),
          usersAPI.getAll(accessToken)
        ]);

        setDefects(defectsData.defects || []);
        setProjects(projectsData.projects || []);
        setUsers(usersData.users || []);
        
      } catch (err: any) {
        console.error('Defects fetch error:', err);
        setError(err.message || 'Ошибка загрузки дефектов');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Новая': return 'bg-blue-500';
      case 'В работе': return 'bg-yellow-500';
      case 'На проверке': return 'bg-orange-500';
      case 'Закрыта': return 'bg-green-500';
      case 'Отменена': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Критический': return 'destructive';
      case 'Высокий': return 'default';
      case 'Средний': return 'secondary';
      case 'Низкий': return 'outline';
      default: return 'outline';
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Неизвестно';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Неизвестно';
  };

  const filteredDefects = defects.filter(defect => {
    const matchesSearch = defect.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         defect.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || defect.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || defect.priority === priorityFilter;
    const matchesProject = projectFilter === "all" || defect.projectId === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-3xl font-bold">Дефекты</h1>
          <p className="text-muted-foreground">Управление дефектами проекта</p>
        </div>
        {(userRole === 'engineer' || userRole === 'manager' || userRole === 'admin') && (
          <Button onClick={onCreateDefect}>
            <Plus className="h-4 w-4 mr-2" />
            Создать дефект
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <Input
                placeholder="Поиск по названию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="Новая">Новая</SelectItem>
                <SelectItem value="В работе">В работе</SelectItem>
                <SelectItem value="На проверке">На проверке</SelectItem>
                <SelectItem value="Закрыта">Закрыта</SelectItem>
                <SelectItem value="Отменена">Отменена</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="Критический">Критический</SelectItem>
                <SelectItem value="Высокий">Высокий</SelectItem>
                <SelectItem value="Средний">Средний</SelectItem>
                <SelectItem value="Низкий">Низкий</SelectItem>
              </SelectContent>
            </Select>

            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Проект" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все проекты</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setProjectFilter("all");
              }}
            >
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Defects List */}
      <div className="space-y-4">
        {filteredDefects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Дефекты не найдены</p>
            </CardContent>
          </Card>
        ) : (
          filteredDefects.map((defect) => (
            <Card key={defect.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{defect.title}</h3>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(defect.status)}`} />
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {defect.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Проект: {getProjectName(defect.projectId)}</span>
                      <span>Исполнитель: {getUserName(defect.assignee)}</span>
                      <span>Создан: {new Date(defect.createdAt).toLocaleDateString('ru')}</span>
                      {defect.dueDate && (
                        <span className={new Date(defect.dueDate) < new Date() && defect.status !== 'Закрыта' ? 'text-red-600' : ''}>
                          Срок: {new Date(defect.dueDate).toLocaleDateString('ru')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityColor(defect.priority)}>
                      {defect.priority}
                    </Badge>
                    <Badge variant="outline">{defect.status}</Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDefect(defect.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}