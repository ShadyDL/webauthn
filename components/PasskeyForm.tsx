import { startAuthentication } from "@simplewebauthn/browser";
import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/typescript-types";
import { signIn } from "next-auth/react";

export function PasskeyForm() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();

        const email = (event.target as any).elements.email.value;

        const url = new URL(
          "/api/auth/passkey/authenticate",
          window.location.origin
        );
        url.search = new URLSearchParams({ email }).toString();
        const optionsResponse = await fetch(url.toString());

        if (optionsResponse.status !== 200) {
          alert("Could not get authentication options from server.");
          return;
        }

        const requestOptionsJSON: PublicKeyCredentialRequestOptionsJSON =
          await optionsResponse.json();

        if (
          !requestOptionsJSON.allowCredentials ||
          requestOptionsJSON.allowCredentials.length === 0
        ) {
          alert(
            "No credentials found for this user. Please register a credential first."
          );
          return;
        }

        const credential = await startAuthentication(requestOptionsJSON);

        await signIn("passkey", {
          id: credential.id,
          rawId: credential.rawId,
          type: credential.type,
          clientDataJSON: credential.response.clientDataJSON,
          authenticatorData: credential.response.authenticatorData,
          signature: credential.response.signature,
          userHandle: credential.response.userHandle,
          clientExtensionResults: JSON.stringify(
            credential.clientExtensionResults
          ),
        });
      }}
    >
      <h2>Passkey</h2>

      <div>
        <label htmlFor="email">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="webauthn username"
          placeholder="jsmith@example.com"
        />
      </div>

      <button type="submit">Continue with Passkey</button>
    </form>
  );
}
