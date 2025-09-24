// TSP Route Optimization Module
// Optimizes route for 89 buildings using real road distances

let distanceMatrix = null;
let optimizedRoute = [];
let optimizedRoutePolyline = null;

// Calculate distance matrix using OSRM (Open Source Routing Machine)
async function calculateDistanceMatrixOSRM(locations) {
    const n = locations.length;
    const matrix = [];
    
    try {
        // Build coordinates string for OSRM
        const coords = locations.map(loc => `${loc.lng},${loc.lat}`).join(';');
        
        // OSRM public server - Table service for distance matrix
        const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance`;
        
        console.log(`Récupération des distances routières réelles pour ${n} adresses via OSRM...`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`OSRM server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code === 'Ok' && data.distances) {
            // OSRM returns distances in meters
            for (let i = 0; i < n; i++) {
                matrix[i] = [];
                for (let j = 0; j < n; j++) {
                    matrix[i][j] = data.distances[i][j] || 0;
                }
            }
            console.log('✅ Distances routières réelles calculées avec succès!');
            return { matrix, type: 'road' };
        } else {
            console.warn('OSRM response:', data.code, data.message);
            throw new Error(data.message || 'OSRM API returned no data');
        }
    } catch (error) {
        console.error('OSRM indisponible, utilisation des distances approximatives:', error.message);
        
        // Show user that we're falling back
        const optimizeBtn = document.getElementById('optimizeRouteBtn');
        if (optimizeBtn && optimizeBtn.textContent.includes('Calcul')) {
            optimizeBtn.textContent = 'Calcul des distances approximatives...';
        }
        
        // Fallback to Haversine with road factor
        const ROAD_FACTOR = 1.3; // Roads are typically 30% longer
        for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    matrix[i][j] = 0;
                } else {
                    matrix[i][j] = haversineDistance(locations[i], locations[j]) * ROAD_FACTOR;
                }
            }
        }
        return { matrix, type: 'approximate' };
    }
}

// Haversine distance calculation
function haversineDistance(coord1, coord2) {
    const R = 6371000; // Earth radius in meters
    const rad = Math.PI / 180;
    const lat1 = coord1.lat * rad;
    const lat2 = coord2.lat * rad;
    const deltaLat = (coord2.lat - coord1.lat) * rad;
    const deltaLng = (coord2.lng - coord1.lng) * rad;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

// Calculate distance matrix - always use road distances
async function calculateDistanceMatrix(locations) {
    const n = locations.length;
    
    // Try OSRM for real road distances
    if (n <= 100) {
        const result = await calculateDistanceMatrixOSRM(locations);
        return result.matrix;
    }
    
    // Fallback for very large sets
    console.log('Too many locations, using approximate distances');
    const matrix = [];
    const ROAD_FACTOR = 1.3;
    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 0;
            } else {
                matrix[i][j] = haversineDistance(locations[i], locations[j]) * ROAD_FACTOR;
            }
        }
    }
    return matrix;
}

// Nearest Neighbor TSP Algorithm
function solveTSPNearestNeighbor(distanceMatrix, startIndex) {
    const n = distanceMatrix.length;
    const visited = new Array(n).fill(false);
    const route = [startIndex];
    visited[startIndex] = true;
    
    let currentIndex = startIndex;
    
    for (let i = 0; i < n - 1; i++) {
        let nearestIndex = -1;
        let minDistance = Infinity;
        
        for (let j = 0; j < n; j++) {
            if (!visited[j] && distanceMatrix[currentIndex][j] < minDistance) {
                minDistance = distanceMatrix[currentIndex][j];
                nearestIndex = j;
            }
        }
        
        if (nearestIndex !== -1) {
            route.push(nearestIndex);
            visited[nearestIndex] = true;
            currentIndex = nearestIndex;
        }
    }
    
    return route;
}

// 2-opt improvement for TSP
function improve2Opt(route, distanceMatrix) {
    const n = route.length;
    let improved = true;
    let bestRoute = [...route];
    
    while (improved) {
        improved = false;
        
        for (let i = 1; i < n - 2; i++) {
            for (let j = i + 1; j < n; j++) {
                // Calculate current distance
                const currentDist = distanceMatrix[bestRoute[i - 1]][bestRoute[i]] +
                                   distanceMatrix[bestRoute[j]][bestRoute[(j + 1) % n]];
                
                // Calculate new distance after swap
                const newDist = distanceMatrix[bestRoute[i - 1]][bestRoute[j]] +
                               distanceMatrix[bestRoute[i]][bestRoute[(j + 1) % n]];
                
                // If improvement found, perform 2-opt swap
                if (newDist < currentDist) {
                    // Reverse the route between i and j
                    const newRoute = [
                        ...bestRoute.slice(0, i),
                        ...bestRoute.slice(i, j + 1).reverse(),
                        ...bestRoute.slice(j + 1)
                    ];
                    bestRoute = newRoute;
                    improved = true;
                }
            }
        }
    }
    
    return bestRoute;
}

// Main optimization function
async function optimizeRoute() {
    const startingPointSelect = document.getElementById('startingPoint');
    const startIndex = parseInt(startingPointSelect.value);
    
    if (isNaN(startIndex)) {
        alert('Veuillez sélectionner un point de départ.');
        return;
    }
    
    if (selectedBuildings.size === 0) {
        alert('Veuillez sélectionner au moins un immeuble à visiter.');
        return;
    }
    
    const optimizeBtn = document.getElementById('optimizeRouteBtn');
    const originalText = optimizeBtn.textContent;
    optimizeBtn.disabled = true;
    
    try {
        // Get selected buildings with coordinates
        const selectedBuildingsData = [];
        const selectedIndices = [];
        
        buildingsData.forEach((building, index) => {
            if (building && building.coordinates && selectedBuildings.has(building.originalAddress)) {
                selectedBuildingsData.push(building.coordinates);
                selectedIndices.push(index);
            }
        });
        
        // Add starting point if not already selected
        const startBuilding = buildingsData[startIndex];
        let startingPointIndex = 0;
        
        if (!selectedBuildings.has(startBuilding.originalAddress)) {
            selectedBuildingsData.unshift(startBuilding.coordinates);
            selectedIndices.unshift(startIndex);
        } else {
            startingPointIndex = selectedIndices.indexOf(startIndex);
        }
        
        const totalLocations = selectedBuildingsData.length;
        optimizeBtn.textContent = `Optimisation de ${totalLocations} adresses...`;
        
        // Calculate distance matrix with real road distances
        console.log(`Calculating distance matrix for ${totalLocations} locations...`);
        optimizeBtn.textContent = `Calcul des distances routières (${totalLocations} adresses)...`;
        
        const matrix = await calculateDistanceMatrix(selectedBuildingsData);
        
        // Solve TSP
        optimizeBtn.textContent = 'Recherche du trajet optimal...';
        console.log('Solving TSP...');
        let route = solveTSPNearestNeighbor(matrix, startingPointIndex);
        
        // Improve with 2-opt if route is small enough
        if (route.length <= 20) {
            optimizeBtn.textContent = 'Optimisation finale...';
            console.log('Applying 2-opt improvement...');
            route = improve2Opt(route, matrix);
        }
        
        // Map route back to building indices
        optimizedRoute = route.map(i => selectedIndices[i]);
        
        // Reorder the building list
        reorderBuildingList(optimizedRoute);
        
        // Display the optimized route on map
        optimizeBtn.textContent = 'Affichage du trajet...';
        displayOptimizedRoute(optimizedRoute);
        
        // Show export and clear buttons
        document.getElementById('exportRouteBtn').style.display = 'block';
        document.getElementById('clearOptimizedBtn').style.display = 'block';
        
        // Generate Google Maps navigation links for mobile
        generateNavigationLinks(optimizedRoute);
        
        console.log(`✅ Trajet optimisé pour ${totalLocations} adresses!`);
        
    } catch (error) {
        console.error('Error optimizing route:', error);
        alert('Erreur lors de l\'optimisation. Veuillez réessayer.');
    } finally {
        optimizeBtn.textContent = originalText;
        optimizeBtn.disabled = false;
    }
}

// Reorder building list based on optimized route
function reorderBuildingList(routeIndices) {
    const buildingList = document.getElementById('buildingList');
    const allItems = Array.from(buildingList.querySelectorAll('.building-item'));
    
    // Create a map of index to item
    const itemMap = {};
    allItems.forEach(item => {
        const index = parseInt(item.dataset.index);
        itemMap[index] = item;
    });
    
    // Clear the list
    buildingList.innerHTML = '';
    
    // Add items in optimized order
    routeIndices.forEach((index, position) => {
        const item = itemMap[index];
        if (item) {
            // Remove old badges
            const oldBadge = item.querySelector('.order-badge');
            if (oldBadge) oldBadge.remove();
            
            // Add order number
            const orderBadge = document.createElement('span');
            orderBadge.className = 'order-badge';
            orderBadge.textContent = (position + 1).toString();
            orderBadge.style.cssText = 'background: #667eea; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px; font-weight: bold; font-size: 0.8rem; flex-shrink: 0;';
            
            const buildingInfo = item.querySelector('.building-info');
            buildingInfo.insertBefore(orderBadge, buildingInfo.firstChild);
            
            // Highlight start and end
            if (position === 0) {
                item.style.border = '2px solid #667eea';
                item.style.background = 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)';
                const startLabel = document.createElement('span');
                startLabel.textContent = 'DÉPART';
                startLabel.style.cssText = 'background: #667eea; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem; font-weight: bold; margin-left: 8px;';
                buildingInfo.querySelector('h4').appendChild(startLabel);
            } else if (position === routeIndices.length - 1) {
                item.style.border = '2px solid #764ba2';
                item.style.background = 'linear-gradient(135deg, #764ba215 0%, #667eea15 100%)';
                const endLabel = document.createElement('span');
                endLabel.textContent = 'FIN';
                endLabel.style.cssText = 'background: #764ba2; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.7rem; font-weight: bold; margin-left: 8px;';
                buildingInfo.querySelector('h4').appendChild(endLabel);
            }
            
            buildingList.appendChild(item);
        }
    });
    
    // Add remaining non-selected items
    allItems.forEach(item => {
        if (!buildingList.contains(item)) {
            const badge = item.querySelector('.order-badge');
            if (badge) badge.remove();
            item.style.border = '';
            item.style.background = '';
            buildingList.appendChild(item);
        }
    });
    
    buildingList.scrollTop = 0;
}

// Display optimized route on map
function displayOptimizedRoute(routeIndices) {
    const bounds = new google.maps.LatLngBounds();
    
    // Clear previous route
    if (optimizedRoutePolyline) {
        optimizedRoutePolyline.setMap(null);
    }
    directionsRenderer.setDirections({ routes: [] });
    
    // Get coordinates
    const routeCoords = routeIndices.map(index => {
        const building = buildingsData[index];
        if (building && building.coordinates) {
            const pos = { lat: building.coordinates.lat, lng: building.coordinates.lng };
            bounds.extend(pos);
            return pos;
        }
        return null;
    }).filter(coord => coord !== null);
    
    if (routeCoords.length < 2) {
        alert('Pas assez de coordonnées pour afficher le trajet.');
        return;
    }
    
    // Update ALL markers with numbers
    routeIndices.forEach((index, position) => {
        const marker = markers[index];
        if (marker) {
            const markerLabel = {
                text: (position + 1).toString(),
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold'
            };
            
            let markerColor = '667eea'; // Purple
            if (position === 0) {
                markerColor = '00ff00'; // Green for start
            } else if (position === routeIndices.length - 1) {
                markerColor = 'ff0000'; // Red for end
            }
            
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#' + markerColor,
                fillOpacity: 0.9,
                strokeColor: 'white',
                strokeWeight: 2,
                scale: 12
            });
            
            marker.setLabel(markerLabel);
        }
    });
    
    // Create polyline for complete route
    optimizedRoutePolyline = new google.maps.Polyline({
        path: routeCoords,
        geodesic: true,
        strokeColor: '#667eea',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map
    });
    
    // Add arrows
    const lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 3,
        strokeColor: '#667eea',
        strokeOpacity: 1,
        strokeWeight: 2
    };
    
    optimizedRoutePolyline.setOptions({
        icons: [{
            icon: lineSymbol,
            offset: '0',
            repeat: '100px'
        }]
    });
    
    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < routeCoords.length - 1; i++) {
        totalDistance += haversineDistance(routeCoords[i], routeCoords[i + 1]);
    }
    
    const distanceInKm = (totalDistance / 1000).toFixed(2);
    document.getElementById('totalDistance').textContent = `${distanceInKm} km (${routeCoords.length} immeubles - trajet optimisé)`;
    
    map.fitBounds(bounds);
    
    // Add info window
    optimizedRoutePolyline.addListener('click', (e) => {
        infoWindow.setContent(`
            <div style="padding: 10px;">
                <h4>Trajet optimisé</h4>
                <p>${routeCoords.length} arrêts au total</p>
                <p>Distance: ${distanceInKm} km</p>
            </div>
        `);
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
    });
}

// Clear optimized route
function clearOptimizedRoute() {
    // Clear polyline
    if (optimizedRoutePolyline) {
        optimizedRoutePolyline.setMap(null);
        optimizedRoutePolyline = null;
    }
    
    // Reset markers
    markers.forEach((marker, index) => {
        if (marker) {
            if (selectedBuildings.has(buildingsData[index].originalAddress)) {
                marker.setIcon({
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                });
            } else {
                marker.setIcon(null);
            }
            marker.setLabel(null);
        }
    });
    
    // Clear route
    optimizedRoute = [];
    directionsRenderer.setDirections({ routes: [] });
    
    // Hide buttons
    document.getElementById('exportRouteBtn').style.display = 'none';
    document.getElementById('clearOptimizedBtn').style.display = 'none';
    
    // Hide navigation links
    const navSection = document.querySelector('.navigation-section');
    if (navSection) {
        navSection.style.display = 'none';
    }
    const navContainer = document.getElementById('navigationLinks');
    if (navContainer) {
        navContainer.innerHTML = '';
    }
    
    // Reset list order
    const buildingList = document.getElementById('buildingList');
    const allItems = Array.from(buildingList.querySelectorAll('.building-item'));
    
    allItems.forEach(item => {
        const badge = item.querySelector('.order-badge');
        if (badge) badge.remove();
        
        const labels = item.querySelectorAll('span[style*="DÉPART"], span[style*="FIN"]');
        labels.forEach(label => label.remove());
        
        item.style.border = '';
        item.style.background = '';
    });
    
    // Sort alphabetically
    allItems.sort((a, b) => {
        const addressA = a.dataset.address;
        const addressB = b.dataset.address;
        return addressA.localeCompare(addressB);
    });
    
    buildingList.innerHTML = '';
    allItems.forEach(item => buildingList.appendChild(item));
    
    document.getElementById('totalDistance').textContent = '-';
    console.log('✅ Trajet effacé');
}

// Generate Google Maps navigation links for mobile
function generateNavigationLinks(routeIndices) {
    const navContainer = document.getElementById('navigationLinks');
    if (!navContainer) return;
    
    // Clear previous links
    navContainer.innerHTML = '';
    
    // Create packs of 10 addresses
    const packSize = 10;
    const packs = [];
    
    for (let i = 0; i < routeIndices.length; i += packSize) {
        const packEnd = Math.min(i + packSize, routeIndices.length);
        const pack = routeIndices.slice(i, packEnd);
        packs.push(pack);
    }
    
    // Create navigation links for each pack
    packs.forEach((pack, packIndex) => {
        const packDiv = document.createElement('div');
        packDiv.className = 'nav-pack';
        
        // Pack header
        const packHeader = document.createElement('h4');
        const startNum = packIndex * packSize + 1;
        const endNum = Math.min(startNum + packSize - 1, routeIndices.length);
        packHeader.textContent = `Pack ${packIndex + 1}: Immeubles ${startNum} à ${endNum}`;
        packDiv.appendChild(packHeader);
        
        // Get coordinates for Google Maps URL
        const locations = pack.map(index => {
            const building = buildingsData[index];
            if (building && building.coordinates) {
                return {
                    lat: building.coordinates.lat.toFixed(6),
                    lng: building.coordinates.lng.toFixed(6),
                    address: building.originalAddress
                };
            }
            return null;
        }).filter(loc => loc !== null);
        
        if (locations.length > 0) {
            // Build Google Maps URL with place names visible
            // Using the format that shows address names while using coordinates for accuracy
            let mapsUrl = 'https://www.google.com/maps/dir/';
            
            // Add origin
            const origin = locations[0];
            mapsUrl += `'${encodeURIComponent(origin.address)}'/@${origin.lat},${origin.lng},17z/`;
            
            // Add waypoints and destination
            for (let i = 1; i < locations.length; i++) {
                const loc = locations[i];
                mapsUrl += `'${encodeURIComponent(loc.address)}'/@${loc.lat},${loc.lng},17z/`;
            }
            
            // Add parameters for driving mode
            mapsUrl += 'data=!4m2!4m1!3e0';
            
            // Log for debugging
            console.log(`Pack ${packIndex + 1} URL:`, mapsUrl);
            
            // Create button
            const navButton = document.createElement('a');
            navButton.href = mapsUrl;
            navButton.target = '_blank';
            navButton.rel = 'noopener noreferrer';
            navButton.className = 'nav-button';
            navButton.innerHTML = `
                <span class="nav-icon">🗺️</span>
                <span>Naviguer Pack ${packIndex + 1}</span>
                <span class="nav-count">${locations.length} arrêts</span>
            `;
            
            // List of addresses in this pack
            const addressList = document.createElement('ul');
            addressList.className = 'pack-addresses';
            pack.forEach((index, position) => {
                const building = buildingsData[index];
                if (building) {
                    const li = document.createElement('li');
                    const globalPosition = packIndex * packSize + position + 1;
                    li.textContent = `${globalPosition}. ${building.originalAddress}`;
                    addressList.appendChild(li);
                }
            });
            
            packDiv.appendChild(navButton);
            packDiv.appendChild(addressList);
        }
        
        navContainer.appendChild(packDiv);
    });
    
    // Show the navigation section
    const navSection = document.querySelector('.navigation-section');
    if (navSection) {
        navSection.style.display = 'block';
    }
}

// Export optimized route
function exportOptimizedRoute() {
    if (optimizedRoute.length === 0) {
        alert('Aucun trajet optimisé à exporter.');
        return;
    }
    
    let exportText = 'TRAJET OPTIMISÉ\n';
    exportText += '================\n\n';
    exportText += `Date: ${new Date().toLocaleString('fr-CA')}\n`;
    exportText += `Nombre d'arrêts: ${optimizedRoute.length}\n\n`;
    exportText += 'ORDRE DE VISITE:\n';
    exportText += '----------------\n\n';
    
    optimizedRoute.forEach((index, position) => {
        const building = buildingsData[index];
        if (building) {
            const order = (position + 1).toString().padStart(2, '0');
            exportText += `${order}. ${building.originalAddress}`;
            if (position === 0) exportText += ' [DÉPART]';
            if (position === optimizedRoute.length - 1) exportText += ' [FIN]';
            exportText += '\n';
        }
    });
    
    // Create groups of 25 for Google Maps
    exportText += '\n\nGROUPES POUR GOOGLE MAPS (max 25 waypoints):\n';
    exportText += '--------------------------------------------\n\n';
    
    const groupSize = 25;
    for (let i = 0; i < optimizedRoute.length; i += groupSize) {
        const groupNum = Math.floor(i / groupSize) + 1;
        const groupEnd = Math.min(i + groupSize, optimizedRoute.length);
        exportText += `GROUPE ${groupNum} (${i + 1} à ${groupEnd}):\n`;
        
        for (let j = i; j < groupEnd; j++) {
            const building = buildingsData[optimizedRoute[j]];
            if (building) {
                exportText += `${j + 1}. ${building.originalAddress}\n`;
            }
        }
        exportText += '\n';
    }
    
    // Download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trajet_optimise_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Select all buildings
function selectAllForRoute() {
    deselectAll();
    
    const checkboxes = document.querySelectorAll('.building-checkbox:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        const address = checkbox.dataset.address;
        selectedBuildings.add(address);
        
        const item = checkbox.closest('.building-item');
        const index = item ? parseInt(item.dataset.index, 10) : -1;
        if (!Number.isNaN(index) && markers[index]) {
            markers[index].setIcon({
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            });
        }
    });
    
    updateSelectedCount();
    console.log(`${selectedBuildings.size} immeubles sélectionnés`);
}

// Populate starting point dropdown
function populateStartingPointDropdown() {
    const dropdown = document.getElementById('startingPoint');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">Choisir une adresse de départ...</option>';
    
    // Create sorted list
    const sortedBuildings = [];
    buildingsData.forEach((building, index) => {
        if (building && building.coordinates) {
            sortedBuildings.push({ index, address: building.originalAddress });
        }
    });
    
    sortedBuildings.sort((a, b) => a.address.localeCompare(b.address));
    
    sortedBuildings.forEach(({ index, address }) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = address;
        dropdown.appendChild(option);
    });
    
    // Enable optimize button when starting point is selected
    dropdown.addEventListener('change', () => {
        const optimizeBtn = document.getElementById('optimizeRouteBtn');
        if (optimizeBtn) {
            optimizeBtn.disabled = !dropdown.value || selectedBuildings.size === 0;
        }
    });
}

// Initialize TSP controls
function initializeTSPControls() {
    // Populate dropdown after buildings are loaded
    if (typeof populateStartingPointDropdown === 'function') {
        setTimeout(populateStartingPointDropdown, 1000);
    }
    
    // Add event listeners
    const optimizeBtn = document.getElementById('optimizeRouteBtn');
    if (optimizeBtn) {
        optimizeBtn.addEventListener('click', optimizeRoute);
    }
    
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllForRoute);
    }
    
    const exportBtn = document.getElementById('exportRouteBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportOptimizedRoute);
    }
    
    const clearBtn = document.getElementById('clearOptimizedBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearOptimizedRoute);
    }
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTSPControls);
} else {
    initializeTSPControls();
}