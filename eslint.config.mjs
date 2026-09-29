import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 removeu o `next lint`: os presets já vêm em flat config, sem FlatCompat.
const config = [
  ...coreWebVitals,
  ...typescript,
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },

  /**
   * Proíbe montar redirecionamento a partir da origem da requisição.
   *
   * Na Hostinger o Node escuta em `0.0.0.0:3000` atrás de um proxy, e é
   * esse o endereço que `request.nextUrl.origin` devolve. Já quebrou duas
   * vezes: o "sair" mandava para `https://0.0.0.0:3000/entrar`, e a
   * confirmação de e-mail mandava para `https://0.0.0.0:3000/painel`
   * depois que a pessoa já tinha clicado no link do e-mail.
   *
   * A segunda vez escapou porque estava escrito como desestruturação
   * (`const { origin } = request.nextUrl`), que nenhuma busca por
   * "nextUrl.origin" encontra. A regra pega as duas formas.
   */
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/lib/endereco.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='origin'][object.property.name='nextUrl']",
          message:
            "Atrás do proxy isto vira 0.0.0.0:3000. Use `urlDoApp` ou `origemPublica` de @/lib/endereco.",
        },
        {
          selector:
            "VariableDeclarator[init.property.name='nextUrl'] > ObjectPattern > Property[key.name='origin']",
          message:
            "Atrás do proxy isto vira 0.0.0.0:3000. Use `urlDoApp` ou `origemPublica` de @/lib/endereco.",
        },
      ],
    },
  },
];

export default config;
