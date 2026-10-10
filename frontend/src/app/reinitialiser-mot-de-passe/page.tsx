import type { Metadata } from "next";
import PasswordRecoveryForm from "@/components/password-recovery-form";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <PasswordRecoveryForm token={token} />;
}
