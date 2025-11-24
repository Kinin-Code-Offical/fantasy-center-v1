import { prisma as globalPrisma } from "@/lib/prisma";

/**
 * Logs a financial transaction to the user's ledger.
 * @param userId The user ID
 * @param amount The amount (positive for income, negative for expense)
 * @param type The type of transaction (e.g., "TRADE_SALE", "TRADE_PURCHASE")
 * @param description A human-readable description
 * @param tx Optional Prisma Transaction Client
 */
export async function logTransaction(userId: string, amount: number, type: string, description: string, tx: any = globalPrisma) {
  try {
    await tx.ledger.create({
      data: {
        userId,
        amount,
        type,
        description,
      },
    });
  } catch (error) {
    console.error("Failed to log transaction:", error);
    // We don't throw here to prevent blocking the main action if logging fails
  }
}

/**
 * Logs a completed trade between two users.
 * @param sellerId The seller's user ID
 * @param buyerId The buyer's user ID
 * @param assetsGiven Snapshot of assets given by the seller
 * @param assetsReceived Snapshot of assets given by the buyer
 * @param tx Optional Prisma Transaction Client
 */
export async function logTrade(sellerId: string, buyerId: string, assetsGiven: any, assetsReceived: any, tx: any = globalPrisma) {
  try {
    await tx.tradeHistory.create({
      data: {
        sellerId,
        buyerId,
        assetsGiven,
        assetsReceived,
      },
    });
  } catch (error) {
    console.error("Failed to log trade history:", error);
  }
}
