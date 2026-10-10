import Image from "next/image";
import Link from "next/link";
import type { Listing } from "@/lib/listings";
import { formatPrice } from "@/lib/listings";
import FavoriteButton from "@/components/favorite-button";

export default function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images?.[0];

  return (
    <article className="listing-card">
      <Link
        className="listing-image"
        href={`/produit/${encodeURIComponent(listing.id)}`}
        aria-label={`Voir ${listing.title}`}
      >
        {image ? (
          <Image
            src={image}
            alt={listing.title}
            width={480}
            height={360}
            unoptimized
          />
        ) : (
          <span className="image-placeholder" aria-hidden="true">
            {listing.category}
          </span>
        )}
        {listing.featured && <span className="featured-label">À la une</span>}
      </Link>
      <FavoriteButton listingId={listing.id} />
      <div className="listing-card-body">
        <p className="listing-category">{listing.category}</p>
        <h3>
          <Link href={`/produit/${encodeURIComponent(listing.id)}`}>{listing.title}</Link>
        </h3>
        <p className="listing-price">{formatPrice(listing.price)}</p>
        <div className="listing-card-meta">
          <span>{listing.city}</span>
          <span>{new Date(listing.createdAt).toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    </article>
  );
}
