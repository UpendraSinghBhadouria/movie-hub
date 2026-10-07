"use client";

import {
  Search,
  MapPin,
  ChevronDown,
  User,
  Package,
  UserCircle,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";
import { useLocation } from "@/hooks/useLocation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

const primaryLinks = ["Movies", "Stream", "Events", "Plays", "Sports"];

const secondaryLinks = ["ListYourShow", "Corporates", "Offers", "Gift Cards"];

export function Navbar() {
  const { location, isLoading, detectLocation, error, setLocation } =
    useLocation();

  const { currentUser, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const userInitials =
    currentUser?.name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => name.charAt(0).toUpperCase())
      .join("") || "U";

  const handleSelect = (location: "bookings" | "profile") => {
    router.push(`/${location}`);
  };

  return (
    <header className="w-full border-b border-border bg-background">
      {/* First Row */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-primary"
          >
            Movie<span className="text-primary/60">Hub</span>
          </Link>

          {/* Search */}
          <div className="hidden w-100 md:block">
            <div
              className="
                flex h-10 items-center rounded-md
                border border-input
                bg-muted/50
                px-3
                transition-colors
                focus-within:border-primary
                focus-within:bg-background
                focus-within:ring-1
                focus-within:ring-primary
              "
            >
              <Search className="mr-2 h-4 w-4 text-muted-foreground" />

              <input
                type="text"
                placeholder="Search for Movies, Events, Plays, Sports..."
                className="
                  w-full
                  bg-transparent
                  text-sm
                  text-foreground
                  outline-none
                  placeholder:text-muted-foreground
                "
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Location */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="
      hidden
      items-center
      gap-1.5
      rounded-md
      px-2
      py-2
      text-sm
      font-normal
      text-foreground
      transition-colors
      hover:bg-muted
      md:flex
    "
            >
              <MapPin className="h-4 w-4 text-primary" />

              <span>{isLoading ? "Detecting..." : location}</span>

              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              {/* Current Location */}
              <div className="px-3 py-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Current location
                </p>

                <p className="mt-1 text-sm font-medium text-foreground">
                  {isLoading ? "Detecting your location..." : location}
                </p>
              </div>

              <DropdownMenuSeparator />

              {/* Detect Current Location */}
              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={detectLocation}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>Use current location</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Cities */}
              <div className="py-1">
                {[
                  "Bhopal",
                  "Delhi",
                  "Mumbai",
                  "Bangalore",
                  "Pune",
                  "Hyderabad",
                ].map((city) => (
                  <DropdownMenuItem
                    key={city}
                    className="cursor-pointer"
                    onClick={() => setLocation(city)}
                  >
                    {city}

                    {location === city && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>

              {/* Error */}
              {error && (
                <>
                  <DropdownMenuSeparator />

                  <p className="px-3 py-2 text-xs text-destructive">{error}</p>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Theme */}
          <ThemeToggle />

          {/* Login */}
          {/* Login / User Menu */}
          {!isAuthenticated ? (
            <Link href={"/login"}>
              <Button
                size="lg"
                className="rounded-md bg-primary px-5 text-primary-foreground hover:bg-primary/90"
              >
                Login
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-primary
                    text-sm
                    font-semibold
                    text-primary-foreground
                    outline-none
                    transition-opacity
                    hover:opacity-90
                    focus-visible:ring-2
                    focus-visible:ring-ring
                    focus-visible:ring-offset-2
  "
                aria-label="Open user menu"
              >
                <span>{userInitials}</span>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                {/* Section 1 - User Information */}
                <div className="px-3 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentUser?.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser?.email}
                  </p>
                </div>

                <DropdownMenuSeparator />

                {/* Section 2 - User Navigation */}
                <div className="py-1">
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 px-3 py-2.5"
                    onClick={() => handleSelect("profile")}
                  >
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                    <span>My Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer gap-3 px-3 py-2.5"
                    onClick={() => handleSelect("bookings")}
                  >
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator />

                {/* Section 3 - Logout */}
                <div className="p-1">
                  <DropdownMenuItem
                    className="
            cursor-pointer
            gap-3
            px-3
            py-2.5
            text-destructive
            focus:text-destructive
          "
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile Search */}
      <div className="px-4 pb-3 md:hidden">
        <div
          className="
            flex h-10 items-center rounded-md
            border border-input
            bg-muted/50
            px-3
          "
        >
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search for Movies, Events..."
            className="
              w-full
              bg-transparent
              text-sm
              text-foreground
              outline-none
              placeholder:text-muted-foreground
            "
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="border-t border-border bg-muted/40">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left Navigation */}
          <nav className="flex items-center gap-6">
            {primaryLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="
                  text-sm
                  font-medium
                  text-muted-foreground
                  transition-colors
                  hover:text-primary
                "
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Right Navigation */}
          <nav className="hidden items-center gap-5 md:flex">
            {secondaryLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="
                  text-xs
                  font-medium
                  text-muted-foreground
                  transition-colors
                  hover:text-primary
                "
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
