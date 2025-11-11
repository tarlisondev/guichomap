// Inicializar o mapa
const map = L.map('map').setView([-15.8267, -48.0516], 13); // Brasília como padrão

// Criar camadas de mapa
const mapaRua = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    minZoom: 2,
    name: 'Rua'
});

const mapaSatelite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, DigitalGlobe, Earthstar Geographics',
    maxZoom: 18,
    minZoom: 2,
    name: 'Satélite'
});

// Adicionar primeira camada (Rua)
mapaRua.addTo(map);

// Variável para rastrear o tipo de mapa atual
let mapaAtual = 'rua';

// Variáveis globais
let origem = null;
let destino = null;
let markerOrigem = null;
let markerDestino = null;
let rotaAntiga = null;
let modo = null; // 'origem' ou 'destino'

// Elementos DOM
const btnLimpar = document.getElementById('btnLimpar');
const btnMinhaLocalizacao = document.getElementById('btnMinhaLocalizacao');
const coordsOrigem = document.getElementById('coordsOrigem');
const coordsDestino = document.getElementById('coordsDestino');
const rotaInfo = document.getElementById('rotaInfo');
const statusLocalizacao = document.getElementById('statusLocalizacao');
const btnAlternarMapa = document.getElementById('btnAlternarMapa');
const routeLoading = document.getElementById('routeLoading');
// Campos do formulário de solicitação
const inputNome = document.getElementById('nome');
const inputTelefone = document.getElementById('telefone');
const inputModelo = document.getElementById('modelo');
const inputPlaca = document.getElementById('placa');
const selectUrgencia = document.getElementById('urgencia');
const textareaObservacao = document.getElementById('observacao');
const btnEnviarSolicitacao = document.getElementById('btnEnviarSolicitacao');
const envioStatus = document.getElementById('envioStatus');

// Variável para controlar se tem permissão de localização
let temPermissaoLocalizacao = false;
let isUserInteracting = false; // true enquanto o usuário arrasta/edita a rota
let _mapMouseDownHandler = null;
let _mapMouseUpHandler = null;

// Event Listeners
btnLimpar.addEventListener('click', limparTudo);
btnMinhaLocalizacao.addEventListener('click', obterMinhaLocalizacao);
btnAlternarMapa.addEventListener('click', alternarMapa);
btnEnviarSolicitacao.addEventListener('click', enviarSolicitacao);

// Função para alternar entre mapa de rua e satélite
function alternarMapa() {
    if (mapaAtual === 'rua') {
        // Trocar para satélite
        map.removeLayer(mapaRua);
        mapaSatelite.addTo(map);
        mapaAtual = 'satelite';
        btnAlternarMapa.textContent = '🗺️ Mapa';
        btnAlternarMapa.classList.add('ativo');
    } else {
        // Trocar para rua
        map.removeLayer(mapaSatelite);
        mapaRua.addTo(map);
        mapaAtual = 'rua';
        btnAlternarMapa.textContent = '🛰️ Satélite';
        btnAlternarMapa.classList.remove('ativo');
    }
}

// Clique no mapa para selecionar local
map.addEventListener('click', (e) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Mostrar popup para escolher se é origem ou destino
    const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(`
            <div style="text-align: center;">
                <p>Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
                <button onclick="setarLocal('origem', ${lat}, ${lng})" style="
                    padding: 6px 12px; 
                    margin: 4px; 
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer;
                ">Origem</button>
                <button onclick="setarLocal('destino', ${lat}, ${lng})" style="
                    padding: 6px 12px; 
                    margin: 4px; 
                    background: #e74c3c; 
                    color: white; 
                    border: none; 
                    border-radius: 4px; 
                    cursor: pointer;
                ">Destino</button>
            </div>
        `)
        .openOn(map);
});

// (Busca por texto removida — seleção por clique no mapa)

// Função para settar um local
function setarLocal(tipo, lat, lng) {
    
    if (tipo === 'origem') {
        origem = { lat, lng };
        
        if (markerOrigem) map.removeLayer(markerOrigem);
        
        markerOrigem = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('📍 Origem');
        
    coordsOrigem.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    } else {
        destino = { lat, lng };
        
        if (markerDestino) map.removeLayer(markerDestino);
        
        markerDestino = L.marker([lat, lng], {
            icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(map).bindPopup('📍 Destino');
        
    coordsDestino.textContent = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    }

    // Ajustar zoom para incluir todos os markers
    if (origem && destino) {
        const group = new L.featureGroup([markerOrigem, markerDestino]);
        map.fitBounds(group.getBounds().pad(0.1));
        // Se os dois pontos estiverem definidos, traçar a rota automaticamente (se não estiver interagindo)
        try {
            if (!isUserInteracting) tracarRota();
        } catch (e) {
            console.error('Erro ao traçar rota automaticamente:', e);
        }
    } else {
        map.setView([lat, lng], 15);
    }
}

// Função para traçar rota
function tracarRota() {
    if (!origem || !destino) {
        alert('Por favor, defina a origem e o destino primeiro!');
        return;
    }

    // se o usuário está interagindo com a rota manualmente, não refazer automaticamente
    if (isUserInteracting) {
        console.log('Auto-trace suspenso: usuário interagindo.');
        return;
    }

    showLoading();

    // Remover rota anterior se existir
    if (rotaAntiga) {
        map.removeControl(rotaAntiga);
    }

    // Criar controle de rota
    rotaAntiga = L.Routing.control({
        waypoints: [
            L.latLng(origem.lat, origem.lng),
            L.latLng(destino.lat, destino.lng)
        ],
        routeWhileDragging: true,
        showAlternatives: true,
        lineOptions: {
            styles: [{ color: '#3498db', opacity: 0.7, weight: 5 }]
        },
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
    }).addTo(map);

    // esconder overlay quando as rotas forem encontradas
    rotaAntiga.on('routesfound', function(e) {
        hideLoading();
    });

    rotaAntiga.on('routingerror', function(err) {
        hideLoading();
        console.error('Erro de roteamento:', err);
        alert('Erro ao calcular rota. Tente novamente.');
    });

    // detectar interações do usuário nos elementos do mapa (dragging de waypoints, etc.)
    attachMapInteractionHandlers();

    // Atualizar informações da rota
    rotaAntiga.on('routesfound', function(e) {
        const rota = e.routes[0];
        const distancia = (rota.summary.totalDistance / 1000).toFixed(2);
        const tempo = Math.round(rota.summary.totalTime / 60);

        rotaInfo.innerHTML = `
            <p><strong>Distância:</strong> ${distancia} km</p>
            <p><strong>Tempo estimado:</strong> ${tempo} minutos</p>
            <p><strong>Origem:</strong> ${origem ? `${origem.lat.toFixed(4)}, ${origem.lng.toFixed(4)}` : 'Não definida'}</p>
            <p><strong>Destino:</strong> ${destino ? `${destino.lat.toFixed(4)}, ${destino.lng.toFixed(4)}` : 'Não definida'}</p>
        `;
    });

    // Ajustar zoom para incluir a rota
    const group = new L.featureGroup([markerOrigem, markerDestino]);
    map.fitBounds(group.getBounds().pad(0.15));
}

// Função para limpar tudo
function limparTudo() {
    origem = null;
    destino = null;
    coordsOrigem.textContent = '';
    coordsDestino.textContent = '';
    rotaInfo.innerHTML = '<p>Nenhuma rota traçada</p>';

    if (markerOrigem) map.removeLayer(markerOrigem);
    if (markerDestino) map.removeLayer(markerDestino);
    if (rotaAntiga) map.removeControl(rotaAntiga);

    markerOrigem = null;
    markerDestino = null;
    rotaAntiga = null;

    map.setView([-15.8267, -48.0516], 13);
}

// Função para obter e usar a localização do usuário
function obterMinhaLocalizacao() {
    if (!navigator.geolocation) {
        mostrarStatus('Geolocalização não é suportada neste navegador.', 'error');
        return;
    }

    mostrarStatus('⏳ Detectando sua localização...', 'loading');
    btnMinhaLocalizacao.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Definir como origem automaticamente
            setarLocal('origem', latitude, longitude);
            coordsOrigem.textContent = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)} (precisão ~${accuracy.toFixed(0)}m)`;
            
            // Zoom no mapa para a localização
            map.setView([latitude, longitude], 15);
            
            mostrarStatus(`✅ Localização obtida com precisão de ${accuracy.toFixed(0)} metros!`, 'success');
            btnMinhaLocalizacao.disabled = false;
            
            // Fechar mensagem após 3 segundos
            setTimeout(() => {
                statusLocalizacao.textContent = '';
                statusLocalizacao.className = 'status-message';
            }, 3000);
        },
        (erro) => {
            let mensagemErro = '';
            
            switch(erro.code) {
                case erro.PERMISSION_DENIED:
                    mensagemErro = '❌ Você negou acesso à localização. Permita em suas configurações.';
                    break;
                case erro.POSITION_UNAVAILABLE:
                    mensagemErro = '❌ Sua localização não pode ser determinada.';
                    break;
                case erro.TIMEOUT:
                    mensagemErro = '❌ A detecção de localização demorou muito.';
                    break;
                default:
                    mensagemErro = '❌ Erro ao obter localização.';
            }
            
            mostrarStatus(mensagemErro, 'error');
            btnMinhaLocalizacao.disabled = false;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Função para mostrar mensagens de status
function mostrarStatus(mensagem, tipo) {
    statusLocalizacao.textContent = mensagem;
    statusLocalizacao.className = `status-message ${tipo}`;
}

// Requisitar permissão de localização ao carregar a página
function verificarPermissaoLocalizacao() {
    if (!navigator.geolocation) {
        btnMinhaLocalizacao.disabled = true;
        btnMinhaLocalizacao.title = 'Geolocalização não suportada';
        return;
    }

    // Tentar obter localização silenciosamente para verificar permissão
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            temPermissaoLocalizacao = true;
            map.setView([latitude, longitude], 13);
            mostrarStatus('✅ Permissão de localização concedida! Clique no botão para usar.', 'info');
            setTimeout(() => {
                statusLocalizacao.textContent = '';
                statusLocalizacao.className = 'status-message';
            }, 4000);
        },
        (erro) => {
            temPermissaoLocalizacao = false;
            mostrarStatus('💡 Clique em "Minha Localização" para usar seu local como origem.', 'info');
            setTimeout(() => {
                statusLocalizacao.textContent = '';
                statusLocalizacao.className = 'status-message';
            }, 4000);
        },
        {
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Chamar ao carregar
verificarPermissaoLocalizacao();

// --- Lógica de armazenamento de solicitações ---
let solicitacoes = loadSolicitacoesFromStorage();

function loadSolicitacoesFromStorage() {
    try {
        const raw = localStorage.getItem('solicitacoes');
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error('Erro ao ler solicitações do storage', e);
        return [];
    }
}

function salvarSolicitacoesStorage() {
    try {
        localStorage.setItem('solicitacoes', JSON.stringify(solicitacoes));
    } catch (e) {
        console.error('Erro ao salvar solicitações', e);
    }
}

function enviarSolicitacao(e) {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const telefone = inputTelefone.value.trim();
    const modelo = inputModelo.value.trim();
    const placa = inputPlaca.value.trim();
    const urgencia = selectUrgencia.value;
    const observacao = textareaObservacao.value.trim();

    if (!nome || !telefone) {
        mostrarStatusEnvio('Por favor, preencha pelo menos nome e telefone.', 'error');
        return;
    }

    const solicitacao = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        nome,
        telefone,
        modelo,
        placa,
        urgencia,
        observacao,
        status: 'não iniciado',
        origem: origem || null,
        destino: destino || null
    };

    // Adiciona no início para mostrar mais recentes primeiro
    solicitacoes.unshift(solicitacao);
    salvarSolicitacoesStorage();

    // Feedback e limpeza do formulário
    mostrarStatusEnvio('✅ Solicitação enviada com sucesso!', 'success');
    inputNome.value = '';
    inputTelefone.value = '';
    inputModelo.value = '';
    inputPlaca.value = '';
    selectUrgencia.value = 'baixa';
    textareaObservacao.value = '';

    // opcional: manter origem/destino
    setTimeout(() => {
        envioStatus.textContent = '';
    }, 3000);
}

function mostrarStatusEnvio(msg, tipo) {
    envioStatus.textContent = msg;
    if (tipo === 'success') {
        envioStatus.style.background = '#d5f4e6';
        envioStatus.style.color = '#27ae60';
        envioStatus.style.borderLeft = '4px solid #27ae60';
    } else {
        envioStatus.style.background = '#fadbd8';
        envioStatus.style.color = '#e74c3c';
        envioStatus.style.borderLeft = '4px solid #e74c3c';
    }
}

// Mostrar / esconder overlay de loading
function showLoading() {
    if (routeLoading) {
        routeLoading.classList.remove('hidden');
    }
}

function hideLoading() {
    if (routeLoading) {
        routeLoading.classList.add('hidden');
    }
}

// Anexar handlers para detectar quando o usuário interage com elementos do roteamento
function attachMapInteractionHandlers() {
    const container = map.getContainer();
    if (!container) return;

    // evitar múltiplas ligações
    if (_mapMouseDownHandler) return;

    _mapMouseDownHandler = function (e) {
        const target = e.target || e.srcElement;
        if (!target) return;
        // se o alvo for um elemento de waypoint/draghandle do routing, consideramos interação
        const cls = target.className || '';
        if (typeof cls === 'string' && (cls.indexOf('leaflet-routing-waypoint') !== -1 || cls.indexOf('leaflet-routing-draggable') !== -1 || cls.indexOf('leaflet-drag-handle') !== -1 || cls.indexOf('leaflet-routing-waypoint-marker') !== -1)) {
            isUserInteracting = true;
        }
    };

    _mapMouseUpHandler = function () {
        // pequena debounce para não reativar imediatamente o auto-trace
        isUserInteracting = false;
    };

    container.addEventListener('mousedown', _mapMouseDownHandler);
    container.addEventListener('touchstart', _mapMouseDownHandler);
    container.addEventListener('mouseup', _mapMouseUpHandler);
    container.addEventListener('touchend', _mapMouseUpHandler);
}
