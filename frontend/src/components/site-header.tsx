import Link from "next/link";
import AccountActions from "@/components/account-actions";
import BrandMark from "@/components/brand-mark";
import { categories } from "@/lib/listings";

export default function SiteHeader() {
  return (
    <>
      <div className="utility-bar">
        <div className="site-shell utility-inner">
          <span>La marketplace locale du Congo</span>
          <span>Achats et ventes à Brazzaville, Pointe-Noire et partout au Congo</span>
        </div>
      </div>
      <header className="site-header">
        <div className="site-shell header-main">
          <Link className="brand" href="/" aria-label="Yaka Marché, accueil">
            <BrandMark />
            <span>Yaka <b>Marché</b></span>
          </Link>
          <form className="header-search" action="/annonces" role="search">
            <label className="sr-only" htmlFor="header-search">Rechercher un produit</label>
            <input id="header-search" name="q" placeholder="Que recherchez-vous ?" />
            <button type="submit" aria-label="Rechercher">⌕</button>
          </form>
          <AccountActions />
        </div>
        <div className="category-bar">
          <nav className="site-shell category-nav" aria-label="Catégories principales">
            <Link href="/annonces">Toutes les annonces</Link>
            {categories.slice(0, 5).map((category) => (
              <Link
                key={category}
                href={`/annonces?category=${encodeURIComponent(category)}`}
              >
                {category}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
