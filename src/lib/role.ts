import prisma from "./prisma";

const ROLE_NAMES = ["Job_finder", "Recruiter", "Admin"] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

function isRoleName(value: unknown): value is RoleName {
  return (
    typeof value === "string" &&
    (ROLE_NAMES as readonly string[]).includes(value)
  );
}

async function getRolesForUser(userId: string): Promise<RoleName[]> {
  const rows = await prisma.userRole.findMany({
    where: { userId },
    select: { role: true },
  });

  const roles: RoleName[] = [];
  for (const row of rows) {
    const value = row.role as unknown;
    if (isRoleName(value) && !roles.includes(value)) roles.push(value);
  }
  return roles;
}

export { isRoleName, getRolesForUser };
