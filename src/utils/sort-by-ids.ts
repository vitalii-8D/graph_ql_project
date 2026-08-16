type Id = string | number;

export const sortByIds = <T extends { id: Id }>(ids: Id[], items: T[]): T[] => {
  const itemsMap = items.reduce((acc, item) => acc.set(item.id, item), new Map<Id, T>());

  return ids.map((id) => itemsMap.get(id)).filter((item): item is T => item !== undefined);
};
