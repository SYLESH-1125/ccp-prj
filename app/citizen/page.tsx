"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CompactPlaygroundMap } from "@/components/playground-map"
import { Camera, MapPin, Bell, Search, Plus, Clock, CheckCircle, AlertTriangle, User, LogOut, Eye, X, Menu } from "lucide-react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Types for our data
interface Issue {
  id: string
  reportId: string
  title: string
  description: string
  category: string
  severity: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "resolved"
  location: string
  createdAt: any
  updatedAt: any
  reportedBy: {
    uid: string
    email: string
    firstName: string
    lastName: string
  }
  resolvedAt?: any
  resolvedBy?: any
  photoUrls: string[]
}

interface Playground {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  amenities: string[]
  status: "Good" | "Attention" | "Urgent"
  activeIssues: number
  lastInspection: string
  description?: string
  distance?: number
}

export default function CitizenDashboard() {
  const { user, userData } = useAuth()
  const isMobile = useIsMobile()
  const [myReports, setMyReports] = useState<Issue[]>([])
  const [allIssues, setAllIssues] = useState<Issue[]>([])
  const [nearbyPlaygrounds, setNearbyPlaygrounds] = useState<Playground[]>([])
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [imageModal, setImageModal] = useState<{isOpen: boolean, src: string, alt: string}>({
    isOpen: false,
    src: "",
    alt: ""
  })

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in miles
  }

  const formatDistance = (distance: number): string => {
    if (distance < 0.1) return "< 0.1 mi"
    return `${distance.toFixed(1)} mi`
  }

  // Fetch playgrounds from Firebase
  useEffect(() => {
    const fetchPlaygrounds = async () => {
      try {
        const playgroundsSnapshot = await getDocs(collection(db, "playgrounds"))
        let playgroundsData = playgroundsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Playground[]

        // Get user location for distance calculation
        if (navigator.geolocation && playgroundsData.length > 0) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              }
              setUserLocation(location)
              
              // Calculate distances and sort playgrounds
              const playgroundsWithDistance = playgroundsData.map(playground => ({
                ...playground,
                distance: calculateDistance(
                  location.latitude,
                  location.longitude,
                  playground.latitude,
                  playground.longitude
                )
              })).sort((a, b) => a.distance - b.distance).slice(0, 5) // Show top 5 nearest
              
              setNearbyPlaygrounds(playgroundsWithDistance)
            },
            (error) => {
              console.error("Error getting location:", error)
              // If location fails, just show first 5 playgrounds without distance
              setNearbyPlaygrounds(playgroundsData.slice(0, 5))
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000
            }
          )
        } else {
          // If no geolocation or no playgrounds, just show first 5
          setNearbyPlaygrounds(playgroundsData.slice(0, 5))
        }
      } catch (error) {
        console.error("Error fetching playgrounds:", error)
      }
    }

    fetchPlaygrounds()
  }, [])

  useEffect(() => {
    if (!user || !userData) {
      setLoading(false)
      return
    }

    console.log("Setting up Firebase listeners for user:", user.uid)

    // Fetch user's own reports (without orderBy to avoid index requirement)
    const userReportsQuery = query(
      collection(db, "issues"),
      where("reportedBy.uid", "==", user.uid)
    )

    // Fetch all issues for community activity (without orderBy to avoid index requirement)
    const allIssuesQuery = query(
      collection(db, "issues")
    )

    // Subscribe to user's reports
    const unsubscribeUserReports = onSnapshot(
      userReportsQuery, 
      (snapshot) => {
        console.log("User reports snapshot received:", snapshot.docs.length)
        const reports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Issue[]
        // Sort on client side
        reports.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
          return bTime.getTime() - aTime.getTime()
        })
        setMyReports(reports)
        console.log("User reports updated:", reports.length)
      },
      (error) => {
        console.error("Error fetching user reports:", error)
        setMyReports([]) // Set empty array on error
      }
    )

    // Subscribe to all issues
    const unsubscribeAllIssues = onSnapshot(
      allIssuesQuery, 
      (snapshot) => {
        console.log("All issues snapshot received:", snapshot.docs.length)
        const issues = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Issue[]
        // Sort on client side
        issues.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt || 0)
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt || 0)
          return bTime.getTime() - aTime.getTime()
        })
        setAllIssues(issues)
        setLoading(false) // Set loading to false after any data is received
        console.log("All issues updated:", issues.length)
      },
      (error) => {
        console.error("Error fetching all issues:", error)
        setAllIssues([]) // Set empty array on error
        setLoading(false) // Stop loading even on error
      }
    )

    return () => {
      unsubscribeUserReports()
      unsubscribeAllIssues()
    }
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
      case "resolved":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const getPlaygroundStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "good":
        return "bg-green-100 text-green-800 border-green-200"
      case "attention":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "pending":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-Responsive Header */}
      <MobileHeader
        title="Citizen Dashboard"
        navigation={[
          { href: "/report", label: "Report Issue", icon: Camera },
          { href: "/playground", label: "Find Playgrounds", icon: MapPin },
          { href: "/status", label: "Safety Status", icon: CheckCircle }
        ]}
        onLogout={() => {/* logout logic */}}
      />

      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <ResponsiveCard
            title="Report an Issue"
            description="Spotted a problem at a playground? Report it instantly with photos and GPS location."
            className="bg-primary/5 border-primary/20"
            mobileBorderless={true}
          >
            <Button asChild className="w-full" size={isMobile ? "default" : "lg"}>
              <Link href="/report">
                <Plus className="h-4 w-4 mr-2" />
                Create New Report
              </Link>
            </Button>
          </ResponsiveCard>

          <ResponsiveCard
            title="Find Playgrounds"
            description="Discover playgrounds near you and check their current safety status."
            mobileBorderless={true}
          >
            <Button variant="outline" asChild className="w-full" size={isMobile ? "default" : "lg"}>
              <Link href="/playground">
                <MapPin className="h-4 w-4 mr-2" />
                Explore Playgrounds
              </Link>
            </Button>
          </ResponsiveCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Find Playgrounds
              </CardTitle>
              <CardDescription>Discover playgrounds near you and check their current safety status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/playground?auto_locate=true">
                  <Search className="h-4 w-4 mr-2" />
                  Explore Nearby
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="my-reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="nearby">Nearby Playgrounds</TabsTrigger>
            <TabsTrigger value="activity">Community Activity</TabsTrigger>
          </TabsList>

          {/* My Reports Tab */}
          <TabsContent value="my-reports" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Issue Reports</h2>
              <Badge variant="secondary">{myReports.length} total reports</Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading your reports...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getStatusIcon(report.status)}
                            {report.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {report.location || "Location not specified"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                          <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                      
                      {/* Photo Gallery */}
                      {report.photoUrls && report.photoUrls.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Photos:</p>
                          <div className="flex gap-2 flex-wrap">
                            {report.photoUrls.map((url: string, index: number) => (
                              <div key={index} className="relative">
                                <img
                                  src={url}
                                  alt={`Issue photo ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setImageModal({
                                    isOpen: true,
                                    src: url,
                                    alt: `My Report Photo ${index + 1} - ${report.title}`
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Report ID: {report.reportId}</span>
                          <span className="text-muted-foreground">Reported: {formatDate(report.createdAt)}</span>
                          {report.resolvedAt && <span className="text-green-600">Resolved: {formatDate(report.resolvedAt)}</span>}
                        </div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {myReports.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
                      <Button asChild className="mt-4">
                        <Link href="/report">Submit Your First Report</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Nearby Playgrounds Tab */}
          <TabsContent value="nearby" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Playgrounds Near You</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/playground?auto_locate=true">
                  <MapPin className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {nearbyPlaygrounds.map((playground) => (
                <Card key={playground.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{playground.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {playground.distance ? `${formatDistance(playground.distance)} away` : playground.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${playground.activeIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {playground.activeIssues}
                          </div>
                          <div className="text-xs text-muted-foreground">Active Issues</div>
                        </div>
                        <Badge className={`${getPlaygroundStatusColor(playground.status)} border`}>
                          {playground.status}
                        </Badge>
                      </div>
                    </div>
                    {/* Compact Map */}
                    <CompactPlaygroundMap playground={playground} userLocation={userLocation} />
                  </CardContent>
                </Card>
              ))}
              
              {nearbyPlaygrounds.length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">Loading nearby playgrounds...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Community Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <h2 className="text-xl font-semibold">Recent Community Activity</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading community activity...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allIssues.slice(0, 10).map((issue) => (
                  <Card key={issue.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        {getStatusIcon(issue.status)}
                        <div className="flex-1">
                          <p className="font-medium">{issue.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Reported by {issue.reportedBy.firstName} {issue.reportedBy.lastName} • {formatDate(issue.createdAt)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                            <Badge className={getStatusColor(issue.status)}>{issue.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {allIssues.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No community activity yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
                    link.download = `my-report-photo-${Date.now()}.jpg`
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
