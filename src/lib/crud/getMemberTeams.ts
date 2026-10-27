import { auth } from "@lib/auth";

type Membership = {
  teamId: string;
  isMember: boolean;
};

export async function getMemberJoinedTeams(
  organizationId: string,
  userId: string,
  headers: Headers,
) {
  // TODO authorize that session is an org.role === 'admin' or 'owner'
  // 1. All teams in the organization
  const teams = await auth.api.listOrganizationTeams({
    query: { organizationId },
    headers,
  });

  // 2. Teams this member belongs to
  //   const memberships: Membership[] = await Promise.all(
  //     teams.map(async (team) => {
  //       const members = await auth.api.listTeamMembers({
  //         query: { teamId: team.id },
  //         headers,
  //       });
  //       console.log({members});
  //       return {
  //         teamId: team.id,
  //         isMember: members.some((m) => m.userId === userId),
  //       };
  //     }),
  //   );

  const ctx = await auth.$context;
  const rows = await ctx.adapter.findMany<{ teamId: string; userId: string }>({
    model: "teamMember",
    where: [{ field: "userId", value: userId }],
  });
  const joinedTeamIds = new Set(rows.map((r) => r.teamId));

  //   const joinedTeamIds = new Set(
  //     memberships.filter((m) => m.isMember).map((m) => m.teamId),
  //   );
  return { teams, joinedTeamIds };
}
