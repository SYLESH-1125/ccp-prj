"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MapPin, 
  LogOut, 
  User, 
  Eye, 
  X, 
  Wrench,
  ClipboardList,
  Calendar,
  Camera,
  Upload
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

interface Issue {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: "low" | "medium" | "high";
  status: "pending" | "assigned" | "in-progress" | "resolved";
  reportedBy: {
    email: string;
    firstName: string;
    lastName: string;
    uid: string;
  };
  assignedTo?: string;
  createdAt: any;
  resolvedAt?: any;
  resolvedBy?: string;
  imageUrl?: string;
  photoUrls?: string[];
  category?: string;
  workCompletedAt?: any;
  completionProof?: string[];
  completionNotes?: string;
  adminApproved?: boolean;
}

export default function MaintenanceDashboard() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [viewIssueModal, setViewIssueModal] = useState<Issue | null>(null)
  const [imageModal, setImageModal] = useState<{isOpen: boolean; src: string; alt: string}>({
    isOpen: false,
    src: "",
    alt: ""
  })
  const [completeModal, setCompleteModal] = useState<{isOpen: boolean; issue: Issue | null}>({
    isOpen: false,
    issue: null
  })
  const [completionNotes, setCompletionNotes] = useState("")
  const [completionPhotos, setCompletionPhotos] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  // Check user role and redirect if not maintenance
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      if (!userRole || userRole !== "maintenance") {
        router.push("/login")
      }
    }
  }, [router])

  // Fetch assigned issues
  useEffect(() => {
    if (!user || !userData) {
      setLoading(false)
      return
    }

    console.log("Fetching issues assigned to:", userData.email)

    // Query for issues assigned to this maintenance staff using email
    const assignedIssuesQuery = query(
      collection(db, "issues"),
      where("assignedTo", "==", userData.email)
    )

    const unsubscribe = onSnapshot(
      assignedIssuesQuery,
      (snapshot) => {
        console.log("Assigned issues snapshot received:", snapshot.docs.length)
        const issues = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || data.description || "Untitled Issue",
            description: data.description || "",
            location: data.location || "Unknown Location",
            severity: data.severity || "medium",
            status: data.status || "pending",
            reportedBy: data.reportedBy || { firstName: "Unknown", lastName: "User", email: "", uid: "" },
            assignedTo: data.assignedTo || null,
            createdAt: data.createdAt,
            resolvedAt: data.resolvedAt || null,
            resolvedBy: data.resolvedBy || null,
            imageUrl: data.imageUrl || data.photoUrls?.[0] || "",
            photoUrls: data.photoUrls || [],
            category: data.category || "",
            workCompletedAt: data.workCompletedAt || null,
            completionProof: data.completionProof || [],
            completionNotes: data.completionNotes || "",
            adminApproved: data.adminApproved || false
          }
        }) as Issue[]
        
        // Sort by creation date (newest first)
        issues.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
          return bTime.getTime() - aTime.getTime()
        })
        
        setAssignedIssues(issues)
        setLoading(false)
        console.log("Assigned issues updated:", issues.length)
      },
      (error) => {
        console.error("Error fetching assigned issues:", error)
        setAssignedIssues([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, userData])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString()
    }
    return new Date(timestamp).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "border-green-300 text-green-700"
      case "medium":
        return "border-orange-300 text-orange-700"
      case "high":
        return "border-red-300 text-red-700"
      default:
        return "border-gray-300 text-gray-700"
    }
  }

  const handleStartWork = async (issueId: string) => {
    try {
      await updateDoc(doc(db, "issues", issueId), {
        status: "in-progress",
        updatedAt: serverTimestamp()
      })
      console.log(`Issue ${issueId} status updated to in-progress`)
    } catch (error) {
      console.error("Error updating issue status:", error)
    }
  }

  // Convert image to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Compress image using canvas
  const compressImage = async (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleCompleteWork = async () => {
    if (!completeModal.issue) return
    
    setUploading(true)
    try {
      let proofUrls: string[] = []
      
      // Process and compress photos
      if (completionPhotos.length > 0) {
        console.log("Processing completion photos:", completionPhotos.length)
        
        for (const photo of completionPhotos) {
          try {
            const compressedImage = await compressImage(photo, 800, 0.6)
            proofUrls.push(compressedImage)
            console.log("Compressed photo size:", Math.round(compressedImage.length / 1024), "KB")
          } catch (error) {
            console.error("Error compressing photo:", error)
            // Fallback to original base64 if compression fails
            const base64 = await convertToBase64(photo)
            proofUrls.push(base64)
          }
        }
      }

      await updateDoc(doc(db, "issues", completeModal.issue.id), {
        status: "resolved", // Mark as resolved but waiting admin approval
        workCompletedAt: serverTimestamp(),
        completionProof: proofUrls,
        completionNotes: completionNotes,
        resolvedBy: userData?.email || user?.email,
        adminApproved: false // Admin needs to approve
      })
      
      setCompleteModal({isOpen: false, issue: null})
      setCompletionNotes("")
      setCompletionPhotos([])
      console.log(`Issue ${completeModal.issue.id} marked as completed with proof`)
    } catch (error) {
      console.error("Error completing work:", error)
      alert("Error submitting completion. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + completionPhotos.length > 5) {
      alert("Maximum 5 photos allowed")
      return
    }
    setCompletionPhotos(prev => [...prev, ...files])
  }

  const removePhoto = (index: number) => {
    setCompletionPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      if (typeof window !== "undefined") {
        localStorage.removeItem("userRole")
        localStorage.removeItem("userEmail")
        localStorage.removeItem("userId")
      }
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your assigned issues...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader
          title="Maintenance Dashboard"
          showLogo={false}
          actions={
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          }
        />
      ) : (
        /* Desktop Header */
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Maintenance Dashboard</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile User Info */}
      {isMobile && (
        <div className="bg-card/30 border-b px-4 py-3">
          <div className="text-center">
            <p className="font-medium">{userData?.firstName} {userData?.lastName}</p>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 py-${isMobile ? '4' : '8'}`}>
        {/* Stats Cards */}
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3 mb-6' : 'grid-cols-1 md:grid-cols-4 gap-6 mb-8'}`}>
          <ResponsiveCard mobileBorderless={isMobile}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'px-3 py-2' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                {isMobile ? "New" : "New Assignments"}
              </CardTitle>
              <ClipboardList className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
            </CardHeader>
            <CardContent className={isMobile ? "px-3 pb-2" : ""}>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {assignedIssues.filter(i => i.status === "assigned").length}
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? "To start" : "Ready to start"}
              </p>
            </CardContent>
          </ResponsiveCard>
          
          <ResponsiveCard mobileBorderless={isMobile}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'px-3 py-2' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>In Progress</CardTitle>
              <Clock className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
            </CardHeader>
            <CardContent className={isMobile ? "px-3 pb-2" : ""}>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {assignedIssues.filter(i => i.status === "in-progress").length}
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? "Working" : "Currently working"}
              </p>
            </CardContent>
          </ResponsiveCard>
          
          <ResponsiveCard mobileBorderless={isMobile}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'px-3 py-2' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Completed</CardTitle>
              <CheckCircle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-muted-foreground`} />
            </CardHeader>
            <CardContent className={isMobile ? "px-3 pb-2" : ""}>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {assignedIssues.filter(i => i.status === "resolved" && !i.adminApproved).length}
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? "Pending" : "Awaiting admin approval"}
              </p>
            </CardContent>
          </ResponsiveCard>

          <ResponsiveCard mobileBorderless={isMobile}>
            <CardHeader className={`flex flex-row items-center justify-between space-y-0 ${isMobile ? 'px-3 py-2' : 'pb-2'}`}>
              <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Approved</CardTitle>
              <CheckCircle className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} text-green-600`} />
            </CardHeader>
            <CardContent className={isMobile ? "px-3 pb-2" : ""}>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                {assignedIssues.filter(i => i.adminApproved).length}
              </div>
              <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                {isMobile ? "Done" : "Fully completed"}
              </p>
            </CardContent>
          </ResponsiveCard>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList className={`${isMobile ? 'grid w-full grid-cols-3' : ''}`}>
            <TabsTrigger value="assigned">{isMobile ? "New" : "New Assignments"}</TabsTrigger>
            <TabsTrigger value="in-progress">{isMobile ? "Active" : "In Progress"}</TabsTrigger>
            <TabsTrigger value="completed">{isMobile ? "Done" : "Completed Work"}</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            <ResponsiveCard 
              title={isMobile ? "New Assignments" : "New Issues Assigned to Me"}
              description={isMobile ? "Issues requiring attention" : "Issues assigned by admin requiring your attention"}
              mobileBorderless={isMobile}
            >
              <div className="space-y-4">
                {assignedIssues.filter(issue => issue.status === "assigned").map((issue) => (
                  <ResponsiveCard 
                    key={issue.id} 
                    className={`border-l-4 ${isMobile ? 'border-l-2' : ''}`} 
                    style={{
                      borderLeftColor: issue.severity === "high" ? "#dc2626" : 
                                      issue.severity === "medium" ? "#d97706" : "#16a34a"
                    }}
                    mobileBorderless={false}
                  >
                    <CardContent className={isMobile ? "p-4" : "p-6"}>
                      <div className={`flex items-start justify-between gap-4 ${isMobile ? 'flex-col' : ''}`}>
                        <div className="flex-1 space-y-3">
                          <div className={`flex items-center gap-3 ${isMobile ? 'flex-wrap' : 'flex-wrap'}`}>
                            <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{issue.title}</h3>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status}
                            </Badge>
                            <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                              {issue.severity} priority
                            </Badge>
                          </div>
                          
                          <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground leading-relaxed`}>
                            {isMobile ? issue.description.substring(0, 100) + '...' : issue.description}
                          </p>
                          
                          <div className={`flex items-center gap-4 ${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground ${isMobile ? 'flex-col items-start gap-1' : 'flex-wrap'}`}>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {isMobile ? issue.location.substring(0, 20) + '...' : issue.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Assigned: {formatDate(issue.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              By: {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                            </span>
                          </div>

                          {/* Photos Preview */}
                          {issue.photoUrls && issue.photoUrls.length > 0 && (
                            <div className="space-y-2">
                              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
                                Photos ({issue.photoUrls.length}):
                              </p>
                              <div className="flex gap-2 flex-wrap">
                                {issue.photoUrls.slice(0, isMobile ? 2 : 4).map((url: string, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={url}
                                      alt={`Issue photo ${index + 1}`}
                                      className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border`}
                                      onClick={() => setImageModal({
                                        isOpen: true,
                                        src: url,
                                        alt: `Issue photo ${index + 1} - ${issue.title}`
                                      })}
                                    />
                                  </div>
                                ))}
                                {issue.photoUrls.length > (isMobile ? 2 : 4) && (
                                  <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 border`}>
                                    +{issue.photoUrls.length - (isMobile ? 2 : 4)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className={`flex ${isMobile ? 'w-full flex-row gap-2' : 'flex-col gap-2 min-w-[140px]'}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewIssueModal(issue)}
                            className={`gap-1 ${isMobile ? 'flex-1' : ''}`}
                          >
                            <Eye className="h-3 w-3" />
                            {isMobile ? "View" : "View Details"}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStartWork(issue.id)}
                            className={`gap-1 ${isMobile ? 'flex-1' : ''}`}
                          >
                            <Clock className="h-3 w-3" />
                            {isMobile ? "Start" : "Start Work"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </ResponsiveCard>
                ))}

                {assignedIssues.filter(issue => issue.status === "assigned").length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No new assignments</p>
                    <p className="text-sm text-muted-foreground">Check back later for new issues</p>
                  </div>
                )}
              </div>
            </ResponsiveCard>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work in Progress</CardTitle>
                <CardDescription>Issues you are currently working on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedIssues.filter(issue => issue.status === "in-progress").map((issue) => (
                    <Card key={issue.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-lg">{issue.title}</h3>
                              <Badge className={getStatusColor(issue.status)}>
                                {issue.status}
                              </Badge>
                              <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                {issue.severity} priority
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {issue.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {issue.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                In progress since: {formatDate(issue.createdAt)}
                              </span>
                            </div>

                            {/* Photos Preview */}
                            {issue.photoUrls && issue.photoUrls.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Issue Photos ({issue.photoUrls.length}):</p>
                                <div className="flex gap-2 flex-wrap">
                                  {issue.photoUrls.slice(0, 4).map((url: string, index: number) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={url}
                                        alt={`Issue photo ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
                                        onClick={() => setImageModal({
                                          isOpen: true,
                                          src: url,
                                          alt: `Issue photo ${index + 1} - ${issue.title}`
                                        })}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewIssueModal(issue)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setCompleteModal({isOpen: true, issue: issue})}
                              className="gap-1"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Complete Work
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {assignedIssues.filter(issue => issue.status === "in-progress").length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No work in progress</p>
                      <p className="text-sm text-muted-foreground">Start working on assigned issues</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Work</CardTitle>
                <CardDescription>Issues you have completed (awaiting admin approval)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignedIssues.filter(issue => issue.status === "resolved").map((issue) => (
                    <Card key={issue.id} className={`border-l-4 ${issue.adminApproved ? 'border-l-green-500' : 'border-l-orange-500'}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-semibold text-lg">{issue.title}</h3>
                              <Badge className={issue.adminApproved ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                                {issue.adminApproved ? "Admin Approved" : "Awaiting Approval"}
                              </Badge>
                              <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                                {issue.severity} priority
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {issue.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {issue.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Completed: {formatDate(issue.workCompletedAt)}
                              </span>
                            </div>

                            {/* Completion Notes */}
                            {issue.completionNotes && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm">
                                  <strong>Completion Notes:</strong> {issue.completionNotes}
                                </p>
                              </div>
                            )}

                            {/* Completion Proof Photos */}
                            {issue.completionProof && issue.completionProof.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Completion Proof ({issue.completionProof.length}):</p>
                                <div className="flex gap-2 flex-wrap">
                                  {issue.completionProof.slice(0, 4).map((url: string, index: number) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={url}
                                        alt={`Completion proof ${index + 1}`}
                                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-green-300"
                                        onClick={() => setImageModal({
                                          isOpen: true,
                                          src: url,
                                          alt: `Completion proof ${index + 1} - ${issue.title}`
                                        })}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 min-w-[140px]">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewIssueModal(issue)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {assignedIssues.filter(issue => issue.status === "resolved").length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed work yet</p>
                      <p className="text-sm text-muted-foreground">Complete work to see it here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Complete Work Modal */}
      {completeModal.isOpen && completeModal.issue && (
        <Dialog open={completeModal.isOpen} onOpenChange={() => setCompleteModal({isOpen: false, issue: null})}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Complete Work - {completeModal.issue.title}
              </DialogTitle>
              <DialogDescription>
                Upload proof of completion and add notes about the work done
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Completion Notes */}
              <div>
                <label className="text-sm font-medium">Work Completion Notes</label>
                <Textarea
                  placeholder="Describe what was done to fix this issue..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-sm font-medium">Upload Proof Photos (Optional)</label>
                <div className="mt-1 space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload up to 5 photos showing the completed work (JPG, PNG)
                  </p>
                  
                  {/* Photo Previews */}
                  {completionPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {completionPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Completion proof ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                            onClick={() => removePhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCompleteWork}
                  disabled={uploading || (!completionNotes.trim() && completionPhotos.length === 0)}
                  className="gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Submit Completion
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCompleteModal({isOpen: false, issue: null})}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Issue Details Modal */}
      {viewIssueModal && (
        <Dialog open={!!viewIssueModal} onOpenChange={() => setViewIssueModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issue Details - {viewIssueModal.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status and Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(viewIssueModal.status)}>
                      {viewIssueModal.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getSeverityColor(viewIssueModal.severity)}>
                      {viewIssueModal.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Issue Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {viewIssueModal.description}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {viewIssueModal.location}
                  </p>
                </div>
              </div>

              {/* Original Issue Photos */}
              {viewIssueModal.photoUrls && viewIssueModal.photoUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Issue Photos ({viewIssueModal.photoUrls.length})
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewIssueModal.photoUrls.map((url: string, index: number) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Issue photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
                          onClick={() => setImageModal({
                            isOpen: true,
                            src: url,
                            alt: `Issue photo ${index + 1} - ${viewIssueModal.title}`
                          })}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion Information */}
              {viewIssueModal.status === "resolved" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Completion Status</label>
                    <div className="mt-1 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        {viewIssueModal.adminApproved ? 
                          "✅ Work completed and approved by admin" : 
                          "⏳ Work completed, awaiting admin approval"
                        }
                      </p>
                      <p className="text-sm text-orange-700">
                        Completed on: {formatDate(viewIssueModal.workCompletedAt)}
                      </p>
                    </div>
                  </div>

                  {viewIssueModal.completionNotes && (
                    <div>
                      <label className="text-sm font-medium">Your Completion Notes</label>
                      <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {viewIssueModal.completionNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {viewIssueModal.completionProof && viewIssueModal.completionProof.length > 0 && (
                    <div>
                      <label className="text-sm font-medium mb-3 block">
                        Your Completion Proof ({viewIssueModal.completionProof.length})
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {viewIssueModal.completionProof.map((url: string, index: number) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Completion proof ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-green-300"
                              onClick={() => setImageModal({
                                isOpen: true,
                                src: url,
                                alt: `Completion proof ${index + 1} - ${viewIssueModal.title}`
                              })}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setViewIssueModal(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <Dialog open={imageModal.isOpen} onOpenChange={() => setImageModal({isOpen: false, src: "", alt: ""})}>
          <DialogContent className="max-w-7xl max-h-[95vh] p-0 overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {imageModal.alt}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageModal({isOpen: false, src: "", alt: ""})}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 p-6">
              <div className="flex justify-center items-center bg-gray-50 rounded-lg min-h-[60vh] max-h-[70vh] overflow-auto">
                <img
                  src={imageModal.src}
                  alt={imageModal.alt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: '70vh', maxWidth: '100%' }}
                />
              </div>
              
              <div className="flex gap-3 mt-6 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = imageModal.src
                    link.download = `photo-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="gap-2"
                >
                  📥 Download
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setImageModal({isOpen: false, src: "", alt: ""})}
                  className="gap-2"
                >
                  ✕ Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
