import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { CredentialsForm } from "@/components/CredentialsForm";
import { WebAuthnForm } from "@/components/WebAuthnForm";
import { PasskeyForm } from "@/components/PasskeyForm";

export default function Page() {
  const router = useRouter();
  const { status } = useSession({
    required: false,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") return;

    router.replace("/");
  }, [status]);

  return (
    <main>
      <h1>Sign in or sign up with</h1>

      <CredentialsForm />
      <hr />
      <WebAuthnForm />
      <hr />
      <PasskeyForm />
    </main>
  );
}
