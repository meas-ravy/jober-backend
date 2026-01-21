"use client";

import { Separator } from "@radix-ui/react-separator";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "./ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { ModeToggle } from "./mode-toggle";

type SiteHeaderProps = {
  title?: string;
  parent?: string;
  parentHref?: string;
};

export function SiteHeader({
  title,
  parent,
  parentHref = "/admin/dashboard",
}: SiteHeaderProps) {
  const pathname = usePathname();
  const fallbackLabel = pathname
    .split("/")
    .filter(Boolean)
    .pop()
    ?.replace(/-/g, " ");
  const current =
    title ??
    (fallbackLabel
      ? `${fallbackLabel.charAt(0).toUpperCase()}${fallbackLabel.slice(1)}`
      : "Dashboard");

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {parent ? (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href={parentHref}>{parent}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
