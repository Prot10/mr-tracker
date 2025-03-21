"use client";

import { ChartCandlestick, Home, TrendingUp, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };
    fetchUser();
  }, []);

  return (
    <Sidebar className="bg-neutral-900" collapsible="icon">
      <SidebarHeader>
        <a href="#">
          <img src="/mr-tracker.svg" alt="logo" />
        </a>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-sm mb-2">Pages</SidebarGroupLabel>
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
      <SidebarFooter>
        <SidebarMenuItem key="Guest">
          <SidebarMenuButton asChild>
            <a href="#">
              <User />
              <span>{user?.user_metadata?.name || user?.email || "Guest"}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
