'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useAdminStats, 
  useAdminUsers, 
  useDeleteUser, 
  useToggleUserActive,
  useMakeAdmin,
  useRemoveAdmin,
  useCreateUser,
  useUpdateUser,
  AdminUser 
} from '@/hooks/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Trash2, 
  Edit, 
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  CreditCard,
  PiggyBank,
  Bot,
  RefreshCw,
  Crown,
  UserMinus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    defaultCurrency: 'EUR',
    isActive: true,
  });

  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: usersData, isLoading: usersLoading, refetch } = useAdminUsers(page, 20, search);
  
  const deleteUserMutation = useDeleteUser();
  const toggleActiveMutation = useToggleUserActive();
  const makeAdminMutation = useMakeAdmin();
  const removeAdminMutation = useRemoveAdmin();
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything while redirecting to login
  if (!isAuthenticated) {
    return null;
  }

  // Check if current user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
        <p className="text-muted-foreground mb-4">Sie benötigen Admin-Rechte um diese Seite zu sehen.</p>
        <Button onClick={() => router.push('/dashboard')}>Zurück zum Dashboard</Button>
      </div>
    );
  }

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      defaultCurrency: user.defaultCurrency,
      isActive: user.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateUser = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      defaultCurrency: 'EUR',
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);
      toast({ title: 'Benutzer gelöscht', description: `${selectedUser.email} wurde gelöscht.` });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.response?.data?.error || 'Löschen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await toggleActiveMutation.mutateAsync(user.id);
      toast({ 
        title: user.isActive ? 'Benutzer deaktiviert' : 'Benutzer aktiviert',
        description: `${user.email} wurde ${user.isActive ? 'deaktiviert' : 'aktiviert'}.`
      });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.response?.data?.error || 'Aktion fehlgeschlagen', variant: 'destructive' });
    }
  };

  const handleToggleAdmin = async (user: AdminUser) => {
    try {
      if (user.role === 'admin') {
        await removeAdminMutation.mutateAsync(user.id);
        toast({ title: 'Admin-Rolle entfernt', description: `${user.email} ist jetzt ein normaler Benutzer.` });
      } else {
        await makeAdminMutation.mutateAsync(user.id);
        toast({ title: 'Zum Admin befördert', description: `${user.email} ist jetzt ein Admin.` });
      }
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.response?.data?.error || 'Aktion fehlgeschlagen', variant: 'destructive' });
    }
  };

  const submitCreateUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
        name: formData.name || undefined,
        role: formData.role,
        defaultCurrency: formData.defaultCurrency,
      });
      toast({ title: 'Benutzer erstellt', description: `${formData.email} wurde erstellt.` });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.response?.data?.error || 'Erstellen fehlgeschlagen', variant: 'destructive' });
    }
  };

  const submitUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      const updateData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
        defaultCurrency: formData.defaultCurrency,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await updateUserMutation.mutateAsync({ userId: selectedUser.id, data: updateData });
      toast({ title: 'Benutzer aktualisiert', description: `${formData.email} wurde aktualisiert.` });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.response?.data?.error || 'Aktualisieren fehlgeschlagen', variant: 'destructive' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Benutzerverwaltung und Systemübersicht</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Benutzer Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats?.users.total || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Benutzer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats?.users.active || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats?.users.admins || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Neu diese Woche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats?.users.newThisWeek || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transaktionen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats?.data.transactions || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Benutzer</CardTitle>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="E-Mail oder Name suchen..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button onClick={handleSearch} variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleCreateUser}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Benutzer
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Währung</TableHead>
                    <TableHead>Letzter Login</TableHead>
                    <TableHead>Registriert</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>{u.name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role === 'admin' ? (
                            <><Crown className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            'Benutzer'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'default' : 'destructive'}>
                          {u.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>{u.defaultCurrency}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(u.lastLoginAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(u)}
                            title="Bearbeiten"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(u)}
                            title={u.isActive ? 'Deaktivieren' : 'Aktivieren'}
                            disabled={u.id === user?.id}
                          >
                            {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAdmin(u)}
                            title={u.role === 'admin' ? 'Admin entfernen' : 'Zum Admin machen'}
                            disabled={u.id === user?.id}
                          >
                            {u.role === 'admin' ? <UserMinus className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u)}
                            title="Löschen"
                            disabled={u.id === user?.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData && usersData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Seite {usersData.pagination.page} von {usersData.pagination.totalPages} ({usersData.pagination.total} Benutzer)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(usersData.pagination.totalPages, p + 1))}
                      disabled={page === usersData.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Benutzer für die FinFlow App.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-Mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Max Mustermann"
              />
            </div>
            <div className="space-y-2">
              <Label>Passwort *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mindestens 8 Zeichen"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as 'user' | 'admin' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Währung</Label>
                <Select value={formData.defaultCurrency} onValueChange={(v) => setFormData({ ...formData, defaultCurrency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="MAD">MAD (د.م.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Abbrechen</Button>
            <Button 
              onClick={submitCreateUser} 
              disabled={!formData.email || !formData.password || formData.password.length < 8}
            >
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Daten von {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Neues Passwort (leer lassen um beizubehalten)</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Neues Passwort"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({ ...formData, role: v as 'user' | 'admin' })}
                  disabled={selectedUser?.id === user?.id}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Benutzer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Währung</Label>
                <Select value={formData.defaultCurrency} onValueChange={(v) => setFormData({ ...formData, defaultCurrency: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="CHF">CHF (Fr.)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="MAD">MAD (د.م.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.isActive ? 'active' : 'inactive'} 
                onValueChange={(v) => setFormData({ ...formData, isActive: v === 'active' })}
                disabled={selectedUser?.id === user?.id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={submitUpdateUser} disabled={!formData.email}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie <strong>{selectedUser?.email}</strong> löschen möchten? 
              Alle Daten dieses Benutzers (Konten, Transaktionen, Budgets, etc.) werden unwiderruflich gelöscht.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Abbrechen</Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Endgültig löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
