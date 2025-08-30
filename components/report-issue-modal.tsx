"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"

interface ReportIssueModalProps {
  children: React.ReactNode
}

export function ReportIssueModal({ children }: ReportIssueModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: "",
    severity: "",
    description: "",
    location: "",
  })

  const handleQuickReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)
    setOpen(false)
    setFormData({ category: "", severity: "", description: "", location: "" })

    // Show success notification (would integrate with toast system)
    alert("Quick report submitted! Report ID: PS-" + Date.now().toString().slice(-6))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Report</DialogTitle>
          <DialogDescription>
            Submit a quick issue report. For detailed reports with photos, use the full form.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleQuickReport} className="space-y-4">
          <div>
            <Label htmlFor="quick-category">Issue Type</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="broken-equipment">Broken Equipment</SelectItem>
                <SelectItem value="safety-hazard">Safety Hazard</SelectItem>
                <SelectItem value="litter-debris">Litter & Debris</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quick-severity">Severity</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High - Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quick-description">Description</Label>
            <Textarea
              id="quick-description"
              placeholder="Brief description of the issue..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="quick-location">Location</Label>
            <Input
              id="quick-location"
              placeholder="Playground name or location"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isSubmitting || !formData.category || !formData.description}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Submit
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
