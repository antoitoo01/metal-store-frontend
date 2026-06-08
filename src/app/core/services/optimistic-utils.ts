import { QueryClient, QueryKey } from '@tanstack/angular-query-experimental';

export interface PageData<T> {
  content: T[];
  totalElements: number;
}

export function optimisticRemoveFromPage<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
): PageData<T> | undefined {
  const data = queryClient.getQueryData<PageData<T>>(queryKey);
  if (!data) return undefined;

  queryClient.setQueryData(queryKey, {
    ...data,
    content: data.content.filter((i) => i.id !== id),
    totalElements: data.totalElements - 1,
  });

  return { content: [...data.content], totalElements: data.totalElements };
}

export function optimisticUpdateInPage<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
  updater: (item: T) => T,
): PageData<T> | undefined {
  const data = queryClient.getQueryData<PageData<T>>(queryKey);
  if (!data) return undefined;

  queryClient.setQueryData(queryKey, {
    ...data,
    content: data.content.map((i) => (i.id === id ? updater(i) : i)),
  });

  return { content: [...data.content], totalElements: data.totalElements };
}

export function optimisticRemoveFromArray<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  id: string,
): T[] | undefined {
  const data = queryClient.getQueryData<T[]>(queryKey);
  if (!data) return undefined;

  queryClient.setQueryData(queryKey, data.filter((i) => i.id !== id));
  return [...data];
}

export function optimisticAddToArray<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  item: T,
): T[] | undefined {
  const data = queryClient.getQueryData<T[]>(queryKey);
  if (!data) return undefined;

  queryClient.setQueryData(queryKey, [...data, item]);
  return [...data];
}

export function rollbackPage<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  previous: PageData<T>,
): void {
  queryClient.setQueryData(queryKey, previous);
}

export function rollbackArray<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  previous: T[],
): void {
  queryClient.setQueryData(queryKey, previous);
}
