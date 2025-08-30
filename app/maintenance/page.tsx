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
  Upload,
  Menu
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  assignedAt?: any;
  assignedBy?: string;
  createdAt: any;
  resolvedAt?: any;
  resolvedBy?: string;
  updatedAt?: any;
  photos?: string[];
  adminNotes?: string;
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

  useEffect(() => {
    if (userData && typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      
      if (userRole !== "maintenance") {
        console.log("User is not maintenance staff, redirecting...")
        router.push("/")
        return
      }
    }
  }, [userData, router])

  useEffect(() => {
    if (!user?.email) return

    console.log("Setting up real-time listener for assigned issues...")
    
    const assignedIssuesQuery = query(
      collection(db, "issues"),
      where("assignedTo", "==", user.email)
    )

    const unsubscribe = onSnapshot(
      assignedIssuesQuery,
      (snapshot) => {
        console.log("Received assignment update:", snapshot.size, "issues")
        const issues = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            location: data.location || "",
            severity: data.severity || "medium",
            status: data.status || "pending",
            reportedBy: data.reportedBy || {},
            assignedTo: data.assignedTo,
            assignedAt: data.assignedAt,
            assignedBy: data.assignedBy,
            createdAt: data.createdAt,
            resolvedAt: data.resolvedAt,
            resolvedBy: data.resolvedBy,
            updatedAt: data.updatedAt,
            photos: data.photos || [],
            adminNotes: data.adminNotes || "",
            workCompletedAt: data.workCompletedAt,
            completionProof: data.completionProof || [],
            completionNotes: data.completionNotes || "",
            adminApproved: data.adminApproved || false
          } as Issue
        })

        // Sort by creation time (newest first)
        const sortedIssues = issues.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
          return bTime.getTime() - aTime.getTime()
        })

        setAssignedIssues(sortedIssues)
        setLoading(false)
      },
      (error) => {
        console.error("Error fetching assigned issues:", error)
        setLoading(false)
      }
    )

    return () => {
      console.log("Cleaning up assignment listener")
      unsubscribe()
    }
  }, [user])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-purple-100 text-purple-800"
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
      {/* Header */}
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

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedIssues.filter(i => i.status === "assigned").length}</div>
              <p className="text-xs text-muted-foreground">Ready to start</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedIssues.filter(i => i.status === "in-progress").length}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedIssues.filter(i => i.status === "resolved").length}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedIssues.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Issues Tabs */}
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">
              New ({assignedIssues.filter(i => i.status === "assigned").length})
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress ({assignedIssues.filter(i => i.status === "in-progress").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({assignedIssues.filter(i => i.status === "resolved").length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All Issues ({assignedIssues.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            {assignedIssues.filter(issue => issue.status === "assigned").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No new assignments</h3>
                  <p className="text-muted-foreground text-center">Check back later for new issues to work on.</p>
                </CardContent>
              </Card>
            ) : (
              assignedIssues.filter(issue => issue.status === "assigned").map((issue) => (
                <Card key={issue.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(issue.severity)} border`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{issue.description}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setViewIssueModal(issue)} variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button onClick={() => handleStartWork(issue.id)} size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Start Work
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {assignedIssues.filter(issue => issue.status === "in-progress").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No issues in progress</h3>
                  <p className="text-muted-foreground text-center">Start working on assigned issues to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              assignedIssues.filter(issue => issue.status === "in-progress").map((issue) => (
                <Card key={issue.id} className="border-l-4 border-l-purple-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(issue.severity)} border`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace("-", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{issue.description}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setViewIssueModal(issue)} variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        onClick={() => setCompleteModal({isOpen: true, issue})} 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {assignedIssues.filter(issue => issue.status === "resolved").length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed work</h3>
                  <p className="text-muted-foreground text-center">Complete your in-progress issues to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              assignedIssues.filter(issue => issue.status === "resolved").map((issue) => (
                <Card key={issue.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(issue.severity)} border`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          COMPLETED
                        </Badge>
                        {issue.adminApproved && (
                          <Badge className="bg-green-100 text-green-800">
                            APPROVED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Completed: {formatDate(issue.workCompletedAt)}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{issue.description}</p>
                    {issue.completionNotes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <h4 className="font-medium text-green-800 mb-1">Completion Notes:</h4>
                        <p className="text-sm text-green-700">{issue.completionNotes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={() => setViewIssueModal(issue)} variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {assignedIssues.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <User className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assigned issues</h3>
                  <p className="text-muted-foreground text-center">You don't have any issues assigned to you yet.</p>
                </CardContent>
              </Card>
            ) : (
              assignedIssues.map((issue) => (
                <Card key={issue.id} className={`border-l-4 ${
                  issue.status === "assigned" ? "border-l-blue-500" :
                  issue.status === "in-progress" ? "border-l-purple-500" :
                  "border-l-green-500"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className={`${getSeverityColor(issue.severity)} border`}>
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status.replace("-", " ").toUpperCase()}
                        </Badge>
                        {issue.status === "resolved" && issue.adminApproved && (
                          <Badge className="bg-green-100 text-green-800">
                            APPROVED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {issue.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(issue.createdAt)}
                        </span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{issue.description}</p>
                    <div className="flex gap-2">
                      <Button onClick={() => setViewIssueModal(issue)} variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {issue.status === "assigned" && (
                        <Button onClick={() => handleStartWork(issue.id)} size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Start Work
                        </Button>
                      )}
                      {issue.status === "in-progress" && (
                        <Button 
                          onClick={() => setCompleteModal({isOpen: true, issue})} 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* View Issue Modal */}
      {viewIssueModal && (
        <Dialog open={!!viewIssueModal} onOpenChange={() => setViewIssueModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewIssueModal.title}</DialogTitle>
              <DialogDescription>
                Issue details and completion status
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(viewIssueModal.status)}>
                      {viewIssueModal.status.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <div className="mt-1">
                    <Badge variant="secondary" className={`${getSeverityColor(viewIssueModal.severity)} border`}>
                      {viewIssueModal.severity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Location</label>
                <p className="mt-1 text-sm">{viewIssueModal.location}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="mt-1 text-sm">{viewIssueModal.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Reported By</label>
                <p className="mt-1 text-sm">
                  {viewIssueModal.reportedBy?.firstName} {viewIssueModal.reportedBy?.lastName} 
                  ({viewIssueModal.reportedBy?.email})
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Reported Date</label>
                <p className="mt-1 text-sm">{formatDate(viewIssueModal.createdAt)}</p>
              </div>

              {viewIssueModal.assignedAt && (
                <div>
                  <label className="text-sm font-medium">Assignment Details</label>
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Assigned on: {formatDate(viewIssueModal.assignedAt)}
                      {viewIssueModal.assignedBy && (
                        <>
                          <br />
                          Assigned by: {viewIssueModal.assignedBy}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {viewIssueModal.adminNotes && (
                <div>
                  <label className="text-sm font-medium">Admin Notes</label>
                  <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{viewIssueModal.adminNotes}</p>
                  </div>
                </div>
              )}

              {viewIssueModal.photos && viewIssueModal.photos.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Issue Photos</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {viewIssueModal.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Issue photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => setImageModal({
                          isOpen: true,
                          src: photo,
                          alt: `Issue photo ${index + 1}`
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {viewIssueModal.status === "resolved" && viewIssueModal.completionProof && viewIssueModal.completionProof.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Completion Proof</label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {viewIssueModal.completionProof.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Completion proof ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => setImageModal({
                          isOpen: true,
                          src: photo,
                          alt: `Completion proof ${index + 1}`
                        })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {viewIssueModal.completionNotes && (
                <div>
                  <label className="text-sm font-medium">Completion Notes</label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">{viewIssueModal.completionNotes}</p>
                  </div>
                </div>
              )}

              {viewIssueModal.workCompletedAt && (
                <div>
                  <label className="text-sm font-medium">Work Completed Date</label>
                  <p className="mt-1 text-sm">{formatDate(viewIssueModal.workCompletedAt)}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Complete Work Modal */}
      {completeModal.isOpen && (
        <Dialog open={completeModal.isOpen} onOpenChange={() => setCompleteModal({isOpen: false, issue: null})}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mark Work Complete</DialogTitle>
              <DialogDescription>
                Add completion notes and upload proof photos for: {completeModal.issue?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Completion Notes</label>
                <Textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Describe what was done to fix the issue..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Proof Photos (Optional)</label>
                <div className="mt-1">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="mb-2"
                  />
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload up to 5 photos showing the completed work
                  </p>
                  
                  {completionPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {completionPhotos.map((photo, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Completion proof ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
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
                  onClick={() => setCompleteModal({isOpen: false, issue: null})}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteWork}
                  disabled={uploading || !completionNotes.trim()}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Completion
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Image Modal */}
      {imageModal.isOpen && (
        <Dialog open={imageModal.isOpen} onOpenChange={() => setImageModal({isOpen: false, src: "", alt: ""})}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{imageModal.alt}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <img
                src={imageModal.src}
                alt={imageModal.alt}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = imageModal.src
                    link.download = imageModal.alt
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
