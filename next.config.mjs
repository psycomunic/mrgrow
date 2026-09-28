/**
 * Config em JavaScript, e não em TypeScript, de propósito.
 *
 * O servidor da Hostinger tem glibc antiga, então o SWC nativo não
 * carrega ali (`GLIBC_2.29 not found`) e o build cai no SWC em WASM.
 * Nesse caminho ele não consegue transpilar um `next.config.ts`, e o
 * build morre antes de começar. Config em JS não precisa de
 * transpilação e passa nos dois ambientes.
 *
 * O tipo vem por JSDoc, então o editor e o `tsc` seguem conferindo o
 * objeto como antes.
 *
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  /* Necessário para hospedagem Node própria, como a da Hostinger: o
     build passa a emitir `.next/standalone/server.js`, que roda sem o
     `node_modules` inteiro ao lado. A Vercel ignora esta opção, então
     não atrapalha o deploy de lá. */
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
