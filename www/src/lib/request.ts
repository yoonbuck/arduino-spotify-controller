export function makeQueryString(params: Record<string, string>) {
  const ps: string[] = [];
  for (let [k, v] of Object.entries(params)) {
    ps.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return ps.join("&");
}

export function parseQueryString(str: string) {
  const parts = str.split("&");
  return Object.fromEntries(
    parts.map((part) => part.split("=").map(decodeURIComponent))
  );
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  query?: Record<string, string>;
  body?: any;
  bearer?: string;
  headers?: HeadersInit;
}
export function request(
  url: string,
  { method = "GET", query, body, bearer, headers = {} }: RequestOptions = {}
): Promise<Response> {
  const fetchOpts = {} as RequestInit;
  fetchOpts.method = method;
  fetchOpts.headers = new Headers(headers);
  if (body) {
    fetchOpts.body = JSON.stringify(body);
    fetchOpts.headers.append("Content-Type", "application/json; charset=utf-8");
  }
  if (bearer) {
    fetchOpts.headers.append("Authorization", "Bearer " + bearer);
  }
  if (query) {
    url = url + "?" + makeQueryString(query);
  }
  return fetch(url, fetchOpts);
}
