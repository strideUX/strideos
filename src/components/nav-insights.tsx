"use client"

import { ChevronRight } from "lucide-react"
import { IconChartPie } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavInsights({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: any
  }[]
}) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const isActive = (url: string) => {
    return pathname.startsWith(url)
  }
  
  // Check if any child item is active
  const isAnyChildActive = items.some(item => isActive(item.url))
  
  return (
    <Collapsible
      open={isOpen || isAnyChildActive}
      onOpenChange={setIsOpen}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton 
            tooltip="Insights"
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <IconChartPie className="!size-4" />
              <span>Insights</span>
            </div>
            <ChevronRight className={`h-4 w-4 transition-transform ${(isOpen || isAnyChildActive) ? 'rotate-90' : ''}`} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((item) => (
              <SidebarMenuSubItem key={item.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isActive(item.url)}
                >
                  <Link href={item.url}>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}