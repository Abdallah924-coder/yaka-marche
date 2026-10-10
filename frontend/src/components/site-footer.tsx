import Link from "next/link";
import BrandMark from "@/components/brand-mark";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <Link className="brand footer-brand" href="/">
          <BrandMark />
          <span>Yaka <b>Marché</b></span>
        </Link>
        <p>Le commerce local, plus proche de toi.</p>
        <div className="footer-legal">
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/politique-de-confidentialite">Confidentialité</Link>
        </div>
        <span>© 2026 Yaka Marché · Congo</span>
      </div>
    </footer>
  );
}
