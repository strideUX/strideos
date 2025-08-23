"use client"

import { type Icon } from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { NavInsights } from "@/components/nav-insights"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  insightsItems,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
  insightsItems?: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  const pathname = usePathname()
  
  // Query for unread notification count
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount)
  const hasUnread = unreadCount !== undefined && unreadCount > 0
  
  const isActive = (url: string) => {
    // Special case for inbox which should only be active on exact match
    if (url === '/inbox') {
      return pathname === url
    }
    // For other routes, check if current path starts with the item's URL
    return pathname.startsWith(url)
  }
  
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title} 
                asChild
                isActive={isActive(item.url)}
              >
                <Link href={item.url} className="relative">
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  {/* Add unread indicator dot for Inbox */}
                  {item.url === '/inbox' && hasUnread && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {/* Include Insights as part of the main menu */}
          {insightsItems && insightsItems.length > 0 && (
            <NavInsights items={insightsItems} />
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
