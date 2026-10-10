"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserApiBaseUrl, formatPrice, type Listing } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type PaymentInfo = {
  priceFcfa: number;
  momo: { number: string; name: string };
  crypto: { network: string; address: string; amount: string };
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Impossible de lire cette capture d’écran."));
    };
    image.onload = () => {
      const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(objectUrl);
      if (!context) {
        reject(new Error("Impossible de préparer cette capture d’écran."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.76));
    };
    image.src = objectUrl;
  });
}

export default function BoostForm({ listingId }: { listingId: string }) {
  const token = useAuthToken();
  const [listing, setListing] = useState<Listing | null>(null);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [credits, setCredits] = useState(0);
  const [method, setMethod] = useState<"momo" | "crypto" | null>(null);
  const [proofImage, setProofImage] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!token || !listingId) return;
    let active = true;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${browserApiBaseUrl}/listings/${encodeURIComponent(listingId)}`, { headers, cache: "no-store" }),
      fetch(`${browserApiBaseUrl}/payments/info`, { headers, cache: "no-store" }),
      fetch(`${browserApiBaseUrl}/auth/me`, { headers, cache: "no-store" }),
    ])
      .then(async ([listingResponse, infoResponse, userResponse]) => {
        const [listingData, infoData, userData] = await Promise.all([
          listingResponse.json(), infoResponse.json(), userResponse.json(),
        ]);
        for (const [response, data] of [
          [listingResponse, listingData], [infoResponse, infoData], [userResponse, userData],
        ] as const) {
          if (!response.ok) throw new Error(data.error || "Impossible de charger les informations de mise en avant.");
        }
        if (String(listingData.listing?.ownerId) !== String(userData.user?.id)) {
          throw new Error("Tu ne peux mettre en avant que tes propres annonces.");
        }
        if (active) {
          setListing(listingData.listing);
          setInfo(infoData);
          setCredits(userData.user.freeBoostCredits || 0);
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [listingId, token]);

  async function sendBoostRequest() {
    if (!method || !proofImage || !listingId) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${browserApiBaseUrl}/payments/boost-request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, method, proofImage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’envoyer la demande.");
      setSuccess("Ta preuve de paiement a été transmise. La mise en avant sera activée après vérification par l’administrateur.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  async function redeemCredit() {
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${browserApiBaseUrl}/listings/${encodeURIComponent(listingId)}/redeem-boost-credit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’utiliser ce crédit.");
      setCredits(data.freeBoostCredits);
      setSuccess("Ton crédit a été utilisé : l’annonce est maintenant mise en avant.");
      setListing(data.listing);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="catalog-message">
        <strong>Connecte-toi pour mettre ton annonce en avant.</strong>
        <Link className="button button-primary" href={`/connexion?redirect=${encodeURIComponent(`/mise-en-avant?id=${listingId}`)}`}>Se connecter</Link>
      </div>
    );
  }
  if (!listingId) return <div className="catalog-message"><strong>Annonce manquante.</strong><p>Ouvre la mise en avant depuis « Mes annonces ».</p></div>;
  if (loading) return <div className="catalog-message">Chargement des options de paiement…</div>;
  if (error && !listing) return <div className="catalog-message" role="alert">{error}</div>;
  if (success) {
    return (
      <div className="boost-success">
        <span aria-hidden="true">✓</span>
        <h2>{listing?.featured ? "Annonce mise en avant" : "Demande envoyée"}</h2>
        <p>{success}</p>
        <Link className="button button-outline" href="/mes-annonces">Retour à mes annonces</Link>
      </div>
    );
  }
  if (listing?.featured) {
    return <div className="catalog-message"><strong>Cette annonce est déjà mise en avant.</strong><Link className="button button-outline" href="/mes-annonces">Retour à mes annonces</Link></div>;
  }
  if (!info) return <div className="catalog-message" role="alert">Les options de paiement sont indisponibles.</div>;

  return (
    <div className="boost-content">
      {listing && (
        <div className="boost-listing">
          {listing.images[0]
            ? <Image src={listing.images[0]} alt="" width={96} height={80} unoptimized />
            : <span className="image-placeholder">{listing.category}</span>}
          <div><span className="eyebrow">Annonce sélectionnée</span><strong>{listing.title}</strong><span>{listing.city}</span></div>
        </div>
      )}
      {credits > 0 && (
        <div className="boost-credit">
          <div><strong>{credits} crédit{credits > 1 ? "s" : ""} gratuit{credits > 1 ? "s" : ""}</strong><p>Crédit obtenu grâce au parrainage, utilisable immédiatement.</p></div>
          <button className="button button-primary" type="button" disabled={busy} onClick={redeemCredit}>Utiliser un crédit gratuit</button>
        </div>
      )}
      <h2>Choisis ton mode de paiement</h2>
      <div className="boost-payment-options">
        <button type="button" className={`boost-payment-option${method === "momo" ? " selected" : ""}`} onClick={() => setMethod("momo")}>
          <strong>MTN Mobile Money</strong>
          <span>Numéro bénéficiaire</span><b>{info.momo.number || "À configurer"}</b>
          <span>Nom du bénéficiaire</span><b>{info.momo.name || "À configurer"}</b>
          <span>Montant à payer</span><b>{formatPrice(info.priceFcfa)}</b>
        </button>
        <button type="button" className={`boost-payment-option${method === "crypto" ? " selected" : ""}`} onClick={() => setMethod("crypto")}>
          <strong>Paiement crypto</strong>
          <span>Réseau</span><b>{info.crypto.network || "À configurer"}</b>
          <span>Adresse</span><b className="boost-address">{info.crypto.address || "À configurer"}</b>
          <span>Montant</span><b>{info.crypto.amount || "—"} (≈ {formatPrice(info.priceFcfa)})</b>
        </button>
      </div>
      <section className="boost-proof">
        <p>1. Effectue le paiement du montant indiqué. 2. Ajoute la capture d’écran de confirmation. 3. Envoie ta demande. L’annonce sera mise en avant après validation manuelle du paiement.</p>
        <label className="boost-upload">
          <span>Capture d’écran du paiement</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                setError("Choisis un fichier image.");
                return;
              }
              try {
                const compressed = await compressImage(file);
                if (compressed.length > 6_000_000) throw new Error("La capture reste trop volumineuse après compression.");
                setProofImage(compressed);
                setPreview(compressed);
                setError("");
              } catch (uploadError) {
                setError(uploadError instanceof Error ? uploadError.message : "Impossible de préparer l’image.");
              }
            }}
          />
          {preview && <Image className="boost-preview" src={preview} alt="Aperçu de la preuve de paiement" width={240} height={180} unoptimized />}
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary" type="button" disabled={busy || !method || !proofImage} onClick={sendBoostRequest}>
          {busy ? "Envoi en cours…" : "Envoyer ma demande de mise en avant"}
        </button>
        <p className="muted-copy">Le paiement est vérifié manuellement. N’envoie jamais ta preuve avant d’avoir effectué le transfert.</p>
      </section>
    </div>
  );
}
