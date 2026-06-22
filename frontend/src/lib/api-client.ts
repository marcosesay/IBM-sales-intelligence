import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

type QueryOptions<TData> = {
  query?: Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, "queryKey" | "queryFn">;
};

type NewsItem = {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
  date?: string;
  snippet?: string;
};

type NewsResponse = NewsItem[];

type LogoResponse = {
  url?: string | null;
  logoUrl?: string | null;
};

type IndustryResponse = {
  industry?: string | null;
};

let baseUrl = "http://localhost:3000";

export function setBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function useGetBriefingNews(
  params: { company: string },
  options?: QueryOptions<NewsResponse>,
) {
  return useQuery({
    queryKey: ["briefing-news", params.company] as const,
    queryFn: () =>
      fetchJson<NewsResponse>(`/api/briefing/news?company=${encodeURIComponent(params.company)}`).then((data: any) =>
        Array.isArray(data) ? data : Array.isArray(data?.news) ? data.news : [],
      ),
    ...options?.query,
  });
}

export function useGetBriefingLogo(
  params: { company: string },
  options?: QueryOptions<LogoResponse>,
) {
  return useQuery({
    queryKey: ["briefing-logo", params.company] as const,
    queryFn: () =>
      fetchJson<LogoResponse>(`/api/briefing/logo?company=${encodeURIComponent(params.company)}`).then((data: any) => ({
        ...data,
        url: data?.url ?? data?.logoUrl ?? null,
        logoUrl: data?.logoUrl ?? data?.url ?? null,
      })),
    ...options?.query,
  });
}

export function useGetBriefingIndustry(
  params: { company: string },
  options?: QueryOptions<IndustryResponse>,
) {
  return useQuery({
    queryKey: ["briefing-industry", params.company] as const,
    queryFn: () =>
      fetchJson<IndustryResponse>(`/api/briefing/industry?company=${encodeURIComponent(params.company)}`),
    ...options?.query,
  });
}


export function useGetPulseNews(
  options,
) {
  return useQuery({
    queryKey: ["pulse-news"],
    queryFn: () =>
      fetchJson("/api/briefing/pulse").then((data) =>
        Array.isArray(data) ? data : [],
      ),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    ...options?.query,
  });
}

// Made with Bob
