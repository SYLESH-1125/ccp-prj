"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Shield, Menu, ArrowLeft, LogOut } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import Link from "next/link"

interface MobileHeaderProps {
  title: string
  backUrl?: string
  backText?: string
  showLogo?: boolean
  actions?: React.ReactNode
  navigation?: Array<{
    href: string
    label: string
    icon?: React.ComponentType<any>
  }>
  onLogout?: () => void
}

export function MobileHeader({ 
  title, 
  backUrl, 
  backText = "Back", 
  showLogo = true,
  actions,
  navigation = [],
  onLogout 
}: MobileHeaderProps) {
  const isMobile = useIsMobile()

  const MobileNav = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <div className="flex flex-col space-y-4 mt-8">
          {navigation.map((item, index) => (
            <Button 
              key={index} 
              variant="ghost" 
              className="justify-start" 
              asChild
            >
              <Link href={item.href}>
                {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                {item.label}
              </Link>
            </Button>
          ))}
          {onLogout && (
            <div className="border-t pt-4">
              <Button variant="outline" className="w-full" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backUrl && (
              <Button variant="ghost" size="sm" asChild className={isMobile ? "p-2" : ""}>
                <Link href={backUrl}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  {!isMobile && backText}
                </Link>
              </Button>
            )}
            
            {showLogo && (
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                <span className="text-sm md:text-lg font-bold">PLAYSAFE</span>
              </div>
            )}
            
            {!showLogo && (
              <h1 className="text-lg md:text-xl font-semibold truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Actions */}
            {!isMobile && actions}
            
            {/* Desktop Navigation */}
            {!isMobile && navigation.length > 0 && (
              <nav className="hidden md:flex items-center gap-4">
                {navigation.map((item, index) => (
                  <Button key={index} variant="ghost" size="sm" asChild>
                    <Link href={item.href}>
                      {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </nav>
            )}

            {/* Desktop Logout */}
            {!isMobile && onLogout && (
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            )}

            {/* Mobile Navigation */}
            {(navigation.length > 0 || onLogout) && <MobileNav />}
          </div>
        </div>

        {/* Mobile Title */}
        {isMobile && showLogo && (
          <div className="mt-2 text-center">
            <h1 className="text-lg font-semibold text-muted-foreground">{title}</h1>
          </div>
        )}
      </div>
    </header>
  )
}
