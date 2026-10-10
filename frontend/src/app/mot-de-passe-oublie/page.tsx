import type { Metadata } from "next";
import PasswordRecoveryForm from "@/components/password-recovery-form";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return <PasswordRecoveryForm />;
}
