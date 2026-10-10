import Link from "next/link";
import ListingCard from "@/components/listing-card";
import SiteHeader from "@/components/site-header";
import { categories, getListings, type Listing } from "@/lib/listings";

export const dynamic = "force-dynamic";

export default async function Home() {
  let listings: Listing[] = [];
  let loadError = false;
  try {
    listings = await getListings({ sort: "recent" });
  } catch (error) {
    console.error("[marketplace] Failed to load home catalog:", error);
    loadError = true;
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="site-shell hero-layout">
            <div className="hero-copy">
              <p className="eyebrow">Acheter et vendre, simplement</p>
              <h1>Le bon produit.<br /><span>Juste à côté.</span></h1>
              <p className="hero-description">
                Découvre les annonces près de chez toi et échange directement avec les vendeurs au Congo.
              </p>
              <form className="hero-search" action="/annonces" role="search">
                <label className="sr-only" htmlFor="home-search">Que recherchez-vous ?</label>
                <span aria-hidden="true">⌕</span>
                <input
                  id="home-search"
                  type="search"
                  name="q"
                  placeholder="Ex. téléphone, terrain, service..."
                />
                <button className="button button-primary" type="submit">Rechercher</button>
              </form>
              <p className="hero-trust"><span aria-hidden="true">✓</span> Contact direct avec les vendeurs</p>
            </div>
            <div className="hero-art" aria-label="Achetez et vendez au Congo">
              <div className="art-sun" />
              <div className="art-card art-card-back"><span>Marché local</span><b>À portée de main</b></div>
              <div className="art-card art-card-front"><span className="art-icon">Y</span><b>De bonnes trouvailles<br />près de chez toi.</b><span className="art-location">Brazzaville · Pointe-Noire</span></div>
              <span className="art-sparkle sparkle-one" aria-hidden="true">✳</span>
              <span className="art-sparkle sparkle-two" aria-hidden="true">✦</span>
            </div>
          </div>
        </section>

        <section className="category-section">
          <div className="site-shell">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Explorer le marché</p>
                <h2>Qu’est-ce que tu cherches ?</h2>
              </div>
              <Link className="text-link" href="/annonces">Toutes les catégories <span aria-hidden="true">→</span></Link>
            </div>
            <div className="category-grid">
              {categories.map((category, index) => (
                <Link
                  className="category-tile"
                  href={`/annonces?category=${encodeURIComponent(category)}`}
                  key={category}
                >
                  <span className={`category-icon category-icon-${index % 4}`} aria-hidden="true">
                    {["▦", "✦", "⌂", "↗"][index % 4]}
                  </span>
                  <span>{category}</span>
                  <span className="category-arrow" aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="market-section">
          <div className="site-shell">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">À découvrir</p>
                <h2>Les annonces du moment</h2>
              </div>
              <Link className="text-link" href="/annonces">Voir toutes les annonces <span aria-hidden="true">→</span></Link>
            </div>
            {loadError ? (
              <div className="catalog-message" role="status">
                <strong>Le catalogue est momentanément indisponible.</strong>
                <p>Réessaie dans quelques instants.</p>
              </div>
            ) : listings.length ? (
              <div className="listing-grid">
                {listings.slice(0, 8).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="catalog-message">
                <strong>Les premières annonces arrivent bientôt.</strong>
                <p>Tu peux déjà explorer les catégories ou publier un article.</p>
                <Link className="button button-outline" href="/annonces">Explorer les annonces</Link>
              </div>
            )}
          </div>
        </section>

        <section className="seller-promo">
          <div className="site-shell seller-promo-inner">
            <div>
              <p className="eyebrow">Tu as quelque chose à vendre ?</p>
              <h2>Ton prochain client<br />est peut-être tout près.</h2>
              <p>Publie une annonce et échange directement avec les acheteurs.</p>
            </div>
            <Link className="button button-light" href="/publier">Publier une annonce <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>
    </>
  );
}
