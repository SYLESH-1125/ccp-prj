"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface ResponsiveCardProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
  mobileBorderless?: boolean
}

export function ResponsiveCard({ 
  title, 
  description, 
  children, 
  className,
  headerClassName,
  contentClassName,
  mobileBorderless = false
}: ResponsiveCardProps) {
  const isMobile = useIsMobile()

  return (
    <Card 
      className={cn(
        className,
        mobileBorderless && isMobile && "border-0 shadow-none"
      )}
    >
      {(title || description) && (
        <CardHeader className={cn(
          isMobile ? "px-4 py-3" : "px-6 py-4",
          headerClassName
        )}>
          {title && (
            <CardTitle className={isMobile ? "text-lg" : "text-xl"}>
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className={isMobile ? "text-sm" : ""}>
              {description}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn(
        isMobile ? "px-4 py-3" : "px-6 py-4",
        contentClassName
      )}>
        {children}
      </CardContent>
    </Card>
  )
}
