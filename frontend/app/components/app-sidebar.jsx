import { ChartCandlestick, Home, TrendingUp, Wallet } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const items = [
  {
    title: "Homepage",
    url: "/homepage",
    icon: Home,
  },
  {
    title: "Wallet",
    url: "/wallet",
    icon: Wallet,
  },
  {
    title: "Investments",
    url: "/investments",
    icon: ChartCandlestick,
  },
  {
    title: "Projections",
    url: "/projections",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className={"bg-neutral-900"}>
      <SidebarHeader>
        <a href="#">
          <img src="/mr-tracker.svg" alt="logo" />
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
