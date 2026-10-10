"use client";

import { MouseEvent, ReactNode } from "react";
import { browserApiBaseUrl } from "@/lib/listings";

export default function ContactSellerLink({
  listingId,
  href,
  children,
}: {
  listingId: string;
  href: string;
  children: ReactNode;
}) {
  function trackContact(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    fetch(`${browserApiBaseUrl}/listings/${encodeURIComponent(listingId)}/contact-click`, {
      method: "POST",
      keepalive: true,
    })
      .catch((error: unknown) => {
        console.error("[marketplace] Failed to track seller contact:", error);
      });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return <a className="button button-primary contact-button" href={href} target="_blank" rel="noopener noreferrer" onClick={trackContact}>{children}</a>;
}
