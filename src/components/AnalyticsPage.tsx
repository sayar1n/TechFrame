import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { TrendingUp, Download, Calendar, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { analyticsAPI, defectsAPI, projectsAPI } from "../utils/api";

interface AnalyticsPageProps {
  accessToken: string;
}

export function AnalyticsPage({ accessToken }: AnalyticsPageProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [defects, setDefects] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [analyticsData, defectsData, projectsData] = await Promise.all([
        analyticsAPI.getStats(accessToken),
        defectsAPI.getAll(accessToken),
        projectsAPI.getAll(accessToken)
      ]);

      setAnalytics(analyticsData);
      setDefects(defectsData.defects || []);
      setProjects(projectsData.projects || []);
      
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  const generateExport = () => {
    const csvData = defects.map(defect => ({
      'ID': defect.id,
      'Название': defect.title,
      'Статус': defect.status,
      'Приоритет': defect.priority,
      'Создан': new Date(defect.createdAt).toLocaleDateString('ru'),
      'Обновлен': new Date(defect.updatedAt).toLocaleDateString('ru'),
      'Срок': defect.dueDate ? new Date(defect.dueDate).toLocaleDateString('ru') : 'Не указан'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `defects_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Prepare chart data
  const statusChartData = analytics?.statusCount ? 
    Object.entries(analytics.statusCount).map(([status, count]) => ({
      status,
      count
    })) : [];

  const priorityChartData = analytics?.priorityCount ? 
    Object.entries(analytics.priorityCount).map(([priority, count]) => ({
      priority,
      count
    })) : [];

  // Generate timeline data
  const getTimelineData = () => {
    const timeline = {};
    defects.forEach(defect => {
      const date = new Date(defect.createdAt).toISOString().split('T')[0];
      timeline[date] = (timeline[date] || 0) + 1;
    });

    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('ru'),
        count
      }));
  };

  const timelineData = getTimelineData();

  // Project performance data
  const getProjectPerformance = () => {
    return projects.map(project => {
      const projectDefects = defects.filter(d => d.projectId === project.id);
      const totalDefects = projectDefects.length;
      const completedDefects = projectDefects.filter(d => d.status === 'Закрыта').length;
      const completionRate = totalDefects > 0 ? Math.round((completedDefects / totalDefects) * 100) : 0;

      return {
        name: project.name,
        total: totalDefects,
        completed: completedDefects,
        completionRate
      };
    }).filter(p => p.total > 0);
  };

  const projectPerformanceData = getProjectPerformance();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
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
          <h1 className="text-3xl font-bold">Аналитика и отчеты</h1>
          <p className="text-muted-foreground">Статистика и анализ дефектов</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все время</SelectItem>
              <SelectItem value="30">Последние 30 дней</SelectItem>
              <SelectItem value="7">Последние 7 дней</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={generateExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт в CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего дефектов</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDefects || 0}</div>
            <p className="text-xs text-muted-foreground">За выбранный период</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">Требуют внимания</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Процент выполнения</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.totalDefects ? 
                Math.round((analytics.statusCount['Закрыта'] || 0) / analytics.totalDefects * 100) : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">Завершенных дефектов</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активные проекты</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">В работе</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по приоритетам</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ priority, count }) => `${priority}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Динамика создания дефектов</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Производительность проектов</CardTitle>
        </CardHeader>
        <CardContent>
          {projectPerformanceData.length > 0 ? (
            <div className="space-y-4">
              {projectPerformanceData.map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{project.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {project.completed}/{project.total}
                      </span>
                      <Badge variant={project.completionRate > 80 ? 'default' : project.completionRate > 50 ? 'secondary' : 'destructive'}>
                        {project.completionRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Нет данных для отображения</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}