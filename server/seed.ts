import { drizzle } from "drizzle-orm/mysql2";
import { questions, equipmentItems } from "../drizzle/schema";
import dotenv from "dotenv";
dotenv.config();

const db = drizzle(process.env.DATABASE_URL!);

const questionsData = [
  // ─── MATEMÁTICA ───────────────────────────────────────────────────────────
  { discipline: "matematica" as const, difficulty: "easy" as const, questionText: "Quanto é 7 + 8?", optionA: "13", optionB: "15", optionC: "14", optionD: "16", correctOption: "B" as const, explanation: "7 + 8 = 15" },
  { discipline: "matematica" as const, difficulty: "easy" as const, questionText: "Quanto é 12 × 3?", optionA: "36", optionB: "33", optionC: "39", optionD: "30", correctOption: "A" as const, explanation: "12 × 3 = 36" },
  { discipline: "matematica" as const, difficulty: "easy" as const, questionText: "Qual é a metade de 40?", optionA: "25", optionB: "15", optionC: "20", optionD: "30", correctOption: "C" as const, explanation: "40 ÷ 2 = 20" },
  { discipline: "matematica" as const, difficulty: "medium" as const, questionText: "Qual é o resultado de 5² (cinco ao quadrado)?", optionA: "10", optionB: "25", optionC: "15", optionD: "20", correctOption: "B" as const, explanation: "5² = 5 × 5 = 25" },
  { discipline: "matematica" as const, difficulty: "medium" as const, questionText: "Se uma pizza tem 8 fatias e você come 3, quantas fatias sobraram?", optionA: "4", optionB: "6", optionC: "5", optionD: "3", correctOption: "C" as const, explanation: "8 - 3 = 5 fatias" },
  { discipline: "matematica" as const, difficulty: "medium" as const, questionText: "Qual número está entre 15 e 17?", optionA: "14", optionB: "18", optionC: "16", optionD: "13", correctOption: "C" as const, explanation: "16 está entre 15 e 17" },
  { discipline: "matematica" as const, difficulty: "medium" as const, questionText: "Quanto é 100 ÷ 4?", optionA: "20", optionB: "30", optionC: "40", optionD: "25", correctOption: "D" as const, explanation: "100 ÷ 4 = 25" },
  { discipline: "matematica" as const, difficulty: "hard" as const, questionText: "Qual é a área de um quadrado com lado de 6 cm?", optionA: "24 cm²", optionB: "36 cm²", optionC: "12 cm²", optionD: "48 cm²", correctOption: "B" as const, explanation: "Área = lado² = 6² = 36 cm²" },
  { discipline: "matematica" as const, difficulty: "hard" as const, questionText: "Se Ana tem 3 vezes mais figurinhas que João, e João tem 12, quantas Ana tem?", optionA: "15", optionB: "24", optionC: "36", optionD: "30", correctOption: "C" as const, explanation: "3 × 12 = 36 figurinhas" },
  { discipline: "matematica" as const, difficulty: "hard" as const, questionText: "Qual fração representa metade de um quarto?", optionA: "1/6", optionB: "1/8", optionC: "1/4", optionD: "2/8", correctOption: "B" as const, explanation: "Metade de 1/4 = 1/8" },

  // ─── PORTUGUÊS ────────────────────────────────────────────────────────────
  { discipline: "portugues" as const, difficulty: "easy" as const, questionText: "Qual dessas palavras é um substantivo?", optionA: "Correr", optionB: "Bonito", optionC: "Casa", optionD: "Rápido", correctOption: "C" as const, explanation: "Casa é um substantivo (nome de coisa)" },
  { discipline: "portugues" as const, difficulty: "easy" as const, questionText: "Quantas vogais tem o alfabeto português?", optionA: "4", optionB: "5", optionC: "6", optionD: "7", correctOption: "B" as const, explanation: "As vogais são: A, E, I, O, U = 5 vogais" },
  { discipline: "portugues" as const, difficulty: "easy" as const, questionText: "Qual é o plural de 'pão'?", optionA: "Pãos", optionB: "Pões", optionC: "Pães", optionD: "Pãoes", correctOption: "C" as const, explanation: "O plural de pão é pães" },
  { discipline: "portugues" as const, difficulty: "medium" as const, questionText: "Qual dessas frases está na voz passiva?", optionA: "O gato comeu o peixe", optionB: "O peixe foi comido pelo gato", optionC: "O gato come peixe", optionD: "O gato vai comer", correctOption: "B" as const, explanation: "Voz passiva: o sujeito sofre a ação" },
  { discipline: "portugues" as const, difficulty: "medium" as const, questionText: "O que é um adjetivo?", optionA: "Nome de pessoa ou lugar", optionB: "Palavra que indica ação", optionC: "Palavra que qualifica o substantivo", optionD: "Palavra que liga frases", correctOption: "C" as const, explanation: "Adjetivo qualifica ou caracteriza o substantivo" },
  { discipline: "portugues" as const, difficulty: "medium" as const, questionText: "Qual é o sinônimo de 'feliz'?", optionA: "Triste", optionB: "Contente", optionC: "Bravo", optionD: "Cansado", correctOption: "B" as const, explanation: "Contente é sinônimo de feliz" },
  { discipline: "portugues" as const, difficulty: "medium" as const, questionText: "Qual é o antônimo de 'grande'?", optionA: "Alto", optionB: "Gordo", optionC: "Pequeno", optionD: "Largo", correctOption: "C" as const, explanation: "Pequeno é o antônimo (oposto) de grande" },
  { discipline: "portugues" as const, difficulty: "hard" as const, questionText: "Em 'O menino correu rapidamente', qual é o advérbio?", optionA: "O", optionB: "menino", optionC: "correu", optionD: "rapidamente", correctOption: "D" as const, explanation: "Rapidamente é advérbio de modo" },
  { discipline: "portugues" as const, difficulty: "hard" as const, questionText: "Qual figura de linguagem está em 'O tempo é dinheiro'?", optionA: "Metáfora", optionB: "Hipérbole", optionC: "Ironia", optionD: "Onomatopeia", correctOption: "A" as const, explanation: "Metáfora: comparação implícita entre dois elementos" },
  { discipline: "portugues" as const, difficulty: "hard" as const, questionText: "Qual é a sílaba tônica de 'telefone'?", optionA: "te", optionB: "le", optionC: "fo", optionD: "ne", correctOption: "C" as const, explanation: "te-le-FO-ne: a sílaba tônica é 'fo'" },

  // ─── GEOGRAFIA ────────────────────────────────────────────────────────────
  { discipline: "geografia" as const, difficulty: "easy" as const, questionText: "Qual é a capital do Brasil?", optionA: "São Paulo", optionB: "Rio de Janeiro", optionC: "Brasília", optionD: "Salvador", correctOption: "C" as const, explanation: "Brasília é a capital federal do Brasil desde 1960" },
  { discipline: "geografia" as const, difficulty: "easy" as const, questionText: "Quantos continentes existem no mundo?", optionA: "5", optionB: "6", optionC: "7", optionD: "8", correctOption: "C" as const, explanation: "Os 7 continentes: América, Europa, Ásia, África, Oceania, Antártida e América do Norte/Sul" },
  { discipline: "geografia" as const, difficulty: "easy" as const, questionText: "Qual é o maior oceano do mundo?", optionA: "Atlântico", optionB: "Índico", optionC: "Ártico", optionD: "Pacífico", correctOption: "D" as const, explanation: "O Oceano Pacífico é o maior e mais profundo do mundo" },
  { discipline: "geografia" as const, difficulty: "medium" as const, questionText: "Qual rio é o mais extenso do Brasil?", optionA: "Rio São Francisco", optionB: "Rio Amazonas", optionC: "Rio Paraná", optionD: "Rio Tocantins", correctOption: "B" as const, explanation: "O Rio Amazonas é o mais extenso do Brasil e do mundo" },
  { discipline: "geografia" as const, difficulty: "medium" as const, questionText: "Qual é o menor estado do Brasil em área?", optionA: "Alagoas", optionB: "Sergipe", optionC: "Rio de Janeiro", optionD: "Espírito Santo", correctOption: "B" as const, explanation: "Sergipe é o menor estado brasileiro em extensão territorial" },
  { discipline: "geografia" as const, difficulty: "medium" as const, questionText: "Em qual hemisfério o Brasil está localizado?", optionA: "Norte e Leste", optionB: "Sul e Oeste", optionC: "Norte/Sul e Oeste", optionD: "Sul e Leste", correctOption: "C" as const, explanation: "O Brasil está nos hemisférios Norte, Sul e Ocidental" },
  { discipline: "geografia" as const, difficulty: "medium" as const, questionText: "Qual é a maior floresta tropical do mundo?", optionA: "Floresta do Congo", optionB: "Floresta Amazônica", optionC: "Mata Atlântica", optionD: "Floresta de Bornéu", correctOption: "B" as const, explanation: "A Floresta Amazônica é a maior floresta tropical do planeta" },
  { discipline: "geografia" as const, difficulty: "hard" as const, questionText: "Qual linha imaginária divide a Terra em Norte e Sul?", optionA: "Trópico de Câncer", optionB: "Meridiano de Greenwich", optionC: "Equador", optionD: "Trópico de Capricórnio", correctOption: "C" as const, explanation: "O Equador divide a Terra nos hemisférios Norte e Sul" },
  { discipline: "geografia" as const, difficulty: "hard" as const, questionText: "Qual é o país mais populoso do mundo?", optionA: "Índia", optionB: "Estados Unidos", optionC: "China", optionD: "Indonésia", correctOption: "A" as const, explanation: "A Índia ultrapassou a China em 2023 como país mais populoso" },
  { discipline: "geografia" as const, difficulty: "hard" as const, questionText: "Qual bioma ocupa a maior parte do território brasileiro?", optionA: "Cerrado", optionB: "Caatinga", optionC: "Amazônia", optionD: "Mata Atlântica", correctOption: "C" as const, explanation: "A Amazônia ocupa cerca de 49% do território brasileiro" },

  // ─── HISTÓRIA ─────────────────────────────────────────────────────────────
  { discipline: "historia" as const, difficulty: "easy" as const, questionText: "Em que ano o Brasil foi descoberto pelos portugueses?", optionA: "1492", optionB: "1500", optionC: "1498", optionD: "1510", correctOption: "B" as const, explanation: "Pedro Álvares Cabral chegou ao Brasil em 22 de abril de 1500" },
  { discipline: "historia" as const, difficulty: "easy" as const, questionText: "Quem foi o primeiro presidente do Brasil?", optionA: "Getúlio Vargas", optionB: "Dom Pedro II", optionC: "Deodoro da Fonseca", optionD: "Floriano Peixoto", correctOption: "C" as const, explanation: "Marechal Deodoro da Fonseca foi o primeiro presidente do Brasil (1889)" },
  { discipline: "historia" as const, difficulty: "easy" as const, questionText: "Qual civilização construiu as pirâmides do Egito?", optionA: "Romanos", optionB: "Gregos", optionC: "Egípcios", optionD: "Maias", correctOption: "C" as const, explanation: "Os antigos egípcios construíram as pirâmides como túmulos para os faraós" },
  { discipline: "historia" as const, difficulty: "medium" as const, questionText: "Em que ano o Brasil se tornou independente de Portugal?", optionA: "1808", optionB: "1822", optionC: "1889", optionD: "1815", correctOption: "B" as const, explanation: "Dom Pedro I proclamou a Independência do Brasil em 7 de setembro de 1822" },
  { discipline: "historia" as const, difficulty: "medium" as const, questionText: "Qual foi o período da escravidão no Brasil?", optionA: "1500 a 1888", optionB: "1600 a 1900", optionC: "1700 a 1850", optionD: "1500 a 1822", correctOption: "A" as const, explanation: "A escravidão no Brasil durou de 1500 até a Lei Áurea em 1888" },
  { discipline: "historia" as const, difficulty: "medium" as const, questionText: "Quem assinou a Lei Áurea que aboliu a escravidão no Brasil?", optionA: "Dom Pedro I", optionB: "Dom Pedro II", optionC: "Princesa Isabel", optionD: "Deodoro da Fonseca", correctOption: "C" as const, explanation: "A Princesa Isabel assinou a Lei Áurea em 13 de maio de 1888" },
  { discipline: "historia" as const, difficulty: "medium" as const, questionText: "O que foi a Revolução Industrial?", optionA: "Uma guerra entre países europeus", optionB: "A transição para produção mecanizada no século XVIII", optionC: "A independência das colônias americanas", optionD: "A queda do Império Romano", correctOption: "B" as const, explanation: "A Revolução Industrial foi a transição para processos de manufatura mecanizados" },
  { discipline: "historia" as const, difficulty: "hard" as const, questionText: "Em que ano terminou a Segunda Guerra Mundial?", optionA: "1943", optionB: "1944", optionC: "1945", optionD: "1946", correctOption: "C" as const, explanation: "A Segunda Guerra Mundial terminou em 1945 com a rendição da Alemanha e do Japão" },
  { discipline: "historia" as const, difficulty: "hard" as const, questionText: "Qual foi a primeira civilização a desenvolver a escrita?", optionA: "Egípcios", optionB: "Sumérios", optionC: "Gregos", optionD: "Chineses", correctOption: "B" as const, explanation: "Os Sumérios da Mesopotâmia desenvolveram a escrita cuneiforme por volta de 3200 a.C." },
  { discipline: "historia" as const, difficulty: "hard" as const, questionText: "O que foi a Inconfidência Mineira?", optionA: "Uma batalha contra os holandeses", optionB: "Um movimento separatista no Rio de Janeiro", optionC: "Uma conspiração para independência de Minas Gerais em 1789", optionD: "A proclamação da república", correctOption: "C" as const, explanation: "A Inconfidência Mineira foi um movimento de independência em 1789, liderado por Tiradentes" },

  // ─── CIÊNCIAS ─────────────────────────────────────────────────────────────
  { discipline: "ciencias" as const, difficulty: "easy" as const, questionText: "Qual é o processo pelo qual as plantas produzem seu alimento?", optionA: "Respiração", optionB: "Fotossíntese", optionC: "Digestão", optionD: "Transpiração", correctOption: "B" as const, explanation: "Fotossíntese: as plantas usam luz solar, água e CO₂ para produzir glicose" },
  { discipline: "ciencias" as const, difficulty: "easy" as const, questionText: "Qual é o planeta mais próximo do Sol?", optionA: "Vênus", optionB: "Terra", optionC: "Marte", optionD: "Mercúrio", correctOption: "D" as const, explanation: "Mercúrio é o planeta mais próximo do Sol no Sistema Solar" },
  { discipline: "ciencias" as const, difficulty: "easy" as const, questionText: "Quantos ossos tem o corpo humano adulto?", optionA: "106", optionB: "206", optionC: "306", optionD: "256", correctOption: "B" as const, explanation: "O corpo humano adulto possui 206 ossos" },
  { discipline: "ciencias" as const, difficulty: "medium" as const, questionText: "Qual gás é essencial para a respiração humana?", optionA: "Dióxido de carbono", optionB: "Nitrogênio", optionC: "Oxigênio", optionD: "Hidrogênio", correctOption: "C" as const, explanation: "O oxigênio (O₂) é essencial para a respiração celular" },
  { discipline: "ciencias" as const, difficulty: "medium" as const, questionText: "O que é a célula?", optionA: "A menor unidade viva dos organismos", optionB: "Um órgão do corpo humano", optionC: "Um tipo de vitamina", optionD: "Uma parte do sistema nervoso", correctOption: "A" as const, explanation: "A célula é a menor unidade estrutural e funcional dos seres vivos" },
  { discipline: "ciencias" as const, difficulty: "medium" as const, questionText: "Qual é a fórmula química da água?", optionA: "CO₂", optionB: "O₂", optionC: "H₂O", optionD: "NaCl", correctOption: "C" as const, explanation: "A água é formada por 2 átomos de hidrogênio e 1 de oxigênio: H₂O" },
  { discipline: "ciencias" as const, difficulty: "medium" as const, questionText: "Qual órgão bombeia o sangue pelo corpo?", optionA: "Pulmão", optionB: "Fígado", optionC: "Rim", optionD: "Coração", correctOption: "D" as const, explanation: "O coração é o órgão responsável por bombear o sangue pelo sistema circulatório" },
  { discipline: "ciencias" as const, difficulty: "hard" as const, questionText: "O que é a cadeia alimentar?", optionA: "Um tipo de dieta saudável", optionB: "A sequência de quem come quem em um ecossistema", optionC: "Um processo de digestão", optionD: "A classificação dos alimentos", correctOption: "B" as const, explanation: "Cadeia alimentar mostra as relações de alimentação entre seres vivos" },
  { discipline: "ciencias" as const, difficulty: "hard" as const, questionText: "Qual é a velocidade da luz no vácuo?", optionA: "300.000 km/s", optionB: "150.000 km/s", optionC: "500.000 km/s", optionD: "100.000 km/s", correctOption: "A" as const, explanation: "A velocidade da luz no vácuo é aproximadamente 300.000 km/s" },
  { discipline: "ciencias" as const, difficulty: "hard" as const, questionText: "O que estuda a ecologia?", optionA: "O estudo dos animais extintos", optionB: "As relações entre seres vivos e o ambiente", optionC: "A composição química dos minerais", optionD: "O movimento dos planetas", correctOption: "B" as const, explanation: "Ecologia estuda as relações entre organismos e seu ambiente" },
];

const equipmentData = [
  // Chapéus
  { name: "Chapéu de Cowboy", description: "Um chapéu estiloso do velho oeste!", category: "hat" as const, pointsCost: 50, rarity: "common" as const, colorValue: "#8B4513", iconEmoji: "🤠" },
  { name: "Coroa Dourada", description: "Para os campeões do conhecimento!", category: "hat" as const, pointsCost: 200, rarity: "epic" as const, colorValue: "#FFD700", iconEmoji: "👑" },
  { name: "Chapéu de Mago", description: "Mágica do saber!", category: "hat" as const, pointsCost: 100, rarity: "rare" as const, colorValue: "#4B0082", iconEmoji: "🎩" },
  { name: "Capacete Espacial", description: "Para explorar o universo do conhecimento!", category: "hat" as const, pointsCost: 300, rarity: "legendary" as const, colorValue: "#C0C0C0", iconEmoji: "🪖" },
  // Camisas
  { name: "Camiseta Azul", description: "Clássica e elegante", category: "shirt" as const, pointsCost: 30, rarity: "common" as const, colorValue: "#4169E1", iconEmoji: "👕" },
  { name: "Camiseta Verde", description: "Cor da natureza!", category: "shirt" as const, pointsCost: 30, rarity: "common" as const, colorValue: "#228B22", iconEmoji: "👕" },
  { name: "Uniforme de Cientista", description: "Para os amantes da ciência!", category: "shirt" as const, pointsCost: 150, rarity: "rare" as const, colorValue: "#FFFFFF", iconEmoji: "🥼" },
  { name: "Roupa de Super-Herói", description: "Salve o mundo com o conhecimento!", category: "shirt" as const, pointsCost: 400, rarity: "legendary" as const, colorValue: "#DC143C", iconEmoji: "🦸" },
  // Acessórios
  { name: "Óculos de Grau", description: "Para os estudiosos!", category: "accessory" as const, pointsCost: 60, rarity: "common" as const, colorValue: "#000000", iconEmoji: "🤓" },
  { name: "Mochila Escolar", description: "Sempre pronto para aprender!", category: "accessory" as const, pointsCost: 80, rarity: "common" as const, colorValue: "#FF6347", iconEmoji: "🎒" },
  { name: "Capa de Super-Herói", description: "Voe pelo conhecimento!", category: "accessory" as const, pointsCost: 250, rarity: "epic" as const, colorValue: "#8B0000", iconEmoji: "🦸" },
  { name: "Asas de Anjo", description: "Leve seu aprendizado às alturas!", category: "accessory" as const, pointsCost: 500, rarity: "legendary" as const, colorValue: "#FFFACD", iconEmoji: "👼" },
  // Calças
  { name: "Calça Jeans", description: "Confortável para estudar!", category: "pants" as const, pointsCost: 40, rarity: "common" as const, colorValue: "#4682B4", iconEmoji: "👖" },
  { name: "Calça Vermelha", description: "Destaque-se na turma!", category: "pants" as const, pointsCost: 60, rarity: "common" as const, colorValue: "#DC143C", iconEmoji: "👖" },
  { name: "Calça Dourada", description: "Para os campeões!", category: "pants" as const, pointsCost: 180, rarity: "rare" as const, colorValue: "#DAA520", iconEmoji: "👖" },
];

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");
  
  // Seed questions
  console.log("📚 Inserindo perguntas...");
  for (const q of questionsData) {
    await db.insert(questions).values(q).onDuplicateKeyUpdate({ set: { questionText: q.questionText } });
  }
  console.log(`✅ ${questionsData.length} perguntas inseridas`);

  // Seed equipment
  console.log("🎮 Inserindo equipamentos...");
  for (const item of equipmentData) {
    await db.insert(equipmentItems).values(item).onDuplicateKeyUpdate({ set: { name: item.name } });
  }
  console.log(`✅ ${equipmentData.length} equipamentos inseridos`);

  console.log("🎉 Seed concluído com sucesso!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
