"use client";

import * as React from "react";
import {
  BookOpen,
  Check,
  ChevronRight,
  Grid2X2Plus,
  ListTodo,
  LoaderCircle,
  LogOut,
  Settings,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible } from "@/components/ui/collapsible";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Grid2X2Plus,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Tests",
      url: "/admin/tests",
      icon: BookOpen,
      items: [
        {
          title: "See tests",
          url: "/admin/tests",
        },
        {
          title: "Create test",
          url: "/admin/tests/create-test-dynamic",
        },
      ],
    },
    {
      title: "Results",
      url: "/admin/results",
      icon: ListTodo,
    },
    {
      title: "Approvals",
      url: "/admin/approvals",
      icon: Check,
    },
    {
      title: "Developer Settings",
      url: "/admin/developer-settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item, index) =>
              item.items?.length ? (
                <Collapsible key={index} asChild className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem, index) => (
                          <SidebarMenuSubItem key={index}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          disabled={isLoggingOut}
          onClick={() => {
            try {
              setIsLoggingOut(true);
              sessionStorage.clear();
              localStorage.clear();
              router.push("/");
            } catch (error) {
              console.log("Cant log out");
            } finally {
              setIsLoggingOut(false);
            }
          }}
          variant={"destructive"}
        >
          {isLoggingOut ? (
            <span className="flex items-center justify-center gap-2">
              <LoaderCircle className="size-5 animate animate-spin" /> Logging
              out
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <LogOut className="size-5" /> Log Out
            </span>
          )}
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
