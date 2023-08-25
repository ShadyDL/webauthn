import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { createRouter } from "next-connect";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  PublicKeyCredentialDescriptorFuture,
  RegistrationCredentialJSON,
} from "@simplewebauthn/typescript-types";
import { prisma } from "@/prisma/db";
import { domain, name, origin } from "@/lib/env";

export default createRouter<NextApiRequest, NextApiResponse>()
  .get(async (request, response) => {
    const session = await getSession({ req: request });
    const email = session?.user?.email;

    if (!email) {
      return response
        .status(401)
        .json({ message: "Authentication is required." });
    }

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        authenticators: {
          select: {
            credentialID: true,
            transports: true,
          },
        },
      },
      where: {
        email,
      },
    });

    if (!user) {
      return response
        .status(401)
        .json({ message: "Authentication is required." });
    }

    const options = generateRegistrationOptions({
      rpID: domain,
      rpName: name,
      userID: user.id,
      userName: user.email,
      attestationType: "none",
      authenticatorSelection: {
        userVerification: "preferred",
      },
      excludeCredentials:
        user.authenticators.map<PublicKeyCredentialDescriptorFuture>(
          ({ credentialID, transports }) => ({
            type: "public-key",
            id: Buffer.from(credentialID, "base64url"),
            transports,
          })
        ),
    });

    try {
      await prisma.challenge.upsert({
        where: {
          userId: user.id,
        },
        create: {
          userId: user.id,
          value: options.challenge,
        },
        update: {
          value: options.challenge,
        },
      });
    } catch (error) {
      return response
        .status(500)
        .json({ message: "Could not set up challenge." });
    }

    return response.status(200).json(options);
  })
  .post(async (request, response) => {
    const session = await getSession({ req: request });
    const email = session?.user?.email;

    if (!email) {
      return response
        .status(401)
        .json({ success: false, message: "You are not connected." });
    }

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
        currentChallenge: true,
      },
      where: {
        email,
      },
    });

    if (!user) {
      return response
        .status(401)
        .json({ success: false, message: "You are not connected." });
    }

    if (!user.currentChallenge) {
      return response
        .status(401)
        .json({ success: false, message: "Pre-registration is required." });
    }

    const credential: RegistrationCredentialJSON = request.body;

    const { verified, registrationInfo: info } =
      await verifyRegistrationResponse({
        credential,
        expectedRPID: domain,
        expectedOrigin: origin,
        expectedChallenge: user.currentChallenge.value,
      });

    if (!verified || !info) {
      return response
        .status(500)
        .json({ success: false, message: "Something went wrong." });
    }

    try {
      await prisma.authenticator.create({
        data: {
          userId: user.id,
          credentialID: info.credentialID.toString("base64url"),
          credentialPublicKey: info.credentialPublicKey,
          credentialBackedUp: info.credentialBackedUp,
          credentialDeviceType: info.credentialDeviceType,
          transports: credential.transports ?? ["internal"],
          counter: info.counter,
        },
      });

      return response.status(201).json({ success: true });
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: "Could not register the credential.",
      });
    }
  })
  .handler({
    onError: (error, _, response) => {
      console.error(error);

      response.status(500).end("Something went wrong.");
    },
    onNoMatch: (_, respones) => {
      respones.status(404).end("Page is not found.");
    },
  });
