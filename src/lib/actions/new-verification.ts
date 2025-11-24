"use server";

import { prisma } from "@/lib/prisma";

export const newVerification = async (token: string) => {
  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: existingToken.email },
        { pendingEmail: existingToken.email }
      ]
    },
  });

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  // Scenario A: New Registration
  if (existingUser.email === existingToken.email) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingToken.email,
      },
    });
  } 
  // Scenario B: Email Change
  else if (existingUser.pendingEmail === existingToken.email) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        emailVerified: new Date(),
        email: existingUser.pendingEmail,
        pendingEmail: null,
      },
    });
  }

  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  return { success: true, message: "Identity Verified." };
};
