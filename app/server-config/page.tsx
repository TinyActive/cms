"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "next-auth/react"
import { hasPermission, hasAnyPermission } from "@/lib/permissions"
import { PERMISSIONS, ROLES } from "@/lib/permissions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Mock data for server configurations
const mockServerTemplates = [
  { id: 1, name: "Basic", cpu: 1, ram: 1, disk: 25, price: 5, availableRoles: ["admin", "user"] },
  { id: 2, name: "Standard", cpu: 2, ram: 2, disk: 50, price: 10, availableRoles: ["admin", "user"] },
  { id: 3, name: "Premium", cpu: 4, ram: 8, disk: 160, price: 40, availableRoles: ["admin"] },
  { id: 4, name: "High Memory", cpu: 8, ram: 16, disk: 320, price: 80, availableRoles: ["admin"] },
  { id: 5, name: "CPU Optimized", cpu: 8, ram: 8, disk: 160, price: 60, availableRoles: ["admin"] },
]

const userRoles = [
  { id: 1, name: "admin", maxServers: 10, allowedServerTypes: [1, 2, 3, 4, 5] },
  { id: 2, name: "user", maxServers: 3, allowedServerTypes: [1, 2] },
  { id: 3, name: "support", maxServers: 0, allowedServerTypes: [] },
  { id: 4, name: "readonly", maxServers: 0, allowedServerTypes: [] },
]

export default function ServerConfigPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
    )
  }

  const handleSaveTemplate = (id: number | null) => {
    // In a real app, this would save to the database
    console.log("Saving template:", id)
    setSelectedTemplate(null)
  }

  const handleSaveRole = (id: number | null) => {
    // In a real app, this would save to the database
    console.log("Saving role:", id)
    setSelectedRole(null)
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
                      <TableHead>Available To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockServerTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>{template.cpu}</TableCell>
                        <TableCell>{template.ram}</TableCell>
                        <TableCell>{template.disk}</TableCell>
                        <TableCell>${template.price}/mo</TableCell>
                        <TableCell>{template.availableRoles.join(", ")}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template.id)}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button>Add New Template</Button>
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit Template: {mockServerTemplates.find(t => t.id === selectedTemplate)?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                      id="template-name" 
                      defaultValue={mockServerTemplates.find(t => t.id === selectedTemplate)?.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-price">Price ($ per month)</Label>
                    <Input 
                      id="template-price" 
                      type="number" 
                      defaultValue={mockServerTemplates.find(t => t.id === selectedTemplate)?.price}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-cpu">CPU Cores</Label>
                    <Input 
                      id="template-cpu" 
                      type="number" 
                      defaultValue={mockServerTemplates.find(t => t.id === selectedTemplate)?.cpu}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-ram">RAM (GB)</Label>
                    <Input 
                      id="template-ram" 
                      type="number" 
                      defaultValue={mockServerTemplates.find(t => t.id === selectedTemplate)?.ram}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-disk">Disk (GB)</Label>
                    <Input 
                      id="template-disk" 
                      type="number" 
                      defaultValue={mockServerTemplates.find(t => t.id === selectedTemplate)?.disk}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Label className="mb-2 block">Available to Roles</Label>
                  <div className="space-y-2">
                    {userRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`role-${role.id}`} 
                          defaultChecked={
                            mockServerTemplates
                              .find(t => t.id === selectedTemplate)?.availableRoles
                              .includes(role.name)
                          }
                        />
                        <Label htmlFor={`role-${role.id}`}>{role.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
                <Button onClick={() => handleSaveTemplate(selectedTemplate)}>Save Changes</Button>
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
                            ? role.allowedServerTypes
                                .map(id => mockServerTemplates.find(t => t.id === id)?.name)
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
                      {mockServerTemplates.map((template) => (
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
                <Button onClick={() => handleSaveRole(selectedRole)}>Save Changes</Button>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">nyc1</TableCell>
                      <TableCell>New York, USA</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">sfo2</TableCell>
                      <TableCell>San Francisco, USA</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ams3</TableCell>
                      <TableCell>Amsterdam, Netherlands</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Checkbox defaultChecked /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">sgp1</TableCell>
                      <TableCell>Singapore</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">lon1</TableCell>
                      <TableCell>London, UK</TableCell>
                      <TableCell><Switch /></TableCell>
                      <TableCell><Checkbox /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Button>Save Region Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 