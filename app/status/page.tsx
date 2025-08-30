"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MapPin, Clock, CheckCircle, AlertTriangle, ArrowLeft, Bell, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

// Mock data for status tracking
const allReports = [
  {
    id: "PS-123456",
    title: "Broken swing chain",
    playground: "Central Park Playground",
    reporter: "Sarah M.",
    status: "resolved",
    severity: "medium",
    reportedDate: "2025-01-10",
    resolvedDate: "2025-01-12",
    assignedTo: "Mike Johnson",
    description: "Chain on swing #3 is broken and needs replacement",
    timeline: [
      { date: "2025-01-10", time: "09:30", event: "Issue reported", type: "report" },
      { date: "2025-01-10", time: "10:15", event: "Report reviewed and assigned", type: "assignment" },
      { date: "2025-01-11", time: "14:20", event: "Maintenance started", type: "progress" },
      { date: "2025-01-12", time: "11:45", event: "Issue resolved", type: "completion" },
    ],
  },
  {
    id: "PS-123457",
    title: "Graffiti on slide surface",
    playground: "Riverside Community Park",
    reporter: "John D.",
    status: "in-progress",
    severity: "low",
    reportedDate: "2025-01-14",
    resolvedDate: null,
    assignedTo: "Lisa Chen",
    description: "Graffiti needs to be cleaned from the main slide surface",
    timeline: [
      { date: "2025-01-14", time: "16:45", event: "Issue reported", type: "report" },
      { date: "2025-01-15", time: "08:30", event: "Report reviewed and assigned", type: "assignment" },
      { date: "2025-01-17", time: "10:00", event: "Cleaning materials ordered", type: "progress" },
    ],
  },
  {
    id: "PS-123458",
    title: "Loose sandbox border",
    playground: "Oak Street Playground",
    reporter: "Emma K.",
    status: "pending",
    severity: "high",
    reportedDate: "2025-01-18",
    resolvedDate: null,
    assignedTo: null,
    description: "Sandbox border is loose and poses a tripping hazard",
    timeline: [
      { date: "2025-01-18", time: "13:20", event: "Issue reported", type: "report" },
      { date: "2025-01-18", time: "13:25", event: "Report received and under review", type: "review" },
    ],
  },
]

export default function StatusTrackingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // Get back URL based on user role
  const getBackUrl = () => {
    switch (userRole) {
      case "citizen":
        return "/citizen"
      case "admin":
        return "/admin"
      case "maintenance":
        return "/dashboard"
      default:
        return "/citizen" // Default to citizen dashboard
    }
  }

  // Check user role
  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("userRole")
      setUserRole(role)
    }
  }, [])

  const filteredReports = allReports.filter((report) => {
    const matchesSearch =
      report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.playground.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selectedReportData = selectedReport ? allReports.find((r) => r.id === selectedReport) : null

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

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "report":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "assignment":
        return <User className="h-4 w-4 text-blue-600" />
      case "progress":
        return <Clock className="h-4 w-4 text-orange-600" />
      case "completion":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "review":
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTimelineColor = (type: string) => {
    switch (type) {
      case "report":
        return "border-yellow-200 bg-yellow-50"
      case "assignment":
        return "border-blue-200 bg-blue-50"
      case "progress":
        return "border-orange-200 bg-orange-50"
      case "completion":
        return "border-green-200 bg-green-50"
      case "review":
        return "border-purple-200 bg-purple-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader
          title="Status Tracking"
          backUrl={getBackUrl()}
          backText="Back"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/report">Report</Link>
              </Button>
            </div>
          }
        />
      ) : (
        /* Desktop Header */
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={getBackUrl()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">Status Tracking</h1>
                  <p className="text-muted-foreground">Track the progress of playground maintenance reports</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/report">Report Issue</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={`container mx-auto px-4 py-${isMobile ? '4' : '8'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'lg:grid-cols-3 gap-8'}`}>
          {/* Search and Filter */}
          <div className={`${isMobile ? '' : 'lg:col-span-2'} space-y-6`}>
            <ResponsiveCard mobileBorderless={isMobile}>
              <div className={`flex ${isMobile ? 'flex-col' : 'flex-col sm:flex-row'} gap-4`}>
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={isMobile ? "Search reports..." : "Search by report ID, title, or playground..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-full sm:w-48'}`}>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </ResponsiveCard>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <ResponsiveCard
                  key={report.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedReport === report.id ? "ring-2 ring-primary" : ""
                  }`}
                  mobileBorderless={false}
                  onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                >
                  <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className={isMobile ? "text-base" : "text-lg"}>{report.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {isMobile ? report.playground.substring(0, 25) + '...' : report.playground}
                        </CardDescription>
                      </div>
                      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
                        <Badge className={`${getSeverityColor(report.severity)} ${isMobile ? 'text-xs' : ''}`}>{report.severity}</Badge>
                        <Badge className={`${getStatusColor(report.status)} ${isMobile ? 'text-xs' : ''}`}>{report.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                    <div className={`flex items-center justify-between text-sm ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
                      <div className={`flex items-center gap-4 ${isMobile ? 'flex-col items-start gap-1' : ''}`}>
                        <span className="font-medium">ID: {report.id}</span>
                        <span className="text-muted-foreground">Reported: {report.reportedDate}</span>
                        {report.assignedTo && (
                          <span className="text-muted-foreground">
                            {isMobile ? `Assigned: ${report.assignedTo}` : `Assigned to: ${report.assignedTo}`}
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        {selectedReport === report.id ? "Hide Details" : "View Details"}
                      </Button>
                    </div>
                  </CardContent>
                </ResponsiveCard>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <ResponsiveCard mobileBorderless={isMobile}>
                <div className="text-center pt-6">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No reports found</h3>
                  <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
                </div>
              </ResponsiveCard>
            )}
          </div>

          {/* Report Details */}
          <div className="space-y-6">
            {selectedReportData ? (
              <>
                <ResponsiveCard 
                  title="Report Details"
                  description={`ID: ${selectedReportData.id}`}
                  mobileBorderless={isMobile}
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">{selectedReportData.title}</h4>
                      <p className="text-sm text-muted-foreground">{selectedReportData.description}</p>
                    </div>

                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'} text-sm`}>
                      <div>
                        <span className="font-medium">Location:</span>
                        <p className="text-muted-foreground">{selectedReportData.playground}</p>
                      </div>
                      <div>
                        <span className="font-medium">Reporter:</span>
                        <p className="text-muted-foreground">{selectedReportData.reporter}</p>
                      </div>
                      <div>
                        <span className="font-medium">Reported:</span>
                        <p className="text-muted-foreground">{selectedReportData.reportedDate}</p>
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <Badge className={`${getStatusColor(selectedReportData.status)} mt-1`}>
                          {selectedReportData.status}
                        </Badge>
                      </div>
                    </div>

                    {selectedReportData.assignedTo && (
                      <div className="pt-3 border-t">
                        <span className="font-medium">Assigned to:</span>
                        <p className="text-muted-foreground">{selectedReportData.assignedTo}</p>
                      </div>
                    )}
                  </div>
                </ResponsiveCard>

                <ResponsiveCard 
                  title="Progress Timeline"
                  description="Track the progress of this report"
                  mobileBorderless={isMobile}
                >
                  <div className="space-y-4">
                    {selectedReportData.timeline.map((event, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className={`p-2 rounded-full border-2 ${getTimelineColor(event.type)}`}>
                          {getTimelineIcon(event.type)}
                        </div>
                        <div className="flex-1">
                          <div className={`flex items-center ${isMobile ? 'flex-col items-start' : 'justify-between'}`}>
                            <p className="font-medium text-sm">{event.event}</p>
                            <span className="text-xs text-muted-foreground">{event.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{event.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ResponsiveCard>
              </>
            ) : (
              <ResponsiveCard mobileBorderless={isMobile}>
                <div className="text-center pt-6">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Report</h3>
                  <p className="text-muted-foreground">Click on a report to view detailed progress information</p>
                </div>
              </ResponsiveCard>
            )}

            {/* Quick Actions */}
            <ResponsiveCard 
              title="Quick Actions"
              mobileBorderless={isMobile}
            >
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/report">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report New Issue
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    View Notifications
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
                  <Link href="/playground">
                    <MapPin className="h-4 w-4 mr-2" />
                    Playground Map
                  </Link>
                </Button>
              </div>
            </ResponsiveCard>
          </div>
        </div>
      </div>
    </div>
  )
}
