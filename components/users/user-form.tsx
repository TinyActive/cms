"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const userSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .optional()
    .or(z.literal("")),
  roleId: z.string({
    required_error: "Please select a role.",
  }),
})

type UserFormValues = z.infer<typeof userSchema>

interface Role {
  id: string
  name: string
  description?: string | null
}

interface UserFormProps {
  initialData: {
    name: string
    email: string
    password?: string
    roleId: string
  }
  roles: Role[]
  userId?: string
}

export function UserForm({ initialData, roles, userId }: UserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<UserFormValues>({
    resolver: zodResolver(
      userId
        ? userSchema.omit({ password: true }).extend({
            password: z.string().min(8).optional().or(z.literal("")),
          })
        : userSchema,
    ),
    defaultValues: initialData,
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)

    try {
      const url = userId ? `/api/users/${userId}` : "/api/users"
      const method = userId ? "PATCH" : "POST"

      // If editing and password is empty, remove it from the payload
      if (userId && !data.password) {
        const { password, ...restData } = data
        data = restData as UserFormValues
      }

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
        title: userId ? "User updated" : "User created",
        description: userId ? "The user has been updated successfully." : "The user has been created successfully.",
      })

      router.push("/users")
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
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormDescription>The user's full name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormDescription>The user's email address.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{userId ? "New Password (optional)" : "Password"}</FormLabel>
              <FormControl>
                <Input type="password" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                {userId
                  ? "Leave blank to keep the current password."
                  : "The user's password. Must be at least 8 characters."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description && ` - ${role.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>The user's role determines their permissions.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/users")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (userId ? "Updating..." : "Creating...") : userId ? "Update User" : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

