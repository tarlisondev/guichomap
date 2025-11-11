// Ler id da query string
function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

const id = getQueryParam('id');
const map = L.map('map').setView([-15.8267, -48.0516], 13);

const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

function carregarSolicitacao(id) {
    const raw = localStorage.getItem('solicitacoes');
    if (!raw) return null;
    const lista = JSON.parse(raw);
    return lista.find(s => String(s.id) === String(id)) || null;
}

const solicitacao = carregarSolicitacao(id);
const titulo = document.getElementById('titulo');
const subinfo = document.getElementById('subinfo');

if (!solicitacao) {
    titulo.textContent = 'Solicitação não encontrada';
    subinfo.textContent = 'Volte para a lista de solicitações.';
} else {
    titulo.textContent = `Rota: ${solicitacao.nome}`;
    subinfo.textContent = `Urgência: ${solicitacao.urgencia} — Enviado: ${new Date(solicitacao.timestamp).toLocaleString()}`;

    // Verificar se temos localização do operador
    let pontoPartida, pontoDestino, labelPartida, labelDestino;

    if (solicitacao.operadorLocalizacao && solicitacao.origem) {
        // Rota da localização do operador para a origem da solicitação
        pontoPartida = {
            lat: solicitacao.operadorLocalizacao.latitude,
            lng: solicitacao.operadorLocalizacao.longitude
        };
        pontoDestino = solicitacao.origem;
        labelPartida = 'Sua Localização';
        labelDestino = 'Origem da Solicitação';
    } else if (solicitacao.origem && solicitacao.destino) {
        // Rota original: origem para destino
        pontoPartida = solicitacao.origem;
        pontoDestino = solicitacao.destino;
        labelPartida = 'Origem';
        labelDestino = 'Destino';
    } else {
        subinfo.textContent += ' — Origem ou destino não definidos. Defina-os no mapa antes de iniciar.';
        pontoPartida = null;
    }

    if (pontoPartida) {
        const markerO = L.marker([pontoPartida.lat, pontoPartida.lng]).addTo(map).bindPopup(labelPartida).openPopup();
        const markerD = L.marker([pontoDestino.lat, pontoDestino.lng]).addTo(map).bindPopup(labelDestino);

        const control = L.Routing.control({
            waypoints: [
                L.latLng(pontoPartida.lat, pontoPartida.lng),
                L.latLng(pontoDestino.lat, pontoDestino.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            showAlternatives: true,
            fitSelectedRoute: true,
            lineOptions: { styles: [{ color: '#ff6b6b', weight: 6 }] },
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
        }).addTo(map);
    }
}
