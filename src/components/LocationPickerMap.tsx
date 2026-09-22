/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Search, AlertCircle } from 'lucide-react';

interface LocationPickerMapProps {
  locationName: string;
  latitude?: number;
  longitude?: number;
  onChange: (locationName: string, lat: number, lng: number) => void;
}

const PAKISTAN_CITIES = [
  { label: 'Lahore (Gulberg)', name: 'Main Boulevard, Gulberg, Lahore', lat: 31.5204, lng: 74.3587 },
  { label: 'Islamabad (Blue Area)', name: 'Jinnah Avenue, Blue Area, Islamabad', lat: 33.7088, lng: 73.0560 },
  { label: 'Karachi (Clifton)', name: 'Clifton Block 4, Karachi', lat: 24.8270, lng: 67.0315 },
  { label: 'Rawalpindi (Saddar)', name: 'Mall Road, Saddar, Rawalpindi', lat: 33.5973, lng: 73.0479 },
  { label: 'Peshawar (Univ Rd)', name: 'University Road, Peshawar', lat: 34.0084, lng: 71.5369 },
  { label: 'Faisalabad (D-Ground)', name: 'D-Ground, Peoples Colony, Faisalabad', lat: 31.4187, lng: 73.0791 },
  { label: 'Multan (Cantt)', name: 'Bosan Road / Cantt, Multan', lat: 30.1984, lng: 71.4687 },
  { label: 'Quetta (Jinnah Rd)', name: 'Jinnah Road, Quetta', lat: 30.1798, lng: 66.9750 },
];

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  locationName,
  latitude = 31.5204,
  longitude = 74.3587,
  onChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentCoords, setCurrentCoords] = useState<[number, number]>([latitude, longitude]);

  // Fix leaflet default icon issue in bundlers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: currentCoords,
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white ring-4 ring-rose-500/30 animate-pulse">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker(currentCoords, {
      icon: customIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', async () => {
      const pos = marker.getLatLng();
      setCurrentCoords([pos.lat, pos.lng]);
      await reverseGeocode(pos.lat, pos.lng);
    });

    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setCurrentCoords([e.latlng.lat, e.latlng.lng]);
      await reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Reverse geocode via OpenStreetMap Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const address = data.address || {};
        const road = address.road || address.pedestrian || address.neighbourhood || address.suburb || 'Selected Area';
        const city = address.city || address.town || address.county || '';
        const name = city ? `${road}, ${city}` : road;
        onChange(name, lat, lng);
      } else {
        onChange(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
      }
    } catch {
      onChange(`Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng);
    }
  };

  // Search forward geocode with Pakistan priority
  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      // First try searching within Pakistan
      let res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=pk&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );

      let data = res.ok ? await res.json() : [];

      // If not found in PK or search fails, fallback without country constraint
      if (!data || data.length === 0) {
        res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        data = res.ok ? await res.json() : [];
      }

      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const name = item.display_name.split(',').slice(0, 3).join(',').trim();

        setCurrentCoords([lat, lon]);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lon], 15);
          markerRef.current.setLatLng([lat, lon]);
        }
        onChange(name, lat, lon);
        setSearchQuery('');
      } else {
        setSearchError('Location not found. Please try a different area, landmark, or city name in Pakistan.');
      }
    } catch (err) {
      setSearchError('Could not connect to map geocoding service.');
    } finally {
      setIsSearching(false);
    }
  };

  // Jump to preset Pakistani city
  const handleSelectCity = (city: typeof PAKISTAN_CITIES[0]) => {
    setCurrentCoords([city.lat, city.lng]);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([city.lat, city.lng], 15);
      markerRef.current.setLatLng([city.lat, city.lng]);
    }
    onChange(city.name, city.lat, city.lng);
  };

  // Current location geolocator
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords([lat, lng]);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
          markerRef.current.setLatLng([lat, lng]);
        }
        await reverseGeocode(lat, lng);
      },
      (err) => {
        setSearchError('Could not retrieve GPS position. Click anywhere on the map instead.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div id="location-picker-container" className="space-y-3">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search street, transit hub, landmark..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching}
            className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Find'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-medium hover:bg-rose-100 transition-colors whitespace-nowrap"
        >
          <Navigation className="w-4 h-4" />
          <span>My Location</span>
        </button>
      </div>

      {/* Quick Select Pakistani Cities */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Quick Select Major Hubs in Pakistan:</span>
          <span className="text-[10px] text-rose-600 font-medium">Click to reposition map</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PAKISTAN_CITIES.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => handleSelectCity(c)}
              className="shrink-0 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 rounded-full transition-all text-slate-700 active:scale-95"
            >
              📍 {c.label}
            </button>
          ))}
        </div>
      </div>

      {searchError && (
        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Map Element */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <div ref={mapContainerRef} className="h-64 sm:h-72 w-full z-0" />
        
        {/* Selected location overlay chip */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-200 shadow-sm z-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium text-slate-800 truncate">
              {locationName || 'Click or drag marker on map to set location'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0 ml-2 hidden sm:inline">
            Lat: {currentCoords[0].toFixed(4)}, Lng: {currentCoords[1].toFixed(4)}
          </span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 flex items-center gap-1">
        <span>* Click anywhere on the map or drag the pin. No exact residential addresses are recorded.</span>
      </p>
    </div>
  );
};
