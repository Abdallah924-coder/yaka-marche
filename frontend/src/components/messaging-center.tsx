"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { browserApiBaseUrl } from "@/lib/listings";
import { useAuthToken, useAuthUser } from "@/lib/auth-session";

type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  otherRole: "buyer" | "seller";
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type Message = {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
};

function apiHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export default function MessagingCenter({
  listingId,
  conversationId,
}: {
  listingId?: string;
  conversationId?: string;
}) {
  const token = useAuthToken();
  const user = useAuthUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const currentUserId = user?.id ? String(user.id) : "";

  const loadConversations = useCallback(async () => {
    const response = await fetch(`${browserApiBaseUrl}/messages`, {
      headers: apiHeaders(token),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger les messages.");
    setConversations(Array.isArray(data.conversations) ? data.conversations : []);
  }, [token]);

  const loadThread = useCallback(async (conversation: Conversation) => {
    const response = await fetch(`${browserApiBaseUrl}/messages/${encodeURIComponent(conversation.id)}`, {
      headers: apiHeaders(token),
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Impossible de charger cette conversation.");
    setSelected(data.conversation);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`${browserApiBaseUrl}/messages`, {
      headers: apiHeaders(token),
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible de charger les messages.");
        if (active) {
          const items: Conversation[] = Array.isArray(data.conversations) ? data.conversations : [];
          setConversations(items);
          const initialConversation = conversationId
            ? items.find((item) => item.id === conversationId)
            : undefined;
          if (initialConversation) {
            fetch(`${browserApiBaseUrl}/messages/${encodeURIComponent(initialConversation.id)}`, {
              headers: apiHeaders(token),
              cache: "no-store",
            }).then(async (threadResponse) => {
              const threadData = await threadResponse.json();
              if (!threadResponse.ok) throw new Error(threadData.error || "Impossible de charger cette conversation.");
              if (active) {
                setSelected(threadData.conversation);
                setMessages(Array.isArray(threadData.messages) ? threadData.messages : []);
              }
            }).catch((threadError: unknown) => {
              if (active) setError(threadError instanceof Error ? threadError.message : "Impossible d’ouvrir cette conversation.");
            });
          }
        }
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [conversationId, token]);

  async function selectConversation(conversation: Conversation) {
    setError("");
    try {
      await loadThread(conversation);
      await loadConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible d’ouvrir cette conversation.");
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText || !token) return;
    setBusy(true);
    setError("");
    try {
      if (listingId && !selected) {
        const response = await fetch(`${browserApiBaseUrl}/messages`, {
          method: "POST",
          headers: apiHeaders(token, true),
          body: JSON.stringify({ listingId, text: cleanText }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le message.");
        setText("");
        await loadConversations();
        if (data.conversation) {
          await loadThread(data.conversation);
          window.history.replaceState(null, "", `/messages?conversation=${encodeURIComponent(data.conversation.id)}`);
        }
      } else if (selected) {
        const response = await fetch(`${browserApiBaseUrl}/messages/${encodeURIComponent(selected.id)}`, {
          method: "POST",
          headers: apiHeaders(token, true),
          body: JSON.stringify({ text: cleanText }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Impossible d’envoyer le message.");
        setMessages((current) => [...current, data.message]);
        setText("");
        await loadConversations();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="catalog-message">
        <strong>Connecte-toi pour accéder à tes messages.</strong>
        <p>Les échanges liés à tes annonces apparaîtront dans ta boîte de réception.</p>
        <Link className="button button-primary" href={`/connexion${listingId ? `?redirect=${encodeURIComponent(`/messages?listing=${listingId}`)}` : ""}`}>
          Se connecter
        </Link>
      </div>
    );
  }

  if (loading) return <div className="catalog-message">Chargement de tes messages…</div>;

  return (
    <div className="messaging-layout">
      <aside className="conversation-list" aria-label="Liste des conversations">
        <h2>Conversations</h2>
        {conversations.length === 0 ? (
          <p className="conversation-empty">
            {listingId ? "Écris au vendeur pour démarrer l’échange." : "Aucun message. Contacte un vendeur depuis une annonce."}
          </p>
        ) : conversations.map((conversation) => (
          <button
            className={`conversation-item${selected?.id === conversation.id ? " conversation-selected" : ""}`}
            key={conversation.id}
            onClick={() => selectConversation(conversation)}
            type="button"
          >
            <span className="conversation-title">{conversation.listingTitle}</span>
            <span className="conversation-preview">{conversation.lastMessage}</span>
            <span className="conversation-date">
              {new Date(conversation.lastMessageAt).toLocaleDateString("fr-FR")}
              {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
            </span>
          </button>
        ))}
      </aside>

      <section className="conversation-thread" aria-label="Conversation sélectionnée">
        {selected ? (
          <>
            <div className="thread-heading">
              <div>
                <p className="listing-category">{selected.otherRole === "seller" ? "Vendeur" : "Acheteur"}</p>
                <h2>{selected.listingTitle}</h2>
              </div>
              <Link href={`/produit/${encodeURIComponent(selected.listingId)}`}>Voir l’annonce</Link>
            </div>
            <div className="thread-messages" aria-live="polite">
              {messages.map((message) => {
                const ownMessage = String(message.sender) === currentUserId;
                return (
                  <article className={`chat-message${ownMessage ? " chat-message-own" : ""}`} key={message.id}>
                    <p>{message.text}</p>
                    <time dateTime={message.createdAt}>
                      {new Date(message.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </time>
                  </article>
                );
              })}
            </div>
            <form className="message-compose" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="message-text">Ton message</label>
              <textarea id="message-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={2} placeholder="Écris ton message…" required />
              <button className="button button-primary" disabled={busy || !text.trim()} type="submit">{busy ? "Envoi…" : "Envoyer"}</button>
            </form>
          </>
        ) : listingId ? (
          <>
            <div className="thread-empty">
              <span aria-hidden="true">✉</span>
              <h2>Écris au vendeur</h2>
              <p>Pose une question sur l’article ou demande plus d’informations.</p>
            </div>
            <form className="message-compose" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="message-text">Ton message au vendeur</label>
              <textarea id="message-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={2000} rows={3} placeholder="Bonjour, cet article est-il toujours disponible ?" required />
              <button className="button button-primary" disabled={busy || !text.trim()} type="submit">{busy ? "Envoi…" : "Envoyer au vendeur"}</button>
            </form>
          </>
        ) : (
          <div className="thread-empty">
            <span aria-hidden="true">✉</span>
            <h2>Tes échanges, au même endroit</h2>
            <p>Sélectionne une conversation ou contacte un vendeur depuis une annonce.</p>
          </div>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
