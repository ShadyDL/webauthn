import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from "react";

export default function Page() {
  const { status } = useSession({
    required: true,
    onUnauthenticated: signIn,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") return;

    signOut();
  }, [status]);

  return (
    <main>
      <span>Loading</span>
    </main>
  );
}
