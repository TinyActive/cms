"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { hasPermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

// Types for our data
interface ServerTemplate {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  disk: number;
  price: number;
  isActive: boolean;
}

interface UserRole {
  id: string;
  name: string;
  maxServers: number;
  allowedServerTypes: string[];
}

interface ServerRegion {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  isAdminOnly: boolean;
}

export default function ServerConfigPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serverTemplates, setServerTemplates] = useState<ServerTemplate[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [serverRegions, setServerRegions] = useState<ServerRegion[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cpu: 1,
    ram: 1,
    disk: 25,
    price: 5,
    isActive: true,
    availableRoles: [] as string[]
  });

  // Kiểm tra xem người dùng có phải admin không
  useEffect(() => {
    if (session?.user?.permissions) {
      try {
        const permissions = JSON.parse(session.user.permissions as string);
        // Nếu user có hầu hết các quyền, coi như là admin
        if (permissions.includes('view_users') && 
            permissions.includes('edit_user') && 
            permissions.includes('view_settings')) {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error("Error parsing permissions:", e);
      }
    }
  }, [session]);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch server templates
        const templatesRes = await fetch('/api/server-templates');
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setServerTemplates(templatesData);
        }
        
        // Fetch user roles
        const rolesRes = await fetch('/api/roles');
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setUserRoles(rolesData);
        }
        
        // Fetch server regions
        const regionsRes = await fetch('/api/server-regions');
        if (regionsRes.ok) {
          const regionsData = await regionsRes.json();
          setServerRegions(regionsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load configuration data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Cho phép truy cập nếu là admin hoặc có quyền cụ thể
  if (!session?.user?.permissions || (!isAdmin && !hasPermission(session.user.permissions, PERMISSIONS.VIEW_SERVER_CONFIGS))) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[600px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view server configurations. This page is restricted to administrators.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Dashboard</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (roleId: string, checked: boolean) => {
    if (checked) {
      setFormData({
        ...formData,
        availableRoles: [...formData.availableRoles, roleId]
      });
    } else {
      setFormData({
        ...formData,
        availableRoles: formData.availableRoles.filter(id => id !== roleId)
      });
    }
  };

  // Handle template selection for editing
  const handleSelectTemplate = (templateId: string) => {
    const template = serverTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      // Get roles that have access to this template
      const templateRoles = userRoles
        .filter(role => role.allowedServerTypes.includes(templateId))
        .map(role => role.id);
      
      setFormData({
        name: template.name,
        cpu: template.cpu,
        ram: template.ram,
        disk: template.disk,
        price: template.price,
        isActive: template.isActive,
        availableRoles: templateRoles
      });
    }
  };

  // Handle saving template changes
  const handleSaveTemplate = async () => {
    try {
      setLoading(true);
      
      const endpoint = selectedTemplate 
        ? `/api/server-templates/${selectedTemplate}` 
        : '/api/server-templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cpu: Number(formData.cpu),
          ram: Number(formData.ram),
          disk: Number(formData.disk),
          price: Number(formData.price),
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: `Server template ${selectedTemplate ? 'updated' : 'created'} successfully`,
        });
        
        // Refresh data
        const templatesRes = await fetch('/api/server-templates');
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setServerTemplates(templatesData);
        }
        
        // Reset form
        setSelectedTemplate(null);
        setFormData({
          name: "",
          cpu: 1,
          ram: 1,
          disk: 25,
          price: 5,
          isActive: true,
          availableRoles: []
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save template');
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle role updates
  const handleSaveRole = async (roleId: string, maxServers: number, allowedTemplates: string[]) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxServers,
          allowedServerTypes: allowedTemplates
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Role settings updated successfully",
        });
        
        // Refresh roles data
        const rolesRes = await fetch('/api/roles');
        if (rolesRes.ok) {
          const rolesData = await rolesRes.json();
          setUserRoles(rolesData);
        }
        
        setSelectedRole(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update role",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle region updates
  const handleUpdateRegion = async (regionId: string, isActive: boolean, isAdminOnly: boolean) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/server-regions/${regionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive,
          isAdminOnly
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Region settings updated successfully",
        });
        
        // Refresh regions data
        const regionsRes = await fetch('/api/server-regions');
        if (regionsRes.ok) {
          const regionsData = await regionsRes.json();
          setServerRegions(regionsData);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update region');
      }
    } catch (error) {
      console.error("Error updating region:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update region",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-[600px]">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>
              Loading server configuration data...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Server Configurations</h2>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Server Templates</TabsTrigger>
          <TabsTrigger value="roles">User Roles & Limits</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
        </TabsList>

        {/* SERVER TEMPLATES TAB */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Server Templates</CardTitle>
              <CardDescription>
                Configure the server templates that users can create based on their role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>RAM (GB)</TableHead>
                      <TableHead>Disk (GB)</TableHead>
                      <TableHead>Price ($)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serverTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.cpu}</TableCell>
                        <TableCell>{template.ram}</TableCell>
                        <TableCell>{template.disk}</TableCell>
                        <TableCell>${template.price}/mo</TableCell>
                        <TableCell>{template.isActive ? 'Active' : 'Inactive'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectTemplate(template.id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button onClick={() => {
                  setSelectedTemplate(null);
                  setFormData({
                    name: "",
                    cpu: 1,
                    ram: 1,
                    disk: 25,
                    price: 5,
                    isActive: true,
                    availableRoles: []
                  });
                }}>
                  Add New Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {(selectedTemplate !== null || formData.name !== "") && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTemplate ? `Edit Template: ${formData.name}` : 'Create New Template'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($ per month)</Label>
                    <Input 
                      id="price" 
                      name="price"
                      type="number" 
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpu">CPU Cores</Label>
                    <Input 
                      id="cpu" 
                      name="cpu"
                      type="number" 
                      value={formData.cpu}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ram">RAM (GB)</Label>
                    <Input 
                      id="ram" 
                      name="ram"
                      type="number" 
                      value={formData.ram}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="disk">Disk (GB)</Label>
                    <Input 
                      id="disk" 
                      name="disk"
                      type="number" 
                      value={formData.disk}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="isActive" 
                        checked={formData.isActive}
                        onCheckedChange={(checked) => 
                          setFormData({...formData, isActive: checked as boolean})
                        }
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Label className="mb-2 block">Available to Roles</Label>
                  <div className="space-y-2">
                    {userRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`role-${role.id}`} 
                          checked={formData.availableRoles.includes(role.id)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(role.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => {
                  setSelectedTemplate(null);
                  setFormData({
                    name: "",
                    cpu: 1,
                    ram: 1,
                    disk: 25,
                    price: 5,
                    isActive: true,
                    availableRoles: []
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* USER ROLES & LIMITS TAB */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Role Limits</CardTitle>
              <CardDescription>
                Configure the maximum number of servers and server types that each role can create.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Max Servers</TableHead>
                      <TableHead>Allowed Server Types</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.maxServers}</TableCell>
                        <TableCell>
                          {role.allowedServerTypes.length > 0 
                            ? serverTemplates
                                .filter(t => role.allowedServerTypes.includes(t.id))
                                .map(t => t.name)
                                .join(", ")
                            : "None"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRole(role.id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {selectedRole && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit Role: {userRoles.find(r => r.id === selectedRole)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-max-servers">Maximum Servers</Label>
                    <Input 
                      id="role-max-servers" 
                      type="number" 
                      defaultValue={userRoles.find(r => r.id === selectedRole)?.maxServers}
                    />
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Allowed Server Templates</Label>
                    <div className="space-y-2">
                      {serverTemplates.map((template) => (
                        <div key={template.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`template-${template.id}`} 
                            defaultChecked={
                              userRoles
                                .find(r => r.id === selectedRole)?.allowedServerTypes
                                .includes(template.id)
                            }
                          />
                          <Label htmlFor={`template-${template.id}`}>
                            {template.name} ({template.cpu} CPU, {template.ram}GB RAM)
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedRole(null)}>Cancel</Button>
                <Button onClick={() => {
                  const role = userRoles.find(r => r.id === selectedRole);
                  if (role) {
                    const maxServers = parseInt((document.getElementById('role-max-servers') as HTMLInputElement).value);
                    const allowedTemplates = serverTemplates
                      .filter(t => (document.getElementById(`template-${t.id}`) as HTMLInputElement).checked)
                      .map(t => t.id);
                    
                    handleSaveRole(selectedRole, maxServers, allowedTemplates);
                  }
                }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        {/* REGIONS TAB */}
        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Regions</CardTitle>
              <CardDescription>
                Configure which data center regions are available for different user roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Admin Only</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serverRegions.map((region) => (
                      <TableRow key={region.id}>
                        <TableCell className="font-medium">{region.name}</TableCell>
                        <TableCell>{region.location}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={region.isActive} 
                            onCheckedChange={(checked) => {
                              handleUpdateRegion(region.id, checked, region.isAdminOnly);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox 
                            checked={region.isAdminOnly}
                            onCheckedChange={(checked) => {
                              handleUpdateRegion(region.id, region.isActive, checked as boolean);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Toggle both values at once
                              handleUpdateRegion(
                                region.id, 
                                !region.isActive, 
                                !region.isAdminOnly
                              );
                            }}
                          >
                            Toggle All
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 