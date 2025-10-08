import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { ArrowLeft, MessageSquare, History, Edit, Save } from "lucide-react";
import { defectsAPI, usersAPI, projectsAPI } from "../utils/api";

interface DefectDetailPageProps {
  accessToken: string;
  defectId: string;
  onBack: () => void;
  userRole: string;
}

export function DefectDetailPage({ accessToken, defectId, onBack, userRole }: DefectDetailPageProps) {
  const [defect, setDefect] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  
  // Comment state
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [accessToken, defectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [defectData, usersData, projectsData] = await Promise.all([
        defectsAPI.getById(accessToken, defectId),
        usersAPI.getAll(accessToken),
        projectsAPI.getAll(accessToken)
      ]);

      setDefect(defectData.defect);
      setHistory(defectData.history || []);
      setUsers(usersData.users || []);
      setProjects(projectsData.projects || []);
      setEditData(defectData.defect);
      
    } catch (err: any) {
      console.error('Defect detail fetch error:', err);
      setError(err.message || 'Ошибка загрузки дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await defectsAPI.update(accessToken, defectId, editData);
      await fetchData(); // Refresh data
      setIsEditing(false);
    } catch (err: any) {
      console.error('Update defect error:', err);
      setError(err.message || 'Ошибка обновления дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setAddingComment(true);
      await defectsAPI.addComment(accessToken, defectId, newComment);
      setNewComment("");
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Add comment error:', err);
      setError(err.message || 'Ошибка добавления комментария');
    } finally {
      setAddingComment(false);
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

  if (loading && !defect) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error && !defect) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!defect) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{defect.title}</h1>
            <p className="text-muted-foreground">Детали дефекта</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleSaveEdit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
              <Button variant="outline" onClick={() => {
                setIsEditing(false);
                setEditData(defect);
              }}>
                Отмена
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Описание</label>
                    <Textarea
                      value={editData.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setEditData((prev: any) => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Статус</label>
                      <Select 
                        value={editData.status} 
                        onValueChange={(value: string) =>
                          setEditData((prev: any) => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Новая">Новая</SelectItem>
                          <SelectItem value="В работе">В работе</SelectItem>
                          <SelectItem value="На проверке">На проверке</SelectItem>
                          <SelectItem value="Закрыта">Закрыта</SelectItem>
                          <SelectItem value="Отменена">Отменена</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Приоритет</label>
                      <Select 
                        value={editData.priority} 
                        onValueChange={(value: string) =>
                          setEditData((prev: any) => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Низкий">Низкий</SelectItem>
                          <SelectItem value="Средний">Средний</SelectItem>
                          <SelectItem value="Высокий">Высокий</SelectItem>
                          <SelectItem value="Критический">Критический</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Исполнитель</label>
                    <Select 
                      value={editData.assignee} 
                      onValueChange={(value: string) =>
                        setEditData((prev: any) => ({ ...prev, assignee: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Описание</h3>
                    <p className="text-muted-foreground mt-1">{defect.description}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(defect.status)}`} />
                      <span className="font-medium">{defect.status}</span>
                    </div>
                    <Badge variant={getPriorityColor(defect.priority)}>
                      {defect.priority}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Комментарии
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {defect.comments && defect.comments.length > 0 ? (
                defect.comments.map((comment: { author: string, timestamp: string, comment: string }, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{getUserName(comment.author)}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(comment.timestamp).toLocaleString('ru')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                    {index < defect.comments.length - 1 && <Separator />}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">Комментарии отсутствуют</p>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <Textarea
                  placeholder="Добавить комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={addingComment || !newComment.trim()}
                  size="sm"
                >
                  {addingComment ? "Добавление..." : "Добавить комментарий"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Детали</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm font-medium">Проект:</span>
                <p className="text-sm text-muted-foreground">{getProjectName(defect.projectId)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium">Исполнитель:</span>
                <p className="text-sm text-muted-foreground">{getUserName(defect.assignee)}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium">Создан:</span>
                <p className="text-sm text-muted-foreground">
                  {new Date(defect.createdAt).toLocaleString('ru')}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium">Обновлен:</span>
                <p className="text-sm text-muted-foreground">
                  {new Date(defect.updatedAt).toLocaleString('ru')}
                </p>
              </div>
              
              {defect.dueDate && (
                <div>
                  <span className="text-sm font-medium">Срок выполнения:</span>
                  <p className={`text-sm ${
                    new Date(defect.dueDate) < new Date() && defect.status !== 'Закрыта' 
                      ? 'text-red-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {new Date(defect.dueDate).toLocaleDateString('ru')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-4 w-4 mr-2" />
                История изменений
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((entry, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{getUserName(entry.userId)}</span>
                          <span className="text-muted-foreground">
                            {new Date(entry.timestamp).toLocaleDateString('ru')}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{entry.details}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">История изменений пуста</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}