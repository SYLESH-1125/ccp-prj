"use client"

import { useState, useEffect, Suspense } from "react"
import { collection, getDocs, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlaygroundMap } from "@/components/playground-map"
import { MapPin, Navigation, Search, Clock, AlertTriangle, CheckCircle, ArrowLeft, Loader2, LogIn, Eye } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileHeader } from "@/components/mobile-header"
import { ResponsiveCard } from "@/components/responsive-card"

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic'

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
}

interface UserLocation {
  latitude: number
  longitude: number
}

export default function PlaygroundsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading playgrounds...</p>
        </div>
      </div>
    }>
      <PlaygroundsContent />
    </Suspense>
  )
}

function PlaygroundsContent() {
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([])
  const [nearbyPlaygrounds, setNearbyPlaygrounds] = useState<(Playground & { distance: number })[]>([])
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationError, setLocationError] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication status and user role
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const role = localStorage.getItem("userRole")
        const authenticated = !!role
        setIsAuthenticated(authenticated)
        setUserRole(role)
      }
    }

    checkAuth()

    // Listen for auth changes
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  // Get back URL based on user role
  const getBackUrl = () => {
    if (!isAuthenticated) return "/"
    
    switch (userRole) {
      case "citizen":
        return "/citizen"
      case "admin":
        return "/admin"
      case "maintenance":
        return "/dashboard"
      default:
        return "/"
    }
  }
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

  // Fetch playgrounds from Firebase
  useEffect(() => {
    const fetchPlaygrounds = async () => {
      try {
        const playgroundsSnapshot = await getDocs(collection(db, "playgrounds"))
        const playgroundsData = playgroundsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Playground[]
        
        setPlaygrounds(playgroundsData)
      } catch (error) {
        console.error("Error fetching playgrounds:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlaygrounds()
  }, [])

  // Auto-trigger location if auto_locate parameter is present
  useEffect(() => {
    const autoLocate = searchParams.get('auto_locate')
    if (autoLocate === 'true' && playgrounds.length > 0 && !userLocation && !locationLoading) {
      getCurrentLocation()
    }
  }, [playgrounds, userLocation, locationLoading, searchParams])

  // Get user's current location
  const getCurrentLocation = () => {
    setLocationLoading(true)
    setLocationError("")

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser")
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }
        setUserLocation(location)
        
        // Calculate distances and sort playgrounds
        const playgroundsWithDistance = playgrounds.map(playground => ({
          ...playground,
          distance: calculateDistance(
            location.latitude,
            location.longitude,
            playground.latitude,
            playground.longitude
          )
        })).sort((a, b) => a.distance - b.distance)
        
        setNearbyPlaygrounds(playgroundsWithDistance)
        setLocationLoading(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationError("Unable to get your location. Please enable location services.")
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Filter playgrounds based on search
  const filteredPlaygrounds = (userLocation ? nearbyPlaygrounds : playgrounds).filter(playground =>
    playground.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playground.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSafetyColor = (rating: string) => {
    switch (rating.toLowerCase()) {
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

  const getSafetyIcon = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "attention":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "urgent":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDistance = (distance: number): string => {
    if (distance < 0.1) return "< 0.1 mi"
    return `${distance.toFixed(1)} mi`
  }

  // Function to open map directions
  const openDirections = (playground: Playground) => {
    if (!userLocation) {
      // If no user location, just open the playground location
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${playground.latitude},${playground.longitude}`
      window.open(mapUrl, '_blank')
      return
    }

    // Get directions from user location to playground
    const origin = `${userLocation.latitude},${userLocation.longitude}`
    const destination = `${playground.latitude},${playground.longitude}`
    
    // Detect device type for appropriate maps app
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isAndroid = /Android/.test(navigator.userAgent)
    
    let mapUrl: string
    
    if (isIOS) {
      // Use Apple Maps on iOS devices
      mapUrl = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
    } else if (isAndroid) {
      // Use Google Maps on Android devices
      mapUrl = `google.navigation:q=${destination}&mode=d`
    } else {
      // Use Google Maps web version for desktop/other devices
      mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
    }
    
    window.open(mapUrl, '_blank')
  }

  // Function to render playground details dialog
  const PlaygroundDetailsDialog = ({ playground }: { playground: Playground & { distance?: number } }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size={isMobile ? "default" : "sm"} className="flex-1">
          <Eye className="h-4 w-4 mr-1" />
          {isMobile ? "Details" : "View Details"}
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[85vh]' : 'max-w-2xl max-h-[80vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {playground.name}
          </DialogTitle>
          <DialogDescription>
            {playground.address}
            {playground.distance && (
              <span className="ml-2 text-primary">
                📍 {formatDistance(playground.distance)} away
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Safety Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Safety Status</h3>
              <Badge className={`${getSafetyColor(playground.status)} border flex items-center gap-1`}>
                {getSafetyIcon(playground.status)}
                {playground.status}
              </Badge>
            </div>
            {playground.activeIssues > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{playground.activeIssues}</div>
                <div className="text-xs text-muted-foreground">Active Issues</div>
              </div>
            )}
          </div>

          {/* Description */}
          {playground.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{playground.description}</p>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h3 className="font-semibold mb-2">Available Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {playground.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Location Info */}
          <div>
            <h3 className="font-semibold mb-2">Location Information</h3>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Address:</span> {playground.address}</p>
              <p><span className="font-medium">Coordinates:</span> {playground.latitude.toFixed(4)}, {playground.longitude.toFixed(4)}</p>
              {playground.distance && (
                <p><span className="font-medium">Distance:</span> {formatDistance(playground.distance)} from your location</p>
              )}
            </div>
          </div>

          {/* Inspection Info */}
          <div>
            <h3 className="font-semibold mb-2">Inspection History</h3>
            <p className="text-sm text-muted-foreground">
              Last Inspection: {playground.lastInspection}
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 pt-4 border-t ${isMobile ? 'flex-col' : ''}`}>
            <PlaygroundMap playground={playground} userLocation={userLocation} />
            {isAuthenticated ? (
              <Button variant="outline" size={isMobile ? "default" : "lg"} asChild>
                <Link href="/report">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report Issue
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size={isMobile ? "default" : "lg"} asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile ? (
        <MobileHeader
          title="Find Playgrounds"
          backUrl={getBackUrl()}
          backText="Back"
          actions={
            isAuthenticated ? (
              <Button size="sm" asChild>
                <Link href="/report">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report
                </Link>
              </Button>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )
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
                    Back
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl font-bold">Find Playgrounds</h1>
                  <p className="text-sm text-muted-foreground">
                    Discover playgrounds near you and check their safety status
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <Button asChild>
                    <Link href="/report">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login to Report
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={`container mx-auto px-4 py-${isMobile ? '4' : '8'}`}>
        {/* Location and Search */}
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'md:grid-cols-3 gap-4'} mb-${isMobile ? '6' : '8'}`}>
          <div className={isMobile ? '' : 'md:col-span-2'}>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search playgrounds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={getCurrentLocation}
            disabled={locationLoading}
            className="gap-2"
            size={isMobile ? "default" : "default"}
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            {locationLoading ? "Getting Location..." : "Find Nearby"}
          </Button>
        </div>

        {/* Location Status */}
        {locationError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {userLocation && (
          <Alert className="mb-6">
            <Navigation className="h-4 w-4" />
            <AlertDescription>
              Showing playgrounds near your location ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
            </AlertDescription>
          </Alert>
        )}

        {/* Playgrounds Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading playgrounds...</p>
          </div>
        ) : (
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
            {filteredPlaygrounds.map((playground) => (
              <ResponsiveCard 
                key={playground.id} 
                className="hover:shadow-md transition-shadow"
                mobileBorderless={false}
              >
                <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className={isMobile ? "text-base" : "text-lg"}>{playground.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {isMobile ? playground.address.substring(0, 30) + '...' : playground.address}
                      </CardDescription>
                      {userLocation && 'distance' in playground && typeof playground.distance === 'number' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {formatDistance(playground.distance)} away
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${getSafetyColor(playground.status)} border flex items-center gap-1 ${isMobile ? 'text-xs' : ''}`}>
                        {getSafetyIcon(playground.status)}
                        {playground.status}
                      </Badge>
                      {playground.activeIssues > 0 && (
                        <div className="text-center">
                          <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-red-600`}>{playground.activeIssues}</div>
                          <div className="text-xs text-muted-foreground">Issues</div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                  {playground.description && !isMobile && (
                    <p className="text-sm text-muted-foreground mb-3">{playground.description}</p>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-2`}>Amenities</h4>
                      <div className="flex flex-wrap gap-1">
                        {playground.amenities.slice(0, isMobile ? 3 : playground.amenities.length).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {isMobile && playground.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{playground.amenities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {!isMobile && (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Last Inspection:</span>
                        <span>{playground.lastInspection}</span>
                      </div>
                    )}
                  </div>

                  <div className={`flex gap-2 mt-4 ${isMobile ? 'flex-col' : ''}`}>
                    <PlaygroundDetailsDialog playground={playground} />
                    <PlaygroundMap playground={playground} userLocation={userLocation} />
                    {isAuthenticated ? (
                      <Button size={isMobile ? "default" : "sm"} variant="outline" asChild>
                        <Link href="/report">
                          <AlertTriangle className="h-4 w-4" />
                          {isMobile && <span className="ml-2">Report Issue</span>}
                        </Link>
                      </Button>
                    ) : (
                      <Button size={isMobile ? "default" : "sm"} variant="outline" asChild>
                        <Link href="/login">
                          <LogIn className="h-4 w-4" />
                          {isMobile && <span className="ml-2">Login</span>}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </ResponsiveCard>
            ))}
          </div>
        )}

        {!loading && filteredPlaygrounds.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No playgrounds found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search terms or clear the search to see all playgrounds."
                : "No playgrounds are available in the system yet."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
