import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/prisma/db";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { domain, origin } from "@/lib/env";
import {
  AuthenticationCredentialJSON,
  AuthenticationExtensionsClientOutputsJSON,
} from "@simplewebauthn/typescript-types";

export default NextAuth({
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return await prisma.user.findFirst({
          where: {
            email: credentials?.email,
            password: credentials?.password,
          },
        });
      },
    }),
    CredentialsProvider({
      id: "webauthn",
      name: "WebAuthn",
      credentials: {
        id: { type: "text", label: "ID" },
        rawId: { type: "text", label: "Raw ID" },
        type: { type: "text", label: "Type" },
        clientDataJSON: { type: "text", label: "Client Data JSON" },
        authenticatorData: { type: "text", label: "Authenticator Data" },
        signature: { type: "text", label: "Signature" },
        userHandle: { type: "text", label: "User Handle" },
        clientExtensionResults: {
          type: "text",
          label: "Client Extension Results",
        },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const {
          id,
          rawId,
          type,
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle,
          clientExtensionResults,
        } = credentials;

        const credential: AuthenticationCredentialJSON = {
          id,
          rawId,
          type,
          response: {
            clientDataJSON,
            authenticatorData,
            signature,
            userHandle,
          },
          clientExtensionResults: JSON.parse(
            clientExtensionResults
          ) as AuthenticationExtensionsClientOutputsJSON,
        };

        const result = await prisma.authenticator.findFirst({
          select: {
            id: true,
            credentialID: true,
            credentialPublicKey: true,
            counter: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                currentChallenge: {
                  select: {
                    value: true,
                  },
                },
              },
            },
          },
          where: {
            credentialID: credential.id,
          },
        });

        if (!result) return null;

        const { user, ...authenticator } = result;

        if (!user.currentChallenge?.value) return null;

        try {
          const { verified, authenticationInfo: info } =
            await verifyAuthenticationResponse({
              credential,
              expectedChallenge: user.currentChallenge.value,
              expectedOrigin: origin,
              expectedRPID: domain,
              authenticator: {
                credentialPublicKey: authenticator.credentialPublicKey,
                credentialID: Buffer.from(
                  authenticator.credentialID,
                  "base64url"
                ),
                counter: authenticator.counter,
              },
            });

          if (!verified || !info) return null;

          await prisma.authenticator.update({
            where: {
              id: authenticator.id,
            },
            data: {
              counter: info.newCounter,
            },
          });
        } catch (error) {
          console.error(error);

          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
    CredentialsProvider({
      id: "passkey",
      name: "Passkey",
      credentials: {
        id: { type: "text", label: "ID" },
        rawId: { type: "text", label: "Raw ID" },
        type: { type: "text", label: "Type" },
        clientDataJSON: { type: "text", label: "Client Data JSON" },
        authenticatorData: { type: "text", label: "Authenticator Data" },
        signature: { type: "text", label: "Signature" },
        userHandle: { type: "text", label: "User Handle" },
        clientExtensionResults: {
          type: "text",
          label: "Client Extension Results",
        },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const {
          id,
          rawId,
          type,
          clientDataJSON,
          authenticatorData,
          signature,
          userHandle,
          clientExtensionResults,
        } = credentials;

        const credential: AuthenticationCredentialJSON = {
          id,
          rawId,
          type,
          response: {
            clientDataJSON,
            authenticatorData,
            signature,
            userHandle,
          },
          clientExtensionResults: JSON.parse(
            clientExtensionResults
          ) as AuthenticationExtensionsClientOutputsJSON,
        };

        const result = await prisma.authenticator.findFirst({
          select: {
            id: true,
            credentialID: true,
            credentialPublicKey: true,
            counter: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                currentChallenge: {
                  select: {
                    value: true,
                  },
                },
              },
            },
          },
          where: {
            credentialID: credential.id,
          },
        });

        if (!result) return null;

        const { user, ...authenticator } = result;

        if (!user.currentChallenge?.value) return null;

        try {
          const { verified, authenticationInfo: info } =
            await verifyAuthenticationResponse({
              credential,
              expectedChallenge: user.currentChallenge.value,
              expectedOrigin: origin,
              expectedRPID: domain,
              authenticator: {
                credentialPublicKey: authenticator.credentialPublicKey,
                credentialID: Buffer.from(
                  authenticator.credentialID,
                  "base64url"
                ),
                counter: authenticator.counter,
              },
              requireUserVerification: true,
            });

          if (!verified || !info) return null;

          await prisma.authenticator.update({
            where: {
              id: authenticator.id,
            },
            data: {
              counter: info.newCounter,
            },
          });
        } catch (error) {
          console.error(error);

          return null;
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/sign-in",
    signOut: "/auth/sign-out",
  },
});
