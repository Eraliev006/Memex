import type { Route } from "./+types/home";
import { LandingPage } from "~/pages/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Memex — твой второй мозг" },
    { name: "description", content: "Личная база знаний с RAG-поиском и ссылками на источники." },
  ];
}

export default function Home() {
  return <LandingPage />;
}
