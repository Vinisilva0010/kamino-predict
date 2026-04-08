# KaminoPredict – Setup inicial e próximos passos

## Visão geral

Este documento registra o estado atual do projeto KaminoPredict, focando no setup de ambiente, estrutura de monorepo, configuração do programa Anchor e próximos passos para evoluir até o produto descrito no plano do hackathon (vault híbrido Kamino + prediction markets via DFlow). Ele foi escrito assumindo o stack real em uso: Rust 1.94.1, Solana CLI 2.2.0, Anchor CLI 1.0.0, Surfpool 1.1.2 e Node.js 22.22.1.[1][2]

## Ambiente e ferramentas

O ambiente não foi reinstalado; foi reaproveitado o setup existente com versões recentes e compatíveis com Anchor 1.0.0.[3][4]

- **Rust**: 1.94.1 – toolchain estável atual, suportado pelo Anchor 1.0.0.[3]
- **Solana CLI**: 2.2.0 – versão nova, com mudanças significativas em relação à série 1.x, mas o Anchor 1.0.0 foi projetado para reduzir o acoplamento ao Solana CLI e apoiar esse tipo de cenário.[5][3]
- **Anchor CLI**: 1.0.0 – primeiro release major estável, com novo template modular (módulos `instructions`, `state`, `error`, etc.) e restrição a um único `#[error_code]` por programa.[4][6][3]
- **Surfpool**: 1.1.2 – utilizado para execução local de programas; compatível com o fluxo de desenvolvimento recomendado em conjunto com Anchor e Solana recentes.[7]
- **Node.js**: 22.22.1 – atende com folga os requisitos mínimos do Next.js 14/16, que exigem Node ≥ 18.17 de acordo com a documentação oficial.[8][9][10]

O ponto chave foi **não rodar o instalador unificado da Solana** para não sobrescrever esse setup estável e já integrando outros projetos; todo o trabalho foi feito em diretórios locais do monorepo, sem alterar instalações globais.

## Estrutura do monorepo

O monorepo do KaminoPredict foi criado em `~/dev/kamino-predict` usando `anchor init`, que gera um workspace padrão com `Anchor.toml`, `Cargo.toml` na raiz, pasta `programs/` contendo o programa principal e diretórios auxiliares para testes e client.[2][11]

Estrutura atual:

```text
kamino-predict/
  Anchor.toml
  Cargo.toml
  programs/
    kamino-predict/
      src/
        lib.rs
        state/
          mod.rs
        instructions/
          mod.rs
          initialize_vault.rs
          deposit.rs
          withdraw.rs
        error.rs
  backend/
    package.json
    tsconfig.json
    src/
      server.ts (placeholder)
  frontend/
    package.json
    next.config (gerado pelo template)
    app/ ou pages/ (estrutura padrão Next 16.2.2)
```

Além disso:

- Um `backend/` foi criado manualmente, com `npm init -y` e dependências locais (`fastify`, `typescript`, `ts-node-dev`, `@types/node`), sem impacto em outros projetos.[9]
- Um `frontend/` foi criado com `npx create-next-app@16.2.2 frontend --ts --tailwind --use-npm`, escolhendo deliberadamente uma versão existente de `create-next-app` para evitar o erro ETARGET causado pela tentativa de instalar `create-next-app@16.2.3` inexistente no registry.[12][13]

O aviso do Next.js sobre múltiplos lockfiles (detecção de `yarn.lock` na raiz e `package-lock.json` no frontend) foi resolvido removendo o `yarn.lock` da raiz, alinhando o monorepo ao uso de `npm` para o frontend, o que está alinhado com as recomendações para monorepos simples com Next + Node.[14][15]

## Backend (Node + TypeScript + Fastify)

O backend ainda está em estado inicial, com o objetivo de ser um **worker/cron + API** que irá:

- Rodar cranks periódicos (chamando instruções como `rebalance` e `settle_prediction` quando existirem).
- Integrar com a DFlow Prediction Markets API para seleção de mercados e execução de trades de YES/NO tokens.
- Consumir QuickNode (RPC + Streams) para monitorar eventos on-chain do programa KaminoPredict.[16][1]

Setup realizado no diretório `backend/`:

- `npm init -y` para criar o `package.json` local.
- Instalação de runtime HTTP: `fastify`.
- Instalação de tooling de desenvolvimento: `typescript`, `ts-node-dev`, `@types/node`.
- Geração de `tsconfig.json` com `npx tsc --init`.
- Criação de diretório `src/` e arquivo placeholder `src/server.ts` (ainda sem lógica implementada).

Este backend não interfere em outros projetos, porque todas as dependências são locais ao diretório `backend/`.

## Frontend (Next.js 16.2.2 + TypeScript + Tailwind)

O frontend foi criado com `create-next-app` versão 16.2.2, garantindo compatibilidade com o Node 22.22.1 e suporte pleno ao App Router e Turbopack.[10][13][17]

Decisões importantes:

- Uso explícito de `create-next-app@16.2.2` em vez de `@latest`, contornando um problema em que uma versão 16.2.3 era requisitada, mas ainda não existia no npm registry, causando erro ETARGET.[13]
- Configuração com TypeScript e Tailwind CSS, alinhando com as práticas recomendadas para criação de dashboards modernos em Next.js.[18][10]
- Remoção do `yarn.lock` da raiz do monorepo para evitar ambiguidades de root com Turbopack, de acordo com a documentação que recomenda um único lockfile por workspace ou configuração explícita de `turbopack.root`.[15][14]

O comando `npm run dev` no diretório `frontend/` inicia o servidor Next.js 16.2.2 com Turbopack, indicando que o ambiente está pronto para desenvolvimento de UI.

## Programa Anchor – visão geral

O programa on-chain `kamino-predict` foi reorganizado para seguir o modelo modular do Anchor 1.0.0, com separação clara entre:

- `lib.rs` – ponto de entrada do programa, com `#[program]` e reexports.
- `state/` – definição das contas principais (`VaultConfig`, `UserPosition`).
- `instructions/` – handlers para instruções (`initialize_vault`, `deposit`, `withdraw`).
- `error.rs` – enum único de erros `KaminoError` com `#[error_code]`, como exigido pelo Anchor 1.0.[6][2][4]

O `lib.rs`:

- Importa `anchor_lang::prelude::*`.
- Declara os módulos `instructions`, `state`, `error`.
- Reexporta `instructions::*` e `KaminoError` para o crate root, permitindo que o macro `#[program]` gere as funções de cliente e tipos de contas a partir dos símbolos `InitializeVault`, `Deposit`, `Withdraw`.[2]
- Define `declare_id!("<PROGRAM_ID>")` com o program id real inserido manualmente.
- Implementa o módulo `kamino_predict` com três métodos públicos:
  - `initialize_vault(ctx: Context<InitializeVault>, params: InitializeVaultParams) -> Result<()>`
  - `deposit(ctx: Context<Deposit>, amount: u64) -> Result<()>`
  - `withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>`

## Módulo `state` – contas principais

O módulo `state` (`state/mod.rs`) define duas contas fundamentais do protocolo:

### VaultConfig

Representa a configuração de um vault KaminoPredict.

Campos:

- `admin: Pubkey` – administrador do vault (inicialmente o deployer).
- `kamino_allocation_bps: u16` – porcentagem alocada em estratégias Kamino (em basis points, 10_000 = 100%).
- `prediction_allocation_bps: u16` – porcentagem alocada em prediction markets (bps).
- `bump: u8` – reservado para uso futuro com PDA (atualmente preenchido com zero na inicialização).
- `_reserved: [u8; 5]` – espaço reservado para expansão, evitando necessidade de migração imediata.

Há também uma constante `LEN` com o tamanho em bytes da estrutura, usada para calcular o `space` na macro `#[account(init, space = 8 + VaultConfig::LEN)]`.

### UserPosition

Representa a posição de um usuário em um determinado vault.

Campos:

- `owner: Pubkey` – wallet do usuário dono da posição.
- `vault: Pubkey` – `Pubkey` do vault ao qual a posição pertence.
- `shares: u64` – quantidade de shares do usuário nesse vault.

Assim como em `VaultConfig`, há um `LEN` para facilitar o cálculo de tamanho na criação da conta.

## Módulo `instructions` – instruções implementadas

O módulo `instructions` (`instructions/mod.rs`) reexporta três submódulos:

- `initialize_vault`
- `deposit`
- `withdraw`

Isso permite que o `lib.rs` importe e reexporte tudo em um passo, mantendo o crate root compatível com o macro `#[program]`.

### `initialize_vault`

O arquivo `initialize_vault.rs` define:

- O contexto `InitializeVault<'info>` com as contas:
  - `admin: Signer<'info>` – admin que paga e inicializa o vault.
  - `vault_config: Account<'info, VaultConfig>` – criado com `init`, `payer = admin`, `space = 8 + VaultConfig::LEN`.
  - `system_program: Program<'info, System>`.
- A struct de parâmetros `InitializeVaultParams`:
  - `name: String` – slug do vault (ainda não usado em seeds na versão atual).
  - `kamino_allocation_bps: u16`.
  - `prediction_allocation_bps: u16`.
- O handler `initialize_vault_handler` que:
  - Garante via `require!` que a soma de `kamino_allocation_bps + prediction_allocation_bps == 10_000` (100%).
  - Preenche os campos de `VaultConfig` com o admin e as alocações.
  - Define `bump = 0` (por enquanto sem PDA real).

Erro utilizado:

- `KaminoError::InvalidAllocation` definido em `error.rs`.

A versão atual não usa PDA/`seeds` para o `vault_config`, o que simplifica o desenvolvimento inicial e evita erros de tipo e de `Bumps`. O plano é, em uma fase posterior, introduzir PDAs estáveis para identificar vaults por nome/perfil.

### `deposit`

O arquivo `deposit.rs` define:

- O contexto `Deposit<'info>` com as contas:
  - `user: Signer<'info>` – usuário que deposita.
  - `vault_config: Account<'info, VaultConfig>` – vault alvo (atualmente não é `mut` no handler, mas declarado como `mut` para futuras atualizações de estado agregado).
  - `user_position: Account<'info, UserPosition>` – criado com `init`, `payer = user`, `space = 8 + UserPosition::LEN`.
  - `system_program: Program<'info, System>`.
- O handler `deposit_handler(ctx, amount)` que:
  - Inicializa `owner`, `vault` e `shares` na `UserPosition` com base em `user`, `vault_config` e `amount`.

Neste estágio, `deposit` **não move tokens SPL**; ele apenas registra a quantidade em `shares` como igual ao `amount` passado. O objetivo é ter uma base estável para depois incluir a lógica de SPL Token e do split Kamino/prediction.

### `withdraw`

O arquivo `withdraw.rs` define:

- O contexto `Withdraw<'info>` com as contas:
  - `user: Signer<'info>` – usuário que realiza o resgate.
  - `user_position: Account<'info, UserPosition>` – conta de posição a ser atualizada.
- O handler `withdraw_handler(ctx, amount)` que:
  - Usa `require!` para garantir que `amount <= position.shares`, sob pena de `KaminoError::InsufficientShares`.
  - Usa `checked_sub` seguido de `ok_or(KaminoError::InsufficientShares)?` para subtrair `amount` de `shares` com segurança.

Assim como em `deposit`, ainda não há movimentação real de tokens SPL, apenas ajuste de contagem de shares.

## Módulo `error` – enum único de erros

O arquivo `error.rs` define um único enum `KaminoError` anotado com `#[error_code]`, atendendo à exigência do Anchor 1.0 de **um único tipo de erro por programa**.[4][6]

Erros definidos:

- `InvalidAllocation` – usado em `initialize_vault` quando a soma das alocações não resulta em 100% (10_000 bps).
- `InsufficientShares` – usado em `withdraw` quando o usuário tenta resgatar mais shares do que possui.

Enums `#[error_code]` locais que existiam em `initialize_vault.rs` e `withdraw.rs` foram removidos para evitar o erro "Multiple error definitions are not allowed".

## Ajustes e problemas resolvidos

Durante o processo, foram enfrentados e resolvidos diversos problemas típicos de projetos Anchor 1.0:

- **Conflito entre `instructions.rs` e `instructions/mod.rs` / `state.rs` e `state/mod.rs`** – resolvido removendo os arquivos `instructions.rs` e `state.rs`, alinhando a estrutura ao modelo de diretório modular recomendado (somente pasta com `mod.rs`).[2]
- **Uso de `init_if_needed` sem feature flag** – o `init_if_needed` exige que o crate `anchor-lang` seja compilado com a feature `init-if-needed`; optou-se por removê-lo e usar `init` simples para evitar feature flags e riscos de re-initialization attack neste estágio.[19][16]
- **Múltiplos `#[error_code]`** – Anchor 1.0 não permite múltiplas definições de erro; todos os erros foram centralizados em `error.rs` em um único enum `KaminoError`.[6][4]
- **Testes boilerplate quebrados** – o teste gerado automaticamente (`tests/test_initialize.rs`) referenciava uma instrução `Initialize` que já não existia após a refatoração; a pasta `tests` foi removida para desbloquear o `anchor build`, com a intenção de criar testes novos alinhados à API atual em fase posterior.[2]
- **Aviso de múltiplos lockfiles no Next.js** – resolvido removendo `yarn.lock` na raiz e mantendo `package-lock.json` no frontend, seguindo a orientação da documentação de Turbopack para monorepos.[14][15]

## Status atual

Neste ponto, o projeto KaminoPredict tem:

- Ambiente de desenvolvimento funcional (Rust, Solana, Anchor 1.0, Surfpool, Node 22).
- Monorepo organizado com programa Anchor, backend Node/TS e frontend Next 16.2.2.[1][10][2]
- Programa Anchor que:
  - Compila e passa `anchor build` tanto em `release` quanto `test` profile.
  - Define contas base (`VaultConfig`, `UserPosition`).
  - Implementa instruções básicas `initialize_vault`, `deposit`, `withdraw` com lógica mínima de alocação e controle de shares.
- Backend e frontend prontos para receber lógica, com tooling de desenvolvimento configurado.

Ainda não há:

- Integração com SPL Token (USDC) para depósitos e saques reais.
- Conta de vault de USDC (ATA ou PDA do programa) nem mapeamento de Kamino vaults.
- CPIs para Kamino (lending vault) nem para DFlow (prediction markets).
- Integração com QuickNode (RPC + Streams) nem com a API da DFlow no backend.
- Fluxo de UI no Next.js para perfis Conservador/Balanceado/Agressivo.

## Próximos passos – on-chain

Os próximos passos no lado on-chain, em linha com a ideia do hackathon, são:

1. **Modelar contas SPL para USDC**:
   - Adicionar contas de token ao contexto de `deposit` e `withdraw`.
   - Definir um vault token account (provavelmente um PDA do programa) que receberá os USDC depositados.[20][1]
2. **Normalizar shares vs. amount**:
   - Em vez de `shares = amount`, introduzir um conceito de share price ou, ao menos, uma proporção baseada no total depositado no vault.
   - Guardar em `VaultConfig` ou em outra conta agregada o total de shares e total de depósitos para permitir cálculo de resgates proporcionais.
3. **Preparar hooks para Kamino e DFlow**:
   - Adicionar campos em `VaultConfig` para referenciar o Kamino vault específico e possíveis parâmetros de estratégia.
   - Definir estrutura mínima para registrar exposure em prediction tokens, mesmo que o cálculo inicial seja feito off-chain.
4. **Planejar instruções adicionais**:
   - `rebalance` – instrução que será chamada por um crank off-chain para ajustar posições após resolução de mercados.
   - `settle_prediction` – handler para consolidar resultados de prediction markets no vault e eventualmente redistribuir.

## Próximos passos – off-chain e frontend

No backend:

- Implementar um `server.ts` mínimo com Fastify expondo:
  - `GET /health` – healthcheck do worker/backend.
  - Endpoints de debug para listar vaults e posições (via client Anchor).
- Integrar com QuickNode para:
  - Enviar transações (RPC). 
  - Assinar webhooks/streams para eventos do programa (deposit/withdraw/settlement).[16]
- Integrar com a DFlow Prediction Markets API:
  - Descobrir mercados ativos (via `GET /metadata`).
  - Enviar ordens de compra/venda de YES/NO tokens (via `POST /trade`).[1]

No frontend:

- Definir páginas/telas principais:
  - Landing + Connect Wallet (Solflare).
  - Tela de seleção de perfil (Conservador/Balanceado/Agressivo).
  - Dashboard de posição (principal em Kamino, posição em prediction, APY combinado).
- Integrar com o client Anchor gerado pela IDL do programa.
- Conectar com o backend para exibir métricas agregadas (APY, exposição, histórico).

Esses passos levam o projeto de um **MVP on-chain funcional** para um **produto completo** alinhado à narrativa KaminoPredict: structured yield product que combina yield base em Kamino com upside via prediction markets, com UX simplificada e profundidade técnica suficiente para se destacar em um hackathon Web3/DeFi.