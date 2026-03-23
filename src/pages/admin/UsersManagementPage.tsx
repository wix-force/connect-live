import { useEffect, useState } from 'react';
import { Users, Shield, Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { useAppSelector, useAppDispatch } from '@/store';
import { fetchAdminUsers } from '@/store/slices/adminSlice';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';

export default function UsersManagementPage() {
  const dispatch = useAppDispatch();
  const { users, usersTotal, usersPage } = useAppSelector(s => s.admin);
  const limit = 20;

  useEffect(() => { dispatch(fetchAdminUsers({ page: 1, limit })); }, [dispatch]);

  const handleBan = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    try {
      await adminService.banUser(userId);
      toast.success('User banned');
      dispatch(fetchAdminUsers({ page: usersPage, limit }));
    } catch { toast.error('Failed to ban user'); }
  };

  const handlePromote = async (userId: string) => {
    try {
      await adminService.updateUserRole(userId, 'admin');
      toast.success('User promoted to admin');
      dispatch(fetchAdminUsers({ page: usersPage, limit }));
    } catch { toast.error('Failed to update role'); }
  };

  const totalPages = Math.ceil(usersTotal / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Users Management</h1>
        <Badge variant="secondary">{usersTotal} total users</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
              ) : users.map(u => (
                <TableRow key={u._id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize text-xs">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {u.role !== 'admin' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePromote(u._id)} title="Promote to admin">
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleBan(u._id)} title="Ban user" className="text-destructive hover:text-destructive">
                        <Ban className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={usersPage <= 1} onClick={() => dispatch(fetchAdminUsers({ page: usersPage - 1, limit }))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {usersPage} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={usersPage >= totalPages} onClick={() => dispatch(fetchAdminUsers({ page: usersPage + 1, limit }))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
