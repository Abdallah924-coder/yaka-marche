import type { Metadata } from "next";
import Link from "next/link";
import ListingCard from "@/components/listing-card";
import SiteHeader from "@/components/site-header";
import { categories, getListings, type Listing } from "@/lib/listings";

export const metadata: Metadata = {
  title: "Toutes les annonces au Congo",
  description:
    "Parcourez les annonces de produits, services et bonnes affaires au Congo sur Yaka Marché.",
  alternates: { canonical: "/annonces" },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  sort?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const selectedCategory = params.category || "";
  const sort = params.sort || "recent";

  let listings: Listing[] = [];
  let loadError = false;
  try {
    listings = await getListings({
      search: query,
      category: selectedCategory,
      sort,
    });
  } catch (error) {
    console.error("[marketplace] Failed to load listing catalog:", error);
    loadError = true;
  }

  return (
    <>
      <SiteHeader />
      <main className="site-shell catalog-layout">
        <aside className="catalog-sidebar" aria-label="Filtres des annonces">
          <h2>Catégories</h2>
          <Link className={!selectedCategory ? "filter-active" : ""} href="/annonces">
            Toutes les catégories
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              className={selectedCategory === category ? "filter-active" : ""}
              href={`/annonces?category=${encodeURIComponent(category)}`}
            >
              {category}
            </Link>
          ))}
        </aside>

        <section className="catalog-content" aria-labelledby="catalog-title">
          <div className="catalog-heading">
            <div>
              <p className="eyebrow">Le marché près de chez vous</p>
              <h1 id="catalog-title">
                {query ? `Résultats pour « ${query} »` : selectedCategory || "Toutes les annonces"}
              </h1>
              <p className="muted-copy">
                {loadError
                  ? "Le catalogue ne répond pas pour le moment."
                  : `${listings.length} annonce${listings.length > 1 ? "s" : ""} à découvrir`}
              </p>
            </div>
            <form className="catalog-search" action="/annonces" role="search">
              <label className="sr-only" htmlFor="catalog-search">Rechercher dans les annonces</label>
              <input
                id="catalog-search"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Produit, service, ville..."
              />
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <button className="button button-primary" type="submit">Rechercher</button>
            </form>
          </div>

          <div className="catalog-toolbar">
            <span>{selectedCategory || "Annonces récentes"}</span>
            <Link className="text-link" href={`/alertes?${new URLSearchParams({
              ...(selectedCategory ? { category: selectedCategory } : {}),
              ...(query ? { keyword: query } : {}),
            }).toString()}`}>Créer une alerte pour cette recherche</Link>
            <form action="/annonces">
              {query && <input type="hidden" name="q" value={query} />}
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <label htmlFor="sort-listings">Trier par</label>
              <select id="sort-listings" name="sort" defaultValue={sort}>
                <option value="recent">Plus récentes</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
              <button className="sort-submit" type="submit">Appliquer</button>
            </form>
          </div>

          {loadError ? (
            <div className="catalog-message" role="status">
              <strong>Impossible de charger les annonces.</strong>
              <p>Réessayez dans quelques instants. Si le problème continue, contactez-nous.</p>
            </div>
          ) : listings.length ? (
            <div className="listing-grid">
              {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          ) : (
            <div className="catalog-message">
              <strong>Aucune annonce ne correspond à votre recherche.</strong>
              <p>Essayez une autre catégorie ou un terme plus général.</p>
              <Link className="button button-outline" href="/annonces">Voir toutes les annonces</Link>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
