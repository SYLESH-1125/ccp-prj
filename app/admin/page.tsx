"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { db, auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Settings, Users, AlertTriangle, CheckCircle, Clock, TrendingUp, MapPin, LogOut, UserCheck, Eye, X, User, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

interface Issue {
  id: string
  title: string
  description: string
  location: string
  severity: "low" | "medium" | "high"
  status: "pending" | "assigned" | "in-progress" | "resolved"
  reportedBy: {
    email: string
    firstName: string
    lastName: string
    uid: string
  }
  assignedTo?: string
  createdAt: any
  resolvedAt?: any
  resolvedBy?: string
  imageUrl?: string
  photoUrls?: string[]
  category?: string
  workCompletedAt?: any
  completionProof?: string[]
  completionNotes?: string
  adminApproved?: boolean
}

interface Staff {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

interface Assignment {
  id: string
  issueId: string
  issueTitle: string
  assignedTo: string
  assignedBy: string
  assignedAt: any
  status: "active" | "completed" | "reassigned"
  notificationSent: boolean
  completedAt?: any
}

interface Playground {
  id: string
  name: string
  address: string
  description: string
  latitude: number
  longitude: number
  amenities: string[]
  activeIssues: number
  status: "Good" | "Attention" | "Urgent"
  lastInspection: string
}

export default function AdminDashboard() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  const [issues, setIssues] = useState<Issue[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState("")
  const [selectedStaff, setSelectedStaff] = useState("")
  const [viewIssueModal, setViewIssueModal] = useState<Issue | null>(null)
  const [imageModal, setImageModal] = useState<{isOpen: boolean, src: string, alt: string}>({
    isOpen: false,
    src: "",
    alt: ""
  })

  // Statistics
  const [pendingCount, setPendingCount] = useState(0)
  const [activeStaffCount, setActiveStaffCount] = useState(0)
  const [resolvedTodayCount, setResolvedTodayCount] = useState(0)
  const [avgResponseTime, setAvgResponseTime] = useState("0d")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      if (!userRole || userRole !== "admin") {
        router.push("/login")
        return
      }
    }
  }, [router])

  // Fetch issues and staff data
  useEffect(() => {
    if (!user) return

    // Fetch all issues
    const issuesQuery = query(collection(db, "issues"), orderBy("createdAt", "desc"))
    const unsubscribeIssues = onSnapshot(issuesQuery, (snapshot) => {
      const issuesData = snapshot.docs.map(doc => {
        const data = doc.data()
        console.log("Admin loading issue:", { id: doc.id, photoUrls: data.photoUrls, title: data.title })
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
          photoUrls: data.photoUrls || [], // Make sure photoUrls is included
          category: data.category || "",
          workCompletedAt: data.workCompletedAt || null,
          completionProof: data.completionProof || [],
          completionNotes: data.completionNotes || "",
          adminApproved: data.adminApproved || false
        }
      }) as Issue[]
      
      setIssues(issuesData)
      
      // Calculate statistics
      const pending = issuesData.filter(issue => issue.status === "pending")
      setPendingCount(pending.length)
      
      // Get today's resolved issues
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const resolvedToday = issuesData.filter(issue => {
        if (issue.status === "resolved" && issue.resolvedAt) {
          const resolvedDate = issue.resolvedAt.toDate ? issue.resolvedAt.toDate() : new Date(issue.resolvedAt)
          return resolvedDate >= today
        }
        return false
      })
      setResolvedTodayCount(resolvedToday.length)
      
      // Calculate average response time for resolved issues
      const resolvedIssues = issuesData.filter(issue => issue.status === "resolved" && issue.resolvedAt && issue.createdAt)
      if (resolvedIssues.length > 0) {
        const totalTime = resolvedIssues.reduce((acc, issue) => {
          const created = issue.createdAt.toDate ? issue.createdAt.toDate() : new Date(issue.createdAt)
          const resolved = issue.resolvedAt.toDate ? issue.resolvedAt.toDate() : new Date(issue.resolvedAt)
          return acc + (resolved.getTime() - created.getTime())
        }, 0)
        const avgTimeMs = totalTime / resolvedIssues.length
        const avgTimeDays = Math.round(avgTimeMs / (1000 * 60 * 60 * 24) * 10) / 10
        setAvgResponseTime(`${avgTimeDays}d`)
      }
    })

    // Fetch maintenance staff
    const staffQuery = query(collection(db, "maintenance"))
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Staff[]
      setStaff(staffData)
      setActiveStaffCount(staffData.length)
    })

    // Fetch assignments
    const assignmentsQuery = query(collection(db, "assignments"), orderBy("assignedAt", "desc"))
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
      const assignmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[]
      setAssignments(assignmentsData)
    })

    // Fetch playgrounds
    const playgroundsQuery = query(collection(db, "playgrounds"))
    const unsubscribePlaygrounds = onSnapshot(playgroundsQuery, (snapshot) => {
      const playgroundsData = snapshot.docs.map(doc => {
        const data = doc.data()
        // Calculate active issues for this playground
        const playgroundIssues = issues.filter(issue => 
          issue.location && data.name && 
          (issue.location.includes(data.name) || 
           issue.location.includes(data.address))
        ).filter(issue => issue.status !== "resolved")
        
        return {
          id: doc.id,
          name: data.name || "Unknown Playground",
          address: data.address || "Unknown Address",
          description: data.description || "",
          latitude: data.latitude || 0,
          longitude: data.longitude || 0,
          amenities: data.amenities || [],
          activeIssues: data.activeIssues || playgroundIssues.length || 0,
          status: data.status || "Good",
          lastInspection: data.lastInspection || "No inspection recorded"
        }
      }) as Playground[]
      setPlaygrounds(playgroundsData)
      setLoading(false)
    })

    return () => {
      unsubscribeIssues()
      unsubscribeStaff()
      unsubscribeAssignments()
      unsubscribePlaygrounds()
    }
  }, [user])

  const handleAssignReport = async () => {
    if (selectedReport && selectedStaff) {
      try {
        // Find the selected issue details
        const selectedIssue = issues.find(issue => issue.id === selectedReport)
        const selectedStaffMember = staff.find(s => s.id === selectedStaff)
        
        if (!selectedIssue || !selectedStaffMember) {
          alert("Issue or staff member not found")
          return
        }

        // Update the issue with assignment
        await updateDoc(doc(db, "issues", selectedReport), {
          assignedTo: selectedStaffMember.email,
          status: "assigned",
          assignedAt: serverTimestamp(),
          assignedBy: user?.email || "admin"
        })

        // Create assignment record in assignments collection
        await addDoc(collection(db, "assignments"), {
          issueId: selectedReport,
          issueTitle: selectedIssue.title,
          issueLocation: selectedIssue.location,
          issueSeverity: selectedIssue.severity,
          assignedTo: selectedStaffMember.email,
          assignedToName: `${selectedStaffMember.firstName} ${selectedStaffMember.lastName}`,
          assignedBy: user?.email || "admin",
          assignedAt: serverTimestamp(),
          status: "active",
          notificationSent: true // We'll implement notifications later
        })

        alert(`Report assigned successfully to ${selectedStaffMember.firstName} ${selectedStaffMember.lastName}`)
        setSelectedReport("")
        setSelectedStaff("")
      } catch (error) {
        console.error("Error assigning report:", error)
        alert("Error assigning report")
      }
    }
  }

  const handleStatusUpdate = async (issueId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === "resolved") {
        updateData.resolvedAt = new Date()
      }
      await updateDoc(doc(db, "issues", issueId), updateData)
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleApproveCompletion = async (issueId: string) => {
    try {
      // Update the issue as approved
      await updateDoc(doc(db, "issues", issueId), {
        adminApproved: true,
        resolvedAt: new Date(),
        resolvedBy: user?.email
      })

      // Find and update the corresponding assignment
      const assignment = assignments.find(a => a.issueId === issueId && a.status === "active")
      if (assignment) {
        await updateDoc(doc(db, "assignments", assignment.id), {
          status: "completed",
          completedAt: serverTimestamp()
        })
      }

      console.log(`Issue ${issueId} approved by admin and assignment completed`)
    } catch (error) {
      console.error("Error approving issue completion:", error)
    }
  }

  const handleRejectCompletion = async (issueId: string) => {
    try {
      await updateDoc(doc(db, "issues", issueId), {
        status: "in-progress",
        adminApproved: false,
        workCompletedAt: null,
        completionProof: [],
        completionNotes: ""
      })
      console.log(`Issue ${issueId} completion rejected, sent back to maintenance`)
    } catch (error) {
      console.error("Error rejecting issue completion:", error)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      return timestamp.toDate().toLocaleDateString()
    } catch {
      return new Date(timestamp).toLocaleDateString()
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handlePlaygroundStatusUpdate = async (playgroundId: string, newStatus: "Good" | "Attention" | "Urgent") => {
    try {
      await updateDoc(doc(db, "playgrounds", playgroundId), {
        status: newStatus,
        lastInspection: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      })
    } catch (error) {
      console.error("Error updating playground status:", error)
    }
  }

  const handleActiveIssuesUpdate = async (playgroundId: string, newActiveIssues: number) => {
    try {
      await updateDoc(doc(db, "playgrounds", playgroundId), {
        activeIssues: newActiveIssues
      })
    } catch (error) {
      console.error("Error updating active issues:", error)
    }
  }

  const getPlaygroundStatusColor = (status: string) => {
    switch (status) {
      case "Good":
        return "bg-green-100 text-green-800 border-green-200"
      case "Attention":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Urgent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-orange-100 text-orange-800"
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

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth)
      
      // Clear localStorage
      localStorage.removeItem("userRole")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userId")
      
      // Redirect to homepage
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      // Still clear localStorage and redirect even if Firebase signout fails
      localStorage.removeItem("userRole")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userId")
      router.push("/")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the admin dashboard.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Responsive Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 md:h-14 items-center px-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-base md:text-lg font-semibold">
              {isMobile ? "Admin" : "Administrator Dashboard"}
            </h1>
          </div>
          {!isMobile && (
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
          {isMobile && (
            <div className="ml-auto">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="text-sm text-muted-foreground px-2">{user?.email}</div>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Require assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{assignments.filter(a => a.status === "active").length}</div>
              <p className="text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStaffCount}</div>
              <p className="text-xs text-muted-foreground">Available for assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedTodayCount}</div>
              <p className="text-xs text-muted-foreground">Issues completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgResponseTime}</div>
              <p className="text-xs text-muted-foreground">Average resolution time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="resolutions">Issue Resolution</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
            <TabsTrigger value="playgrounds">Playgrounds</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Issues Tab - Detailed View of All Issues */}
          <TabsContent value="issues" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              {/* Header Card with Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    All Issues ({issues.length})
                  </CardTitle>
                  <CardDescription>Complete list of all reported issues with detailed information</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                      All ({issues.length})
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-orange-100 hover:text-orange-800">
                      Pending ({issues.filter(i => i.status === "pending").length})
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-blue-100 hover:text-blue-800">
                      Assigned ({issues.filter(i => i.status === "assigned").length})
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-yellow-100 hover:text-yellow-800">
                      In Progress ({issues.filter(i => i.status === "in-progress").length})
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-green-100 hover:text-green-800">
                      Resolved ({issues.filter(i => i.status === "resolved").length})
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Scrollable Issues Container */}
              <div className="max-h-[75vh] overflow-y-auto space-y-4 pr-2">
                {issues.map((issue) => (
                  <Card key={issue.id} className="border-l-4 hover:shadow-md transition-shadow" style={{
                    borderLeftColor: issue.severity === "high" ? "#dc2626" : 
                                    issue.severity === "medium" ? "#d97706" : "#16a34a"
                  }}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Issue Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-lg">{issue.title}</h3>
                            <Badge className={getStatusColor(issue.status)}>
                              {issue.status}
                            </Badge>
                            <Badge variant="outline" className={
                              issue.severity === "high" ? "border-red-300 text-red-700" :
                              issue.severity === "medium" ? "border-orange-300 text-orange-700" :
                              "border-green-300 text-green-700"
                            }>
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
                              <Clock className="h-3 w-3" />
                              {formatDate(issue.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {issue.reportedBy?.firstName} {issue.reportedBy?.lastName}
                            </span>
                          </div>

                          {/* Photos Preview */}
                          {issue.photoUrls && issue.photoUrls.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Photos ({issue.photoUrls.length}):</p>
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
                                {issue.photoUrls.length > 4 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 border">
                                    +{issue.photoUrls.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Assignment Info */}
                          {issue.assignedTo && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Assigned to:</strong> {issue.assignedTo}
                              </p>
                            </div>
                          )}

                          {/* Resolution Info */}
                          {issue.resolvedAt && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-green-800">
                                <strong>Resolved:</strong> {formatDate(issue.resolvedAt)}
                                {issue.resolvedBy && ` by ${issue.resolvedBy}`}
                              </p>
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
                            Full Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {issues.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No issues found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Reports */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Reports</CardTitle>
                  <CardDescription>Reports awaiting staff assignment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {issues.filter(issue => issue.status === "pending").map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{issue.title}</h4>
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-sm text-muted-foreground">{issue.location}</p>
                      
                      {/* Photo Gallery */}
                      {issue.photoUrls && issue.photoUrls.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Photos ({issue.photoUrls.length}):</p>
                          <div className="flex gap-2 flex-wrap">
                            {issue.photoUrls.map((url: string, index: number) => (
                              <div key={index} className="relative">
                                <img
                                  src={url}
                                  alt={`Issue photo ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
                                  onClick={() => setImageModal({
                                    isOpen: true,
                                    src: url,
                                    alt: `Issue photo ${index + 1} - ${issue.title}`
                                  })}
                                  onError={(e) => {
                                    console.error(`Failed to load image ${index + 1}:`, url.substring(0, 50) + '...')
                                    e.currentTarget.style.display = 'none'
                                  }}
                                  onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        Reported by {issue.reportedBy?.firstName} {issue.reportedBy?.lastName} on {formatDate(issue.createdAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedReport(issue.id)}
                          variant={selectedReport === issue.id ? "default" : "outline"}
                        >
                          {selectedReport === issue.id ? "Selected" : "Select"}
                        </Button>
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
                          variant="outline"
                          onClick={() => handleStatusUpdate(issue.id, "resolved")}
                        >
                          Mark Resolved
                        </Button>
                      </div>
                    </div>
                  ))}

                  {issues.filter(issue => issue.status === "pending").length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No pending reports</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Staff Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle>Assign to Staff</CardTitle>
                  <CardDescription>Select staff member for assignment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Available Staff</label>
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName} ({member.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleAssignReport} 
                    disabled={!selectedReport || !selectedStaff}
                    className="w-full"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resolutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Work Completion Review</CardTitle>
                <CardDescription>Review and approve maintenance work completed by staff</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {issues.filter(issue => issue.status === "resolved" && !issue.adminApproved && issue.workCompletedAt).map((issue) => (
                    <Card key={issue.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Issue Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-lg">{issue.title}</h3>
                                <Badge className="bg-orange-100 text-orange-800">
                                  Awaiting Approval
                                </Badge>
                                <Badge variant="outline" className={
                                  issue.severity === "low" ? "border-green-300 text-green-700" :
                                  issue.severity === "medium" ? "border-orange-300 text-orange-700" :
                                  "border-red-300 text-red-700"
                                }>
                                  {issue.severity} priority
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                <strong>Location:</strong> {issue.location}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Assigned to:</strong> {issue.assignedTo}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <strong>Completed on:</strong> {issue.workCompletedAt ? new Date(issue.workCompletedAt.seconds * 1000).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Original Issue Description */}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm">
                              <strong>Original Issue:</strong> {issue.description}
                            </p>
                          </div>

                          {/* Completion Notes */}
                          {issue.completionNotes && (
                            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                              <p className="text-sm">
                                <strong>Maintenance Notes:</strong> {issue.completionNotes}
                              </p>
                            </div>
                          )}

                          {/* Original Issue Photos */}
                          {issue.photoUrls && issue.photoUrls.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Original Issue Photos:</p>
                              <div className="flex gap-2 flex-wrap">
                                {issue.photoUrls.slice(0, 3).map((url: string, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={url}
                                      alt={`Issue photo ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border"
                                      onClick={() => setImageModal({
                                        isOpen: true,
                                        src: url,
                                        alt: `Issue photo ${index + 1} - ${issue.title}`
                                      })}
                                    />
                                  </div>
                                ))}
                                {issue.photoUrls.length > 3 && (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 border">
                                    +{issue.photoUrls.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Completion Proof Photos */}
                          {issue.completionProof && issue.completionProof.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Completion Proof Photos:</p>
                              <div className="flex gap-2 flex-wrap">
                                {issue.completionProof.slice(0, 4).map((url: string, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={url}
                                      alt={`Completion proof ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border border-green-300"
                                      onClick={() => setImageModal({
                                        isOpen: true,
                                        src: url,
                                        alt: `Completion proof ${index + 1} - ${issue.title}`
                                      })}
                                    />
                                  </div>
                                ))}
                                {issue.completionProof.length > 4 && (
                                  <div className="w-20 h-20 bg-green-50 rounded-lg flex items-center justify-center text-xs text-green-600 border border-green-300">
                                    +{issue.completionProof.length - 4}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              onClick={() => setViewIssueModal(issue)}
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View Full Details
                            </Button>
                            <Button
                              onClick={() => handleApproveCompletion(issue.id)}
                              size="sm"
                              className="gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve Completion
                            </Button>
                            <Button
                              onClick={() => handleRejectCompletion(issue.id)}
                              variant="destructive"
                              size="sm"
                              className="gap-1"
                            >
                              <X className="h-3 w-3" />
                              Reject & Send Back
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {issues.filter(issue => issue.status === "resolved" && !issue.adminApproved && issue.workCompletedAt).length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No completed work awaiting approval</p>
                      <p className="text-sm text-muted-foreground">Maintenance staff completions will appear here for review</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Approved Work Summary */}
            {issues.filter(issue => issue.adminApproved).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recently Approved Work</CardTitle>
                  <CardDescription>Work that has been completed and approved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {issues.filter(issue => issue.adminApproved).slice(0, 5).map((issue) => (
                      <div key={issue.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{issue.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Completed by {issue.assignedTo} • Approved on {issue.resolvedAt ? new Date(issue.resolvedAt.seconds * 1000).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Approved
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Staff</CardTitle>
                <CardDescription>Current staff members and their assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staff.map((member) => {
                    const assignedIssues = issues.filter(issue => issue.assignedTo === member.id && issue.status !== "resolved")
                    return (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{member.firstName} {member.lastName}</h4>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                            <p className="text-sm text-muted-foreground">Role: {member.role}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={assignedIssues.length > 0 ? "secondary" : "default"}>
                              {assignedIssues.length > 0 ? "Busy" : "Available"}
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignedIssues.length} active assignments
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {staff.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No maintenance staff found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playgrounds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Playground Management</CardTitle>
                <CardDescription>Monitor and update playground status and active issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {playgrounds.map((playground) => (
                    <div key={playground.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{playground.name}</h4>
                          <p className="text-sm text-muted-foreground">{playground.address}</p>
                          <p className="text-sm text-muted-foreground mt-1">{playground.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {playground.amenities.map((amenity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={getPlaygroundStatusColor(playground.status)}>
                            {playground.status}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            Last Inspection: {playground.lastInspection}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t">
                        <div>
                          <label className="text-sm font-medium">Active Issues</label>
                          <Select 
                            value={playground.activeIssues.toString()} 
                            onValueChange={(value) => handleActiveIssuesUpdate(playground.id, parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select 
                            value={playground.status} 
                            onValueChange={(value: "Good" | "Attention" | "Urgent") => 
                              handlePlaygroundStatusUpdate(playground.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Good">Good</SelectItem>
                              <SelectItem value="Attention">Needs Attention</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handlePlaygroundStatusUpdate(playground.id, playground.status)}
                            className="w-full"
                          >
                            Update Inspection Date
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {playgrounds.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No playgrounds found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Issue Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {["pending", "assigned", "in-progress", "resolved"].map((status) => {
                      const count = issues.filter(issue => issue.status === status).length
                      const percentage = issues.length > 0 ? (count / issues.length * 100).toFixed(1) : 0
                      return (
                        <div key={status} className="flex justify-between items-center">
                          <span className="capitalize">{status}</span>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(status)}>{count}</Badge>
                            <span className="text-sm text-muted-foreground">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {issues.slice(0, 5).map((issue) => (
                      <div key={issue.id} className="flex justify-between items-center text-sm">
                        <span>{issue.title}</span>
                        <Badge className={getStatusColor(issue.status)}>
                          {issue.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue Details Modal */}
      {viewIssueModal && (
        <Dialog open={!!viewIssueModal} onOpenChange={() => setViewIssueModal(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Issue Details - {viewIssueModal.title}
              </DialogTitle>
              <DialogDescription>
                Report ID: {viewIssueModal.id}
              </DialogDescription>
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
                  <label className="text-sm font-medium">Severity</label>
                  <div className="mt-1">
                    <Badge className={getSeverityColor(viewIssueModal.severity)}>
                      {viewIssueModal.severity}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Issue Information */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {viewIssueModal.category || "Not specified"}
                  </p>
                </div>
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

              {/* Reporter Information */}
              <div>
                <label className="text-sm font-medium">Reported By</label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>{viewIssueModal.reportedBy?.firstName} {viewIssueModal.reportedBy?.lastName}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">{viewIssueModal.reportedBy?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Reported on: {formatDate(viewIssueModal.createdAt)}
                  </p>
                </div>
              </div>

              {/* Photos */}
              {viewIssueModal.photoUrls && viewIssueModal.photoUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Attached Photos ({viewIssueModal.photoUrls.length})
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
                          onError={(e) => {
                            console.error(`Failed to load modal image ${index + 1}:`, url.substring(0, 50) + '...')
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                          onLoad={() => console.log(`Modal image ${index + 1} loaded successfully`)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click on any photo to view it in full size in the image viewer
                  </p>
                </div>
              )}

              {/* Resolution Information */}
              {viewIssueModal.resolvedAt && (
                <div>
                  <label className="text-sm font-medium">Resolution Details</label>
                  <div className="mt-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ This issue was resolved on {formatDate(viewIssueModal.resolvedAt)}
                    </p>
                    {viewIssueModal.resolvedBy && (
                      <p className="text-sm text-green-700">
                        Resolved by: {viewIssueModal.resolvedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => handleStatusUpdate(viewIssueModal.id, "resolved")}
                  disabled={viewIssueModal.status === "resolved"}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {viewIssueModal.status === "resolved" ? "Already Resolved" : "Mark as Resolved"}
                </Button>
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
              {/* Main Image Display */}
              <div className="flex justify-center items-center bg-gray-50 rounded-lg min-h-[60vh] max-h-[70vh] overflow-auto">
                <img
                  src={imageModal.src}
                  alt={imageModal.alt}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  style={{ maxHeight: '70vh', maxWidth: '100%' }}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = imageModal.src
                    link.download = `issue-photo-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="gap-2"
                >
                  📥 Download Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(imageModal.src).then(() => {
                      alert('Image data copied to clipboard!')
                    })
                  }}
                  className="gap-2"
                >
                  � Copy Image Data
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
