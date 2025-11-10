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

    if (solicitacao.origem && solicitacao.destino) {
        const markerO = L.marker([solicitacao.origem.lat, solicitacao.origem.lng]).addTo(map).bindPopup('Origem').openPopup();
        const markerD = L.marker([solicitacao.destino.lat, solicitacao.destino.lng]).addTo(map).bindPopup('Destino');

        const control = L.Routing.control({
            waypoints: [
                L.latLng(solicitacao.origem.lat, solicitacao.origem.lng),
                L.latLng(solicitacao.destino.lat, solicitacao.destino.lng)
            ],
            routeWhileDragging: false,
            addWaypoints: false,
            draggableWaypoints: false,
            showAlternatives: true,
            fitSelectedRoute: true,
            lineOptions: { styles: [{ color: '#ff6b6b', weight: 6 }] },
            router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' })
        }).addTo(map);

    } else {
        subinfo.textContent += ' — Origem ou destino não definidos. Defina-os no mapa antes de iniciar.';
    }
}
