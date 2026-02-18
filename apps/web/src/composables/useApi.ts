import { hc } from "hono/client";
import type { AppType } from "@web-clipper/api";

const baseUrl = import.meta.env.VITE_API_URL || "/";

const client = hc<AppType>(baseUrl, {
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_API_TOKEN}`,
  },
});

export function useApi() {
  return client;
}
