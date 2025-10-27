document.addEventListener('DOMContentLoaded', () => {
    // Referências dos elementos de tela
    const telaInicial = document.getElementById('tela-inicial');
    const telaAvaliacao = document.getElementById('tela-avaliacao');
    const telaResultado = document.getElementById('tela-resultado');

    // Botões de navegação
    const iniciarAvaliacaoBtn = document.getElementById('iniciarAvaliacao');
    const voltarAoInicioBtn = document.getElementById('voltarAoInicio');
    const voltarAoInicioResultadoBtn = document.getElementById('voltarAoInicioResultado');
    const responderNovamenteBtn = document.getElementById('responderNovamente');

    // Formulário e Resultado
    const avaliacaoForm = document.getElementById('avaliacaoForm');
    const pontuacaoFinalSpan = document.getElementById('pontuacao-final');
    const circuloPontuacao = document.getElementById('circulo-pontuacao');
    const tituloResultado = document.getElementById('titulo-resultado');
    const mensagemDica = document.getElementById('mensagem-dica');
    
    // Cores (Mantidas as mesmas do CSS)
    const VERDE = '#4CAF50';    // Verde para Compra Consciente
    const AMARELO = '#FFC107'; // Amarelo para Atenção
    const VERMELHO = '#E53935'; // Vermelho para Alto Risco

    /**
     * Função para trocar a tela visível.
     */
    function trocarTela(telaParaMostrar) {
        // Esconde todas as telas
        [telaInicial, telaAvaliacao, telaResultado].forEach(tela => {
            tela.classList.add('hidden');
        });
        // Mostra a tela desejada
        telaParaMostrar.classList.remove('hidden');
    }

    /**
     * Reseta o formulário e volta para a tela de início.
     */
    function resetarTudo() {
        avaliacaoForm.reset();
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        trocarTela(telaInicial);
    }
    
    /**
     * Calcula a pontuação e exibe a tela de resultado.
     */
    function calcularResultado(event) {
        event.preventDefault();

        // Verificação se todas as perguntas foram respondidas
        const radiosP1 = avaliacaoForm.querySelectorAll('input[name="p1"]');
        const radiosP2 = avaliacaoForm.querySelectorAll('input[name="p2"]');
        const radiosP3 = avaliacaoForm.querySelectorAll('input[name="p3"]');

        const isP1Checked = Array.from(radiosP1).some(radio => radio.checked);
        const isP2Checked = Array.from(radiosP2).some(radio => radio.checked);
        const isP3Checked = Array.from(radiosP3).some(radio => radio.checked);
        
        if (!isP1Checked || !isP2Checked || !isP3Checked) {
            alert('Por favor, responda todas as perguntas para ver o resultado.');
            return;
        }

        // Soma das pontuações
        let total = 0;
        const dadosForm = new FormData(avaliacaoForm);
        for (let value of dadosForm.values()) {
            total += parseInt(value);
        }

        pontuacaoFinalSpan.textContent = total;

        // Lógica e Mensagens de Resultado
        let cor;
        let titulo;
        let dica;
        let iconeDica = 'favorite'; // Ícone de coração (suave)

        if (total >= 5) { // Alto Risco (5 ou 6 pontos)
            cor = VERMELHO;
            titulo = "Alto risco de compra impulsiva";
            dica = "Pare! Respire fundo, pense em você e no seu futuro. Peça a opinião de uma amiga antes de finalizar a compra.";
        } else if (total >= 2) { // Atenção (2 a 4 pontos)
            cor = AMARELO;
            titulo = "Atenção! Há sinais de compra impulsiva";
            dica = "Uma pausa de 30 minutos faz maravilhas. Veja se a vontade se mantém ou se era apenas um momento de carência.";
        } else { // Compra Consciente (0 ou 1 ponto)
            cor = VERDE;
            titulo = "Compra consciente e planejada";
            dica = "Que ótimo! Você está no controle das suas finanças. Siga em frente com confiança!";
        }
        
        // Atualiza o visual do resultado
        circuloPontuacao.style.backgroundColor = cor;
        tituloResultado.textContent = titulo;
        tituloResultado.style.color = cor;
        
        // Usando o novo ícone
        mensagemDica.innerHTML = `<span><span class="material-icons" style="font-size: 1.2em; vertical-align: middle; margin-right: 5px;">${iconeDica}</span> ${dica}</span>`;
        mensagemDica.style.borderLeftColor = cor;
        
        // Troca para a tela de resultado
        trocarTela(telaResultado);
    }

    // ======================= EVENT LISTENERS =======================
    
    iniciarAvaliacaoBtn.addEventListener('click', () => {
        trocarTela(telaAvaliacao);
    });

    voltarAoInicioBtn.addEventListener('click', resetarTudo);
    avaliacaoForm.addEventListener('submit', calcularResultado);
    voltarAoInicioResultadoBtn.addEventListener('click', resetarTudo);
    responderNovamenteBtn.addEventListener('click', () => {
        avaliacaoForm.reset();
        trocarTela(telaAvaliacao);
    });
    
    // Inicia na tela inicial por padrão
    trocarTela(telaInicial);
});