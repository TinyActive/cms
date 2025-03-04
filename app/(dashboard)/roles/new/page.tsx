import type { Metadata } from "next"
import { RoleForm } from "@/components/roles/role-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Create Role",
  description: "Create a new user role",
}

export default function NewRolePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create Role</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
          <CardDescription>Create a new role with specific permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <RoleForm
            permissions={Object.values(PERMISSIONS)}
            initialData={{
              name: "",
              description: "",
              permissions: [],
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

