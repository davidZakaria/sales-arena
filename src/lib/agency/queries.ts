export function excludeArchivedFilter() {
  return { status: { not: "ARCHIVED" as const } };
}

export function userAgencyAccessFilter(userId: string) {
  return {
    AND: [
      excludeArchivedFilter(),
      {
        OR: [
          { primaryOwnerId: userId },
          { coOwners: { some: { id: userId } } },
        ],
      },
    ],
  };
}

/** Agencies owned by sales reps on the manager's team (directors see all). */
export function managerTeamAgencyFilter(viewerId: string, viewerRole: string) {
  if (viewerRole === "DIRECTOR") {
    return excludeArchivedFilter();
  }

  return {
    AND: [
      excludeArchivedFilter(),
      {
        OR: [
          { primaryOwner: { managerId: viewerId } },
          { coOwners: { some: { managerId: viewerId } } },
        ],
      },
    ],
  };
}

/** Manager queue + team agencies for omni-search. */
export function managerSearchAgencyFilter(viewerId: string, viewerRole: string) {
  if (viewerRole === "DIRECTOR") {
    return excludeArchivedFilter();
  }

  return {
    AND: [
      excludeArchivedFilter(),
      {
        OR: [
          { status: "OPEN_RACE" as const },
          { primaryOwner: { managerId: viewerId } },
          { coOwners: { some: { managerId: viewerId } } },
        ],
      },
    ],
  };
}

/** Sales reps a manager can search / assign to. */
export function managerTeamUserFilter(viewerId: string, viewerRole: string) {
  if (viewerRole === "DIRECTOR") {
    return {};
  }

  if (viewerRole === "MANAGER") {
    return {
      OR: [{ id: viewerId }, { managerId: viewerId }],
    };
  }

  return { id: viewerId };
}

export function userPrimaryAgencyFilter(userId: string) {
  return { primaryOwnerId: userId };
}

export function canViewUserPortfolio(
  viewerRole: string,
  viewerId: string,
  targetUserId: string,
): boolean {
  return (
    viewerId === targetUserId ||
    viewerRole === "MANAGER" ||
    viewerRole === "DIRECTOR"
  );
}

export function canViewAgencyRecord(
  agency: {
    status: string;
    primaryOwnerId: string | null;
    coOwners: Array<{ id: string }>;
  },
  userId: string | undefined,
  userRole: string | undefined,
): boolean {
  if (!userId || !userRole) {
    return false;
  }

  if (
    userRole === "OPERATIONS" ||
    userRole === "FINANCE" ||
    userRole === "MANAGER" ||
    userRole === "DIRECTOR"
  ) {
    return true;
  }

  if (userRole !== "SALES") {
    return false;
  }

  const isOwner =
    agency.primaryOwnerId === userId ||
    agency.coOwners.some((coOwner) => coOwner.id === userId);

  if (isOwner) {
    return true;
  }

  return agency.status === "ASSIGNED" && agency.primaryOwnerId !== null;
}
