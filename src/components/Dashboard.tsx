import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { FileText, AlertTriangle, Clock, CheckCircle, TrendingUp } from "lucide-react";
import { analyticsAPI, defectsAPI } from "../utils/api";

interface DashboardProps {
  accessToken: string;
}

export function Dashboard({ accessToken }: DashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentDefects, setRecentDefects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [analyticsData, defectsData] = await Promise.all([
          analyticsAPI.getStats(accessToken),
          defectsAPI.getAll(accessToken)
        ]);

        setAnalytics(analyticsData);
        
        // Get recent defects (last 5)
        const sortedDefects = defectsData.defects
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRecentDefects(sortedDefects);
        
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

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

  const completionRate = analytics?.totalDefects ? 
    Math.round((analytics.statusCount['Закрыта'] || 0) / analytics.totalDefects * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">Обзор состояния дефектов</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего дефектов</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalDefects || 0}</div>
            <p className="text-xs text-muted-foreground">
              За все время
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Требуют внимания
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {analytics?.statusCount['В работе'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Активные задачи
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Завершено</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Процент выполнения
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по статусам</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.statusCount && Object.entries(analytics.statusCount).map(([status, count]: [string, any]) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{status}</span>
                  <span className="text-sm font-medium">{count}</span>
                </div>
                <Progress 
                  value={(count / analytics.totalDefects) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по приоритету</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.priorityCount && Object.entries(analytics.priorityCount).map(([priority, count]: [string, any]) => (
              <div key={priority} className="flex justify-between items-center">
                <Badge variant={getPriorityColor(priority)}>{priority}</Badge>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Defects */}
      <Card>
        <CardHeader>
          <CardTitle>Последние дефекты</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDefects.length === 0 ? (
            <p className="text-muted-foreground">Дефекты не найдены</p>
          ) : (
            <div className="space-y-4">
              {recentDefects.map((defect) => (
                <div key={defect.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{defect.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(defect.createdAt).toLocaleDateString('ru')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityColor(defect.priority)}>
                      {defect.priority}
                    </Badge>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(defect.status)}`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}