import "server-only";

import { Role, WorkspaceType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/server/db/client";

export type AuthzSessionUser = {
  id: string;
  role: Role;
  email?: string | null;
};

export class AuthzError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

export async function requireSessionUser(): Promise<AuthzSessionUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthzError("Not authenticated.", 401);
  }
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  };
}

export function assertAnyRole(user: AuthzSessionUser, allowed: Role[]) {
  if (!allowed.includes(user.role) && user.role !== "ADMIN") {
    throw new AuthzError("Unauthorized.", 403);
  }
}

export async function assertWorkspaceEnabled(userId: string, workspace: WorkspaceType) {
  const membership = await db.userWorkspace.findUnique({
    where: { userId_workspace: { userId, workspace } },
    select: { status: true },
  });
  if (!membership || membership.status !== "ENABLED") {
    throw new AuthzError("Workspace access not enabled.", 403);
  }
}

export async function getDefaultWorkspace(userId: string): Promise<WorkspaceType | null> {
  const membership = await db.userWorkspace.findFirst({
    where: { userId, status: "ENABLED", isDefault: true },
    select: { workspace: true },
  });
  return membership?.workspace ?? null;
}

export async function getEnabledWorkspaces(userId: string): Promise<WorkspaceType[]> {
  const memberships = await db.userWorkspace.findMany({
    where: { userId, status: "ENABLED" },
    select: { workspace: true },
  });
  return memberships.map((item) => item.workspace);
}
