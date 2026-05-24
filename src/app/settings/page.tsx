"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { formatDate } from "@/lib/utils";
import { Plus, Loader2, Shield, Users, Tag, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData { id: string; name: string; email: string; role: string; active: boolean; createdAt: string; }
interface CategoryData { id: string; name: string; description?: string | null; _count?: { products: number }; }
interface BrandData { id: string; name: string; description?: string | null; _count?: { products: number }; }

export default function SettingsPage() {
  const { get, post } = useApi();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [catForm, setCatForm] = useState({ name: "", description: "" });
  const [brandForm, setBrandForm] = useState({ name: "", description: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [usersRes, catsRes, brandsRes] = await Promise.all([
      get<unknown>("/api/users"),
      get<unknown>("/api/categories"),
      get<unknown>("/api/brands"),
    ]);
    if (usersRes.data) setUsers((usersRes.data as { data: UserData[] }).data || []);
    if (catsRes.data) setCategories((catsRes.data as { data: CategoryData[] }).data || []);
    if (brandsRes.data) setBrands((brandsRes.data as { data: BrandData[] }).data || []);
  };

  const saveUser = async () => {
    if (!userForm.name || !userForm.email || !userForm.password) return;
    setSaving(true);
    const { error } = await post("/api/users", userForm);
    if (!error) { setShowUserModal(false); loadAll(); toast({ title: "Usuario creado" }); setUserForm({ name: "", email: "", password: "", role: "EMPLOYEE" }); }
    else alert(error);
    setSaving(false);
  };

  const saveCat = async () => {
    if (!catForm.name) return;
    setSaving(true);
    const { error } = await post("/api/categories", catForm);
    if (!error) { setShowCatModal(false); loadAll(); toast({ title: "Categoría creada" }); setCatForm({ name: "", description: "" }); }
    else alert(error);
    setSaving(false);
  };

  const saveBrand = async () => {
    if (!brandForm.name) return;
    setSaving(true);
    const { error } = await post("/api/brands", brandForm);
    if (!error) { setShowBrandModal(false); loadAll(); toast({ title: "Marca creada" }); setBrandForm({ name: "", description: "" }); }
    else alert(error);
    setSaving(false);
  };

  return (
    <AppLayout title="Configuración">
      <div className="space-y-5 animate-fade-in">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" />Usuarios</TabsTrigger>
            <TabsTrigger value="categories"><Tag className="mr-2 h-4 w-4" />Categorías</TabsTrigger>
            <TabsTrigger value="brands"><Zap className="mr-2 h-4 w-4" />Marcas</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{users.length} Usuarios</CardTitle>
                <Button size="sm" onClick={() => setShowUserModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Usuario
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                          {u.role === "ADMIN" ? "Admin" : "Empleado"}
                        </Badge>
                        {!u.active && <Badge variant="destructive">Inactivo</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{categories.length} Categorías</CardTitle>
                <Button size="sm" onClick={() => setShowCatModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Categoría
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                      </div>
                      <Badge variant="secondary">{c._count?.products || 0}</Badge>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-sm text-gray-400 col-span-3">No hay categorías</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brands">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">{brands.length} Marcas</CardTitle>
                <Button size="sm" onClick={() => setShowBrandModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Marca
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {brands.map((b) => (
                    <div key={b.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                      <div>
                        <p className="text-sm font-medium">{b.name}</p>
                        {b.description && <p className="text-xs text-gray-400">{b.description}</p>}
                      </div>
                      <Badge variant="secondary">{b._count?.products || 0}</Badge>
                    </div>
                  ))}
                  {brands.length === 0 && <p className="text-sm text-gray-400 col-span-3">No hay marcas</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Modal */}
        <Dialog open={showUserModal} onOpenChange={(o) => !o && setShowUserModal(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuevo Usuario</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Contraseña *</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rol</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancelar</Button>
              <Button onClick={saveUser} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Category Modal */}
        <Dialog open={showCatModal} onOpenChange={(o) => !o && setShowCatModal(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Categoría</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Ej: Smartphones, Consolas..." /></div>
              <div className="space-y-1.5"><Label>Descripción</Label><Input value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCatModal(false)}>Cancelar</Button>
              <Button onClick={saveCat} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Brand Modal */}
        <Dialog open={showBrandModal} onOpenChange={(o) => !o && setShowBrandModal(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Marca</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} placeholder="Ej: Apple, Samsung, Sony..." /></div>
              <div className="space-y-1.5"><Label>Descripción</Label><Input value={brandForm.description} onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBrandModal(false)}>Cancelar</Button>
              <Button onClick={saveBrand} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
