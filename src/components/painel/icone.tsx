"use client";

import {
  BarChart3, Building2, CircleCheckBig, FileBarChart, FileText, Filter,
  FolderKanban, LayoutDashboard, Plug, Settings, Users, Wallet, Zap,
  type LucideIcon,
} from "lucide-react";

const MAPA: Record<string, LucideIcon> = {
  LayoutDashboard, BarChart3, FolderKanban, CircleCheckBig, Filter, Building2,
  FileText, Wallet, Plug, Zap, FileBarChart, Users, Settings,
};

export function Icone({ nome, className }: { nome: string; className?: string }) {
  const Componente = MAPA[nome] ?? LayoutDashboard;
  return <Componente className={className} />;
}
