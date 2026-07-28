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
