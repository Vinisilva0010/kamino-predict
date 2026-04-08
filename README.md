PASSO 1 — RECONHECIMENTO DE TERRENO
O contexto real desse hackathon:
Esta não é uma trilha do Colosseum principal. É um side track da Eitherway rodando dentro do Frontier (6 Abr – 11 Mai 2026). Prêmio: $20K total ($8K Grand Prize + $3K por trilha de parceiro). O juiz-critério mais pesado é longevidade — eles querem dApps que ainda existam 30 dias depois da submissão, com usuários orgânicos e atividade on-chain mensurável.
O que os projetos fracos fazem nesse tipo de trilha:

Dashboard de portfólio genérico ("conecte sua wallet e veja seus tokens")
Wrapper fino em cima de Kamino sem lógica própria
Interface de swap que usa DFlow só pra conectar, sem explorar a infra

O que os projetos vencedores têm em comum (baseado nos Cypherpunk winners e padrões Colosseum):

Resolvem um problema específico e doloroso para um usuário real
A integração com o parceiro é a espinha dorsal, não um plugin
Mostram métricas de uso reais na submissão

As brechas de mercado que identifiquei:
DFlow recentemente lançou a Prediction Markets API, a primeira camada de tokenização trazendo os mercados da Kalshi para Solana como SPL tokens nativos — com cobertura de 100% dos mercados e composabilidade total. Solana A Kalshi está bancando o ecossistema com um grants program de $2M para builders que construírem em cima disso, e DFlow já tem mais de 100 integrações enfileiradas. Solana Compass
Isso é a brecha central: tokens de prediction market são SPL tokens composáveis, mas ninguém ainda os usou como colateral para estratégias de yield no Kamino. Os dois parceiros juntos — DFlow + Kamino — criam um espaço virgem.
O vault layer do Kamino já detém ~$593M, com usuários buscando estratégias passivas de stablecoin, Medium mas a composabilidade com prediction tokens está completamente inexplorada.

PASSO 2 — A IDEIA "10x"
KaminoPredict: O Motor de Yield sobre Mercados Preditivos
O conceito em uma frase: Uma plataforma onde usuários depositam USDC, o protocolo aloca automaticamente parte em vaults conservadores do Kamino (yield base garantido) e parte em posições de prediction markets da Kalshi via DFlow — criando um "structured yield product" com proteção de capital e upside de predição.
Por que isso é 10x e não projeto de faculdade:
É a primeira composição real entre prediction market tokens e DeFi lending no Solana. O usuário não precisa entender nada de prediction markets — ele só decide o percentual de "risco" (10%, 20%, 30%) e o protocolo faz tudo. A narrativa é: "Earn mais que stablecoins sem perder o principal".
Fit com os critérios do hackathon:
CritérioPor que ganhaUtilidade real (30%)Resolve a dor do DeFi yield user: rendimentos de stablecoin estão em 4-5% no mercado aberto, vaults Kamino chegam a 10-12%. Com prediction tokens no mix, o upside pode ser substancialmente maior num bom cenário.Qualidade do produto (30%)UX minimalista: 3 telas. Depósito, escolha de perfil (Conservador/Balanceado/Agressivo), dashboard de posição. Sem complexidade exposta ao usuário.Profundidade de integração (25%)Kamino como motor de yield base. DFlow como motor de alocação em prediction tokens. QuickNode para dados em tempo real do portfólio. Multi-parceiro = elegível para Grand Prize + múltiplas trilhas.Potencial de adoção (15%)Usuário-alvo: degens que já usam Kamino mas querem mais upside sem gerenciar posições manualmente. Esse usuário existe e já está na plataforma.
Usuário real e dor concreta:
Usuário: LP/yield farmer no Kamino que está cansado de 10% APY e quer mais, mas não quer estudar prediction markets, monitorar mercados ou perder o principal.
Dor: "Quero yield acima da média, mas não quero acordar de manhã com meu USDC zerado."
Solução: Structured product on-chain. Principal protegido pelo vault Kamino. Upside pelo prediction market. Rebalanceamento automático.
Diferencial vs. projetos comuns que os jurados já viram:
Os jurados vão ver 50 dashboards de Kamino e 20 wrappers de swap com DFlow. Nenhum vai combinar os dois de forma estruturada para criar um produto financeiro novo. Este projeto responde à pergunta que o DFlow deixou em aberto: "O que você faz quando um prediction token vira SPL composável?"

PASSO 3 — PLANO DE GUERRA
Arquitetura do MVP
O que fica ON-CHAIN
Programa Anchor: kamino-predict

initialize_vault: cria um vault do protocolo com parâmetros de alocação (ex: 80% Kamino, 20% prediction)
deposit: usuário deposita USDC → protocolo divide e executa as duas alocações
rebalance: permissionless crank que pode ser chamado por qualquer um (ou por nosso bot) para rebalancear quando mercados se resolvem
withdraw: queima shares, resgate proporcional de capital + yields
settle_prediction: processa os tokens de prediction market resolvidos e retorna para o vault

Contas on-chain:

VaultConfig: parâmetros do vault (allocation_pct, min_prediction_odds, accepted_markets)
UserPosition: shares do usuário, timestamp, allocation snapshot
MarketRegistry: lista de mercados Kalshi ativos aprovados para o vault

O que fica OFF-CHAIN
Backend TypeScript (Node.js + Fastify):

Crank Worker: roda a cada X minutos, chama rebalance quando há markets resolvidos
Market Selector: usa a DFlow Prediction Markets API para filtrar mercados com alta liquidez e probabilidade não trivial (evita mercados já precificados a 95%+)
Position Tracker: indexa positions via QuickNode Streams (webhooks on-chain)
APY Calculator: combina yield real do Kamino + P&L dos prediction tokens para mostrar APY ao vivo

QuickNode:

RPC principal para todas as transações
QuickNode Streams para webhooks de eventos do programa (deposits, withdrawals, settlements)
Dados em tempo real para o dashboard

Kamino SDK (TypeScript):

Deposit automático na earn vault de USDC (conservadora — Steakhouse ou Allez)
Leitura de kToken price para calcular valor atual da posição de lending

DFlow API:

GET /metadata para descobrir mercados ativos
POST /trade para comprar YES/NO tokens para o vault
Webhook de resolução para disparar o crank de settlement

Fluxo do Usuário (Zero ao First Action)
1. Landing page → "Connect Wallet" (Solflare — isso cobre a trilha Solflare também)
2. Usuário vê 3 cards: Conservador (90/10), Balanceado (80/20), Agressivo (70/30)
3. Cada card mostra: APY estimado histórico, capital em risco, mercados ativos
4. Usuário clica "Deposit" → digita valor em USDC → aprova transação no Solflare
5. Transação on-chain: split → 80% vai para Kamino Earn Vault → 20% compra YES tokens selecionados via DFlow
6. Dashboard: mostra posição ao vivo — principal no Kamino, tokens de prediction, APY agregado
7. Quando um prediction market resolve: crank automático → winnings voltam para o vault → re-alocados automaticamente
Fluxo das Transações On-Chain
deposit(amount: u64, profile: VaultProfile)
  ├─ Transfer USDC from user → vault_token_account
  ├─ CPI → Kamino Earn Vault deposit (amount * allocation_pct)
  ├─ CPI → DFlow Trade API → buy YES tokens (amount * prediction_pct)
  ├─ Mint vault_shares to user
  └─ Update UserPosition account

settle_prediction(market_id: Pubkey)
  ├─ Read resolved token value (YES won = 1 USDC, NO won = 0)
  ├─ Redeem winning tokens via DFlow CPI
  ├─ USDC returned → re-deposit into Kamino vault
  └─ Update VaultConfig with new allocation stats

Stack Técnico Completo
CamadaTecnologiaSmart ContractRust + AnchorFrontendNext.js 14 + TypeScript + TailwindWalletSolflare Wallet Adapter (cobre trilha Solflare)LendingKamino TypeScript SDK + klend-sdkPrediction MarketsDFlow Prediction Markets APIRPC + StreamsQuickNode (cobre trilha QuickNode)Backend/CrankNode.js + Fastify, deployado em Fly.io ou RailwayStoragePostgreSQL (posições históricas, APY snapshot)DeployMainnet Solana via Eitherway
Resultado: você cobre 3 trilhas de parceiro (Kamino + DFlow + QuickNode) + Solflare pela wallet. Elegível para Grand Prize + todas as trilhas.

Plano de Go-To-Market do Hackathon
Vídeo de Pitch (2-3 min — roteiro)
0:00–0:20 — O gancho:
"Você tem USDC no Kamino ganhando 10% APY. Legal. Mas e se você pudesse ganhar 25% sem colocar o principal em risco? Esse é o KaminoPredict."
0:20–1:00 — Demo ao vivo:
Mostra o fluxo completo: conecta Solflare → seleciona "Balanceado" → faz deposit de USDC na devnet → mostra o split acontecendo on-chain → mostra kTokens no Kamino + YES tokens do DFlow na mesma tela
1:00–1:40 — A arquitetura em 30 segundos:
Diagrama simples mostrando: USDC → [80% Kamino Earn Vault | 20% DFlow Prediction Tokens] → APY combinado → rebalanceamento automático
1:40–2:20 — Métricas:
Mostra simulação histórica: se o protocolo tivesse estado ativo nos últimos 3 meses, qual seria o APY combinado vs. only-Kamino. Usa dados reais do Kamino (APY histórico público) + win rate de mercados Kalshi bem selecionados.
2:20–3:00 — Vida depois do hackathon:
"Esse produto não morre no dia 27. Já temos [X] usuários na devnet. Estamos aplicando para o Kalshi grants program ($2M em aberto). O próximo passo é abrir Creator Vaults — qualquer curador pode criar sua própria estratégia de prediction market."
Como mostrar impacto rápido

Métricas simuladas honestas: Usar APY histórico real do Kamino (público no Defillama) + histórico de acerto de mercados Kalshi com alta liquidez. Não inventar números — calcular com dados reais.
Usuários de teste: Coloca o dApp em devnet semanas antes e convida 5-10 pessoas da comunidade Superteam Brasil para testar. Screenshots de wallets de outras pessoas usando = prova social.
Atividade on-chain mensurável: O crank rodando automaticamente gera transações regulares mesmo sem novos depósitos. Isso aparece no explorer e prova que o protocolo está vivo.

Posicionamento pós-hackathon

Kalshi $2M Grants Program — Você está usando a DFlow API deles, já é um projeto "Powered by Kalshi". Aplicar imediatamente após o hackathon.
Colosseum Accelerator — O projeto se qualifica para o Frontier principal também. Submeter em paralelo.
Creator Vaults (v2): Abrir para que terceiros criem estratégias de prediction market com diferentes market filters — isto transforma o protocolo num marketplace de estratégias.
Narrativa de RWA: Kamino já está fazendo RWA looping com bonds tokenizados. Prediction markets da Kalshi são mercados regulados pelo CFTC — isso é RWA também. A narrativa de "RWA yield product" está quente em 2026.


Veredicto Final
Esta é a única ideia nessa trilha que:

Cria um produto financeiro novo que não existe no Solana hoje
Cobre 3-4 parceiros profundamente sem forçar a barra
Tem usuário real e dor real — não é um experimento de dev
Vai continuar gerando atividade on-chain depois da submissão (crank automático + mercados se resolvendo)
Tem funding path claro fora do hackathon (Kalshi grants, Colosseum accelerator)
