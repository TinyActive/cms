"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"

const tokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
})

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasToken, setHasToken] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof tokenSchema>>({
    resolver: zodResolver(tokenSchema),
    defaultValues: {
      token: "",
    },
  })

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("/api/settings/digitalocean-token")
        if (!response.ok) throw new Error("Failed to fetch token status")
        const data = await response.json()
        setHasToken(!!data.token)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch token status",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchToken()
  }, [toast])

  async function onSubmit(values: z.infer<typeof tokenSchema>) {
    try {
      const response = await fetch("/api/settings/digitalocean-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to update token")

      toast({
        title: "Success",
        description: "DigitalOcean API token updated successfully",
      })

      setHasToken(true)
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update DigitalOcean API token",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>DigitalOcean API Token</CardTitle>
          <CardDescription>Manage your DigitalOcean API token for accessing DigitalOcean services.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Token</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your DigitalOcean API token" {...field} />
                    </FormControl>
                    <FormDescription>
                      {hasToken
                        ? "A token is currently set. Enter a new token to update it."
                        : "No token is currently set."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Update Token</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

