"use client";

import {
  Avatar,
  Button,
  CircularProgress,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { IconBrandGoogle } from "@tabler/icons-react";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";

/**
 * AuthButton component for handling authentication actions.
 * 
 * @param {Object} props - Component props
 * @param {boolean} [props.minimal=true] - Whether to show minimal version of the button
 * @returns {React.ReactElement} The rendered AuthButton component
 */
export default function AuthButton({ minimal = true }: { minimal?: boolean }) {
  const { data, status } = useSession();
  const [isHovered, setIsHovered] = React.useState(false);

  // Handler for mouse enter event
  const handleMouseEnter = () => setIsHovered(true);
  // Handler for mouse leave event
  const handleMouseLeave = () => setIsHovered(false);

  if (status === "loading") {
    return <CircularProgress aria-label="Loading authentication status..." />;
  }

  if (status === "authenticated") {
    const signOutClick = () =>
      signOut({
        callbackUrl: "/",
      });
    if (minimal) {
      return (
        <Button 
        onClick={signOutClick} color="danger" variant="ghost">
          <IconBrandGoogle />
          Sign Out
        </Button>
      );
    }

    return (
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            className="transition-transform"
            showFallback={!data.user?.image}
            src={data.user?.image || ""}
          />
        </DropdownTrigger>
        <DropdownMenu aria-label="Profile Actions" variant="flat">
          <DropdownItem key="profile" className="h-14 gap-2">
            <p className="font-semibold">Signed in as</p>
            <p className="font-semibold">{data.user?.email}</p>
          </DropdownItem>
          <DropdownItem key="sign-out" color="danger" onClick={signOutClick}>
            Sign Out
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }

  return (
    <Button
      onClick={() =>
        signIn("google", {
          callbackUrl: "/profile",
        })
      }
      radius="full"
      color="primary"
      variant="solid"
      className={`text-white shadow-lg transition-all duration-300 ${

        isHovered ? "scale-105" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <IconBrandGoogle />
      Sign In
    </Button>
  );
}