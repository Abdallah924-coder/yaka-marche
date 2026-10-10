import type { Metadata } from "next";
import MessagingCenter from "@/components/messaging-center";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mes messages",
  robots: { index: false, follow: false },
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; conversation?: string }>;
}) {
  const { listing, conversation } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="site-shell messages-page">
        <p className="eyebrow">Messagerie Yaka Marché</p>
        <h1>Mes messages</h1>
        <p className="orders-intro">Échange directement avec les acheteurs et les vendeurs.</p>
        <MessagingCenter listingId={listing} conversationId={conversation} />
      </main>
    </>
  );
}
