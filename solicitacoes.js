function carregarSolicitacoes() {
    let raw = localStorage.getItem('solicitacoes');
    let lista = [];
    try {
        if (raw) lista = JSON.parse(raw);
    } catch (e) {
        console.error('Erro ao parsear solicitações', e);
    }

    const container = document.getElementById('listaSolicitacoes');
    container.innerHTML = '';

    if (!lista || lista.length === 0) {
        container.innerHTML = '<p class="vazio">Nenhuma solicitação encontrada.</p>';
        return;
    }

    // Lista já está em ordem com mais recentes primeiro (conforme envio)
    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';

        const h = document.createElement('h3');
        h.textContent = `${item.nome} — ${item.urgencia.toUpperCase()}`;

        const meta = document.createElement('div');
        meta.className = 'meta';
        meta.textContent = `Enviado em: ${new Date(item.timestamp).toLocaleString()}`;

        const campoTelefone = document.createElement('div');
        campoTelefone.className = 'campo';
        campoTelefone.textContent = `📞 ${item.telefone}`;

        const campoVeiculo = document.createElement('div');
        campoVeiculo.className = 'campo';
        campoVeiculo.textContent = `🚗 ${item.modelo || '-'} — Placa: ${item.placa || '-'}`;

        const campoObs = document.createElement('div');
        campoObs.className = 'campo';
        campoObs.textContent = `📝 ${item.observacao || '-'}`;

    const campoOrigem = document.createElement('div');
        campoOrigem.className = 'campo';
        campoOrigem.textContent = `📍 Origem: ${item.origem ? `${item.origem.lat.toFixed(4)}, ${item.origem.lng.toFixed(4)}` : 'Não definida'}`;

        const campoDestino = document.createElement('div');
        campoDestino.className = 'campo';
        campoDestino.textContent = `📍 Destino: ${item.destino ? `${item.destino.lat.toFixed(4)}, ${item.destino.lng.toFixed(4)}` : 'Não definida'}`;

    // Status
    const campoStatus = document.createElement('div');
    campoStatus.className = 'campo status';
    campoStatus.textContent = `Status: ${item.status || 'não iniciado'}`;

    // Botões de ação
    const acoes = document.createElement('div');
    acoes.className = 'acoes';

    const btnIniciar = document.createElement('button');
    btnIniciar.className = 'btn-small';
    btnIniciar.textContent = 'Iniciar';
    btnIniciar.addEventListener('click', () => iniciarSolicitacao(item.id));

    const btnMarcarConcluida = document.createElement('button');
    btnMarcarConcluida.className = 'btn-small';
    btnMarcarConcluida.textContent = 'Concluir';
    btnMarcarConcluida.addEventListener('click', () => concluirSolicitacao(item.id));

    acoes.appendChild(btnIniciar);
    acoes.appendChild(btnMarcarConcluida);

        div.appendChild(h);
        div.appendChild(meta);
        div.appendChild(campoTelefone);
        div.appendChild(campoVeiculo);
        div.appendChild(campoOrigem);
        div.appendChild(campoDestino);
        div.appendChild(campoObs);
    div.appendChild(campoStatus);
    div.appendChild(acoes);

        container.appendChild(div);
    });
}

function limparTudo() {
    if (!confirm('Tem certeza que deseja apagar todas as solicitações?')) return;
    localStorage.removeItem('solicitacoes');
    carregarSolicitacoes();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarSolicitacoes();
    const btnLimpar = document.getElementById('btnLimparTudo');
    if (btnLimpar) btnLimpar.addEventListener('click', limparTudo);
});

// Ações sobre solicitações
function atualizarListaEStorage(novaLista) {
    localStorage.setItem('solicitacoes', JSON.stringify(novaLista));
    carregarSolicitacoes();
}

function iniciarSolicitacao(id) {
    let raw = localStorage.getItem('solicitacoes');
    if (!raw) return;
    let lista = JSON.parse(raw);
    const idx = lista.findIndex(s => s.id === id);
    if (idx === -1) return;

    // marcar como em andamento
    lista[idx].status = 'em andamento';
    atualizarListaEStorage(lista);

    // abrir a página de rota passando id
    window.location.href = `rota.html?id=${id}`;
}

function concluirSolicitacao(id) {
    let raw = localStorage.getItem('solicitacoes');
    if (!raw) return;
    let lista = JSON.parse(raw);
    const idx = lista.findIndex(s => s.id === id);
    if (idx === -1) return;
    lista[idx].status = 'concluída';
    atualizarListaEStorage(lista);
}
