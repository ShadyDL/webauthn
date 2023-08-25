import { signIn } from "next-auth/react";

export function CredentialsForm() {
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();

        const email = (event.target as any).elements.email.value;
        const password = (event.target as any).elements.password.value;

        await signIn("credentials", {
          email,
          password,
        });
      }}
    >
      <h2>Credentials</h2>

      <div>
        <label htmlFor="email">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="jsmith@example.com"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="********"
        />
      </div>

      <button type="submit">Continue</button>
    </form>
  );
}
