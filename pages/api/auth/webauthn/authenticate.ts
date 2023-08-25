import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import type { PublicKeyCredentialDescriptorFuture } from "@simplewebauthn/typescript-types";
import { prisma } from "@/prisma/db";

export default createRouter<NextApiRequest, NextApiResponse>()
  .get(async (request, response) => {
    const email = request.query["email"] as string;

    if (!email) {
      return response.status(400).json({ message: "Email is required." });
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
          where: {
            credentialBackedUp: false,
          },
        },
      },
      where: {
        email,
      },
    });

    if (!user) {
      return response.status(404).json({ message: "Email is not registered." });
    }

    const options = generateAuthenticationOptions({
      userVerification: "preferred",
      allowCredentials:
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
    } catch (err) {
      return response
        .status(500)
        .json({ message: "Could not set up challenge." });
    }

    return response.status(200).json(options);
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
