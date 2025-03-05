"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, AlertCircle, RefreshCw, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function DropletsPage() {
  const [droplets, setDroplets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'invalid' | 'missing' | 'unknown'>('unknown')
  const { toast } = useToast()

  useEffect(() => {
    // Kiểm tra token khi trang được tải
    checkDigitalOceanToken();
  }, [])

  // Kiểm tra tính hợp lệ của token DigitalOcean
  async function checkDigitalOceanToken() {
    try {
      const response = await fetch("/api/digitalocean/check-token")
      const data = await response.json()
      
      if (!response.ok) {
        if (data.error === "TOKEN_NOT_FOUND") {
          setTokenStatus('missing')
        } else if (data.error === "INVALID_TOKEN") {
          setTokenStatus('invalid')
        } else {
          setTokenStatus('unknown')
        }
        
        // Không fetch droplets nếu token không hợp lệ
        setIsLoading(false)
        setError({ 
          message: data.message || "Token validation failed", 
          code: data.error 
        })
        return
      }
      
      // Token hợp lệ, fetch droplets
      setTokenStatus('valid')
      fetchDroplets()
    } catch (error) {
      setTokenStatus('unknown')
      setIsLoading(false)
      setError({ message: "Failed to check DigitalOcean token status" })
    }
  }

  async function fetchDroplets() {
    setIsLoading(true)
    if (error) setError(null)
    
    try {
      const response = await fetch("/api/droplets")
      const data = await response.json()
      
      if (!response.ok) {
        // Xử lý lỗi từ API
        const errorMessage = data.message || "Failed to fetch droplets"
        const errorCode = data.error
        
        setError({ message: errorMessage, code: errorCode })
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }
      
      setDroplets(data.droplets || [])
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch droplets"
      setError({ message: errorMessage })
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function createDroplet() {
    // Implement droplet creation logic here
  }

  // Render thông báo lỗi phù hợp dựa trên mã lỗi
  const renderErrorMessage = () => {
    if (!error && tokenStatus === 'valid') return null
    
    // Customize error messages based on token status or error code
    let errorTitle = "Error Loading Droplets"
    let errorDescription = error?.message || "Unknown error"
    let showSettings = false
    
    if (tokenStatus === 'missing') {
      errorTitle = "DigitalOcean API Token Missing"
      errorDescription = "No API token found. Please add a valid token in settings."
      showSettings = true
    } else if (tokenStatus === 'invalid') {
      errorTitle = "DigitalOcean API Token Invalid"
      errorDescription = "Your API token is invalid or has expired. Please update it in settings."
      showSettings = true
    } else if (error?.code === "TOKEN_NOT_FOUND") {
      errorTitle = "DigitalOcean API Token Missing"
      errorDescription = "No valid API token found. Please add a valid token in settings."
      showSettings = true
    } else if (error?.code === "INVALID_TOKEN") {
      errorTitle = "DigitalOcean API Token Invalid"
      errorDescription = "Your API token is invalid or has expired. Please update it in settings."
      showSettings = true
    }
    
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorDescription}</AlertDescription>
        <div className="mt-4 flex space-x-2">
          <Button variant="outline" size="sm" onClick={checkDigitalOceanToken}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          {showSettings && (
            <Link href="/settings/digitalocean">
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure API Token
              </Button>
            </Link>
          )}
        </div>
      </Alert>
    )
  }

  if (isLoading && !error) return <div className="p-8">Loading droplets...</div>

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Droplets</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={checkDigitalOceanToken} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          {tokenStatus === 'valid' && (
            <Button onClick={createDroplet}>
              <Plus className="mr-2 h-4 w-4" />
              Create Droplet
            </Button>
          )}
          
          <Link href="/settings/digitalocean">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              API Settings
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Hiển thị thông báo lỗi */}
      {renderErrorMessage()}
      
      {/* Hiển thị danh sách droplet hoặc thông báo không có dữ liệu */}
      {tokenStatus === 'valid' && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {droplets.length > 0 ? (
            droplets.map((droplet) => (
              <Card key={droplet.id} className="p-4">
                {/* Droplet card content */}
                <h3 className="font-semibold">{droplet.name}</h3>
                <p className="text-sm text-gray-500">Status: {droplet.status}</p>
                <p className="text-sm text-gray-500">IP: {droplet.networks?.v4?.[0]?.ip_address || 'N/A'}</p>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center p-8">
              <p>No droplets found. Create your first droplet to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

