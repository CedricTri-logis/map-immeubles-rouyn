const SECTORS = [
    {
        name: "Centre-Ville (Principale)",
        buildings: [
            "31-37 Principale",
            "73-77 Principale",
            "79-87 Principale",
            "151-159 Principale",
            "187-193 Principale",
            "234-238 Principale",
            "296-300 Principale",
            "89 Notre-Dame",
            "96 Horne",
            "5-9 Gatineau",
            "136 Champlain"
        ]
    },
    {
        name: "Secteur Taschereau",
        buildings: [
            "26 Taschereau E",
            "49-53 Taschereau E",
            "73-77 Taschereau E",
            "89 Taschereau E",
            "108-114 Taschereau E",
            "375-377 Taschereau E",
            "567 Taschereau E",
            "633 Taschereau E",
            "44 Taschereau O",
            "306 Taschereau O"
        ]
    },
    {
        name: "Secteur Mgr-Tessier & Mgr-Rheaume",
        buildings: [
            "74-78 Mgr-Tessier O",
            "107 Mgr-Tessier O",
            "109-113 Mgr-Tessier O",
            "110-114 Mgr-Tessier O",
            "117-119 Mgr-Tessier O",
            "123-125 Mgr-Tessier O",
            "91 Mgr-Rheaume E",
            "307 Mgr-Rheaume E",
            "24 Mgr-Latulipe E",
            "270 Mgr-Latulipe E"
        ]
    },
    {
        name: "Secteur Perreault",
        buildings: [
            "14-20 Perreault E",
            "29 Perreault E",
            "45 Perreault E",
            "58-60 Perreault E",
            "62-66 Perreault E",
            "1384-1392 Perreault E",
            "43-45 Perreault O",
            "35-41 Pinder E",
            "83-87 Pinder E",
            "42-48 Pinder O"
        ]
    },
    {
        name: "Secteur Cardinal-Begin & Dallaire",
        buildings: [
            "122 Cardinal-Begin E",
            "254-258 Cardinal-Begin E",
            "260-264 Cardinal-Begin E",
            "308 Cardinal-Begin E",
            "103-105 Dallaire",
            "110 Dallaire",
            "284-288 Dallaire",
            "276-282 Gagne",
            "378-382 Gagne"
        ]
    },
    {
        name: "Secteur Montreal & Iberville",
        buildings: [
            "44-48 Montreal O",
            "68-72 Montreal O",
            "355 Montreal O",
            "73-77 Iberville O",
            "80 Des Oblats O",
            "22-28 Gamble O"
        ]
    },
    {
        name: "Secteur Carter & 8e Rue",
        buildings: [
            "52 Carter",
            "104-106 Carter",
            "173-177 Carter",
            "17 8e Rue",
            "109 8e Rue",
            "215 8e Rue",
            "156 6e Rue",
            "7-15 15e Rue"
        ]
    },
    {
        name: "Secteur Richard & Lariviere",
        buildings: [
            "469-473 Richard",
            "490 Richard",
            "529-531 Richard",
            "587 Lariviere",
            "784 Lariviere",
            "992 Lariviere",
            "718 Laliberte",
            "539 Girard"
        ]
    },
    {
        name: "Secteur Ste-Bernadette & Nord",
        buildings: [
            "525-531 Ste-Bernadette",
            "628-636 Ste-Bernadette",
            "1109-1115 Charbonneau",
            "1141 du Jardin",
            "806 Emile-Dussault",
            "480 Universite",
            "500 Boutour"
        ]
    },
    {
        name: "Secteur Résidentiel Est",
        buildings: [
            "154 Charlebois",
            "184-190 Tremoy",
            "194-198 Chenier",
            "2-6 Sam-Laporte",
            "26 Bertrand",
            "30 Gelineau",
            "32 Gelineau",
            "40 Matapedia",
            "50-54 Mercier"
        ]
    },
    {
        name: "Secteur Granada & Riverains",
        buildings: [
            "2349-2357 Granada",
            "4114 Riverains",
            "4996 Hull",
            "7313 Saguenay"
        ]
    }
];

const BUILDINGS = SECTORS.flatMap(sector => sector.buildings);

let map;
let markers = [];
let directionsService;
let directionsRenderer;
let geocoder;
let buildingsData = [];
let infoWindow;
let apiKey = '';
let currentSector = null;

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
    
    // Populate sectors dropdown before loading buildings
    populateSectorSelect();
    
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
        "31-37 Principale": "31 Avenue Principale, Rouyn-Noranda, QC J9X 4P1, Canada"
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

function populateSectorSelect() {
    const sectorSelect = document.getElementById('sectorSelect');
    sectorSelect.innerHTML = '<option value="">-- Sélectionnez un secteur --</option>';
    
    SECTORS.forEach((sector, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${sector.name} (${sector.buildings.length} immeubles)`;
        sectorSelect.appendChild(option);
    });
}

async function loadBuildings() {
    const buildingList = document.getElementById('buildingList');
    const totalBuildings = document.getElementById('totalBuildings');
    const buildingCount = document.getElementById('buildingCount');
    
    totalBuildings.textContent = BUILDINGS.length;
    buildingCount.textContent = BUILDINGS.length;
    
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
            
            resolve({ address, coords, buildingData });
        });
    });
    
    // Attendre que toutes les adresses soient géocodées
    const results = await Promise.all(geocodePromises);
    
    // Effacer l'indicateur de chargement
    buildingList.innerHTML = '';
    
    // Créer tous les marqueurs et éléments de liste en une fois
    results.forEach(({ address, coords, buildingData }) => {
        const listItem = document.createElement('div');
        listItem.className = 'building-item';
        listItem.dataset.address = address;
        
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
            markers.push(marker);
            bounds.extend(marker.position);
            
            listItem.innerHTML = `
                <h4>${address}</h4>
                <p>Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}</p>
                <span class="status geocoded">Géocodé</span>
            `;
            
            listItem.addEventListener('click', () => {
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
                <h4>${address}</h4>
                <p>Impossible de géocoder cette adresse</p>
                <span class="status not-geocoded">Non géocodé</span>
            `;
        }
        
        buildingList.appendChild(listItem);
        buildingsData.push(buildingData);
    });
    
    updateStats(geocodedCount);
    
    if (markers.length > 0) {
        map.fitBounds(bounds);
    }
}

function updateStats(geocodedCount) {
    const geocodedBuildings = document.getElementById('geocodedBuildings');
    geocodedBuildings.textContent = geocodedCount || buildingsData.filter(b => b.coordinates !== null).length;
}

async function calculateSectorRoute() {
    const sectorSelect = document.getElementById('sectorSelect');
    const sectorIndex = parseInt(sectorSelect.value);
    
    if (isNaN(sectorIndex)) {
        alert('Veuillez sélectionner un secteur.');
        return;
    }
    
    const sector = SECTORS[sectorIndex];
    currentSector = sector;
    
    // Filtrer les immeubles géocodés pour ce secteur
    const sectorBuildingsData = buildingsData.filter(b => 
        b.coordinates !== null && sector.buildings.includes(b.originalAddress)
    );
    
    if (sectorBuildingsData.length < 2) {
        alert(`Le secteur ${sector.name} doit avoir au moins 2 immeubles géocodés pour calculer un trajet.`);
        return;
    }
    
    // Highlight sector buildings on the map
    highlightSectorBuildings(sector);
    
    let buildingsToRoute = sectorBuildingsData;
    
    const origin = buildingsToRoute[0].coordinates;
    const destination = buildingsToRoute[buildingsToRoute.length - 1].coordinates;
    const waypoints = buildingsToRoute.slice(1, -1).map(b => ({
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
            const sectorName = currentSector ? currentSector.name : 'Groupe';
            document.getElementById('totalDistance').textContent = `${distanceInKm} km (${buildingsToRoute.length} immeubles - ${sectorName})`;
            
            const optimizedOrder = result.routes[0].waypoint_order;
            console.log('Ordre optimisé des waypoints:', optimizedOrder);
        } else {
            alert('Erreur lors du calcul du trajet: ' + status);
        }
    });
}

function clearRoute() {
    directionsRenderer.setDirections({ routes: [] });
    document.getElementById('totalDistance').textContent = '-';
    currentSector = null;
    resetMarkerColors();
}

function highlightSectorBuildings(sector) {
    // Reset all markers to default color first
    resetMarkerColors();
    
    // Highlight sector buildings
    markers.forEach((marker, index) => {
        const buildingData = buildingsData[index];
        if (buildingData && sector.buildings.includes(buildingData.originalAddress)) {
            marker.setIcon({
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
        }
    });
    
    // Zoom to sector buildings
    const bounds = new google.maps.LatLngBounds();
    buildingsData.forEach(building => {
        if (building.coordinates && sector.buildings.includes(building.originalAddress)) {
            bounds.extend({ lat: building.coordinates.lat, lng: building.coordinates.lng });
        }
    });
    
    if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
    }
}

function resetMarkerColors() {
    markers.forEach(marker => {
        marker.setIcon(null); // Reset to default red marker
    });
}

function showAllBuildings() {
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend(marker.position);
        });
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

function filterBySector() {
    const sectorSelect = document.getElementById('sectorSelect');
    const sectorIndex = sectorSelect.value;
    const items = document.querySelectorAll('.building-item');
    
    if (sectorIndex === '') {
        // Show all buildings
        items.forEach(item => {
            item.style.display = 'block';
        });
        resetMarkerColors();
        showAllBuildings();
    } else {
        const sector = SECTORS[parseInt(sectorIndex)];
        items.forEach(item => {
            const address = item.dataset.address;
            if (sector.buildings.includes(address)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        highlightSectorBuildings(sector);
    }
    
    // Update building count
    const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
    document.getElementById('buildingCount').textContent = visibleItems.length;
}

if (typeof google === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
        document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
        document.getElementById('searchInput').addEventListener('input', filterBuildings);
        document.getElementById('calculateSectorRouteBtn').addEventListener('click', calculateSectorRoute);
        document.getElementById('sectorSelect').addEventListener('change', filterBySector);
    });
} else {
    document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
    document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
    document.getElementById('searchInput').addEventListener('input', filterBuildings);
    document.getElementById('calculateSectorRouteBtn').addEventListener('click', calculateSectorRoute);
    document.getElementById('sectorSelect').addEventListener('change', filterBySector);
}