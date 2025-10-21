// Map Page JavaScript

class MapPage {
    constructor() {
        this.map = null;
        this.markers = [];
        this.layers = {
            villages: null,
            cultural: null,
            religious: null
        };
        this.searchResults = [];
        this.currentTab = 'cities';
        this.init();
    }

    init() {
        if (typeof L === 'undefined') {
            console.error('Leaflet library not loaded');
            return;
        }

        this.initMap();
        this.initLayers();
        this.initControls();
        this.initSearch();
        this.initTabs();
        this.loadMapData();
    }

    initMap() {
        // Initialize map
        this.map = L.map('map').setView([43.1589, 44.8122], 10);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add satellite layer
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        // Add layer control
        this.layerControl = L.control.layers({
            'Карта': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
            'Спутник': this.satelliteLayer
        }).addTo(this.map);
    }

    initLayers() {
        // Create layer groups
        this.layers.villages = L.layerGroup();
        this.layers.cultural = L.layerGroup();
        this.layers.religious = L.layerGroup();

        // Add layers to map
        this.layers.villages.addTo(this.map);
        this.layers.cultural.addTo(this.map);
        this.layers.religious.addTo(this.map);
    }

    initControls() {
        // Layer visibility controls
        const villageCheckbox = document.getElementById('layer-villages');
        const culturalCheckbox = document.getElementById('layer-cultural');
        const religiousCheckbox = document.getElementById('layer-religious');

        if (villageCheckbox) {
            villageCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.map.addLayer(this.layers.villages);
                } else {
                    this.map.removeLayer(this.layers.villages);
                }
            });
        }

        if (culturalCheckbox) {
            culturalCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.map.addLayer(this.layers.cultural);
                } else {
                    this.map.removeLayer(this.layers.cultural);
                }
            });
        }

        if (religiousCheckbox) {
            religiousCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.map.addLayer(this.layers.religious);
                } else {
                    this.map.removeLayer(this.layers.religious);
                }
            });
        }

        // Add locate control
        L.control.locate({
            position: 'topright',
            strings: {
                title: 'Показать мое местоположение'
            }
        }).addTo(this.map);
    }

    initSearch() {
        const searchInput = document.getElementById('place-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchPlaces(e.target.value);
            }, 300));
        }
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabId}`).classList.add('active');

        this.currentTab = tabId;
        this.updatePlacesList();
    }

    async loadMapData() {
        try {
            // Load map data from server or static file
            const response = await fetch('/js/mapData.js');
            const script = await response.text();
            
            // Execute the script to get map data
            eval(script);
            
            if (typeof mapData !== 'undefined') {
                this.processMapData(mapData);
            }
        } catch (error) {
            console.error('Failed to load map data:', error);
            this.loadDefaultData();
        }
    }

    processMapData(data) {
        // Process villages
        if (data.villages) {
            data.villages.forEach(place => {
                this.addMarker(place, 'villages');
            });
        }

        // Process cultural sites
        if (data.cultural) {
            data.cultural.forEach(place => {
                this.addMarker(place, 'cultural');
            });
        }

        // Process religious sites
        if (data.religious) {
            data.religious.forEach(place => {
                this.addMarker(place, 'religious');
            });
        }

        this.updatePlacesList();
    }

    addMarker(place, type) {
        const icon = this.getIcon(type);
        
        const marker = L.marker([place.lat, place.lng], { icon })
            .bindPopup(this.createPopupContent(place));

        this.layers[type].addLayer(marker);
        this.markers.push({ marker, place, type });
    }

    getIcon(type) {
        const iconConfigs = {
            villages: { icon: 'fas fa-home', color: '#006400' },
            cultural: { icon: 'fas fa-landmark', color: '#0066cc' },
            religious: { icon: 'fas fa-mosque', color: '#009900' }
        };

        const config = iconConfigs[type] || iconConfigs.villages;
        
        return L.divIcon({
            className: 'map-icon',
            html: `<i class="${config.icon}" style="color: ${config.color}"></i>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    }

    createPopupContent(place) {
        let content = `
            <div class="popup-content">
                <h3>${place.name}</h3>
        `;

        if (place.image) {
            content += `<img src="${place.image}" alt="${place.name}" class="popup-image">`;
        }

        if (place.description) {
            content += `<p class="popup-description">${place.description}</p>`;
        }

        content += '</div>';
        return content;
    }

    searchPlaces(query) {
        if (!query.trim()) {
            this.searchResults = [];
            this.updatePlacesList();
            return;
        }

        const searchTerm = query.toLowerCase();
        this.searchResults = this.markers.filter(({ place }) => 
            place.name.toLowerCase().includes(searchTerm) ||
            (place.description && place.description.toLowerCase().includes(searchTerm))
        );

        this.updatePlacesList();
        this.highlightSearchResults();
    }

    updatePlacesList() {
        const lists = {
            cities: document.getElementById('cities-list'),
            villages: document.getElementById('villages-list'),
            cultural: document.getElementById('cultural-list'),
            religious: document.getElementById('religious-list')
        };

        Object.entries(lists).forEach(([type, container]) => {
            if (!container) return;

            const places = this.getPlacesByType(type);
            container.innerHTML = '';

            places.forEach(({ place, type: placeType }) => {
                const item = document.createElement('div');
                item.className = 'place-item';
                item.innerHTML = `
                    <div class="place-name">${place.name}</div>
                    <div class="place-type">${this.getTypeLabel(placeType)}</div>
                `;
                
                item.addEventListener('click', () => {
                    this.focusOnPlace(place);
                });

                container.appendChild(item);
            });
        });
    }

    getPlacesByType(type) {
        if (this.searchResults.length > 0) {
            return this.searchResults.filter(({ place, type: placeType }) => 
                this.matchesType(placeType, type)
            );
        }

        return this.markers.filter(({ type: placeType }) => 
            this.matchesType(placeType, type)
        );
    }

    matchesType(placeType, filterType) {
        const typeMapping = {
            cities: 'villages',
            villages: 'villages',
            cultural: 'cultural',
            religious: 'religious'
        };

        return placeType === typeMapping[filterType];
    }

    getTypeLabel(type) {
        const labels = {
            villages: 'Населенный пункт',
            cultural: 'Культурный объект',
            religious: 'Религиозный объект'
        };

        return labels[type] || 'Объект';
    }

    focusOnPlace(place) {
        this.map.setView([place.lat, place.lng], 15);
        
        // Find and open popup for this place
        this.markers.forEach(({ marker, place: markerPlace }) => {
            if (markerPlace === place) {
                marker.openPopup();
            }
        });
    }

    highlightSearchResults() {
        // Reset all markers
        this.markers.forEach(({ marker }) => {
            marker.setOpacity(1);
        });

        // Highlight search results
        this.searchResults.forEach(({ marker }) => {
            marker.setOpacity(0.7);
        });
    }

    loadDefaultData() {
        // Load default data if external data fails
        const defaultData = {
            villages: [
                { name: 'Магас', lat: 43.1589, lng: 44.8122, description: 'Столица Ингушетии' },
                { name: 'Назрань', lat: 43.2257, lng: 44.7656, description: 'Крупнейший город Ингушетии' }
            ],
            cultural: [
                { name: 'Эрзи', lat: 42.8, lng: 44.7, description: 'Средневековый башенный комплекс' }
            ],
            religious: [
                { name: 'Мечеть Магаса', lat: 43.1589, lng: 44.8122, description: 'Главная мечеть столицы' }
            ]
        };

        this.processMapData(defaultData);
    }
}

// Initialize map page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('map')) {
        new MapPage();
    }
});

// Export for use in other scripts
window.MapPage = MapPage;
