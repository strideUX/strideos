/**
 * NavInsights - Collapsible insights navigation component
 *
 * @remarks
 * Provides a collapsible navigation section for insights and analytics pages.
 * Automatically expands when any child route is active and supports dynamic
 * navigation items with proper active state management.
 *
 * @example
 * ```tsx
 * <NavInsights items={[
 *   { title: "Dashboard", url: "/insights/dashboard" },
 *   { title: "Analytics", url: "/insights/analytics" }
 * ]} />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { IconChartPie } from '@tabler/icons-react';

// 2. Internal imports
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@radix-ui/react-collapsible';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

// 3. Types
interface InsightItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavInsightsProps {
  /** Array of insight navigation items */
  items: InsightItem[];
}

// 4. Component definition
export const NavInsights = memo(function NavInsights({ 
  items 
}: NavInsightsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isAnyChildActive = useMemo(() => {
    return items.some(item => pathname.startsWith(item.url));
  }, [items, pathname]);

  const shouldBeOpen = useMemo(() => {
    return isOpen || isAnyChildActive;
  }, [isOpen, isAnyChildActive]);

  const chevronRotation = useMemo(() => {
    return shouldBeOpen ? 'rotate-90' : '';
  }, [shouldBeOpen]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const isActive = useCallback((url: string): boolean => {
    return pathname.startsWith(url);
  }, [pathname]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const renderInsightItem = useCallback((item: InsightItem) => (
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
  ), [isActive]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Collapsible
      open={shouldBeOpen}
      onOpenChange={handleOpenChange}
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
            <ChevronRight 
              className={`h-4 w-4 transition-transform ${chevronRotation}`} 
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map(renderInsightItem)}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
});