/**
 * Carrega as questões de um arquivo JSON.
 * @returns {Promise<Object>} Uma promessa que resolve com os dados do JSON.
 */
async function carregarQuestoes() {
  try {
    const resposta = await fetch('bancoDeQuestoes.json');
    if (!resposta.ok) {
      throw new Error(`Erro na rede: ${resposta.statusText}`);
    }
    const dados = await resposta.json();
    return dados;
  } catch (error) {
    console.error("Não foi possível carregar o banco de questões:", error);
    alert("Erro: Não foi possível carregar o arquivo 'bancoDeQuestoes.json'. Verifique se o arquivo está na mesma pasta e se o nome está correto.");
  }
}

/**
 * Inicia e executa o quiz.
 */
async function iniciarQuiz() {
  const dados = await carregarQuestoes();
  if (!dados) return; // Encerra se os dados não puderam ser carregados

  // 1. Solicita a escolha de um tema ao usuário
  const temas = dados.bancoDeQuestoes.map(item => item.tema);
  let temaEscolhido = null;
  let bancoDoTema = null;

  // Loop para garantir que o usuário escolha um tema válido
  while (!bancoDoTema) {
    const listaDeTemas = temas.map((t, i) => `${i + 1}. ${t}`).join('\n');
    const escolhaUsuario = prompt(`Escolha um tema pelo número:\n\n${listaDeTemas}`);
    
    if (escolhaUsuario === null) {
        alert("Quiz cancelado.");
        return;
    }

    const indiceTema = parseInt(escolhaUsuario, 10) - 1;

    if (indiceTema >= 0 && indiceTema < temas.length) {
      temaEscolhido = temas[indiceTema];
      bancoDoTema = dados.bancoDeQuestoes[indiceTema];
    } else {
      alert("Escolha inválida. Por favor, digite o número correspondente ao tema.");
    }
  }
  
  // Combina as duas listas de questões em uma só
  const todasAsQuestoes = [
    ...bancoDoTema.questoesDiretoDoConcurso,
    ...bancoDoTema.questoesDeConcurso
  ];
  
  // Cria uma cópia para poder remover itens sem alterar o original
  let questoesDisponiveis = [...todasAsQuestoes];
  let pontuacao = 0;
  const totalDePerguntas = 10;
  
  if (questoesDisponiveis.length < totalDePerguntas) {
      alert(`O tema "${temaEscolhido}" possui apenas ${questoesDisponiveis.length} questões. O quiz será mais curto.`);
  }

  // 2. Loop principal do quiz (repete 10 vezes ou até acabarem as questões)
  for (let i = 0; i < totalDePerguntas; i++) {
    
    if (questoesDisponiveis.length === 0) {
        alert("Não há mais questões disponíveis para este tema.");
        break;
    }

    // 3. Sorteia uma questão sem reposição
    const indiceAleatorio = Math.floor(Math.random() * questoesDisponiveis.length);
    const questaoSorteada = questoesDisponiveis[indiceAleatorio];
    // Remove a questão sorteada para não repeti-la
    questoesDisponiveis.splice(indiceAleatorio, 1);

    // 4. Exibe o enunciado e as alternativas
    let textoPrompt = `--- TEMA: ${temaEscolhido} ---\n`;
    textoPrompt += `Questão ${i + 1} de ${totalDePerguntas}\n\n`;
    textoPrompt += `Fonte: ${questaoSorteada.fonte}\n\n`;
    textoPrompt += `${questaoSorteada.enunciado}\n\n`;

    // Adapta o prompt para o tipo de questão
    if (questaoSorteada.tipo === 'CERTO_ERRADO') {
      textoPrompt += "Responda com 'C' para Certo ou 'E' para Errado.";
    } else {
      questaoSorteada.alternativas.forEach(alt => {
        textoPrompt += `${alt.key}) ${alt.text}\n`;
      });
      textoPrompt += "\nDigite a letra da alternativa correta.";
    }

    // 5. Pede ao usuário para escolher uma alternativa
    const respostaUsuario = prompt(textoPrompt);

    // Se o usuário cancelar, encerra o quiz
    if (respostaUsuario === null) {
      alert("Quiz interrompido.");
      break;
    }
    
    // 6. Compara a resposta com o gabarito
    const gabarito = questaoSorteada.gabarito.toLowerCase();
    let respostaCorreta;
    let isCorrecto = false;

    // Lógica para os diferentes tipos de gabarito
    if (questaoSorteada.tipo === 'CERTO_ERRADO') {
        respostaCorreta = gabarito.charAt(0); // Extrai 'c' ou 'e'
        if(respostaUsuario.toLowerCase() === respostaCorreta) {
            isCorrecto = true;
        }
    } else {
        respostaCorreta = gabarito; // A letra da alternativa
        if(respostaUsuario.toLowerCase() === respostaCorreta) {
            isCorrecto = true;
        }
    }

    // 7. Exibe o resultado da jogada
    if (isCorrecto) {
      pontuacao++;
      alert("Certo! 👍");
    } else {
      let mensagemErro = `Errado! 👎\n\nA resposta correta é: ${respostaCorreta.toUpperCase()}`;
      if (questaoSorteada.tipo === 'CERTO_ERRADO') {
         mensagemErro = `Errado! 👎\n\nA resposta correta é: ${questaoSorteada.gabarito}`;
      }
      alert(mensagemErro);
    }
  }

  // 8. Exibe o resultado final
  alert(`Fim do quiz!\n\nSua pontuação final foi: ${pontuacao} de ${totalDePerguntas} acertos.`);
}

// Inicia o quiz quando o script é carregado
iniciarQuiz();
