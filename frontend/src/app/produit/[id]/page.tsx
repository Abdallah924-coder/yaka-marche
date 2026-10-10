import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import FavoriteButton from "@/components/favorite-button";
import ContactSellerLink from "@/components/contact-seller-link";
import { formatPrice, getListing } from "@/lib/listings";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const listing = await getListing(id);
    if (!listing) return { title: "Annonce introuvable" };

    const description = listing.description.slice(0, 155);
    return {
      title: listing.title,
      description,
      alternates: { canonical: `/produit/${encodeURIComponent(listing.id)}` },
      openGraph: {
        title: `${listing.title} — Yaka Marché`,
        description,
        images: listing.images?.[0]?.startsWith("https://")
          ? [listing.images[0]]
          : ["/og-image.png"],
      },
    };
  } catch (error) {
    console.error("[marketplace] Failed to load listing metadata:", error);
    return { title: "Annonce — Yaka Marché" };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  let listing;
  try {
    listing = await getListing(id);
  } catch (error) {
    console.error("[marketplace] Failed to load listing details:", error);
    return (
      <>
        <SiteHeader />
        <main className="site-shell catalog-message">
          <h1>Annonce temporairement indisponible</h1>
          <p>Impossible de récupérer cette annonce. Réessayez dans quelques instants.</p>
        </main>
      </>
    );
  }

  if (!listing) notFound();

  const image = listing.images?.[0];
  const phone = listing.phone.replace(/[^0-9]/g, "");
  const message = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre annonce sur Yaka Marché : ${listing.title}`,
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images?.[0]?.startsWith("https://")
      ? listing.images[0]
      : "https://yaka-marche.xyz/og-image.png",
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "XAF",
      availability: listing.status === "active"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `https://yaka-marche.xyz/produit/${encodeURIComponent(listing.id)}`,
      areaServed: listing.city,
    },
  };

  return (
    <>
      <SiteHeader />
      <main className="site-shell product-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <nav className="breadcrumbs" aria-label="Fil d’Ariane">
          <Link href="/">Accueil</Link><span aria-hidden="true">/</span>
          <Link href="/annonces">Annonces</Link><span aria-hidden="true">/</span>
          <span>{listing.category}</span>
        </nav>
        <article className="product-layout">
          <div className="product-photo">
            {image ? (
              <Image
                src={image}
                alt={listing.title}
                width={900}
                height={700}
                unoptimized
                priority
              />
            ) : (
              <span className="image-placeholder" aria-hidden="true">{listing.category}</span>
            )}
          </div>
          <div className="product-information">
            <p className="eyebrow">{listing.category} · {listing.city}</p>
            <h1>{listing.title}</h1>
            <p className="product-price">{formatPrice(listing.price)}</p>
            <p className="product-description">{listing.description}</p>
            <div className="seller-panel">
              <span className="seller-avatar" aria-hidden="true">
                {(listing.owner?.name || "V").slice(0, 1).toUpperCase()}
              </span>
              <div>
                {listing.ownerId ? (
                  <Link className="seller-profile-link" href={`/vendeur/${encodeURIComponent(String(listing.ownerId))}`}>
                    <strong>{listing.owner?.name || "Vendeur Yaka Marché"}</strong>
                  </Link>
                ) : <strong>{listing.owner?.name || "Vendeur Yaka Marché"}</strong>}
                <p>{listing.owner?.ratingCount
                  ? `★ ${listing.owner.ratingAvg?.toFixed(1)} · ${listing.owner.ratingCount} avis`
                  : "Vendeur sur Yaka Marché"}</p>
              </div>
            </div>
            <div className="product-favorite"><FavoriteButton listingId={listing.id} /></div>
            <ContactSellerLink listingId={listing.id} href={`https://wa.me/${phone}?text=${message}`}>
              Contacter le vendeur sur WhatsApp
            </ContactSellerLink>
            <Link
              className="button button-outline contact-button order-button"
              href={`/commander/${encodeURIComponent(listing.id)}`}
            >
              Passer commande
            </Link>
            <Link
              className="button button-outline contact-button order-button"
              href={`/messages?listing=${encodeURIComponent(listing.id)}`}
            >
              Envoyer un message au vendeur
            </Link>
            <p className="safety-note">Échangez avec le vendeur pour convenir des modalités de vente et de livraison.</p>
          </div>
        </article>
      </main>
    </>
  );
}
