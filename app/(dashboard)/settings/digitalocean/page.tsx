"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function DigitalOceanSettingsPage() {
  const [token, setToken] = useState("")
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [isTokenActive, setIsTokenActive] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [isTestingToken, setIsTestingToken] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTokenInfo()
  }, [])

  async function fetchTokenInfo() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/settings/digitalocean-token")
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || "Failed to fetch token information")
        toast({
          title: "Error",
          description: data.message || "Failed to fetch token information",
          variant: "destructive",
        })
        return
      }
      
      setCurrentToken(data.token)
      setIsTokenActive(data.isActive)
      setIsTokenValid(data.isValid)
      setValidationMessage(data.validationMessage || null)
      setLastUpdated(data.lastUpdated)
    } catch (error: any) {
      setError(error.message || "Failed to fetch token information")
      toast({
        title: "Error",
        description: error.message || "Failed to fetch token information",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveToken() {
    if (!token) {
      setError("API token is required")
      return
    }
    
    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)
    
    try {
      const response = await fetch("/api/settings/digitalocean-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.message || "Failed to save token")
        toast({
          title: "Error",
          description: data.message || "Failed to save token",
          variant: "destructive",
        })
        return
      }
      
      setToken("")
      setSuccessMessage("API token updated successfully")
      toast({
        title: "Success",
        description: "API token updated successfully",
      })
      
      // Refresh token info
      fetchTokenInfo()
    } catch (error: any) {
      setError(error.message || "Failed to save token")
      toast({
        title: "Error",
        description: error.message || "Failed to save token",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Hàm mới để kiểm tra token thủ công
  async function testCurrentToken() {
    if (!currentToken) {
      setError("No token available to test")
      return
    }
    
    setIsTestingToken(true)
    setError(null)
    
    try {
      const response = await fetch("/api/digitalocean/check-token")
      const data = await response.json()
      
      setIsTokenValid(data.isValid)
      setValidationMessage(data.message || null)
      
      if (data.isValid) {
        toast({
          title: "Success",
          description: "Token is valid and working correctly",
        })
      } else {
        toast({
          title: "Invalid Token",
          description: data.message || "Token validation failed",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setError(error.message || "Failed to test token")
      toast({
        title: "Error",
        description: error.message || "Failed to test token",
        variant: "destructive",
      })
    } finally {
      setIsTestingToken(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Loading...</h2>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-2">
        <Link href="/settings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Button>
        </Link>
      </div>
      
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">DigitalOcean API Settings</h2>
      </div>
      
      {/* Token status */}
      <Card>
        <CardHeader>
          <CardTitle>Current API Token Status</CardTitle>
          <CardDescription>Information about your DigitalOcean API token</CardDescription>
        </CardHeader>
        <CardContent>
          {currentToken ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Token:</span>
                <span>{currentToken ? `${currentToken.substring(0, 8)}...${currentToken.substring(currentToken.length - 8)}` : ""}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                {isTokenActive && isTokenValid ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Active and Valid
                  </span>
                ) : isTokenActive && !isTokenValid ? (
                  <span className="flex items-center text-red-600">
                    <AlertCircle className="mr-1 h-4 w-4" />
                    Active but Invalid
                  </span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
                
                {currentToken && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testCurrentToken}
                    disabled={isTestingToken}
                  >
                    {isTestingToken ? (
                      <>
                        <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Test Token
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {validationMessage && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Message: </span>
                  <span className="text-sm">{validationMessage}</span>
                </div>
              )}
              
              {lastUpdated && (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Last Updated:</span>
                  <span>{new Date(lastUpdated).toLocaleString()}</span>
                </div>
              )}
              
              {!isTokenValid && isTokenActive && (
                <Alert variant="warning" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Troubleshooting Invalid Token</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Your token appears to be invalid. Here are some common reasons:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>The token has been revoked in DigitalOcean control panel</li>
                      <li>The token has expired (tokens can expire based on your settings)</li>
                      <li>The token doesn't have sufficient permissions (it needs read and write access)</li>
                      <li>There might be network connectivity issues to DigitalOcean API</li>
                    </ul>
                    <p className="pt-2">To fix this issue:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Create a new personal access token in the <a href="https://cloud.digitalocean.com/account/api/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">DigitalOcean Control Panel</a></li>
                      <li>Make sure to select both Read and Write scopes</li>
                      <li>Set an appropriate expiration period (or no expiration)</li>
                      <li>Copy the new token and paste it in the form below</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No API Token Found</AlertTitle>
              <AlertDescription>You haven't set up a DigitalOcean API token yet.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Update token form */}
      <Card>
        <CardHeader>
          <CardTitle>Update API Token</CardTitle>
          <CardDescription>
            Enter your DigitalOcean API token. You can generate a new token from the{" "}
            <a 
              href="https://cloud.digitalocean.com/account/api/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              DigitalOcean Control Panel
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {successMessage && (
            <Alert variant="success" className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          
          {!isTokenValid && isTokenActive && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Token</AlertTitle>
              <AlertDescription>
                Your current token is not valid. This might be because it was revoked,
                expired, or doesn't have the necessary permissions. Please generate a new token
                with Read and Write permissions.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">DigitalOcean API Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your API token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={saveToken} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Token"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 