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

    // Referências para paginação
    const perguntas = document.querySelectorAll('.pergunta-item');
    const voltarPerguntaBtn = document.getElementById('voltarPergunta');
    const proximaPerguntaBtn = document.getElementById('proximaPergunta');
    const verResultadoBtn = document.getElementById('verResultadoBtn');
    let perguntaAtual = 0;

    /**
     * Atualiza a pergunta visível com base no índice atual.
     */
    function atualizarPergunta() {
        perguntas.forEach((pergunta, index) => {
            pergunta.classList.toggle('hidden', index !== perguntaAtual);
        });

        voltarPerguntaBtn.classList.toggle('hidden', perguntaAtual === 0);
        proximaPerguntaBtn.classList.toggle('hidden', perguntaAtual === perguntas.length - 1);
        verResultadoBtn.classList.toggle('hidden', perguntaAtual !== perguntas.length - 1);
    }

    // Navegação entre perguntas
    proximaPerguntaBtn.addEventListener('click', () => {
        const radios = perguntas[perguntaAtual].querySelectorAll('input[type="radio"]');
        const isRespondido = Array.from(radios).some(radio => radio.checked);

        if (!isRespondido) {
            alert('Por favor, responda a pergunta antes de continuar.');
            return;
        }

        perguntaAtual++;
        atualizarPergunta();
    });

    voltarPerguntaBtn.addEventListener('click', () => {
        if (perguntaAtual > 0) {
            perguntaAtual--;
            atualizarPergunta();
        }
    });

    // Verifica se todas as perguntas foram respondidas - se não, foca na primeira pendente
    function todasRespostasPreenchidas() {
        const nomes = ['p1', 'p2', 'p3'];
        for (let i = 0; i < nomes.length; i++) {
            const name = nomes[i];
            const radios = avaliacaoForm.querySelectorAll(`input[name="${name}"]`);
            const answered = Array.from(radios).some(r => r.checked);
            if (!answered) {
                // Se faltar, leva o usuário à pergunta faltante e retorna false
                perguntaAtual = i;
                atualizarPergunta();
                // Move foco para a primeira opção dessa pergunta para acessibilidade
                const firstInput = perguntas[perguntaAtual].querySelector('input[type="radio"]');
                if (firstInput) firstInput.focus();
                return false;
            }
        }
        return true;
    }

    // adiciona variavel para guardar o ultimo resultado calculado
    let ultimoTotal = null;

    /**
     * Calcula a pontuação e exibe a tela de resultado.
     * event pode ser undefined quando chamado diretamente pelo botão.
     */
    function calcularResultado(event) {
        if (event) event.preventDefault();

        // Valida respostas; se alguma faltar, todasRespostasPreenchidas já redireciona para a pergunta
        if (!todasRespostasPreenchidas()) {
            alert('Por favor, responda todas as perguntas para ver o resultado.');
            return;
        }

        // Soma das pontuações
        let total = 0;
        const dadosForm = new FormData(avaliacaoForm);
        for (let value of dadosForm.values()) {
            total += parseInt(value);
        }

        // Guarda último total para uso pela narração
        ultimoTotal = total;
        pontuacaoFinalSpan.textContent = total;

        // Define cor do círculo com base na pontuação
        circuloPontuacao.style.backgroundColor = (total >= 5) ? VERMELHO : (total >= 2) ? AMARELO : VERDE;

        // Atualiza título e mensagem de dica com base na pontuação
        let titulo, dica;
        if (total >= 5) {
            titulo = 'Alto risco de compra impulsiva';
            dica = 'Considere esperar 24 horas antes de realizar a compra. Avalie se é realmente necessário.';
        } else if (total >= 2) {
            titulo = 'Atenção: compra por impulso possível';
            dica = 'Reflita sobre a compra. Pergunte-se se é um desejo momentâneo ou uma necessidade real.';
        } else {
            titulo = 'Compra consciente e planejada';
            dica = 'Ótimo trabalho! Continue assim, planejando suas compras e evitando impulsos.';
        }
        tituloResultado.textContent = titulo;
        mensagemDica.textContent = dica;

        // Troca para a tela de resultado
        trocarTela(telaResultado);

        // Se narração de resultado estiver ativa, ler com base no ultimoTotal
        if (telaResultado.dataset.narrationActive === 'true') {
            narrarResultado(ultimoTotal);
        }
    }

    // Função para narrar o resultado com variação conforme pontuação
    function narrarResultado(totalParam) {
        // usa totalParam, ou ultimoTotal, ou o valor na tela
        const total = (typeof totalParam === 'number') ? totalParam : (typeof ultimoTotal === 'number' ? ultimoTotal : parseInt(pontuacaoFinalSpan.textContent || '0'));

        let mensagem;
        if (total >= 5) {
            mensagem = `Você obteve ${total} pontos. Alto risco de compra impulsiva. ${mensagemDica.textContent}`;
        } else if (total >= 2) {
            mensagem = `Você obteve ${total} pontos. Atenção necessária. ${mensagemDica.textContent}`;
        } else {
            mensagem = `Você obteve ${total} pontos. Compra consciente e planejada. ${mensagemDica.textContent}`;
        }

        // Atualiza os data-audio para permitir que quem clicar leia esses elementos
        document.getElementById('pontuacao-final').dataset.audio = `Pontuação final ${total}`;
        document.getElementById('titulo-resultado').dataset.audio = document.getElementById('titulo-resultado').textContent || '';
        document.getElementById('mensagem-dica').dataset.audio = mensagemDica.textContent || '';

        // Narra a mensagem
        if (speechSupported) narrarTexto(mensagem);
    }

    // Garantir que o botão "Ver resultado" acione a mesma lógica do submit
    if (verResultadoBtn) {
        verResultadoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            calcularResultado(e); // não usamos stopPropagation — evita interferências
        });
    }

    // Mantém listener de submit
    avaliacaoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calcularResultado(e);
    });

    // ================= RESULT SCREEN BUTTONS =================
    // Voltar ao início — limpa tudo e mostra tela inicial
    if (voltarAoInicioResultadoBtn) {
        voltarAoInicioResultadoBtn.addEventListener('click', () => {
            resetarTudo();
        });
    }

    // Responder novamente — reseta formulário, volta para tela de avaliação
    if (responderNovamenteBtn) {
        responderNovamenteBtn.addEventListener('click', () => {
            // Limpa campos e checkbox/ radio
            avaliacaoForm.reset();
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.checked = false;
            });

            // Volta para a primeira pergunta e mostra a tela de avaliação
            perguntaAtual = 0;
            atualizarPergunta();
            trocarTela(telaAvaliacao);
        });
    }

    // Detecta suporte de síntese de fala
    const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

    // Função para narrar texto (com cancelamento de fala anterior e tentativa de voz pt-BR)
    function narrarTexto(texto) {
        if (!speechSupported) {
            console.warn('Síntese de fala não suportada neste navegador.');
            return;
        }
        // Cancela qualquer fala em andamento antes de falar o novo texto
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';

        // Tenta escolher voz pt-BR se disponível (getVoices pode retornar vazia inicialmente)
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt')) || null;

        window.speechSynthesis.speak(utterance);
    }

    // Helper: remove a parte de "(N ponto(s))" do texto, caso exista
    function removerIndicadorPontos(texto) {
        return texto.replace(/\(\s*\d+\s*pontos?\s*\)/gi, '').trim();
    }

    // Mapa para armazenar handlers adicionados (para que possamos remover)
    const clickNarrationHandlers = new Map();

    // Ativa leitura ao pressionar (pointerdown) nos elementos .audio-clickable dentro do root
    // pointerdown dá resposta imediata e não impede comportamento de labels/inputs
    function enableClickNarration(root) {
        if (!speechSupported) return; // se não suportado, não adiciona handler

        const items = root.querySelectorAll('.audio-clickable');
        items.forEach(item => {
            if (clickNarrationHandlers.has(item)) return;
            const handler = (e) => {
                const textoRaw = item.dataset.audio || item.textContent || '';
                const texto = removerIndicadorPontos(textoRaw);
                if (texto) narrarTexto(texto);
            };
            item.addEventListener('pointerdown', handler);
            clickNarrationHandlers.set(item, handler);
            item.setAttribute('aria-pressed', 'true');
        });
    }

    // Desativa leitura ao clicar nos elementos .audio-clickable dentro do root
    function disableClickNarration(root) {
        const items = root.querySelectorAll('.audio-clickable');
        items.forEach(item => {
            const handler = clickNarrationHandlers.get(item);
            if (handler) {
                item.removeEventListener('pointerdown', handler);
                clickNarrationHandlers.delete(item);
                item.removeAttribute('aria-pressed');
            }
        });

        // Cancela qualquer fala em andamento quando desabilita o modo
        if (speechSupported) window.speechSynthesis.cancel();
    }

    // Atualiza os botões de áudio — desabilita se não houver suporte
    const audioBtns = ['audioDescricaoInicial', 'audioDescricaoAvaliacao', 'audioDescricaoResultado'];
    audioBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (!speechSupported && btn) {
            btn.disabled = true;
            btn.title = 'Áudio descrição não suportada no seu navegador';
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        }
    });

    // Alterna a funcionalidade de click narration para a tela de avaliação
    document.getElementById('audioDescricaoAvaliacao').addEventListener('click', () => {
        const btn = document.getElementById('audioDescricaoAvaliacao');
        const isActive = telaAvaliacao.dataset.narrationActive === 'true';

        if (isActive) {
            disableClickNarration(telaAvaliacao);
            telaAvaliacao.dataset.narrationActive = 'false';
            btn.textContent = 'Ouvir descrição da tela';
            btn.setAttribute('aria-pressed', 'false');
        } else {
            enableClickNarration(telaAvaliacao);
            telaAvaliacao.dataset.narrationActive = 'true';
            btn.textContent = 'Desativar leitura por clique';
            btn.setAttribute('aria-pressed', 'true');
            // narra a tela somente ao ativar
            if (speechSupported) narrarTexto(descricoes.avaliacao);
        }
    });

    // Inicial — alterna sem narrar ao desativar
    document.getElementById('audioDescricaoInicial').addEventListener('click', () => {
        const btn = document.getElementById('audioDescricaoInicial');
        const isActive = telaInicial.dataset.narrationActive === 'true';

        if (isActive) {
            disableClickNarration(telaInicial);
            telaInicial.dataset.narrationActive = 'false';
            btn.textContent = 'Ouvir descrição da tela';
            btn.setAttribute('aria-pressed', 'false');
        } else {
            enableClickNarration(telaInicial);
            telaInicial.dataset.narrationActive = 'true';
            btn.textContent = 'Desativar leitura por clique';
            btn.setAttribute('aria-pressed', 'true');
            if (speechSupported) narrarTexto(descricoes.inicial);
        }
    });

    // Resultado — alterna sem narrar ao desativar; quando ativar, narrar o resultado completo (usa ultimoTotal)
    const audioResultadoBtn = document.getElementById('audioDescricaoResultado');
    if (audioResultadoBtn) {
        audioResultadoBtn.addEventListener('click', () => {
            const isActive = telaResultado.dataset.narrationActive === 'true';

            if (isActive) {
                // Desativa sem narrar; cancela áudio atual
                disableClickNarration(telaResultado);
                telaResultado.dataset.narrationActive = 'false';
                audioResultadoBtn.textContent = 'Ouvir descrição da tela';
                audioResultadoBtn.setAttribute('aria-pressed', 'false');
            } else {
                // Ativa e narra apenas ao ativar
                enableClickNarration(telaResultado);
                telaResultado.dataset.narrationActive = 'true';
                audioResultadoBtn.textContent = 'Desativar leitura por clique';
                audioResultadoBtn.setAttribute('aria-pressed', 'true');
                // Narra o resultado usando o ultimo total se houver
                if (speechSupported) {
                    if (typeof ultimoTotal === 'number') {
                        narrarResultado(ultimoTotal);
                    } else {
                        // Se não houver total calculado ainda, narra uma mensagem geral da tela
                        narrarTexto(descricoes.resultado);
                    }
                }
            }
        });
    }

    // Descrições das telas
    const descricoes = {
        inicial: "Bem-vindo ao Minhas Finanças Conscientes. Aqui você pode avaliar suas compras com base em desejo, reflexão e economia.",
        avaliacao: "Esta é a escala de avaliação de compra. Responda às perguntas para obter uma análise da sua escolha.",
        resultado: "Esta é a tela de resultados. Aqui você verá sua pontuação e dicas para melhorar suas decisões financeiras."
    };

    // ======================= EVENT LISTENERS =======================
    
    iniciarAvaliacaoBtn.addEventListener('click', () => {
        trocarTela(telaAvaliacao);
    });

    voltarAoInicioBtn.addEventListener('click', resetarTudo);
    voltarAoInicioResultadoBtn.addEventListener('click', resetarTudo);
    responderNovamenteBtn.addEventListener('click', () => {
        avaliacaoForm.reset();
        trocarTela(telaAvaliacao);
    });
    
    // Inicializa na tela inicial por padrão
    trocarTela(telaInicial);

    /**
     * Reseta o formulário e volta para a tela de início.
     */
    function resetarTudo() {
        avaliacaoForm.reset();
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.checked = false;
        });
        // Limpa pontuação exibida
        pontuacaoFinalSpan.textContent = '0';
        tituloResultado.textContent = '';
        mensagemDica.textContent = '';
        perguntaAtual = 0;
        atualizarPergunta();
        trocarTela(telaInicial);
    }

    // Garante que o botão "Voltar ao início" na tela de avaliação funcione (robusto)
    if (voltarAoInicioBtn) {
        voltarAoInicioBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetarTudo();
        });
    }

    // Garante que o botão "Voltar ao início" na tela de resultado funcione (robusto)
    if (voltarAoInicioResultadoBtn) {
        voltarAoInicioResultadoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetarTudo();
        });
    }
});