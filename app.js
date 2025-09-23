const BUILDINGS = [
    "104-106 Carter",
    "156 6e Rue",
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
    "567 Taschereau E",
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
    "4114 Riverains",
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
let markers = [];
let directionsService;
let directionsRenderer;
let geocoder;
let buildingsData = [];
let infoWindow;
let apiKey = '';

function initializeMap() {
    const centerLatLng = { lat: 48.2396, lng: -79.0132 };
    
    apiKey = window.googleMapsApiKey;
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: centerLatLng,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true
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
                
                streetViewService.getPanoramaByLocation(
                    { lat: coords.lat, lng: coords.lng },
                    50, // Rayon de recherche en mètres
                    (data, status) => {
                        let streetViewUrl;
                        
                        if (status === google.maps.StreetViewStatus.OK) {
                            // Calculer l'angle entre la position Street View et le bâtiment
                            const panoLocation = data.location.latLng;
                            const heading = google.maps.geometry.spherical.computeHeading(
                                panoLocation, 
                                new google.maps.LatLng(coords.lat, coords.lng)
                            );
                            
                            // Utiliser la position du panorama pour une meilleure vue
                            streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${panoLocation.lat()},${panoLocation.lng()}&fov=90&heading=${heading}&pitch=10&key=${apiKey}&source=outdoor`;
                        } else {
                            // Fallback si pas de Street View disponible
                            streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=400x300&location=${coords.lat},${coords.lng}&fov=90&heading=0&pitch=0&key=${apiKey}&source=outdoor`;
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

async function calculateGroupRoute(groupIndex) {
    const geocodedBuildings = buildingsData.filter(b => b.coordinates !== null);
    
    if (geocodedBuildings.length < 2) {
        alert('Il faut au moins 2 immeubles géocodés pour calculer un trajet.');
        return;
    }
    
    let buildingsToRoute = [];
    
    if (groupIndex === 'all') {
        // Pour tous les immeubles, on prend les 25 premiers pour l'instant
        alert(`Calcul du trajet pour tous les immeubles. Vue la limite de 25 waypoints, seuls les 25 premiers seront inclus.`);
        buildingsToRoute = geocodedBuildings.slice(0, 25);
    } else {
        // Calcul pour un groupe spécifique
        const startIdx = parseInt(groupIndex) * 25;
        const endIdx = Math.min(startIdx + 25, geocodedBuildings.length);
        buildingsToRoute = geocodedBuildings.slice(startIdx, endIdx);
        
        if (buildingsToRoute.length === 0) {
            alert('Aucun immeuble dans ce groupe.');
            return;
        }
        
        if (buildingsToRoute.length === 1) {
            alert('Un seul immeuble dans ce groupe, impossible de calculer un trajet.');
            return;
        }
    }
    
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
            document.getElementById('totalDistance').textContent = `${distanceInKm} km (${buildingsToRoute.length} immeubles)`;
            
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

if (typeof google === 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
        document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
        document.getElementById('searchInput').addEventListener('input', filterBuildings);
        document.getElementById('calculateGroupRouteBtn').addEventListener('click', () => {
            const groupSelect = document.getElementById('groupSelect');
            const selectedGroup = groupSelect.value;
            if (selectedGroup) {
                calculateGroupRoute(selectedGroup);
            } else {
                alert('Veuillez sélectionner un groupe.');
            }
        });
    });
} else {
    document.getElementById('showAllBtn').addEventListener('click', showAllBuildings);
    document.getElementById('clearRouteBtn').addEventListener('click', clearRoute);
    document.getElementById('searchInput').addEventListener('input', filterBuildings);
    document.getElementById('calculateGroupRouteBtn').addEventListener('click', () => {
        const groupSelect = document.getElementById('groupSelect');
        const selectedGroup = groupSelect.value;
        if (selectedGroup) {
            calculateGroupRoute(selectedGroup);
        } else {
            alert('Veuillez sélectionner un groupe.');
        }
    });
}