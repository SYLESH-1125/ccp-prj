"use client"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, MapPin, Calendar, AlertTriangle, CheckCircle, Camera, FileText, Settings } from "lucide-react"
import Link from "next/link"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

// Mock data for individual playground
const playgroundData = {
  id: 1,
  name: "Central Park Playground",
  location: "Downtown District",
  address: "123 Central Park Ave, Downtown",
  coordinates: "40.7829, -73.9654",
  status: "good",
  lastInspection: "2025-01-15",
  nextInspection: "2025-02-15",
  equipment: ["Swings", "Slides", "Climbing Frame", "Sandbox"],
  capacity: 50,
  ageRange: "3-12 years",
  surface: "Rubber matting",
  accessibility: "Fully accessible",
  issues: {
    active: 1,
    resolved: 12,
    total: 13,
  },
}

const issueHistory = [
  {
    id: 1,
    title: "Broken swing chain",
    category: "Equipment",
    severity: "medium",
    status: "resolved",
    reportedDate: "2025-01-10",
    resolvedDate: "2025-01-12",
    reporter: "Sarah M.",
    assignedTo: "Mike Johnson",
    description: "Chain on swing #3 is broken and needs replacement",
  },
  {
    id: 2,
    title: "Graffiti on slide",
    category: "Vandalism",
    severity: "low",
    status: "in-progress",
    reportedDate: "2025-01-14",
    resolvedDate: null,
    reporter: "John D.",
    assignedTo: "Lisa Chen",
    description: "Graffiti needs to be cleaned from the main slide surface",
  },
  {
    id: 3,
    title: "Loose sandbox border",
    category: "Safety",
    severity: "high",
    status: "resolved",
    reportedDate: "2025-01-08",
    resolvedDate: "2025-01-09",
    reporter: "Emma K.",
    assignedTo: "Mike Johnson",
    description: "Sandbox border is loose and poses a tripping hazard",
  },
]

export default function PlaygroundDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview")
  const isMobile = useIsMobile()

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getIssueStatusColor = (status: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader
          title={playgroundData.name}
          backUrl="/playground"
          backText="Back"
          actions={
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Manage
            </Button>
          }
        />
      ) : (
        /* Desktop Header */
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/playground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Playgrounds
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{playgroundData.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {playgroundData.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${getStatusColor(playgroundData.status)} border`}>
                  {playgroundData.status === "good" && "Good Condition"}
                  {playgroundData.status === "attention" && "Needs Attention"}
                  {playgroundData.status === "urgent" && "Urgent"}
                </Badge>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={`container mx-auto px-4 py-${isMobile ? '4' : '8'}`}>
        {/* Mobile Status Badge */}
        {isMobile && (
          <div className="mb-4 flex justify-center">
            <Badge className={`${getStatusColor(playgroundData.status)} border`}>
              {playgroundData.status === "good" && "Good Condition"}
              {playgroundData.status === "attention" && "Needs Attention"}
              {playgroundData.status === "urgent" && "Urgent"}
            </Badge>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            {!isMobile && <TabsTrigger value="maintenance">Maintenance</TabsTrigger>}
            {!isMobile && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'md:grid-cols-3 gap-6'}`}>
              {/* Basic Info */}
              <ResponsiveCard 
                title="Playground Information"
                className={isMobile ? '' : 'md:col-span-2'}
                mobileBorderless={isMobile}
              >
                <div className="space-y-4">
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'md:grid-cols-2 gap-4'}`}>
                    <div>
                      <Label className="text-sm font-medium">Address</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.address}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Coordinates</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.coordinates}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Capacity</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.capacity} children</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Age Range</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.ageRange}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Surface Type</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.surface}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Accessibility</Label>
                      <p className="text-sm text-muted-foreground">{playgroundData.accessibility}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Equipment</Label>
                    <div className="flex flex-wrap gap-2">
                      {playgroundData.equipment.map((item, index) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ResponsiveCard>

              {/* Quick Stats */}
              <div className="space-y-6">
                <ResponsiveCard 
                  title="Issue Summary"
                  mobileBorderless={isMobile}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Issues</span>
                      <Badge variant="destructive">{playgroundData.issues.active}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Resolved Issues</span>
                      <Badge variant="secondary">{playgroundData.issues.resolved}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Reports</span>
                      <Badge variant="outline">{playgroundData.issues.total}</Badge>
                    </div>
                  </div>
                </ResponsiveCard>

                <ResponsiveCard 
                  title="Inspection Schedule"
                  mobileBorderless={isMobile}
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Last Inspection</p>
                        <p className="text-sm text-muted-foreground">{playgroundData.lastInspection}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Next Inspection</p>
                        <p className="text-sm text-muted-foreground">{playgroundData.nextInspection}</p>
                      </div>
                    </div>
                  </div>
                </ResponsiveCard>
              </div>
            </div>

            {/* Map Placeholder */}
            <ResponsiveCard 
              title="Location Map"
              mobileBorderless={isMobile}
            >
              <div className={`${isMobile ? 'h-48' : 'h-64'} bg-muted/30 rounded-lg flex items-center justify-center`}>
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Interactive map would be displayed here</p>
                  <p className="text-sm text-muted-foreground">Coordinates: {playgroundData.coordinates}</p>
                </div>
              </div>
            </ResponsiveCard>
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Issue History</h2>
              <Button size={isMobile ? "sm" : "default"} asChild>
                <Link href="/report">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {isMobile ? "Report" : "Report New Issue"}
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {issueHistory.map((issue) => (
                <ResponsiveCard 
                  key={issue.id}
                  mobileBorderless={false}
                >
                  <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                    <div className={`flex items-start justify-between ${isMobile ? 'flex-col gap-2' : ''}`}>
                      <div className="flex-1">
                        <CardTitle className={isMobile ? "text-base" : "text-lg"}>{issue.title}</CardTitle>
                        <CardDescription className="mt-1">{issue.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(issue.severity)}>{issue.severity}</Badge>
                        <Badge className={getIssueStatusColor(issue.status)}>{issue.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'md:grid-cols-2 lg:grid-cols-4 gap-4'} text-sm`}>
                      <div>
                        <Label className="font-medium">Category</Label>
                        <p className="text-muted-foreground">{issue.category}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Reported By</Label>
                        <p className="text-muted-foreground">{issue.reporter}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Assigned To</Label>
                        <p className="text-muted-foreground">{issue.assignedTo}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Reported Date</Label>
                        <p className="text-muted-foreground">{issue.reportedDate}</p>
                      </div>
                    </div>
                    {issue.resolvedDate && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>Resolved on {issue.resolvedDate}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </ResponsiveCard>
              ))}
            </div>
          </TabsContent>

          {/* Mobile tabs content */}
          {isMobile && (
            <>
              <TabsContent value="maintenance" className="space-y-6">
                <ResponsiveCard 
                  title="Maintenance Schedule"
                  description="Upcoming and completed maintenance activities"
                  mobileBorderless={true}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">Monthly Safety Inspection</p>
                          <p className="text-xs text-muted-foreground">Scheduled for February 15, 2025</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">Upcoming</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-sm">Equipment Deep Clean</p>
                          <p className="text-xs text-muted-foreground">Completed on January 15, 2025</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Completed</Badge>
                    </div>
                  </div>
                </ResponsiveCard>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <ResponsiveCard 
                  title="Generate Reports"
                  description="Create detailed reports for this playground"
                  mobileBorderless={true}
                >
                  <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="h-16 flex-col gap-2 bg-transparent">
                      <FileText className="h-5 w-5" />
                      <span className="text-sm">Safety Report</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col gap-2 bg-transparent">
                      <Camera className="h-5 w-5" />
                      <span className="text-sm">Photo Documentation</span>
                    </Button>
                  </div>
                </ResponsiveCard>
              </TabsContent>
            </>
          )}

          {/* Desktop Maintenance and Reports tabs remain unchanged for desktop */}
          {!isMobile && (
            <>
              <TabsContent value="maintenance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Schedule</CardTitle>
                    <CardDescription>Upcoming and completed maintenance activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium">Monthly Safety Inspection</p>
                            <p className="text-sm text-muted-foreground">Scheduled for February 15, 2025</p>
                          </div>
                        </div>
                        <Badge variant="outline">Upcoming</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">Equipment Deep Clean</p>
                            <p className="text-sm text-muted-foreground">Completed on January 15, 2025</p>
                          </div>
                        </div>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Reports</CardTitle>
                    <CardDescription>Create detailed reports for this playground</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                        <FileText className="h-6 w-6" />
                        <span>Safety Report</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
                        <Camera className="h-6 w-6" />
                        <span>Photo Documentation</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}

function Label({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
  return (
    <label className={`text-sm font-medium ${className || ""}`} {...props}>
      {children}
    </label>
  )
}
