# Discoff

Compartilhamento de tela com áudio, voz e chat — app desktop (Windows) e Android, com
salas privadas por código e comunidades no estilo Discord.

> **Site oficial:** https://scoffyt.github.io/screenconnect/
> **Baixar:** [instalador para Windows](https://github.com/scoffyt/screenconnect/releases/latest) · [APK Android](https://github.com/scoffyt/screenconnect/releases)

- **Desktop:** Electron 45 + React 19 + TypeScript + Vite + Tailwind v4
- **Android:** Capacitor 6 (mesmo renderer)
- **Backend:** Supabase (Postgres + RLS + Realtime + Auth)
- **Mídia:** WebRTC ponto-a-ponto (mesh), com captura de tela, áudio do sistema e microfone

---

## O que o app faz

### Salas de transmissão

- Salas privadas com código de 8 caracteres ou públicas na lista de descoberta
- Compartilhar **tela inteira** ou **janela específica**
- **Áudio do sistema** (loopback do Windows) junto com o vídeo
- **Microfone** com cancelamento de eco, supressão de ruído e ganho automático
- Assistir à transmissão de outra pessoa, com tela cheia nativa e Picture-in-Picture
- Chat por sala com histórico
- Qualidade configurável: resolução (720p/1080p/1440p), FPS (15/30/60) e bitrate
- Volume individual e mudo por participante (inclusive "mutar um amigo")

### Comunidades (servidores)

- Criar servidor, transferir propriedade, sair, convidar por link
- Convites com validade, limite de usos e revogação
- Canais de **texto** e de **voz**, organizados em categorias
- Canais privados com permissão dedicada
- Cargos e permissões (Proprietário, Administrador, Moderador, Membro + 14 permissões)
- Gestão de membros, banimentos e trilha de auditoria
- Descoberta de comunidades públicas

---

## Requisitos

| Item | Versão |
|---|---|
| Node.js | 20+ |
| Windows | 10/11 (para o app desktop) |
| Conta Supabase | projeto próprio (gratuito serve) |
| JDK + Android SDK | apenas para gerar o APK |

---

## Configuração

### 1. Banco de dados

No painel do Supabase, abra **SQL Editor** e cole o conteúdo de
`supabase/apply_all.sql` (as 6 migrations em ordem). Ele é idempotente: pode ser
reexecutado com segurança.

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```ini
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
VITE_STUN_URL=stun:stun.l.google.com:19302
```

> **Nunca** coloque a chave `service_role` aqui. Ela ignora o RLS e daria
> controle total do banco a quem tivesse acesso ao app. O app usa somente a
> `anon`, que é pública por definição.

Para redes que bloqueiam UDP, configure um TURN em **Configurações → Rede / TURN**
(a credencial é criptografada com o cofre do sistema) ou pelas variáveis
`VITE_TURN_URL`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`.

### 3. Rodar

```bash
npm install
npm run dev
```

### 4. Gerar os instaladores

```bash
# Windows (NSIS + portátil) — sai em release/
npm run make

# Android
npm run sync:android
cd android && ./gradlew assembleRelease
```

---

## Verificação

O projeto tem testes automatizados e sondas que exercitam o **backend real**
(sem `service_role`: autenticam com contas de teste e chamam as mesmas RPCs que
o app usa).

```bash
npm test              # testes unitários
npm run typecheck     # TypeScript nos três alvos (node, web, tests)
npm run verify:all    # backend, autenticação e Realtime
npm run verify:servers # permissões, convites, canais, moderação (60 checagens)
```

---

## Segurança

- `contextIsolation` e `sandbox` ativados; `nodeIntegration` desligado
- CSP fechada em produção (sem `unsafe-eval`), `object-src`/`frame-src` bloqueados
- Renderer só alcança uma lista fixa de canais IPC, com payload validado por zod
- Toda escrita em servidores passa por RPC `SECURITY DEFINER` que valida permissão
- RLS ligado e `force` em todas as tabelas: sem policy, sem acesso
- Navegação restrita ao próprio bundle — um HTML local aberto na janela não herda a API
- Android com `allowBackup=false` (o token de sessão não sai no backup do SO)

Ao abrir o app para outras pessoas, ative **Confirm email** em
*Supabase → Authentication → Providers → Email*. O app já trata o link de
confirmação e o de redefinição de senha via `screenconnect://`.

---

## Estrutura

```
src/
├── main/          processo principal do Electron (janela, IPC, captura, TURN)
├── preload/       ponte tipada entre main e renderer
├── renderer/      interface React
│   ├── components/  UI
│   ├── hooks/       sessões de sala, mídia, presença
│   ├── services/    Supabase, WebRTC, captura, microfone
│   └── stores/      estado (Zustand)
└── shared/        tipos e constantes compartilhados
supabase/
├── migrations/    schema, funções e RLS (0001–0006)
└── apply_all.sql  bundle para colar no SQL Editor
```

Documentação detalhada em [`docs/`](docs/): arquitetura, setup, Android e
solução de problemas.

---

## Licença

Projeto pessoal. Veja [LICENSE](LICENSE).
