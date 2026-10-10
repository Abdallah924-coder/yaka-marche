"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { browserApiBaseUrl, formatPrice } from "@/lib/listings";
import { useAuthToken } from "@/lib/auth-session";

type Order = {
  id: string;
  listingId: string;
  listingTitle: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  buyer: { name: string; phone?: string };
  seller: { name: string; phone: string };
  deliveryCity: string;
  deliveryAddress: string;
  buyerNote: string;
  paymentMethod: string | null;
  paymentReference: string;
  status: string;
  createdAt: string;
  role: "buyer" | "seller";
};

const statusLabels: Record<string, string> = {
  pending_payment: "En attente de paiement",
  payment_reported: "Paiement signalé · à vérifier",
  confirmed: "Paiement confirmé",
  completed: "Terminée",
  cancelled: "Annulée",
};

const paymentLabels: Record<string, string> = {
  mobile_money: "Mobile Money",
  cash: "Espèces",
  other: "Autre arrangement",
};

const apiActions: Record<string, string> = {
  payment: "report-payment",
  confirm: "confirm-payment",
  complete: "complete",
  cancel: "cancel",
};

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const token = useAuthToken();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyOrder, setBusyOrder] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [paymentReference, setPaymentReference] = useState("");

  const loadOrders = useCallback(async (authToken: string) => {
    const response = await fetch(`${browserApiBaseUrl}/orders/mine`, {
      headers: { Authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger les commandes.");
    setOrders(Array.isArray(data.orders) ? data.orders : []);
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger les commandes.");
        if (active) setOrders(Array.isArray(data.orders) ? data.orders : []);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function updateOrder(order: Order, action: keyof typeof apiActions) {
    if (!token) return;
    setBusyOrder(order.id);
    setError("");
    const body = action === "payment" ? { paymentMethod, paymentReference } : {};
    try {
      const response = await fetch(
        `${browserApiBaseUrl}/orders/${encodeURIComponent(order.id)}/${apiActions[action]}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de mettre à jour la commande.");
      await loadOrders(token);
      setPaymentReference("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusyOrder("");
    }
  }

  if (!token) {
    return (
      <div className="catalog-message">
        <strong>Connecte-toi pour retrouver tes commandes.</strong>
        <p>Utilise le compte Yaka Marché que tu as déjà ou crée-en un nouveau.</p>
        <Link className="button button-primary" href="/connexion">Se connecter</Link>
      </div>
    );
  }
  if (loading) return <div className="catalog-message">Chargement des commandes…</div>;

  return (
    <div className="orders-list">
      {error && <p className="form-error" role="alert">{error}</p>}
      {orders.length === 0 && (
        <div className="catalog-message">
          <strong>Aucune commande pour le moment.</strong>
          <p>Tes achats et ventes apparaîtront ici.</p>
          <Link className="button button-outline" href="/annonces">Explorer les annonces</Link>
        </div>
      )}
      {orders.map((order) => {
        const busy = busyOrder === order.id;
        return (
          <article className="order-card" key={order.id}>
            <div className="order-card-heading">
              <div>
                <p className="listing-category">{order.role === "buyer" ? "Mon achat" : "Ma vente"}</p>
                <h2><Link href={`/produit/${encodeURIComponent(order.listingId)}`}>{order.listingTitle}</Link></h2>
              </div>
              <span className={`order-status status-${order.status}`}>{statusLabels[order.status] || order.status}</span>
            </div>
            <div className="order-details">
              <span>{order.quantity} × {formatPrice(order.unitPrice)}</span>
              <strong>{formatPrice(order.totalPrice)}</strong>
              <span>{order.role === "buyer" ? `Vendeur : ${order.seller.name}` : `Acheteur : ${order.buyer.name}`}</span>
              <span>Livraison/retrait : {order.deliveryCity}{order.deliveryAddress ? ` · ${order.deliveryAddress}` : ""}</span>
              {order.buyerNote && <span>Note : {order.buyerNote}</span>}
              <span>Créée le {new Date(order.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>

            {order.role === "buyer" && order.status === "pending_payment" && (
              <div className="order-actions order-payment-form">
                <p>
                  Contacte le vendeur au <a href={`tel:${order.seller.phone}`}>{order.seller.phone}</a> pour convenir du paiement.
                  Signale le paiement seulement après l’avoir réellement effectué.
                </p>
                <label htmlFor={`payment-method-${order.id}`}>Mode de paiement</label>
                <select id={`payment-method-${order.id}`} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="cash">Espèces</option>
                  <option value="other">Autre arrangement</option>
                </select>
                <label htmlFor={`payment-reference-${order.id}`}>Référence de transaction (facultatif)</label>
                <input
                  id={`payment-reference-${order.id}`}
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  maxLength={100}
                />
                <button className="button button-primary" disabled={busy} onClick={() => updateOrder(order, "payment")}>
                  J’ai payé le vendeur
                </button>
                <button className="button button-outline" disabled={busy} onClick={() => updateOrder(order, "cancel")}>
                  Annuler la commande
                </button>
              </div>
            )}
            {order.role === "seller" && order.status === "payment_reported" && (
              <div className="order-actions">
                <p>
                  {order.buyer.name}{order.buyer.phone ? ` · ${order.buyer.phone}` : ""} signale un paiement
                    {order.paymentMethod ? ` par ${paymentLabels[order.paymentMethod] || order.paymentMethod}` : ""}
                    {order.paymentReference ? ` (réf. ${order.paymentReference})` : ""}. Vérifie la réception directement.
                  </p>
                <button className="button button-primary" disabled={busy} onClick={() => updateOrder(order, "confirm")}>
                  Confirmer la réception
                </button>
              </div>
            )}
            {order.role === "seller" && order.status === "confirmed" && (
              <div className="order-actions">
                <p>Paiement confirmé. Coordonne la remise ou la livraison avec l’acheteur.</p>
                <button className="button button-primary" disabled={busy} onClick={() => updateOrder(order, "complete")}>
                  Marquer comme terminée
                </button>
              </div>
            )}
            {order.role === "seller" && order.status === "pending_payment" && (
              <div className="order-actions">
                <p>Contacte l’acheteur pour organiser le paiement et la remise.</p>
                <a className="button button-outline" href={`tel:${order.buyer.phone || ""}`}>Contacter l’acheteur</a>
                <button className="button button-outline" disabled={busy} onClick={() => updateOrder(order, "cancel")}>
                  Annuler la commande
                </button>
              </div>
            )}
            {order.role === "buyer" && order.status === "payment_reported" && (
              <p className="order-pending-note">En attente de confirmation par le vendeur. En cas de problème, contacte-le directement au {order.seller.phone}.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
