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
