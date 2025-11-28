document.addEventListener('DOMContentLoaded', () => {
	// Referências dos elementos de tela
	const telaAvaliacao = document.getElementById('tela-avaliacao');
	const telaResultado = document.getElementById('tela-resultado');

	// Botões de navegação
	const voltarPerguntaBtn = document.getElementById('voltarPergunta');
	const responderNovamenteBtn = document.getElementById('responderNovamente');

	// Formulário e Resultado
	const avaliacaoForm = document.getElementById('avaliacaoForm');
	const pontuacaoFinalSpan = document.getElementById('pontuacao-final');
	const circuloPontuacao = document.getElementById('circulo-pontuacao');
	const tituloResultado = document.getElementById('titulo-resultado');
	const mensagemDica = document.getElementById('mensagem-dica');

	// Cores
	const VERDE = '#4CAF50';
	const AMARELO = '#FFC107';
	const VERMELHO = '#E53935';

	// === ADICIONADO: suporte a síntese de fala e funções utilitárias necessárias ===
	// declara suporte cedo para evitar ReferenceError quando handlers são registrados
	const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

	// Narrador: cancela fala em andamento e tenta usar voz pt-BR
	function narrarTexto(texto) {
		if (!speechSupported || !texto) return;
		try {
			window.speechSynthesis.cancel();
			const utterance = new SpeechSynthesisUtterance(texto);
			utterance.lang = 'pt-BR';
			const voices = window.speechSynthesis.getVoices();
			utterance.voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt')) || null;
			window.speechSynthesis.speak(utterance);
		} catch (err) {
			// falha silenciosa — mantém o app funcional
			console.warn('Erro ao tentar narrar texto:', err);
		}
	}

	// Remove trechos como "(2 pontos)" das strings de áudio
	function removerIndicadorPontos(texto) {
		return (texto || '').replace(/\(\s*\d+\s*pontos?\s*\)/gi, '').trim();
	}

	// Função simples para trocar telas (usada em vários pontos do código)
	function trocarTela(telaParaMostrar) {
		// Cancela qualquer narração em andamento ao trocar de tela
		if (speechSupported && window.speechSynthesis) {
			try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
		}

		[telaAvaliacao, telaResultado].forEach(t => {
			if (t) t.classList.add('hidden');
		});
		if (telaParaMostrar) telaParaMostrar.classList.remove('hidden');
	}
	// === FIM ADIÇÕES ===

	// Garantir estado inicial do dataset
	if (!telaAvaliacao.dataset.narrationActive) telaAvaliacao.dataset.narrationActive = 'false';
	if (!telaResultado.dataset.narrationActive) telaResultado.dataset.narrationActive = 'false';

	// Referências para paginação
	const perguntas = Array.from(document.querySelectorAll('.pergunta-item'));
	let perguntaAtual = 0;

	function atualizarPergunta() {
		perguntas.forEach((pergunta, index) => {
			pergunta.classList.toggle('hidden', index !== perguntaAtual);
		});
		// mostrar/ocultar botão voltar de pergunta se existir
		if (voltarPerguntaBtn) voltarPerguntaBtn.classList.toggle('hidden', perguntaAtual === 0);

		// foco na primeira opção da pergunta atual
		const firstInput = perguntas[perguntaAtual].querySelector('input[type="radio"]');
		if (firstInput) firstInput.focus();
	}

	// voltar pergunta
	if (voltarPerguntaBtn) {
		voltarPerguntaBtn.addEventListener('click', () => {
			if (perguntaAtual > 0) {
				perguntaAtual--;
				// limpar confirmação ao voltar
				selecaoConfirmada.clear();
				atualizarPergunta();
			}
		});
	}

	// adiciona variavel para guardar o ultimo resultado calculado
	let ultimoTotal = null;

	/**
	 * Calcula a pontuação e exibe a tela de resultado.
	 */
	function calcularResultado(event) {
		if (event) event.preventDefault();

		// Valida respostas
		let todasRespondidas = true;
		const nomes = ['p1', 'p2', 'p3'];
		for (let i = 0; i < nomes.length; i++) {
			const name = nomes[i];
			const radios = avaliacaoForm.querySelectorAll(`input[name="${name}"]`);
			const answered = Array.from(radios).some(r => r.checked);
			if (!answered) {
				todasRespondidas = false;
				perguntaAtual = i;
				atualizarPergunta();
				break;
			}
		}

		if (!todasRespondidas) {
			alert('Por favor, responda todas as perguntas para ver o resultado.');
			return;
		}

		// Soma das pontuações
		let total = 0;
		const dadosForm = new FormData(avaliacaoForm);
		for (let value of dadosForm.values()) {
			total += parseInt(value);
		}

		ultimoTotal = total;
		pontuacaoFinalSpan.textContent = total;

		// Define cor do círculo
		circuloPontuacao.style.backgroundColor = (total >= 5) ? VERMELHO : (total >= 2) ? AMARELO : VERDE;

		// Atualiza título e mensagem
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

		trocarTela(telaResultado);

		if (telaResultado.dataset.narrationActive === 'true') {
			narrarResultado(ultimoTotal);
		}
	}

	// Função para narrar o resultado
	function narrarResultado(totalParam) {
		const total = (typeof totalParam === 'number') ? totalParam : (typeof ultimoTotal === 'number' ? ultimoTotal : parseInt(pontuacaoFinalSpan.textContent || '0'));

		let mensagem;
		if (total >= 5) {
			mensagem = `Você obteve ${total} pontos. Alto risco de compra impulsiva. ${mensagemDica.textContent}`;
		} else if (total >= 2) {
			mensagem = `Você obteve ${total} pontos. Atenção necessária. ${mensagemDica.textContent}`;
		} else {
			mensagem = `Você obteve ${total} pontos. Compra consciente e planejada. ${mensagemDica.textContent}`;
		}

		document.getElementById('pontuacao-final').dataset.audio = `Pontuação final ${total}`;
		document.getElementById('titulo-resultado').dataset.audio = document.getElementById('titulo-resultado').textContent || '';
		document.getElementById('mensagem-dica').dataset.audio = mensagemDica.textContent || '';

		if (speechSupported) narrarTexto(mensagem);
	}

	// Mantém listener de submit
	avaliacaoForm.addEventListener('submit', (e) => {
		e.preventDefault();
		calcularResultado(e);
	});

	// ================= RESULT SCREEN BUTTONS =================
	// Removido listener para 'voltarAoInicioResultadoBtn' (botão removido do HTML)

	// Responder novamente — reseta formulário, volta para tela de avaliação
	if (responderNovamenteBtn) {
		responderNovamenteBtn.addEventListener('click', () => {
			// Limpa campos e checkbox/ radio
			avaliacaoForm.reset();
			document.querySelectorAll('input[type="radio"]').forEach(radio => {
				radio.checked = false;
			});
			perguntaAtual = 0;
			selecaoConfirmada.clear();
			atualizarPergunta();
			trocarTela(telaAvaliacao);
		});
	}

	// Mapa para armazenar handlers de leitura por clique (mantido)
	const clickNarrationHandlers = new Map();

	// Adiciona funções ausentes para ativar/desativar a leitura por clique (usadas pelos botões de áudio)
	function enableClickNarration(root) {
		if (!root || !speechSupported) return;
		// NÃO incluir .opcao-label aqui para evitar dupla leitura; vamos narrar opções explicitamente no clickHandler
		const items = root.querySelectorAll('.audio-clickable:not(.opcao-label)');
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

	function disableClickNarration(root) {
		if (!root) return;
		// remove handlers apenas dos elementos que adicionamos
		const items = root.querySelectorAll('.audio-clickable:not(.opcao-label)');
		items.forEach(item => {
			const handler = clickNarrationHandlers.get(item);
			if (handler) {
				item.removeEventListener('pointerdown', handler);
				clickNarrationHandlers.delete(item);
				item.removeAttribute('aria-pressed');
			}
		});
		if (speechSupported) window.speechSynthesis.cancel();
	}

	// controle de confirmações quando audiodescrição ativa
	const selecaoConfirmada = new Map(); // chave: indexPergunta -> lastSelectedOptionId

	// Nova flag: suprime narração imediata após avançar (evita repetição ao trocar pergunta)
	let suppressNarration = false;

	/**
	 * Avança para a próxima pergunta / resultado
	 */
	function avancarPergunta() {
		// garante que a pergunta atual tem resposta
		const radios = perguntas[perguntaAtual].querySelectorAll('input[type="radio"]');
		const isRespondido = Array.from(radios).some(r => r.checked);
		if (!isRespondido) return;

		// suprime narração por curto período para evitar que o clique "vaze" para a próxima pergunta
		suppressNarration = true;

		if (perguntaAtual === perguntas.length - 1) {
			calcularResultado();
		} else {
			perguntaAtual++;
			// limpar confirmações para nova pergunta
			selecaoConfirmada.delete(perguntaAtual);
			atualizarPergunta();
		}

		// limpa a supressão após breve intervalo (ajuste se necessário)
		setTimeout(() => { suppressNarration = false; }, 350);
	}

	/**
	 * Registra listeners:
	 * - change nos inputs: quando audiodescrição DESATIVADA -> avança automaticamente.
	 * - click no label: quando audiodescrição ATIVADA -> primeiro clique apenas seleciona e pede confirmação; segundo clique no mesmo rótulo avança.
	 */
	function adicionarListenersOpcoes() {
		perguntas.forEach((pergunta, indexPergunta) => {
			const labels = pergunta.querySelectorAll('.opcao-label');
			labels.forEach((label, idx) => {
				const inputRadio = label.querySelector('input[type="radio"]');
				if (!inputRadio) return;

				// remover antigos listeners (se houver)
				if (inputRadio._changeHandler) inputRadio.removeEventListener('change', inputRadio._changeHandler);
				if (label._clickHandler) label.removeEventListener('click', label._clickHandler);

				// change: avanço automático quando audiodescrição desligada (mantido)
				const changeHandler = (e) => {
					const audioAtivo = telaAvaliacao.dataset.narrationActive === 'true';
					if (!audioAtivo && inputRadio.checked) {
						setTimeout(() => avancarPergunta(), 120);
					}
				};
				inputRadio.addEventListener('change', changeHandler);
				inputRadio._changeHandler = changeHandler;

				// click no label: quando audiodescrição ativada, usar confirmação
				const clickHandler = (e) => {
					const audioAtivo = telaAvaliacao.dataset.narrationActive === 'true';

					// se suprimido (recém avançou), não narrar nem pedir confirmação
					if (suppressNarration) {
						e.preventDefault();
						e.stopPropagation();
						inputRadio.focus();
						return;
					}

					// sem audiodescrição: deixamos o comportamento nativo marcar o radio e disparar 'change'
					if (!audioAtivo) {
						return;
					}

					// audiodescrição ON: comportamento de confirmação em 2 cliques
					const thisId = `q${indexPergunta}-opt${idx}`;
					const lastSelectedId = selecaoConfirmada.get(indexPergunta);

					// Texto da opção para narrar (se houver data-audio no label)
					const optionAudio = removerIndicadorPontos(label.dataset.audio || label.textContent || '');

					if (lastSelectedId !== thisId) {
						// primeiro clique: marca manualmente (porque vamos prevenir a mudança nativa) e narra instrução
						inputRadio.checked = true;
						selecaoConfirmada.set(indexPergunta, thisId);
						if (speechSupported) {
							const mensagem = optionAudio ? `${optionAudio}. Clique novamente para confirmar` : 'Clique novamente para confirmar';
							narrarTexto(mensagem);
						}
						e.preventDefault();
						e.stopPropagation();
						inputRadio.focus();
						return;
					} else {
						// segundo clique no mesmo rótulo: confirma e avança sem repetir a instrução
						selecaoConfirmada.delete(indexPergunta);
						suppressNarration = true;
						setTimeout(() => avancarPergunta(), 100);
					}
				};
				label.addEventListener('click', clickHandler);
				label._clickHandler = clickHandler;
			});
		});
	}

	// Alterna audiodescrição da avaliação (mantém e limpa handlers antigos de leitura)
	const audioDescricaoAvaliacaoBtn = document.getElementById('audioDescricaoAvaliacao');
	if (audioDescricaoAvaliacaoBtn) {
		audioDescricaoAvaliacaoBtn.addEventListener('click', () => {
			const isActive = telaAvaliacao.dataset.narrationActive === 'true';
			if (isActive) {
				disableClickNarration(telaAvaliacao);
				telaAvaliacao.dataset.narrationActive = 'false';
				audioDescricaoAvaliacaoBtn.textContent = 'Ouvir descrição da tela';
				audioDescricaoAvaliacaoBtn.setAttribute('aria-pressed', 'false');
				selecaoConfirmada.clear();
			} else {
				enableClickNarration(telaAvaliacao);
				telaAvaliacao.dataset.narrationActive = 'true';
				audioDescricaoAvaliacaoBtn.textContent = 'Desativar leitura por clique';
				audioDescricaoAvaliacaoBtn.setAttribute('aria-pressed', 'true');
				selecaoConfirmada.clear();
				if (speechSupported) narrarTexto('Esta é a escala de avaliação de compra. Responda às perguntas para obter uma análise da sua escolha.');
			}
			// re-registra listeners (evita duplicações)
			adicionarListenersOpcoes();
		});
	}

	// Resultado — alterna audiodescrição (mantém comportamento anterior)
	const audioResultadoBtn = document.getElementById('audioDescricaoResultado');
	if (audioResultadoBtn) {
		audioResultadoBtn.addEventListener('click', () => {
			const isActive = telaResultado.dataset.narrationActive === 'true';
			if (isActive) {
				disableClickNarration(telaResultado);
				telaResultado.dataset.narrationActive = 'false';
				audioResultadoBtn.textContent = 'Ouvir descrição da tela';
				audioResultadoBtn.setAttribute('aria-pressed', 'false');
			} else {
				enableClickNarration(telaResultado);
				telaResultado.dataset.narrationActive = 'true';
				audioResultadoBtn.textContent = 'Desativar leitura por clique';
				audioResultadoBtn.setAttribute('aria-pressed', 'true');
				if (speechSupported) {
					if (typeof ultimoTotal === 'number') {
						narrarResultado(ultimoTotal);
					} else {
						narrarTexto('Esta é a tela de resultados. Aqui você verá sua pontuação e dicas para melhorar suas decisões financeiras.');
					}
				}
			}
		});
	}

	// Event listeners para botões de resultado
	// if (voltarAoInicioResultadoBtn) {
	//     voltarAoInicioResultadoBtn.addEventListener('click', () => resetarTudo());
	// }
	if (responderNovamenteBtn) {
		responderNovamenteBtn.addEventListener('click', () => {
			avaliacaoForm.reset();
			document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
			perguntaAtual = 0;
			selecaoConfirmada.clear();
			atualizarPergunta();
			trocarTela(telaAvaliacao);
		});
	}

	// reset/initialização (mantém lógica anterior)
	function resetarTudo() {
		// Cancela qualquer narração em andamento ao resetar
		if (speechSupported && window.speechSynthesis) {
			try { window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
		}

		avaliacaoForm.reset();
		document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
		pontuacaoFinalSpan.textContent = '0';
		tituloResultado.textContent = '';
		mensagemDica.textContent = '';
		perguntaAtual = 0;
		selecaoConfirmada.clear();
		atualizarPergunta();
		trocarTela(telaAvaliacao);
	}

	// Inicializa telas, listeners
	trocarTela(telaAvaliacao);
	adicionarListenersOpcoes();
});