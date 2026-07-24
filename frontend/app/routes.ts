import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("registration", "routes/registration.tsx"),
  route("auth/google/callback", "routes/auth-google-callback.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  layout("routes/_protected.tsx", [
    route("documents", "routes/documents.tsx"),
    route("chat", "routes/chat.tsx"),
    route("chat/:sessionId", "routes/chat-session.tsx"),
    route("knowledge-graph", "routes/knowledge-graph.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;