"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { browserApiBaseUrl, formatPrice } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type AdminStats = {
  totalUsers: number;
  totalListings: number;
  totalFeatured: number;
  totalPendingBoosts: number;
  totalApprovedBoosts: number;
};
type BoostRequest = {
  id: string;
  method: "momo" | "crypto";
  amountFcfa: number;
  proofImage: string;
  createdAt: string;
  listing: { id: string; title: string; price: number; city: string } | null;
  user: { name: string; email: string; phone: string } | null;
};
type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
  listingsCount: number;
};

function displayDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export default function AdminDashboard() {
  const token = useAuthToken();
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [requests, setRequests] = useState<BoostRequest[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadDashboard = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };
    const [statsResponse, requestsResponse, usersResponse] = await Promise.all([
      fetch(`${browserApiBaseUrl}/admin/stats`, { headers, cache: "no-store" }),
      fetch(`${browserApiBaseUrl}/payments/boost-requests`, { headers, cache: "no-store" }),
      fetch(`${browserApiBaseUrl}/admin/users`, { headers, cache: "no-store" }),
    ]);
    const [statsData, requestsData, usersData] = await Promise.all([
      statsResponse.json(), requestsResponse.json(), usersResponse.json(),
    ]);
    for (const [response, data] of [
      [statsResponse, statsData], [requestsResponse, requestsData], [usersResponse, usersData],
    ] as const) {
      if (!response.ok) throw new Error(data.error || "Impossible de charger les données administratives.");
    }
    setStats(statsData);
    setRequests(Array.isArray(requestsData.boostRequests) ? requestsData.boostRequests : []);
    setUsers(Array.isArray(usersData.users) ? usersData.users : []);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    let active = true;
    fetch(`${browserApiBaseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Connecte-toi pour continuer.");
        if (!data.user?.isAdmin) {
          if (active) setError("Accès réservé à l’administrateur.");
          return;
        }
        if (active) setAuthorized(true);
        await loadDashboard();
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Impossible de charger l’administration.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadDashboard, token]);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`${browserApiBaseUrl}/payments/boost-requests/${encodeURIComponent(id)}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de traiter cette demande.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de traiter cette demande.");
    } finally {
      setBusyId("");
    }
  }

  if (!token) {
    return <div className="catalog-message"><strong>Connecte-toi avec le compte administrateur.</strong><Link className="button button-primary" href="/connexion?redirect=%2Fadmin">Se connecter</Link></div>;
  }
  if (loading) return <div className="catalog-message">Vérification des accès et chargement…</div>;
  if (!authorized) return <div className="catalog-message" role="alert">{error || "Accès non autorisé."}</div>;

  return (
    <div className="admin-dashboard">
      {error && <p className="form-error" role="alert">{error}</p>}
      {stats ? (
        <div className="admin-stat-grid">
          <div><strong>{stats.totalUsers}</strong><span>Utilisateurs</span></div>
          <div><strong>{stats.totalListings}</strong><span>Annonces</span></div>
          <div><strong>{stats.totalFeatured}</strong><span>Mises en avant actives</span></div>
          <div><strong>{stats.totalPendingBoosts}</strong><span>Demandes en attente</span></div>
        </div>
      ) : <div className="catalog-message">Les statistiques ne sont pas disponibles.</div>}

      <section className="admin-section">
        <div className="section-title-row"><div><p className="eyebrow">Vérification manuelle</p><h2>Demandes de mise en avant</h2></div></div>
        {!requests.length ? <div className="catalog-message">Aucune demande en attente.</div> : (
          <div className="admin-boost-list">
            {requests.map((request) => (
              <article className="admin-boost-card" key={request.id}>
                <div className="admin-boost-details">
                  <span className="boost-pending-label">En attente</span>
                  <h3>{request.listing?.title || "Annonce supprimée"}</h3>
                  <p>{request.user?.name || "Utilisateur inconnu"} · {request.user?.email || "—"} · {request.user?.phone || "—"}</p>
                  <p>{request.listing?.city || "Ville inconnue"} · {request.method === "momo" ? "MTN Mobile Money" : "Crypto"} · {formatPrice(request.amountFcfa)}</p>
                  <p>Reçu le {displayDate(request.createdAt)}</p>
                  {request.listing && <Link className="text-link" href={`/produit/${encodeURIComponent(request.listing.id)}`}>Consulter l’annonce</Link>}
                </div>
                <Image className="admin-proof-image" src={request.proofImage} alt={`Preuve de paiement de ${request.user?.name || "l’utilisateur"}`} width={480} height={360} unoptimized />
                <div className="admin-review-actions">
                  <button className="button button-primary" disabled={busyId === request.id} onClick={() => review(request.id, "approve")} type="button">
                    {busyId === request.id ? "Traitement…" : "Valider le paiement"}
                  </button>
                  <button className="button button-outline" disabled={busyId === request.id} onClick={() => review(request.id, "reject")} type="button">Rejeter</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-section">
        <div className="section-title-row"><div><p className="eyebrow">Comptes marketplace</p><h2>Utilisateurs</h2></div></div>
        {!users.length ? <div className="catalog-message">Aucun utilisateur pour l’instant.</div> : (
          <div className="admin-users">
            {users.map((adminUser) => (
              <article className="admin-user-row" key={adminUser.id}>
                <div><h3>{adminUser.name}</h3><p>{adminUser.email} · {adminUser.phone}{adminUser.city ? ` · ${adminUser.city}` : ""}</p></div>
                <span>Inscrit le {displayDate(adminUser.createdAt)} · {adminUser.listingsCount} annonce{adminUser.listingsCount === 1 ? "" : "s"}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
