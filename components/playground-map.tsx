"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, X, Maximize2, Minimize2 } from "lucide-react"

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

interface PlaygroundMapProps {
  playground: Playground
  userLocation?: {
    latitude: number
    longitude: number
  } | null
}

export function PlaygroundMap({ playground, userLocation }: PlaygroundMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapUrl, setMapUrl] = useState("")

  useEffect(() => {
    // Generate the map URL based on whether we have user location or not
    let url = ""
    
    if (userLocation) {
      // Show directions from user location to playground
      const origin = `${userLocation.latitude},${userLocation.longitude}`
      const destination = `${playground.latitude},${playground.longitude}`
      url = `https://www.google.com/maps/embed/v1/directions?key=YOUR_API_KEY&origin=${origin}&destination=${destination}&mode=driving`
    } else {
      // Just show the playground location
      url = `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${playground.latitude},${playground.longitude}&zoom=15`
    }
    
    // For now, we'll use a basic Google Maps embed URL without API key (limited functionality)
    // You'll need to get a Google Maps API key for full functionality
    const basicUrl = userLocation 
      ? `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d15548.123!2d${playground.longitude}!3d${playground.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s${userLocation.latitude},${userLocation.longitude}!2sYour+Location!3m2!1d${userLocation.latitude}!2d${userLocation.longitude}!4m5!1s${playground.latitude},${playground.longitude}!2s${encodeURIComponent(playground.name)}!3m2!1d${playground.latitude}!2d${playground.longitude}!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin`
      : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5!2d${playground.longitude}!3d${playground.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(playground.name)}!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin`
    
    setMapUrl(basicUrl)
  }, [playground, userLocation])

  const getSafetyColor = (status: string) => {
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

  const openInGoogleMaps = () => {
    if (userLocation) {
      const origin = `${userLocation.latitude},${userLocation.longitude}`
      const destination = `${playground.latitude},${playground.longitude}`
      
      // Detect device for appropriate map app
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      
      let mapUrl: string
      
      if (isIOS) {
        mapUrl = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`
      } else if (isAndroid) {
        mapUrl = `google.navigation:q=${destination}&mode=d`
      } else {
        mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`
      }
      
      window.open(mapUrl, '_blank')
    } else {
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${playground.latitude},${playground.longitude}`
      window.open(mapUrl, '_blank')
    }
  }

  const MapContent = () => (
    <div className="space-y-4">
      {/* Playground Info Header */}
      <div className="flex items-start justify-between p-4 border-b">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">{playground.name}</h3>
            <Badge className={`${getSafetyColor(playground.status)} border`}>
              {playground.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{playground.address}</p>
          {playground.distance && (
            <p className="text-sm text-primary mt-1">
              📍 {playground.distance.toFixed(1)} miles away
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={openInGoogleMaps}>
            <Navigation className="h-4 w-4 mr-1" />
            Open in Maps
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'h-[70vh]' : 'h-[400px]'} w-full`}>
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-lg"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Playground Details */}
      <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="font-semibold mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-1">
            {playground.amenities.map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Status Info</h4>
          <div className="space-y-1 text-sm">
            <p>Active Issues: <span className="font-medium">{playground.activeIssues}</span></p>
            <p>Last Inspection: <span className="font-medium">{playground.lastInspection}</span></p>
          </div>
        </div>
      </div>

      {playground.description && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{playground.description}</p>
        </div>
      )}
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <MapPin className="h-4 w-4" />
          View Map
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">Playground Map</DialogTitle>
        </DialogHeader>
        <MapContent />
      </DialogContent>
    </Dialog>
  )
}

// Compact version for citizen dashboard
export function CompactPlaygroundMap({ playground, userLocation }: PlaygroundMapProps) {
  const [mapUrl, setMapUrl] = useState("")

  useEffect(() => {
    const basicUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.5!2d${playground.longitude}!3d${playground.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${encodeURIComponent(playground.name)}!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin`
    setMapUrl(basicUrl)
  }, [playground])

  return (
    <div className="h-[200px] w-full rounded-lg overflow-hidden">
      {mapUrl ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <MapPin className="h-8 w-8 text-gray-400" />
        </div>
      )}
    </div>
  )
}
