"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"

const roleSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, {
    message: "Select at least one permission.",
  }),
})

type RoleFormValues = z.infer<typeof roleSchema>

interface RoleFormProps {
  initialData: {
    name: string
    description?: string
    permissions: string[]
  }
  permissions: string[]
  roleId?: string
}

export function RoleForm({ initialData, permissions, roleId }: RoleFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: initialData,
  })

  async function onSubmit(data: RoleFormValues) {
    setIsLoading(true)

    try {
      const url = roleId ? `/api/roles/${roleId}` : "/api/roles"
      const method = roleId ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Something went wrong")
      }

      toast({
        title: roleId ? "Role updated" : "Role created",
        description: roleId ? "The role has been updated successfully." : "The role has been created successfully.",
      })

      router.push("/roles")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Group permissions by category
  const groupedPermissions: Record<string, string[]> = {}
  permissions.forEach((permission) => {
    const category = permission.split("_")[0]
    if (!groupedPermissions[category]) {
      groupedPermissions[category] = []
    }
    groupedPermissions[category].push(permission)
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Admin" {...field} />
              </FormControl>
              <FormDescription>The name of the role. This will be displayed to users.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Administrators have full access to all resources."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>A brief description of the role and its permissions.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Permissions</FormLabel>
                <FormDescription>Select the permissions for this role.</FormDescription>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                  <Card key={category} className="p-4">
                    <h3 className="font-medium mb-2 capitalize">{category}</h3>
                    <div className="space-y-2">
                      {categoryPermissions.map((permission) => (
                        <FormField
                          key={permission}
                          control={form.control}
                          name="permissions"
                          render={({ field }) => {
                            return (
                              <FormItem key={permission} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(permission)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, permission])
                                        : field.onChange(field.value?.filter((value) => value !== permission))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{permission.replace(/_/g, " ")}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/roles")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (roleId ? "Updating..." : "Creating...") : roleId ? "Update Role" : "Create Role"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

