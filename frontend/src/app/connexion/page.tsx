import type { Metadata } from "next";
import AccountForm from "@/components/account-form";

export const metadata: Metadata = {
  title: "Connexion",
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  return <AccountForm mode="login" redirectTo={redirect} />;
}
