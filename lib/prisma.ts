import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ||
    new PrismaClient({
        log:
            env.NODE_ENV === "development"
                ? env.PRISMA_LOG_QUERIES === "1"
                    ? ["query", "error", "warn"]
                    : ["error", "warn"]
                : ["error"],
    });

if (env.NODE_ENV !== "production") global.prisma = prisma;
