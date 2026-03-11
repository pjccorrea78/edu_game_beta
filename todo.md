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

## Redesenho do Mapa 3D - Estilo Roblox com Movimento

- [x] Implementar sistema de movimento do avatar (WASD/setas, câmera terceira pessoa)
- [x] Criar sistema de colisão e detecção de proximidade com prédios
- [x] Implementar menu flutuante com acesso via tecla (ESC/M) e botão
- [x] Testar fluxo completo: movimento → aproximação → entrada no prédio
- [x] Restaurar usabilidade mantendo visual 3D imersivo

## Restauração do Menu 2D Completo no Menu 3D

- [x] Adicionar botão "Meu Material" (Study) ao menu flutuante
- [x] Adicionar botão "Painel do Professor" (Teacher) ao menu flutuante
- [x] Adicionar botão "Conquistas" (Achievements) ao menu flutuante
- [x] Adicionar botão "Modo História" (Story) ao menu flutuante
- [x] Adicionar botão "Notificações" (Notifications) ao menu flutuante
- [x] Adicionar botão "Avatar IA" (Avatar AI) ao menu flutuante
- [x] Adicionar botão "Prédio Personalizado" (School) ao menu flutuante
- [x] Habilitar funcionalidades: Desafio Diário, Ranking, Duelos
- [x] Integrar todas as telas de navegação com o novo menu 3D
- [x] Testar fluxo completo: mapa → menu → todas as funcionalidades

## Suporte Mobile - Joystick Virtual

- [x] Implementar joystick virtual no canto inferior esquerdo
- [x] Adicionar feedback visual do joystick (círculo base + controle)
- [x] Implementar detecção de toque para movimento contínuo
- [x] Adicionar botão flutuante "Menu" para toque
- [ ] Testar em dispositivos móveis (iOS e Android)
- [ ] Otimizar tamanho dos controles para diferentes telas

## Redesenho Cidade 3D Estilo Roblox

- [x] Criar chão com asfalto cinza (ruas) e grama verde (quadras)
- [x] Adicionar calçadas (faixas brancas/cinza entre rua e prédio)
- [x] Criar grid de ruas (horizontal e vertical) formando quartéirões
- [x] Construir prédios com fachadas coloridas por disciplina (janelas, portas, placa com nome)
- [x] Adicionar elementos urbanos: árvores, postes, bancos, faixas de pedestres
- [x] Implementar avatar humanóide animado: cabeça, tronco, braços, pernas
- [x] Animação de caminhada: braços e pernas se movendo ao andar
- [x] Câmera terceira pessoa atrás e acima do avatar
- [x] Sistema de colisão com prédios (não atravessa paredes)
- [x] Detecção de porta do prédio para entrar
- [x] Joystick mobile funcional com movimento suave
- [x] Iluminação ambiente para simular dia

## Bugs Mobile iPhone

- [x] Joystick não move o personagem (delta não chega ao loop de animação)
- [x] Menu duplicado: aparece tanto no topo quanto na base da tela
- [x] Garantir que apenas 1 botão de menu apareça em mobile

## Auditoria Completa do Jogo

- [ ] Diagnosticar erros no console (browser e servidor)
- [ ] Corrigir carregamento eterno de questões (Artes e outras matérias)
- [ ] Testar todos os 8 prédios/matérias
- [ ] Corrigir erros de tRPC/LLM nas procedures de quiz
- [ ] Verificar e corrigir todas as telas do menu (Loja, Progresso, etc.)
- [ ] Garantir que o fluxo completo funciona: login → mapa → prédio → quiz → pontos

## Auditoria Completa do Jogo (Mar 2026)

- [x] Identificar todas as matérias sem questões no banco (Arte, Ed. Física, Ensino Religioso)
- [x] Corrigir carregamento eterno de questões — gerar via LLM automaticamente quando banco vazio
- [x] Adicionar tela de erro amigável no QuizScreen (em vez de loading eterno)
- [x] Corrigir erro strokeDashoffset undefined no resultado do quiz
- [x] Corrigir teste unitário que falhava por timeout (mock invokeLLM)
- [x] Testar todas as 8 matérias/prédios — 10 questões disponíveis para cada

## Dificuldade Adaptativa

- [x] Router: quiz.getAdaptiveDifficulty — calcula dificuldade com base no histórico de desempenho por disciplina
- [x] Lógica: easy se acerto < 50%, medium se 50–79%, hard se >= 80%
- [x] Passar dificuldade calculada automaticamente ao getQuestions no frontend
- [x] Garantir questões de cada dificuldade no banco (gerar via LLM se faltar)
- [x] Indicador visual de dificuldade no HUD do quiz (estrelas: 1=fácil, 2=médio, 3=difícil)
- [x] Mensagem motivacional ao subir de dificuldade ("Você evoluiu! Agora é difícil 🔥")
- [x] Testes vitest para a lógica adaptativa

## 7 Melhorias de Negócio (Mar 2026)

- [x] Schema: adicionar campos age (int), grade (varchar), gender (enum masculino/feminino) na tabela players
- [x] Migration SQL aplicada
- [x] Onboarding: etapa de seleção de gênero (menino/menina) com avatar preview
- [x] Onboarding: campo de idade obrigatório
- [x] Onboarding: campo de série BNCC opcional (1º ao 9º ano Ensino Fundamental)
- [x] Lógica BNCC: calcular série pela idade se não informada (6a=1º, 7a=2º, ..., 14a=9º)
- [x] Quiz: gerar questões direcionadas à série do aluno (prompt LLM com contexto da série)
- [x] Renomear "Prédio Personalizado" → "Minha Escola" em toda a UI
- [x] Fluxo upload de material: verificar se aluno criou escola antes de permitir upload
- [x] Tela StudyMaterial: redirecionar para criar escola se schoolName estiver vazio
- [x] Avatar IA: mover para dentro do menu Avatar (não mais item separado no menu principal)
- [x] Avatar: seleção de gênero com cabelos, roupas e acessórios masculinos e femininos
- [x] Avatar masculino: cabelos curto/topete/moicano, roupas camiseta/camisa/moletom
- [x] Avatar feminino: cabelos comprido/trança/coque, roupas vestido/blusa/saia

## 5 Correções Críticas (Mar 2026)

- [ ] Remover "Meu Material" do menu principal (mover para dentro da escola)
- [ ] Limpar base de jogadores (DELETE * FROM players)
- [ ] Adicionar validação: nickname deve ser único na tabela players
- [ ] Corrigir Modo História: timeout de geração de perguntas muito curto
- [ ] Sincronizar avatar do mapa com personalização (cores, gênero, cabelo, direção)
- [ ] Avatar no mapa não deve andar de costas (virar para frente ao se mover)
- [ ] Adicionar imagens às questões (campo imageUrl no schema questions)
- [ ] LLM: gerar URL de imagem relevante para cada questão


## 5 Correções Críticas (Mar 2026) - CONCLUÍDAS

- [x] Remover "Meu Material" do menu principal
- [x] Limpar base de jogadores
- [x] Adicionar validação de nickname único
- [x] Corrigir Modo História (gerar perguntas via LLM com procedure missions.generateQuiz)
- [x] Sincronizar avatar do mapa com personalização (cores, gênero, cabelo)
- [x] Corrigir rotação do avatar para andar para frente
- [x] Adicionar cabelo ao avatar 3D
