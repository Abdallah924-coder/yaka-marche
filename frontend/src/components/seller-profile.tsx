"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import ListingCard from "@/components/listing-card";
import { browserApiBaseUrl, type Listing } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type Seller = { id: string; name: string; city: string; memberSince: string; ratingAvg: number; ratingCount: number };
type Review = { id: string; rating: number; comment: string; createdAt: string; reviewerName: string };

export default function SellerProfile({ sellerId }: { sellerId: string }) {
  const token = useAuthToken();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${browserApiBaseUrl}/sellers/${encodeURIComponent(sellerId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Profil vendeur indisponible.");
        if (active) {
          setSeller(data.seller);
          setListings(Array.isArray(data.listings) ? data.listings : []);
          setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        }
      })
      .catch((requestError: unknown) => { if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sellerId]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${browserApiBaseUrl}/sellers/${encodeURIComponent(sellerId)}/reviews`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rating: Number(rating), comment: comment.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’envoyer ton avis.");
      setNotice("Merci, ton avis a été enregistré.");
      setComment("");
      const profileResponse = await fetch(`${browserApiBaseUrl}/sellers/${encodeURIComponent(sellerId)}`, { cache: "no-store" });
      const profileData = await profileResponse.json();
      if (!profileResponse.ok) throw new Error(profileData.error || "Avis enregistré, mais impossible d’actualiser le profil.");
      setSeller(profileData.seller);
      setReviews(profileData.reviews || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally { setBusy(false); }
  }

  if (loading) return <div className="catalog-message">Chargement du profil vendeur…</div>;
  if (error && !seller) return <div className="catalog-message" role="alert">{error}</div>;
  if (!seller) return <div className="catalog-message">Vendeur introuvable.</div>;

  return (
    <>
      <nav className="breadcrumbs" aria-label="Fil d’Ariane"><Link href="/">Accueil</Link><span>/</span><Link href="/annonces">Annonces</Link><span>/</span><span>Vendeur</span></nav>
      <section className="seller-profile-heading">
        <span className="seller-avatar" aria-hidden="true">{seller.name.slice(0, 1).toUpperCase()}</span>
        <div><p className="eyebrow">Profil vendeur</p><h1>{seller.name}</h1><p>{seller.city || "Congo"} · Membre depuis {new Date(seller.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p><strong className="seller-rating">★ {seller.ratingCount ? seller.ratingAvg.toFixed(1) : "—"} · {seller.ratingCount} avis</strong></div>
      </section>
      <section className="seller-profile-section"><div className="section-title-row"><div><p className="eyebrow">Publications disponibles</p><h2>Annonces de {seller.name}</h2></div></div>
        {listings.length ? <div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <p className="catalog-message">Ce vendeur n’a pas d’annonce active.</p>}
      </section>
      <section className="seller-profile-section">
        <div className="section-title-row"><div><p className="eyebrow">Avis de la communauté</p><h2>Avis ({reviews.length})</h2></div></div>
        {token ? (
          <form className="tools-panel account-form review-form" onSubmit={submitReview}>
            <h3>Laisser ou modifier ton avis</h3>
            <label htmlFor="review-rating">Note</label><select id="review-rating" value={rating} onChange={(event) => setRating(event.target.value)}>{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} étoile{value > 1 ? "s" : ""}</option>)}</select>
            <label htmlFor="review-comment">Commentaire (facultatif)</label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={3} />
            {error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="order-success" role="status">{notice}</p>}
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Envoi…" : "Publier mon avis"}</button>
          </form>
        ) : <p className="muted-copy"><Link href={`/connexion?redirect=${encodeURIComponent(`/vendeur/${sellerId}`)}`}>Connecte-toi</Link> pour laisser un avis.</p>}
        <div className="review-list">{reviews.map((review) => <article className="review-card" key={review.id}><div><strong>{review.reviewerName}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</span></div><time>{new Date(review.createdAt).toLocaleDateString("fr-FR")}</time>{review.comment && <p>{review.comment}</p>}</article>)}</div>
      </section>
    </>
  );
}
