"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { Listing } from "@/lib/listings";
import { browserApiBaseUrl, formatPrice } from "@/lib/listings";
import { useAuthToken, useAuthUser } from "@/lib/auth-session";
import CitySuggestions from "@/components/city-suggestions";

export default function OrderCheckout({ listing }: { listing: Listing }) {
  const router = useRouter();
  const token = useAuthToken();
  const user = useAuthUser();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch(`${browserApiBaseUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, listingId: listing.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de créer la commande.");
      router.push("/commandes?created=1");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="checkout-login">
        <p>Connecte-toi pour passer commande.</p>
        <Link
          className="button button-primary"
          href={`/connexion?redirect=${encodeURIComponent(`/commander/${listing.id}`)}`}
        >
          Se connecter ou créer un compte
        </Link>
      </div>
    );
  }

  return (
    <form className="checkout-form" onSubmit={submit}>
      <label htmlFor="order-quantity">Quantité</label>
      <input
        id="order-quantity"
        name="quantity"
        type="number"
        min="1"
        max="50"
        value={quantity}
        onChange={(event) => setQuantity(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
        required
      />
      <label htmlFor="order-phone">Ton numéro de téléphone</label>
      <input id="order-phone" name="buyerPhone" type="tel" defaultValue={user?.phone || ""} maxLength={30} required />
      <label htmlFor="order-city">Ville de livraison ou de retrait</label>
      <input id="order-city" name="deliveryCity" list="congo-cities" defaultValue={user?.city || listing.city} maxLength={100} required />
      <CitySuggestions id="congo-cities" />
      <label htmlFor="order-address">Adresse ou point de rendez-vous <span>(facultatif)</span></label>
      <input id="order-address" name="deliveryAddress" maxLength={300} />
      <label htmlFor="order-note">Note au vendeur <span>(facultatif)</span></label>
      <textarea id="order-note" name="buyerNote" rows={3} maxLength={500} />
      <div className="manual-payment-notice">
        <strong>Paiement directement au vendeur</strong>
        <span>Tu conviendras avec lui du mode de paiement et de la livraison. Yaka Marché ne conserve pas l’argent.</span>
      </div>
      <div className="checkout-total">
        <span>Total estimé</span>
        <strong>{formatPrice(listing.price * quantity)}</strong>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary contact-button" type="submit" disabled={busy}>
        {busy ? "Création de la commande..." : `Confirmer la commande · ${formatPrice(listing.price * quantity)}`}
      </button>
    </form>
  );
}
