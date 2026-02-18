import { bearerAuth } from "hono/bearer-auth";

export const createAuthMiddleware = (token: string) => bearerAuth({ token });
