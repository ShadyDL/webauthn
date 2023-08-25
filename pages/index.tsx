import { signIn, signOut, useSession } from "next-auth/react";
import { startRegistration } from "@simplewebauthn/browser";

export default function Page() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: signIn,
  });

  async function registerWebAuthn() {
    const optionsResponse = await fetch("/api/auth/webauthn/register");

    if (optionsResponse.status !== 200) {
      alert("Could not get registration options from server");
      return;
    }

    const creationOptionsJSON = await optionsResponse.json();

    try {
      const credential = await startRegistration(creationOptionsJSON);

      const response = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credential),
        credentials: "include",
      });

      if (response.status !== 201) {
        alert("Could not register WebAuthn credentials.");
      } else {
        alert("Your WebAuthn credentials have been registered.");
      }
    } catch (error) {
      alert(`Registration failed. ${(error as Error).message}`);
    }
  }

  async function registerPasskey() {
    const optionsResponse = await fetch("/api/auth/passkey/register");

    if (optionsResponse.status !== 200) {
      alert("Could not get registration options from server");
      return;
    }

    const creationOptionsJSON = await optionsResponse.json();

    try {
      const credential = await startRegistration(creationOptionsJSON);

      const response = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credential),
        credentials: "include",
      });

      if (response.status !== 201) {
        alert("Could not register Passkey credentials.");
      } else {
        alert("Your Passkey credentials have been registered.");
      }
    } catch (error) {
      alert(`Registration failed. ${(error as Error).message}`);
    }
  }

  if (status !== "authenticated")
    return (
      <main>
        <span>Loading...</span>
      </main>
    );

  return (
    <main>
      <div>
        <h1>Signed in as {session?.user?.email}</h1>

        <button onClick={registerWebAuthn}>Register WebAuthn</button>
        <button onClick={registerPasskey}>Register Passkey</button>
        <button onClick={() => signOut()}>Log out</button>
      </div>
    </main>
  );
}
