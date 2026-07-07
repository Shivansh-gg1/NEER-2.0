/* eslint-disable @typescript-eslint/no-explicit-any */

'use client'

import { useEffect, useRef } from 'react'
import L, { map } from 'leaflet'
import type { MapViewProps } from '../types'
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet-draw';

import 'leaflet-editable'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})


export default function MapView({
    center = [28.6282, 77.4390],
    zoom = 15,
    buildingData,
    userCoordinates,
    onAreaUpdate,
    onMapClick
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const buildingLayerRef = useRef<L.Polygon & { editing?: L.Editable } | null>(null)
    const userMarkerRef = useRef<L.Marker | null>(null)
    const clickMarkerRef = useRef<L.Marker | L.CircleMarker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        // Create map instance
        const map = L.map(mapRef.current, { editable: true }).setView(center, zoom)

        // Add tile layers
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        })

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri',
            maxZoom: 19
        })

        // Add default layer
        osmLayer.addTo(map)

        // Add layer control
        const baseMaps = {
            "Street Map": osmLayer,
            "Satellite": satelliteLayer
        }
        L.control.layers(baseMaps).addTo(map)

        // Add scale control
        L.control.scale().addTo(map)

        mapInstanceRef.current = map

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Update map center and zoom
    useEffect(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView(center, zoom)
        }
    }, [center, zoom])

    // Update building data
    useEffect(() => {
        if (!mapInstanceRef.current) return

        // Remove existing building layer
        if (buildingLayerRef.current) {
                if (buildingLayerRef.current.editing) {
                    // leaflet-editable's types don't expose a disable() method consistently
                    // so just guard/remove the layer.
                }
            mapInstanceRef.current.removeLayer(buildingLayerRef.current)
            buildingLayerRef.current = null
        }

        // Add new building data if available
        if (buildingData && buildingData.features && buildingData.features.length > 0) {
            const feature = buildingData.features[0]
            if (!feature?.geometry?.coordinates?.[0]) return

            const coordinates = feature.geometry.coordinates[0] as number[][]

            // Convert coordinates for Leaflet (swap lat/lon)
            const leafletCoords: [number, number][] = coordinates
                .filter((coord): coord is [number, number] => coord[0] !== undefined && coord[1] !== undefined)
                .map(coord => [coord[1], coord[0]])

            // Create polygon
            const polygon = L.polygon(leafletCoords, {
                color: '#dc2626',
                fillColor: '#dc2626',
                fillOpacity: 0.4,
                weight: 3
            }) as L.Polygon & { editing?: L.Editable };




            // Create popup content
            const properties = feature.properties || {}
            const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-lg mb-2 text-gray-900">🏢 Building Information</h3>
          <div class="space-y-1 text-sm">
            <p><strong>Area:</strong> ${properties.area || 'Unknown'} sq meters</p>
            <p><strong>Type:</strong> ${properties.buildingType || 'Unknown'}</p>
            <p><strong>Source:</strong> ${properties.dataSource || 'Microsoft Building Footprints'}</p>
            <p><strong>ID:</strong> ${feature.id || 'Unknown'}</p>
            ${properties.queryTime ? `<p><strong>Query Time:</strong> ${new Date(properties.queryTime).toLocaleString()}</p>` : ''}
            ${properties.cached ? '<p class="text-blue-600 italic">📋 Cached result</p>' : ''}
          </div>
        </div>
      `

            polygon.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            })

            // Add to map
            polygon.addTo(mapInstanceRef.current)
            polygon.enableEdit();

            // polygon.on('edit', () => {
            //     const area = L.GeometryUtil.geodesicArea(polygon.getLatLngs()[0] as L.LatLng[]);
            //     onAreaUpdate(Math.round(area));
            // });

            buildingLayerRef.current = polygon

            // **Function to update area and popup**
            const updateAreaAndPopup = () => {
                const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
                const area = L.GeometryUtil.geodesicArea(latlngs);
                if (onAreaUpdate) {
                  onAreaUpdate(parseFloat(area.toFixed(2))); // Send area to parent
                }

                const properties = feature.properties || {};
                const popupContent = `
                    <div class="p-2">
                        <h3 class="font-semibold text-lg mb-2 text-gray-900">🏢 Building Information</h3>
                        <div class="space-y-1 text-sm">
                            <p><strong>Area:</strong> ${area.toFixed(2)} sq meters (Live)</p>
                            <p><strong>Type:</strong> ${properties.buildingType || 'Unknown'}</p>
                            <p class="text-green-600 italic">You can drag the corners to edit the area.</p>
                        </div>
                    </div>`;
                polygon.setPopupContent(popupContent);
            };

            // **Listen for edit events**
            polygon.on('editable:vertex:dragend', updateAreaAndPopup);
            polygon.on('editable:vertex:deleted', updateAreaAndPopup);

            // Initial calculation and popup setup
            updateAreaAndPopup();
            polygon.bindPopup(polygon.getPopup()!);

            // Fit map to show polygon with padding
            const group = L.featureGroup([polygon])
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
        }
    }, [buildingData, onAreaUpdate])

    // Update user marker
    useEffect(() => {
        if (!mapInstanceRef.current) return

        // Remove existing user marker
        if (userMarkerRef.current) {
            mapInstanceRef.current.removeLayer(userMarkerRef.current)
            userMarkerRef.current = null
        }



        // Add user marker if coordinates are provided
        if (userCoordinates && userCoordinates.latitude && userCoordinates.longitude) {
            // const blueIcon = L.icon({
            //     iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            //     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            //     iconSize: [25, 41],
            //     iconAnchor: [12, 41],
            //     popupAnchor: [1, -34],
            //     shadowSize: [41, 41]
            // })

            const liveIcon = L.divIcon({
                className: 'live-marker',
                iconSize: [15, 15], // Size of the icon
            });

            const marker = L.marker([userCoordinates.latitude, userCoordinates.longitude], {
                icon: liveIcon
            })

            marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold text-lg mb-2 text-blue-900">📍 Your Location</h3>
          <p class="text-sm text-gray-600">
            <strong>Coordinates:</strong><br>
            ${userCoordinates.latitude}, ${userCoordinates.longitude}
          </p>
        </div>
      `)

            marker.addTo(mapInstanceRef.current)
            userMarkerRef.current = marker
        }
    }, [userCoordinates])

    // Handle map clicks to get coordinates
    useEffect(() => {
        const map = mapInstanceRef.current
        if (!map) return;

        const handleMapClick = (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            if (clickMarkerRef.current) {
                map.removeLayer(clickMarkerRef.current);
            }

            const clickMarker = L.circleMarker([lat, lng], {
                radius: 8,
                color: '#16a34a',
                fillColor: '#16a34a',
                fillOpacity: 0.8,
            }).addTo(map);


            clickMarkerRef.current = clickMarker;

            // Send the coordinates up to the parent component
            onMapClick({ latitude: lat, longitude: lng });

        }
        map.on('click', handleMapClick)
        return () => {
            map.off('click', handleMapClick)
        }
    }, [mapInstanceRef, onMapClick])

    useEffect(() => {
        if (!buildingData && clickMarkerRef.current) {
            if (mapInstanceRef.current?.hasLayer(clickMarkerRef.current)) {
                mapInstanceRef.current.removeLayer(clickMarkerRef.current);
            }
            clickMarkerRef.current = null;
        }
    }, [buildingData]);

    return (
        <div className="relative w-full h-full">
            <div
                ref={mapRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: '400px' }}
            />

            {/* Loading overlay when no map is initialized yet */}
            {!mapInstanceRef.current && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-gray-600 text-sm">Loading map...</p>
                    </div>
                </div>
            )}
        </div>
    )
}