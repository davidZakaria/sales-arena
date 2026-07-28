export function userAgencyAccessFilter(userId: string) {
  return {
    OR: [
      { primaryOwnerId: userId },
      { coOwners: { some: { id: userId } } },
    ],
  };
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
