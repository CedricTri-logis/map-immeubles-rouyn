const BUILDINGS = [
    "104-106 Carter",
    "107 Mgr-Tessier O",
    "108-114 Taschereau E",
    "109-113 Mgr-Tessier O",
    "110-114 Mgr-Tessier O",
    "1109-1115 Charbonneau",
    "1141 du Jardin",
    "117-119 Mgr-Tessier O",
    "123-125 Mgr-Tessier O",
    "1384-1392 Perreault E",
    "14-20 Perreault E",
    "151-159 Principale",
    "154 Charlebois",
    "17 8e Rue",
    "173-177 Carter",
    "184-190 Tremoy",
    "187-193 Principale",
    "194-198 Chenier",
    "2-6 Sam-Laporte",
    "22-28 Gamble O",
    "234-238 Principale",
    "2349-2357 Granada",
    "24 Mgr-Latulipe E",
    "254-258 Cardinal-Begin E",
    "26 Bertrand",
    "26 Taschereau E",
    "260-264 Cardinal-Begin E",
    "270 Mgr-Latulipe E",
    "276-282 Gagne",
    "284-288 Dallaire",
    "29 Perreault E",
    "296-300 Principale",
    "30 Gelineau",
    "31-37 Principale",
    "32 Gelineau",
    "35-41 Pinder E",
    "375-377 Taschereau E",
    "378-382 Gagne",
    "40 Matapedia",
    "42-48 Pinder O",
    "43-45 Perreault O",
    "44 Taschereau O",
    "44-48 Montreal O",
    "45 Perreault E",
    "469-473 Richard",
    "480 Universite",
    "49-53 Taschereau E",
    "4996 Hull",
    "50-54 Mercier",
    "500 Boutour",
    "525-531 Ste-Bernadette",
    "529-531 Richard",
    "539 Girard",
    "58-60 Perreault E",
    "587 Lariviere",
    "62-66 Perreault E",
    "628-636 Ste-Bernadette",
    "633 Taschereau E",
    "68-72 Montreal O",
    "7-15 15e Rue",
    "73-77 Iberville O",
    "73-77 Taschereau E",
    "7313 Saguenay",
    "74-78 Mgr-Tessier O",
    "784 Lariviere",
    "80 Des Oblats O",
    "806 Emile-Dussault",
    "83-87 Pinder E",
    "89 Notre-Dame",
    "91 Mgr-Rheaume E",
    "96 Horne",
    "992 Lariviere",
    "103-105 Dallaire",
    "718 Laliberte",
    "490 Richard",
    "307 Mgr-Rheaume E",
    "308 Cardinal-Begin E",
    "122 Cardinal-Begin E",
    "89 Taschereau E",
    "355 Montreal O",
    "79-87 Principale",
    "73-77 Principale",
    "109 8e Rue",
    "215 8e Rue",
    "52 Carter",
    "136 Champlain",
    "5-9 Gatineau",
    "110 Dallaire",
    "306 Taschereau O"
];

let map;
let markers = new Array(BUILDINGS.length).fill(null);
let directionsService;
let directionsRenderer;
let geocoder;
let buildingsData = new Array(BUILDINGS.length).fill(null);
let infoWindow;
let apiKey = '';
let selectedBuildings = new Set();
let visibleMarkers = [];

function initializeMap() {
    const centerLatLng = { lat: 48.2396, lng: -79.0132 };
    
    apiKey = window.googleMapsApiKey;
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: centerLatLng,
        mapTypeControl: window.innerWidth > 768,
        streetViewControl: window.innerWidth > 768,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy' // Better mobile touch handling
    });
    
    geocoder = new google.maps.Geocoder();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#667eea',
            strokeWeight: 4,
            strokeOpacity: 0.7
        }
    });
    
    infoWindow = new google.maps.InfoWindow();
    
    // Add map listeners for bounds changes
    map.addListener('bounds_changed', debounce(() => {
        updateVisibleBuildings();
    }, 300));
    
    loadBuildings();
}

function normalizeAddress(address) {
    // Cas spéciaux pour certaines adresses problématiques
    const specialCases = {
        "79-87 Principale": "79 Avenue Principale, Rouyn-Noranda, QC J9X 4P2, Canada",
        "73-77 Principale": "73 Avenue Principale, Rouyn-Noranda, QC J9X 4P2, Canada", 
        "151-159 Principale": "151 Avenue Principale, Rouyn-Noranda, QC J9X 4P5, Canada",
        "187-193 Principale": "187 Avenue Principale, Rouyn-Noranda, QC J9X 4P5, Canada",
        "234-238 Principale": "234 Avenue Principale, Rouyn-Noranda, QC J9X 4P6, Canada",
        "296-300 Principale": "296 Avenue Principale, Rouyn-Noranda, QC J9X 4P7, Canada",
        "31-37 Principale": "31 Avenue Principale, Rouyn-Noranda, QC J9X 4P1, Canada",
        "4996 Hull": "4996 Rang Hull, Rouyn-Noranda, QC, Canada",
        "7313 Saguenay": "7313 rue saguenay, Rouyn-Noranda, QC, Canada"
    };
    
    // Vérifier si c'est un cas spécial
    if (specialCases[address]) {
        return specialCases[address];
    }
    
    // Traitement normal pour les autres adresses
    let cleanAddress = address
        .replace(/\//g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Améliorer certains noms de rues
    cleanAddress = cleanAddress
        .replace(/\bO\b/gi, 'Ouest')
        .replace(/\bE\b/gi, 'Est')
        .replace(/\bMgr\b/gi, 'Monseigneur')
        .replace(/\bSte\b/gi, 'Sainte');
    
    // Ajouter "Avenue" pour les adresses Principale si pas déjà présent
    if (cleanAddress.includes('Principale') && !cleanAddress.includes('Avenue Principale')) {
        cleanAddress = cleanAddress.replace('Principale', 'Avenue Principale');
    }
    
    return `${cleanAddress}, Rouyn-Noranda, QC, Canada`;
}

async function geocodeAddress(address) {
    const normalizedAddress = normalizeAddress(address);
    
    return new Promise((resolve, reject) => {
        geocoder.geocode({ address: normalizedAddress }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                    formatted_address: results[0].formatted_address,
                    place_id: results[0].place_id
                });
            } else {
                console.error(`Erreur de géocodage pour ${address}: ${status}`);
                resolve(null);
            }
        });
    });
}

async function loadBuildings() {
    const buildingList = document.getElementById('buildingList');
    const totalBuildings = document.getElementById('totalBuildings');
    const buildingCount = document.getElementById('buildingCount');
    const visibleCount = document.getElementById('visibleCount');

    totalBuildings.textContent = BUILDINGS.length;
    buildingCount.textContent = BUILDINGS.length;
    if (visibleCount) {
        visibleCount.textContent = `${BUILDINGS.length} immeubles visibles`;
    }
    
    // Afficher un indicateur de chargement
    buildingList.innerHTML = '<div class="loading-indicator">Géocodage des adresses en cours...</div>';
    
    const bounds = new google.maps.LatLngBounds();
    let geocodedCount = 0;
    
    // Géocoder toutes les adresses en parallèle avec un délai pour éviter les limites de taux
    const geocodePromises = BUILDINGS.map((address, index) => {
        return new Promise(async (resolve) => {
            // Délai échelonné pour éviter de surcharger l'API
            await new Promise(r => setTimeout(r, index * 50));
            
            const buildingData = {
                originalAddress: address,
                coordinates: null,
                marker: null
            };
            
            const coords = await geocodeAddress(address);
            
            if (coords) {
                buildingData.coordinates = coords;
                geocodedCount++;
            }
            
            resolve({ index, address, coords, buildingData });
        });
    });
    
    // Attendre que toutes les adresses soient géocodées
    const results = await Promise.all(geocodePromises);
    
    // Effacer l'indicateur de chargement
    buildingList.innerHTML = '';
    
    // Créer tous les marqueurs et éléments de liste en une fois
    results.forEach(({ index, address, coords, buildingData }) => {
        const listItem = document.createElement('div');
        listItem.className = 'building-item';
        listItem.dataset.address = address;
        listItem.dataset.index = index;
        
        if (coords) {
            const marker = new google.maps.Marker({
                position: { lat: coords.lat, lng: coords.lng },
                map: map,
                title: address,
                animation: google.maps.Animation.DROP
            });
            
            marker.addListener('click', async () => {
                // Obtenir le service Street View pour trouver le meilleur panorama
                const streetViewService = new google.maps.StreetViewService();
                
                // Chercher d'abord les panoramas disponibles dans un rayon plus large
                streetViewService.getPanoramaByLocation(
                    { lat: coords.lat, lng: coords.lng },
                    100, // Augmenter le rayon à 100m pour avoir plus d'options
                    (data, status) => {
                        let streetViewUrl;
                        
                        if (status === google.maps.StreetViewStatus.OK && data.location) {
                            // Position du panorama Street View
                            const panoLat = data.location.latLng.lat();
                            const panoLng = data.location.latLng.lng();
                            
                            // Calculer la direction depuis le panorama vers le bâtiment
                            // C'est l'inverse de ce qu'on faisait avant
                            const buildingLatLng = new google.maps.LatLng(coords.lat, coords.lng);
                            const panoLatLng = new google.maps.LatLng(panoLat, panoLng);
                            
                            // L'angle pour regarder VERS le bâtiment DEPUIS la position Street View
                            const heading = google.maps.geometry.spherical.computeHeading(
                                panoLatLng,  // FROM: position de la caméra
                                buildingLatLng  // TO: position du bâtiment
                            );
                            
                            // Utiliser directement les coordonnées du bâtiment pour être sûr d'avoir la bonne vue
                            // Mais avec l'angle calculé pour regarder vers le bon endroit
                            streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${coords.lat},${coords.lng}&fov=80&heading=${heading}&pitch=5&key=${apiKey}&source=outdoor`;
                        } else {
                            // Fallback: essayer avec plusieurs angles prédéfinis
                            const defaultHeadings = [0, 90, 180, 270]; // N, E, S, O
                            const randomHeading = defaultHeadings[Math.floor(Math.random() * 4)];
                            streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${coords.lat},${coords.lng}&fov=80&heading=${randomHeading}&pitch=5&key=${apiKey}&source=outdoor`;
                        }
                        
                        infoWindow.setContent(`
                            <div class="popup-content">
                                <h3>${address}</h3>
                                <p style="font-size: 0.85rem; color: #666; margin: 5px 0;">${coords.formatted_address}</p>
                                <img src="${streetViewUrl}" alt="Street View de ${address}" class="street-view-image" style="width: 100%; max-width: 400px; height: auto; margin-top: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                            </div>
                        `);
                        
                        infoWindow.open(map, marker);
                    }
                );
            });
            
            buildingData.marker = marker;
            markers[index] = marker;
            bounds.extend(marker.position);
            
            listItem.innerHTML = `
                <input type="checkbox" class="building-checkbox" data-address="${address}" id="cb-${index}">
                <div class="building-info">
                    <h4>${address}</h4>
                    <p>Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}</p>
                    <span class="status geocoded">Géocodé</span>
                </div>
            `;
            
            // Add checkbox listener
            const checkbox = listItem.querySelector('.building-checkbox');
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                if (e.target.checked) {
                    selectedBuildings.add(address);
                    marker.setIcon({
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    });
                } else {
                    selectedBuildings.delete(address);
                    marker.setIcon(null);
                }
                updateSelectedCount();
            });
            
            listItem.addEventListener('click', (e) => {
                if (e.target.type === 'checkbox') return;
                map.setCenter({ lat: coords.lat, lng: coords.lng });
                map.setZoom(16);
                google.maps.event.trigger(marker, 'click');
                
                document.querySelectorAll('.building-item').forEach(item => {
                    item.classList.remove('active');
                });
                listItem.classList.add('active');
            });
        } else {
            listItem.innerHTML = `
                <input type="checkbox" class="building-checkbox" data-address="${address}" id="cb-${index}" disabled>
                <div class="building-info">
                    <h4>${address}</h4>
                    <p>Impossible de géocoder cette adresse</p>
                    <span class="status not-geocoded">Non géocodé</span>
                </div>
            `;
            markers[index] = null;
        }
        
        buildingList.appendChild(listItem);
        buildingsData[index] = buildingData;
    });
    
    updateStats(geocodedCount);
    
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
    }
}

function updateStats(geocodedCount) {
    const geocodedBuildings = document.getElementById('geocodedBuildings');
    geocodedBuildings.textContent = geocodedCount || buildingsData.filter(b => b.coordinates !== null).length;
}

function updateSelectedCount() {
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        selectedCount.textContent = selectedBuildings.size;
    }
    
    const calculateSelectedBtn = document.getElementById('calculateSelectedBtn');
    if (calculateSelectedBtn) {
        calculateSelectedBtn.disabled = selectedBuildings.size < 2;
    }
}

function selectAllVisible() {
    const visibleCheckboxes = document.querySelectorAll('.building-item:not([style*="display: none"]) .building-checkbox:not(:disabled)');
    visibleCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            const address = checkbox.dataset.address;
            selectedBuildings.add(address);
            
            // Update marker color
            const index = BUILDINGS.indexOf(address);
            if (markers[index]) {
                markers[index].setIcon({
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                });
            }
        }
    });
    updateSelectedCount();
}

function deselectAll() {
    const checkboxes = document.querySelectorAll('.building-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    selectedBuildings.clear();
    
    // Reset all marker colors
    markers.forEach(marker => {
        if (marker) {
            marker.setIcon(null);
        }
    });
    
    updateSelectedCount();
}

function calculateSelectedRoute() {
    if (selectedBuildings.size < 2) {
        alert('Veuillez sélectionner au moins 2 immeubles pour calculer un trajet.');
        return;
    }
    
    const selectedBuildingsData = buildingsData.filter(b => 
        b.coordinates !== null && selectedBuildings.has(b.originalAddress)
    );
    
    if (selectedBuildingsData.length < 2) {
        alert('Il faut au moins 2 immeubles géocodés pour calculer un trajet.');
        return;
    }
    
    const origin = selectedBuildingsData[0].coordinates;
    const destination = selectedBuildingsData[selectedBuildingsData.length - 1].coordinates;
    const waypoints = selectedBuildingsData.slice(1, -1).map(b => ({
        location: { lat: b.coordinates.lat, lng: b.coordinates.lng },
        stopover: true
    }));
    
    const request = {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            let totalDistance = 0;
            const route = result.routes[0];
            
            for (let i = 0; i < route.legs.length; i++) {
                totalDistance += route.legs[i].distance.value;
            }
            
            const distanceInKm = (totalDistance / 1000).toFixed(2);
            document.getElementById('totalDistance').textContent = `${distanceInKm} km (${selectedBuildingsData.length} immeubles sélectionnés)`;
        } else {
            alert('Erreur lors du calcul du trajet: ' + status);
        }
    });
}


function clearRoute() {
    directionsRenderer.setDirections({ routes: [] });
    document.getElementById('totalDistance').textContent = '-';
}

function showAllBuildings() {
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
        if (marker && marker.getPosition) {
            bounds.extend(marker.getPosition());
        }
    });

    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
    }
}

function filterBuildings() {
    const searchTerm = this.value.toLowerCase();
    const items = document.querySelectorAll('.building-item');
    
    items.forEach(item => {
        const address = item.dataset.address.toLowerCase();
        if (address.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}


if (typeof google === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
        document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
        document.getElementById('searchInput').addEventListener('input', filterBuildings);
        document.getElementById('selectAllVisibleBtn').addEventListener('click', selectAllVisible);
        document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
        document.getElementById('calculateSelectedBtn').addEventListener('click', calculateSelectedRoute);
    });
} else {
    document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
    document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
    document.getElementById('searchInput').addEventListener('input', filterBuildings);
    document.getElementById('selectAllVisibleBtn').addEventListener('click', selectAllVisible);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
    document.getElementById('calculateSelectedBtn').addEventListener('click', calculateSelectedRoute);
}
