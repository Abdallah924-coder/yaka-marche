import type { Metadata } from "next";
import AccountForm from "@/components/account-form";

export const metadata: Metadata = {
  title: "Créer un compte",
  robots: { index: false, follow: true },
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; ref?: string }>;
}) {
  const { redirect, ref } = await searchParams;
  return <AccountForm mode="register" redirectTo={redirect} referralCode={ref} />;
}
