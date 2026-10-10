"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { browserApiBaseUrl, categories } from "@/lib/listings";
import { useAuthToken, useAuthUser } from "@/lib/auth-session";

const imageRequiredCategories = ["Immobilier", "Electronique"];

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Impossible de lire l’image « ${file.name} ».`));
    };
    image.onload = () => {
      const maxSize = 1000;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      URL.revokeObjectURL(objectUrl);
      if (!context) {
        reject(new Error("Impossible de préparer cette image."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    image.src = objectUrl;
  });
}

export default function ListingForm() {
  const router = useRouter();
  const token = useAuthToken();
  const user = useAuthUser();
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectImages(event: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = "";
    if (images.length + files.length > 6) {
      setError("Tu peux ajouter jusqu’à 6 photos.");
      return;
    }
    try {
      const compressed = await Promise.all(files.map(compressImage));
      setImages((current) => [...current, ...compressed]);
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "Impossible de charger les images.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (imageRequiredCategories.includes(category) && images.length < 3) {
      setError("Cette catégorie demande au moins 3 photos.");
      return;
    }

    setBusy(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`${browserApiBaseUrl}/listings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...payload, category, images }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de publier l’annonce.");
      router.push("/mes-annonces?published=1");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="catalog-message">
        <strong>Connecte-toi pour publier une annonce.</strong>
        <p>Utilise ton compte Yaka Marché ou crée-en un gratuitement.</p>
        <Link className="button button-primary" href="/connexion?redirect=%2Fpublier">Se connecter ou créer un compte</Link>
      </div>
    );
  }

  return (
    <form className="listing-form" onSubmit={submit}>
      <div className="form-two-columns">
        <div>
          <label htmlFor="listing-title">Titre de l’annonce</label>
          <input id="listing-title" name="title" maxLength={120} required placeholder="Ex. Vélo de ville en bon état" />
        </div>
        <div>
          <label htmlFor="listing-category">Catégorie</label>
          <select id="listing-category" value={category} onChange={(event) => setCategory(event.target.value)} required>
            <option value="">Choisir une catégorie</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="listing-price">Prix (FCFA)</label>
          <input id="listing-price" name="price" type="number" min="0" step="1" required placeholder="Ex. 25000" />
        </div>
        <div>
          <label htmlFor="listing-city">Ville</label>
          <input id="listing-city" name="city" defaultValue={user?.city || ""} maxLength={100} required placeholder="Brazzaville" />
        </div>
        <div className="form-full-width">
          <label htmlFor="listing-description">Description</label>
          <textarea id="listing-description" name="description" rows={5} maxLength={3000} required placeholder="Décris l’article, son état et les modalités de vente." />
        </div>
        <div>
          <label htmlFor="listing-phone">Téléphone / WhatsApp</label>
          <input id="listing-phone" name="phone" type="tel" defaultValue={user?.phone || ""} maxLength={30} required />
        </div>
      </div>

      <div className="listing-upload">
        <label htmlFor="listing-images">Photos <span>(jusqu’à 6 · JPEG compressé automatiquement)</span></label>
        <input id="listing-images" type="file" accept="image/*" multiple onChange={selectImages} />
        {imageRequiredCategories.includes(category) && (
          <p className="upload-hint">Au moins 3 photos sont obligatoires pour cette catégorie.</p>
        )}
        {images.length > 0 && (
          <div className="upload-previews">
            {images.map((image, index) => (
              <div className="upload-preview" key={`${index}-${image.slice(-24)}`}>
                <Image src={image} alt={`Photo ${index + 1} de l’annonce`} width={120} height={100} unoptimized />
                <button type="button" aria-label={`Retirer la photo ${index + 1}`} onClick={() => setImages((current) => current.filter((_, item) => item !== index))}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary listing-submit" type="submit" disabled={busy}>
        {busy ? "Publication en cours..." : "Publier l’annonce"}
      </button>
    </form>
  );
}
