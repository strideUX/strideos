/**
 * NavSecondary - Secondary navigation component for the application sidebar
 *
 * @remarks
 * Renders secondary navigation items with icons and links. Extends the SidebarGroup
 * component to support additional props for customization. Provides consistent
 * navigation styling and behavior.
 *
 * @example
 * ```tsx
 * <NavSecondary
 *   items={secondaryNavItems}
 *   className="mt-4"
 * />
 * ```
 */

// 1. External imports
import React, { useCallback, memo } from 'react';
import Link from "next/link";
import { type Icon } from "@tabler/icons-react";

// 2. Internal imports
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// 3. Types
interface NavSecondaryItem {
  title: string;
  url: string;
  icon: Icon;
}

interface NavSecondaryProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  /** Secondary navigation items to display */
  items: NavSecondaryItem[];
}

// 4. Component definition
export const NavSecondary = memo(function NavSecondary({ 
  items, 
  ...props 
}: NavSecondaryProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  const renderNavItem = useCallback((item: NavSecondaryItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <Link href={item.url}>
          <item.icon />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ), []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(renderNavItem)}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
