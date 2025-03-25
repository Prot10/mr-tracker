"use client";

import {
  ChartCandlestick,
  Home,
  LogOut,
  Trash2,
  TrendingUp,
  User,
  UserX,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    };
    fetchUser();
  }, []);

  // Helper to get auth token
  const getAuthToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token;
  };

  // Action handlers with full logic
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteTransactions = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/all-transactions`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.alert("All transactions deleted successfully.");
      } else {
        window.alert("Failed to delete transactions.");
      }
    } catch (error) {
      console.error(error);
      window.alert("Error deleting transactions.");
    }
  };

  const handleDeleteInvestments = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/all-investments`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.alert("All investments deleted successfully.");
      } else {
        window.alert("Failed to delete investments.");
      }
    } catch (error) {
      console.error(error);
      window.alert("Error deleting investments.");
    }
  };

  const handleDeleteAccountData = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/account-data`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.alert("Account data deleted successfully.");
      } else {
        window.alert("Failed to delete account data.");
      }
    } catch (error) {
      console.error(error);
      window.alert("Error deleting account data.");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${BACKEND_URL}/account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        window.alert("Account deleted successfully.");
        window.location.href = "/";
      } else {
        window.alert("Failed to delete account.");
      }
    } catch (error) {
      console.error(error);
      window.alert("Error deleting account.");
    }
  };

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
      <SidebarFooter className="flex justify-center">
        <SidebarMenuItem key="UserActions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <a href="#" className="flex items-center gap-2">
                <User className="text-white" />
                <span className="text-white">
                  {user?.user_metadata?.name || user?.email || "Guest"}
                </span>
              </a>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-neutral-800 text-white">
              <DropdownMenuItem asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 w-full justify-start text-white"
                    >
                      <LogOut />
                      <span>Logout</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? You will be redirected
                        to the initial page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-neutral-950 hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleLogout}
                        className="bg-indigo-700 hover:bg-indigo-600"
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
              <div className="grid flex-1 text-right text-sm leading-tight border-t border-b border-neutral-700">
                <DropdownMenuItem asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 w-full justify-start text-neutral-300"
                      >
                        <Trash2 />
                        <span>Delete all transactions</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Transactions Data
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your transactions
                          data. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-neutral-950 hover:bg-neutral-800">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteTransactions}
                          className="bg-red-600 hover:bg-red-500"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 w-full justify-start text-neutral-300"
                      >
                        <Trash2 />
                        <span>Delete all investments</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Investments Data
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete all your investments
                          data. Are you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-neutral-950 hover:bg-neutral-800">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteInvestments}
                          className="bg-red-600 hover:bg-red-500"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-2 w-full justify-start text-neutral-300"
                      >
                        <Trash2 />
                        <span>Delete all data</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-neutral-900 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account data. Are
                          you sure?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-neutral-950 hover:bg-neutral-800">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccountData}
                          className="bg-red-600 hover:bg-red-500"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              </div>
              <DropdownMenuItem asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 w-full justify-start text-red-500"
                    >
                      <UserX />
                      <span>Delete Account</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-neutral-900 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all
                        associated data. Are you absolutely sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-neutral-950 hover:bg-neutral-800">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-700 hover:bg-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
