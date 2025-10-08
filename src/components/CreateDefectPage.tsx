import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { ArrowLeft, Save } from "lucide-react";
import { defectsAPI, projectsAPI, usersAPI } from "../utils/api";

interface CreateDefectPageProps {
  accessToken: string;
  onBack: () => void;
  onDefectCreated: () => void;
}

export function CreateDefectPage({ accessToken, onBack, onDefectCreated }: CreateDefectPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "",
    assignee: "",
    projectId: "",
    dueDate: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsData, usersData] = await Promise.all([
          projectsAPI.getAll(accessToken),
          usersAPI.getAll(accessToken)
        ]);

        setProjects(projectsData.projects || []);
        setUsers(usersData.users || []);
        
      } catch (err: any) {
        console.error('Data fetch error:', err);
        setError(err.message || 'Ошибка загрузки данных');
      }
    };

    fetchData();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await defectsAPI.create(accessToken, formData);
      setSuccess('Дефект успешно создан');
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "",
        assignee: "",
        projectId: "",
        dueDate: ""
      });
      
      // Call callback after a short delay
      setTimeout(() => {
        onDefectCreated();
      }, 1500);
      
    } catch (err: any) {
      console.error('Create defect error:', err);
      setError(err.message || 'Ошибка создания дефекта');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Создать дефект</h1>
          <p className="text-muted-foreground">Добавление нового дефекта в систему</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Информация о дефекте</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Название дефекта</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Краткое описание дефекта"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Подробное описание дефекта"
                rows={4}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Низкий">Низкий</SelectItem>
                    <SelectItem value="Средний">Средний</SelectItem>
                    <SelectItem value="Высокий">Высокий</SelectItem>
                    <SelectItem value="Критический">Критический</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Проект</Label>
                <Select value={formData.projectId} onValueChange={(value) => handleInputChange('projectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите проект" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assignee">Исполнитель</Label>
                <Select value={formData.assignee} onValueChange={(value) => handleInputChange('assignee', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите исполнителя" />
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

              <div className="space-y-2">
                <Label htmlFor="dueDate">Срок выполнения</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Создание..." : "Создать дефект"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack}>
                Отмена
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}