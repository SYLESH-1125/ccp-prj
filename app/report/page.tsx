"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, MapPin, Upload, AlertTriangle, CheckCircle, ArrowLeft, Loader2, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

export default function ReportIssuePage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    title: "",
    description: "",
    location: "",
    photos: [] as File[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [reportId, setReportId] = useState("")
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)

  // Get back URL based on user role
  const getBackUrl = () => {
    if (!user) return "/login"
    
    switch (userRole) {
      case "citizen":
        return "/citizen"
      case "admin":
        return "/admin"
      case "maintenance":
        return "/dashboard"
      default:
        return "/citizen" // Default to citizen dashboard for authenticated users
    }
  }

  // Check user role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole")
      setUserRole(role)
    }
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/report')
    }
  }, [user, authLoading, router])

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render form if not authenticated
  if (!user || !userData) {
    return null
  }

  // Helper function to convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file) // fallback to original if compression fails
          }
        }, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleLocationCapture = () => {
    setLocationStatus("loading")
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          }))
          setLocationStatus("success")
        },
        (error) => {
          console.error("Error getting location:", error)
          setLocationStatus("error")
        },
      )
    } else {
      setLocationStatus("error")
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 3), // Max 3 photos
    }))
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    console.log("Starting form submission...")

    if (!user || !userData) {
      console.error("User not authenticated")
      setError("You must be logged in to submit a report")
      setIsSubmitting(false)
      return
    }

    try {
      // Generate report ID
      const timestamp = Date.now().toString().slice(-6)
      const generatedReportId = `PS-${timestamp}`
      console.log("Generated report ID:", generatedReportId)

      // Upload photos to Firebase Storage
      const photoUrls: string[] = []
      console.log("Number of photos to upload:", formData.photos.length)
      
      if (formData.photos.length > 0) {
        console.log("Starting photo processing...")
        for (let i = 0; i < formData.photos.length; i++) {
          const photo = formData.photos[i]
          
          try {
            // Compress image first to reduce size
            console.log(`Compressing photo ${i + 1}...`)
            const compressedPhoto = await compressImage(photo, 800, 0.6) // Max width 800px, 60% quality
            console.log(`Photo ${i + 1} compressed from ${photo.size} to ${compressedPhoto.size} bytes`)
            
            // Convert compressed photo to base64
            console.log(`Converting photo ${i + 1} to base64...`)
            const base64 = await convertToBase64(compressedPhoto)
            
            // Check if base64 is still too large (Firestore limit is ~1MB)
            const sizeInBytes = new Blob([base64]).size
            if (sizeInBytes > 1000000) { // 1MB limit
              console.warn(`Photo ${i + 1} is still too large (${sizeInBytes} bytes), compressing further...`)
              // Compress with lower quality
              const smallerPhoto = await compressImage(photo, 600, 0.4)
              const smallerBase64 = await convertToBase64(smallerPhoto)
              photoUrls.push(smallerBase64)
              console.log(`Photo ${i + 1} compressed to smaller size and converted successfully`)
            } else {
              photoUrls.push(base64)
              console.log(`Photo ${i + 1} converted to base64 successfully (${sizeInBytes} bytes)`)
            }
          } catch (conversionError) {
            console.error(`Failed to process photo ${i + 1}:`, conversionError)
            // Skip this photo but continue with others
            setError(`Failed to process photo ${i + 1}. Photo skipped.`)
          }
        }
        console.log("All photos processed:", photoUrls.length, "successful uploads")
      }

      // Create issue document
      const issueData = {
        reportId: generatedReportId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        severity: formData.severity,
        location: formData.location,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reportedBy: {
          uid: user.uid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName
        },
        photoUrls: photoUrls, // Store the photo URLs (base64 or Firebase URLs)
        resolvedAt: null,
        resolvedBy: null
      }

      console.log("Creating document with data:", { ...issueData, photoUrls: `${photoUrls.length} photos` })

      // Add to issues collection
      const docRef = await addDoc(collection(db, "issues"), issueData)
      console.log("Document created successfully with ID:", docRef.id)

      setReportId(generatedReportId)
      setIsSubmitted(true)
    } catch (error: any) {
      console.error("Error submitting report:", error)
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      setError(`Failed to submit report: ${error.message || "Unknown error"}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Report Submitted Successfully!</CardTitle>
              <CardDescription>Your playground safety report has been received and is being processed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <Label className="text-sm font-medium">Report ID</Label>
                <div className="text-2xl font-mono font-bold text-primary mt-1">{reportId}</div>
                <p className="text-sm text-muted-foreground mt-2">Save this ID to track your report status</p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You will receive notifications about the progress of this report. Expected response time: 24-48 hours.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link href="/status">Track Status</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1 bg-transparent">
                  <Link href={getBackUrl()}>Back to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href={getBackUrl()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Report an Issue</h1>
            <p className="text-muted-foreground">Help keep our playgrounds safe by reporting maintenance issues</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Issue Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Category</CardTitle>
              <CardDescription>What type of issue are you reporting?</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broken-equipment">Broken Equipment</SelectItem>
                  <SelectItem value="surface-damage">Surface Damage</SelectItem>
                  <SelectItem value="litter-debris">Litter & Debris</SelectItem>
                  <SelectItem value="vandalism">Vandalism</SelectItem>
                  <SelectItem value="safety-hazard">Safety Hazard</SelectItem>
                  <SelectItem value="maintenance-needed">General Maintenance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Severity Level */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Severity Level</CardTitle>
              <CardDescription>How urgent is this issue?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
                  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
                  { value: "high", label: "High", color: "bg-red-100 text-red-800 border-red-200" },
                ].map((severity) => (
                  <button
                    key={severity.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, severity: severity.value }))}
                    className={`p-3 rounded-lg border-2 text-center font-medium transition-all ${
                      formData.severity === severity.value ? severity.color : "border-border hover:border-primary/50"
                    }`}
                  >
                    {severity.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issue Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issue Details</CardTitle>
              <CardDescription>Provide a clear description of the problem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail, including any safety concerns..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Location</CardTitle>
              <CardDescription>Help us locate the issue precisely</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="GPS coordinates will appear here"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLocationCapture}
                  disabled={locationStatus === "loading"}
                  className="gap-2 bg-transparent"
                >
                  {locationStatus === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {locationStatus === "loading" ? "Getting..." : "Get Location"}
                </Button>
              </div>
              {locationStatus === "success" && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Location captured successfully!</AlertDescription>
                </Alert>
              )}
              {locationStatus === "error" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Unable to get location. Please enter the playground name or address manually.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Photos</CardTitle>
              <CardDescription>Upload up to 3 photos to help illustrate the issue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="photos" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                    <Camera className="h-4 w-4" />
                    <span>Add Photos</span>
                  </div>
                </Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">{formData.photos.length}/3 photos</span>
              </div>

              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={URL.createObjectURL(photo) || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2"
                disabled={isSubmitting || !formData.category || !formData.severity || !formData.title}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Submit Report
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground text-center mt-3">
                Your report will be reviewed within 24-48 hours
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
