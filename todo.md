# EduGame Beta - TODO

## Banco de Dados & Backend
- [x] Schema: tabelas players, quiz_sessions, questions, equipment_items, player_equipment, notifications
- [x] Seed: banco de perguntas inicial (10 por disciplina x 5 disciplinas = 50 perguntas)
- [x] Router: player (criar/buscar por session_id anônimo)
- [x] Router: quiz (iniciar sessão, responder pergunta, finalizar)
- [x] Router: leaderboard / progresso
- [x] Router: loja (listar itens, comprar equipamento)
- [x] Router: avatar (salvar customização)
- [x] Router: LLM (gerar novas perguntas adaptativas)
- [x] Router: notificações (enviar ao responsável em marcos)

## Frontend - Mapa
- [x] Mapa interativo 3D estilo Roblox com perspectiva isométrica
- [x] 6 prédios clicáveis (Matemática, Português, Geografia, História, Ciências + Hub central)
- [x] Animações de hover e entrada nos prédios
- [x] Avatar do jogador visível no mapa

## Frontend - Quiz
- [x] Tela de quiz com 10 perguntas de múltipla escolha
- [x] Feedback imediato (acerto = +10pts verde, erro = -5pts vermelho)
- [x] Barra de progresso das perguntas
- [x] Tela de resultado final com pontuação
- [x] Geração de perguntas via LLM com adaptação de dificuldade

## Frontend - Avatar & Loja
- [x] Avatar blocky estilo Roblox/Minecraft personalizável
- [x] Loja com chapéus, roupas, acessórios, cores
- [x] Sistema de desbloqueio por pontos
- [x] Preview do avatar com equipamentos

## Frontend - Painel de Progresso
- [x] Pontuação total exibida no HUD
- [x] Disciplinas completadas com porcentagem
- [x] Equipamentos desbloqueados
- [x] Histórico de sessões de quiz

## Frontend - Notificações
- [x] Formulário para e-mail do responsável
- [x] Notificação: 100% em disciplina
- [x] Notificação: 1000 pontos acumulados
- [x] Notificação: todos equipamentos desbloqueados

## Visual & UX
- [x] Paleta vibrante infantil (roxo, azul, verde, amarelo, laranja)
- [x] Tipografia amigável (Fredoka One / Nunito)
- [x] Animações lúdicas (bounce, pulse, confetti)
- [x] Interface responsiva mobile-first
- [x] Tema claro elegante com elementos gamificados

## Testes
- [x] Testes vitest para routers principais
- [x] Validação de fluxo quiz completo

## Material de Estudo Personalizado
- [x] Schema: tabela study_materials (id, playerId, title, content, fileUrl, discipline, status, createdAt)
- [x] Schema: tabela custom_quiz_questions (id, materialId, questionText, options, correctOption, explanation)
- [x] Migration SQL aplicada
- [x] Router: uploadMaterial (salvar texto/arquivo, disparar análise LLM)
- [x] Router: analyzeMaterial (LLM analisa conteúdo e gera 10 perguntas estruturadas)
- [x] Router: listMaterials (listar materiais enviados pelo aluno)
- [x] Router: getCustomQuiz (buscar perguntas geradas para um material)
- [x] Tela StudyMaterial: upload de texto com análise LLM
- [x] Indicador de progresso durante análise LLM (loading animado)
- [x] Exibição das perguntas geradas com opção de iniciar quiz
- [x] Quiz personalizado usando perguntas do material (mesmo fluxo do QuizScreen)
- [x] Botão "Meu Material" acessível no mapa e no menu de configurações
- [x] Testes vitest para router de material de estudo

## Prédio Personalizado da Escola

- [x] Campo schoolName adicionado à tabela players
- [x] Migration SQL aplicada
- [x] Router player.updateSchoolName implementado
- [x] Componente SchoolBuilding.tsx criado com fachada 3D do prédio
- [x] Prédio personalizado visível no mapa (posição central, estilo roxo/violeta com estrela)
- [x] Nome do prédio exibido no mapa e na fachada (placa dourada)
- [x] Edição do nome do prédio diretamente na tela SchoolBuilding
- [x] Salas de estudo em grid 2x2 com visual por disciplina
- [x] Status badge (pronto, analisando, erro) por sala
- [x] Botão "Nova Sala" para adicionar material
- [x] Fluxo completo: mapa → prédio → sala → quiz personalizado
- [x] Navegação integrada no App.tsx com nova tela "school"
- [x] 17 testes passando

## Upload de PDF

- [x] Instalar pdf-parse para extração de texto no servidor
- [x] Endpoint tRPC: submitPdf (recebe base64, extrai texto, salva material)
- [x] Frontend: toggle texto/PDF na tela StudyMaterial
- [x] Preview do nome do arquivo selecionado
- [x] Indicador de progresso durante upload e extração

## Ranking do Prédio

- [x] Schema: tabela custom_quiz_sessions (id, playerId, materialId, score, correctAnswers, completedAt)
- [x] Migration SQL aplicada
- [x] Router: salvar resultado de quiz personalizado
- [x] Router: buscar ranking por materialId (top 10)
- [x] Tela SchoolBuilding: botão troféu em cada sala pronta
- [x] Modal RankingModal com medalhas (ouro, prata, bronze) para top 3

## Código de Turma

- [x] Schema: tabela class_codes (id, code, ownerId, materialId, title, createdAt, expiresAt)
- [x] Migration SQL aplicada
- [x] Router: gerar código de turma (6 caracteres únicos)
- [x] Router: entrar em turma por código (importa material para o aluno)
- [x] Botão "Turma" no SchoolBuilding com modal ClassCodeModal
- [x] Fluxo gerar código + copiar + entrar com código

## Painel do Professor

- [x] Router: teacher.getTurmaProgress (recebe código, retorna progresso de todos os alunos)
- [x] Router: teacher.getTurmaStats (médias, top alunos, disciplinas mais acessadas)
- [x] Tela TeacherPanel.tsx com acesso via código de turma
- [x] Tabela de alunos com pontuação, quizzes completados, % de acerto
- [x] Gráfico de desempenho por disciplina
- [x] Botão "Painel do Professor" acessível no mapa

## Sistema de Vidas

- [x] Estado de vidas (3 vidas) no QuizScreen
- [x] Animação de perda de vida (coração quebrando)
- [x] Game over antecipado quando vidas chegam a zero
- [x] Tela de game over com pontuação parcial e opção de reiniciar
- [x] HUD de vidas visível durante o quiz

## Conquistas e Badges

- [x] Schema: tabela achievements (id, key, title, description, icon, condition)
- [x] Schema: tabela player_achievements (id, playerId, achievementKey, unlockedAt)
- [x] Migration SQL aplicada
- [x] Seed: 12 conquistas iniciais (por disciplina, pontos, streaks, loja)
- [x] Router: achievements.list (listar conquistas com status desbloqueado)
- [x] Router: achievements.check (verificar e desbloquear conquistas após eventos)
- [x] Tela de conquistas no painel de progresso
- [x] Toast de celebração ao desbloquear conquista
- [x] Badge visual no avatar quando tem conquistas

## Desafio Diário

- [ ] Schema: tabela daily_challenges (id, date, questionId, discipline, bonusMultiplier)
- [ ] Schema: tabela daily_challenge_attempts (id, playerId, challengeId, isCorrect, pointsEarned, attemptedAt)
- [ ] Migration SQL aplicada
- [ ] Router: daily.getToday (busca ou gera desafio do dia via LLM)
- [ ] Router: daily.submit (responde desafio, aplica bônus 2x, salva tentativa)
- [ ] Tela DailyChallenge.tsx com countdown até meia-noite
- [ ] Badge "Hoje" no mapa indicando desafio disponível
- [ ] Streak de dias consecutivos com bônus crescente

## Ranking Global

- [ ] Router: leaderboard.global (top 10 jogadores por pontos totais)
- [ ] Router: leaderboard.myRank (posição do jogador atual)
- [ ] Tela GlobalRanking.tsx com pódio animado e lista completa
- [ ] Estrutura "Mural da Fama" visível no mapa como prédio especial
- [ ] Atualização em tempo real via polling

## Multiplayer Assíncrono

- [ ] Schema: tabela challenges (id, challengerId, challengedId, quizType, discipline, materialId, status, createdAt)
- [ ] Schema: tabela challenge_results (id, challengeId, playerId, score, correctAnswers, completedAt)
- [ ] Migration SQL aplicada
- [ ] Router: challenge.create (criar desafio com código único)
- [ ] Router: challenge.accept (aceitar desafio pelo código)
- [ ] Router: challenge.submit (enviar resultado do quiz)
- [ ] Router: challenge.getResult (comparar resultados dos dois jogadores)
- [ ] Tela ChallengeMode.tsx com fluxo criar/aceitar desafio
- [ ] Tela de resultado comparativo lado a lado
- [ ] Notificação quando oponente completa o desafio

## Notificações Push Web

- [ ] Service Worker (sw.js) com suporte a push notifications
- [ ] Endpoint: push.subscribe (salvar subscription do browser)
- [ ] Endpoint: push.sendDailyReminder (disparar push para todos os inscritos)
- [ ] Tela de opt-in para notificações no mapa
- [ ] Agendamento automático do lembrete diário

## Modo História com Missões

- [ ] Schema: tabela story_missions e player_missions
- [ ] Migration SQL aplicada
- [ ] Seed: 10 missões progressivas cobrindo todas as disciplinas
- [ ] Router: missions.list e missions.checkAndUnlock
- [ ] Tela StoryMode.tsx com mapa de missões visual e progressão
- [ ] Integração com quiz: missões desbloqueiam ao completar quizzes
- [ ] Botão "História" acessível no mapa

## Relatório Semanal para Pais

- [ ] Schema: tabela parent_reports
- [ ] Migration SQL aplicada
- [ ] Router: parentReport.setEmail e parentReport.generateReport
- [ ] Router: parentReport.sendReport (enviar e-mail via notifyOwner)
- [ ] Tela de configuração do e-mail do responsável
- [ ] Template do relatório semanal com estatísticas
- [ ] Agendamento automático semanal

## Personalização de Avatar com IA

- [ ] Router: avatar.generateFromDescription (LLM interpreta texto e retorna configuração JSON de avatar)
- [ ] Schema JSON de resposta: skinColor, hairColor, shirtColor, pantsColor, hatId, accessoryId, name
- [ ] Tela AvatarAI.tsx com campo de descrição livre e botão "Gerar com IA"
- [ ] Preview do avatar em tempo real com as cores/itens gerados pela IA
- [ ] Animação de loading mágica durante geração
- [ ] Botão "Aplicar ao meu avatar" para salvar o resultado
- [ ] Sugestões de descrição para inspirar o aluno (ex: "herói azul com espada")
- [ ] Histórico das últimas 3 gerações para comparar
- [ ] Integração ao App.tsx com navegação do mapa
- [ ] Testes vitest para o router de geração de avatar

## Geração de Imagem do Avatar

- [ ] Router: avatarAI.generateImage (LLM gera prompt artístico, IA cria imagem PNG)
- [ ] Salvar URL da imagem no banco (player.avatarImageUrl)
- [ ] Exibir foto de perfil no painel de progresso
- [ ] Exibir foto de perfil no HUD do quiz
- [ ] Botão "Gerar Foto" na tela AvatarAI com preview

## Compartilhamento de Avatar

- [ ] Gerar código único de compartilhamento (6 caracteres)
- [ ] Salvar link compartilhável com imagem do avatar
- [ ] Botão "Compartilhar" na tela AvatarAI
- [ ] Modal com link copiável e QR code
- [ ] Página pública para visualizar avatar compartilhado (/avatar/:shareCode)

## Autenticação com Google/E-mail

- [ ] Integrar Manus OAuth (já existe, melhorar UX)
- [ ] Adicionar opção de login com Google
- [ ] Adicionar opção de login com E-mail
- [ ] Salvar e-mail do responsável no banco (players.parentEmail)
- [ ] Tela de login/registro antes do welcome
- [ ] Persistência de sessão entre dispositivos
- [ ] Recuperação de conta por e-mail

## Sistema de Gênero no Avatar

- [ ] Schema: adicionar campo gender (masculino/feminino) na tabela players
- [ ] Cabelos masculinos: corte curto, topete, moicano, calvo
- [ ] Cabelos femininos: comprido, trança, coque, franja
- [ ] Roupas masculinas: camiseta, camisa, moletom, jaqueta
- [ ] Roupas femininas: vestido, blusa, saia, macacão
- [ ] Acessórios por gênero: óculos, lenço, pulseira, brinco
- [ ] Tela de seleção de gênero no onboarding
- [ ] BlockyAvatar renderiza diferentes silhuetas por gênero

## Mapa 3D Evoluído com Animações

- [ ] Usar Three.js para gráficos 3D avançados
- [ ] Prédios com texturas e sombras realistas
- [ ] Avatar do jogador animado caminhando no mapa
- [ ] Animação de entrada: avatar caminha até prédio e entra
- [ ] Efeitos de partículas (poeira, folhas caindo)
- [ ] Câmera isométrica suave com zoom
- [ ] Iluminação dinâmica (dia/noite)

## Faixas Etárias BNCC (1º ao 5º Ano)

- [ ] 1º ano (6-7 anos): Alfabetização, números até 10
- [ ] 2º ano (7-8 anos): Leitura, números até 100
- [ ] 3º ano (8-9 anos): Escrita, multiplicação e divisão
- [ ] 4º ano (9-10 anos): Frações, geometria
- [ ] 5º ano (10-11 anos): Números decimais, estatística
- [ ] Seleção de série no onboarding
- [ ] Perguntas adaptadas por série
- [ ] Prédios específicos por série

## Prédios das Disciplinas BNCC

- [ ] Língua Portuguesa (Literatura, Leitura, Escrita, Oralidade)
- [ ] Matemática (Números, Geometria, Álgebra, Estatística)
- [ ] Ciências (Vida, Matéria, Energia, Terra)
- [ ] Geografia (Espaço, Recursos, População, Cultura)
- [ ] História (Tempo, Sociedade, Identidade, Memória)
- [ ] Educação Física (Movimento, Saúde, Jogos)
- [ ] Arte (Artes Visuais, Música, Teatro, Dança)
- [ ] Ensino Religioso (Identidade, Alteridade, Cosmologias)
- [ ] Total: 8 prédios principais + 1 prédio personalizado do aluno
