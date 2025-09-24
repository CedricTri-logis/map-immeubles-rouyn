// Mobile Map Drawer - Swipeable map like Airbnb
(function() {
    let mapDrawer = null;
    let dragHandle = null;
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let mapHeight = 0;
    let isMapExpanded = true;
    
    // Heights for different states
    const COLLAPSED_HEIGHT = 80; // Just shows handle
    const PEEK_HEIGHT = 200; // Shows a bit of map
    const FULL_HEIGHT_PERCENT = 60; // 60% of viewport
    
    // Initialize drawer functionality
    function initializeMapDrawer() {
        // Only activate on mobile
        if (window.innerWidth > 768) return;
        
        const mapElement = document.getElementById('map');
        if (!mapElement) return;
        
        // Create wrapper for map
        mapDrawer = document.createElement('div');
        mapDrawer.className = 'map-drawer';
        mapDrawer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            z-index: 1000;
            transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            will-change: transform;
        `;
        
        // Create drag handle
        dragHandle = document.createElement('div');
        dragHandle.className = 'drawer-handle';
        dragHandle.innerHTML = `
            <div class="handle-bar"></div>
            <div class="handle-text">
                <span class="handle-icon">📍</span>
                <span class="handle-label">Carte</span>
                <span class="handle-arrow">⌃</span>
            </div>
        `;
        dragHandle.style.cssText = `
            height: ${COLLAPSED_HEIGHT}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            cursor: grab;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            user-select: none;
            -webkit-user-select: none;
            position: relative;
        `;
        
        // Style for handle bar
        const handleBar = dragHandle.querySelector('.handle-bar');
        handleBar.style.cssText = `
            width: 40px;
            height: 4px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 2px;
            margin-bottom: 8px;
        `;
        
        // Style for handle text
        const handleText = dragHandle.querySelector('.handle-text');
        handleText.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 500;
        `;
        
        const handleArrow = dragHandle.querySelector('.handle-arrow');
        handleArrow.style.cssText = `
            transition: transform 0.3s;
            font-size: 18px;
        `;
        
        // Move map into drawer
        const mapContainer = mapElement.parentElement;
        mapDrawer.appendChild(dragHandle);
        mapDrawer.appendChild(mapElement);
        document.body.appendChild(mapDrawer);
        
        // Set initial height
        mapHeight = window.innerHeight * (FULL_HEIGHT_PERCENT / 100);
        mapElement.style.height = `${mapHeight}px`;
        mapDrawer.style.height = `${mapHeight + COLLAPSED_HEIGHT}px`;
        mapDrawer.style.transform = 'translateY(0)';
        
        // Adjust sidebar to account for map drawer
        adjustSidebarForDrawer();
        
        // Add touch event listeners
        addTouchListeners();
        
        // Add click listener for quick toggle
        dragHandle.addEventListener('click', toggleMapDrawer);
    }
    
    // Adjust sidebar positioning when map is in drawer
    function adjustSidebarForDrawer() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.style.cssText += `
                position: relative;
                height: auto;
                min-height: 100vh;
                padding-bottom: ${isMapExpanded ? mapHeight + COLLAPSED_HEIGHT : COLLAPSED_HEIGHT}px;
            `;
        }
    }
    
    // Add touch event listeners for dragging
    function addTouchListeners() {
        // Touch events
        dragHandle.addEventListener('touchstart', handleDragStart, { passive: true });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd, { passive: true });
        
        // Mouse events for testing on desktop
        dragHandle.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    }
    
    // Handle drag start
    function handleDragStart(e) {
        isDragging = true;
        startY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        currentY = startY;
        
        // Remove transition during drag
        mapDrawer.style.transition = 'none';
        dragHandle.style.cursor = 'grabbing';
    }
    
    // Handle drag move
    function handleDragMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
        const deltaY = currentY - startY;
        
        // Calculate new position
        let newTranslateY = deltaY;
        
        if (isMapExpanded) {
            // If expanded, only allow dragging down
            newTranslateY = Math.max(0, deltaY);
        } else {
            // If collapsed, only allow dragging up
            newTranslateY = Math.min(0, deltaY + (mapHeight - PEEK_HEIGHT));
        }
        
        mapDrawer.style.transform = `translateY(${newTranslateY}px)`;
    }
    
    // Handle drag end
    function handleDragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        
        // Re-enable transition
        mapDrawer.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
        
        // Calculate drag distance
        const dragDistance = currentY - startY;
        const threshold = 100; // Minimum drag distance to trigger state change
        
        if (isMapExpanded && dragDistance > threshold) {
            // Collapse the map
            collapseMap();
        } else if (!isMapExpanded && dragDistance < -threshold) {
            // Expand the map
            expandMap();
        } else {
            // Snap back to current state
            if (isMapExpanded) {
                expandMap();
            } else {
                collapseMap();
            }
        }
    }
    
    // Toggle map drawer state
    function toggleMapDrawer(e) {
        if (e) e.stopPropagation();
        
        if (isMapExpanded) {
            collapseMap();
        } else {
            expandMap();
        }
    }
    
    // Expand map to full height
    function expandMap() {
        isMapExpanded = true;
        mapDrawer.style.transform = 'translateY(0)';
        
        // Rotate arrow up
        const arrow = dragHandle.querySelector('.handle-arrow');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
        
        // Update handle text
        const label = dragHandle.querySelector('.handle-label');
        if (label) label.textContent = 'Glisser pour fermer';
        
        // Adjust sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.style.paddingBottom = `${mapHeight + COLLAPSED_HEIGHT}px`;
        }
        
        // Trigger map resize
        if (typeof google !== 'undefined' && map) {
            setTimeout(() => {
                google.maps.event.trigger(map, 'resize');
            }, 300);
        }
    }
    
    // Collapse map to show only handle
    function collapseMap() {
        isMapExpanded = false;
        mapDrawer.style.transform = `translateY(${mapHeight - PEEK_HEIGHT}px)`;
        
        // Rotate arrow down
        const arrow = dragHandle.querySelector('.handle-arrow');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
        
        // Update handle text
        const label = dragHandle.querySelector('.handle-label');
        if (label) label.textContent = 'Glisser pour ouvrir';
        
        // Adjust sidebar
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 768) {
            sidebar.style.paddingBottom = `${COLLAPSED_HEIGHT + PEEK_HEIGHT}px`;
        }
    }
    
    // Handle window resize
    function handleResize() {
        if (window.innerWidth > 768 && mapDrawer) {
            // Remove drawer on desktop
            const mapElement = document.getElementById('map');
            if (mapElement && mapDrawer.contains(mapElement)) {
                const originalContainer = document.querySelector('.main-content');
                if (originalContainer) {
                    originalContainer.insertBefore(mapElement, originalContainer.firstChild);
                    mapElement.style.height = '';
                }
            }
            
            if (mapDrawer.parentElement) {
                mapDrawer.parentElement.removeChild(mapDrawer);
            }
            
            mapDrawer = null;
            
            // Reset sidebar
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.style.paddingBottom = '';
            }
        } else if (window.innerWidth <= 768 && !mapDrawer) {
            // Re-initialize drawer on mobile
            initializeMapDrawer();
        }
        
        // Update map height if drawer exists
        if (mapDrawer) {
            mapHeight = window.innerHeight * (FULL_HEIGHT_PERCENT / 100);
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.style.height = `${mapHeight}px`;
            }
            mapDrawer.style.height = `${mapHeight + COLLAPSED_HEIGHT}px`;
            
            if (!isMapExpanded) {
                mapDrawer.style.transform = `translateY(${mapHeight - PEEK_HEIGHT}px)`;
            }
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initializeMapDrawer, 500); // Delay to ensure map is loaded
        });
    } else {
        setTimeout(initializeMapDrawer, 500);
    }
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Expose functions globally if needed
    window.mapDrawerAPI = {
        toggle: toggleMapDrawer,
        expand: expandMap,
        collapse: collapseMap,
        isExpanded: () => isMapExpanded
    };
})();