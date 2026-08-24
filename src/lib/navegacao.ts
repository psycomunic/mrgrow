import type { Recurso } from "@/lib/papeis";

export type ItemMenu = {
  href: string;
  rotulo: string;
  icone: string;
  recurso: Recurso;
  grupo: "Operação" | "Comercial" | "Gestão";
};

export const MENU: ItemMenu[] = [
  { href: "/painel", rotulo: "Visão geral", icone: "LayoutDashboard", recurso: "visao", grupo: "Operação" },
  { href: "/painel/metricas", rotulo: "Métricas", icone: "BarChart3", recurso: "metricas", grupo: "Operação" },
  { href: "/painel/projetos", rotulo: "Projetos", icone: "FolderKanban", recurso: "projetos", grupo: "Operação" },
  { href: "/painel/tarefas", rotulo: "Tarefas", icone: "CircleCheckBig", recurso: "tarefas", grupo: "Operação" },

  { href: "/painel/crm", rotulo: "CRM", icone: "Filter", recurso: "crm", grupo: "Comercial" },
  { href: "/painel/clientes", rotulo: "Clientes", icone: "Building2", recurso: "clientes", grupo: "Comercial" },
  { href: "/painel/propostas", rotulo: "Propostas", icone: "FileText", recurso: "propostas", grupo: "Comercial" },

  { href: "/painel/financeiro", rotulo: "Financeiro", icone: "Wallet", recurso: "financeiro", grupo: "Gestão" },
  { href: "/painel/integracoes", rotulo: "Integrações", icone: "Plug", recurso: "integracoes", grupo: "Gestão" },
  { href: "/painel/automacoes", rotulo: "Automações", icone: "Zap", recurso: "automacoes", grupo: "Gestão" },
  { href: "/painel/relatorios", rotulo: "Relatórios", icone: "FileBarChart", recurso: "relatorios", grupo: "Gestão" },
  { href: "/painel/equipe", rotulo: "Equipe", icone: "Users", recurso: "equipe", grupo: "Gestão" },
  { href: "/painel/configuracoes", rotulo: "Configurações", icone: "Settings", recurso: "configuracoes", grupo: "Gestão" },
];

export const GRUPOS = ["Operação", "Comercial", "Gestão"] as const;
