import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { toast } from "sonner@2.0.3";
import { usersAPI } from "../utils/api";

interface AdminPageProps {
  accessToken: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

const roleLabels = {
  observer: "Наблюдатель",
  engineer: "Инженер", 
  manager: "Менеджер",
  admin: "Администратор"
};

const roleColors = {
  observer: "secondary",
  engineer: "default",
  manager: "outline",
  admin: "destructive"
} as const;

export function AdminPage({ accessToken }: AdminPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll(accessToken);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error("Ошибка при загрузке пользователей");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingUser(userId);
      await usersAPI.updateRole(accessToken, userId, newRole);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success("Роль пользователя успешно обновлена");
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error("Ошибка при обновлении роли пользователя");
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return roleColors[role as keyof typeof roleColors] || "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1>Загрузка...</h1>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1>Управление пользователями</h1>
        <p className="text-muted-foreground">
          Управление ролями и правами доступа пользователей системы
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Пользователи системы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Текущая роль</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        disabled={updatingUser === user.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="observer">Наблюдатель</SelectItem>
                          <SelectItem value="engineer">Инженер</SelectItem>
                          <SelectItem value="manager">Менеджер</SelectItem>
                          <SelectItem value="admin">Администратор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Описание ролей</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">Наблюдатель</Badge>
              <span className="text-sm">Просмотр дефектов и отчётов</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Только чтение. Может просматривать дашборд, дефекты, проекты и аналитику.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default">Инженер</Badge>
              <span className="text-sm">Регистрация и обновление дефектов</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Может создавать новые дефекты, редактировать существующие и добавлять комментарии.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">Менеджер</Badge>
              <span className="text-sm">Управление задачами и отчётность</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Может назначать исполнителей, изменять статусы, создавать проекты и формировать отчёты.
            </p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive">Администратор</Badge>
              <span className="text-sm">Полный доступ к системе</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Полные права доступа, включая управление пользователями и их ролями.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}