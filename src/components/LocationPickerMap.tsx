/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CachedTileLayer } from '../utils/CachedTileLayer';
import {
  MapPin,
  Navigation,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit3,
  Globe,
  Compass,
  X,
  ExternalLink,
} from 'lucide-react';

export interface LocationDetails {
  country?: string;
  countryCode?: string;
  city?: string;
  state?: string;
  area?: string;
  displayName?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
}

interface LocationPickerMapProps {
  locationName: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  city?: string;
  state?: string;
  area?: string;
  onChange: (
    locationName: string,
    lat: number,
    lng: number,
    details?: { country?: string; city?: string; state?: string; area?: string }
  ) => void;
}

type DetectionStatus =
  | 'idle'
  | 'detecting'
  | 'success'
  | 'denied'
  | 'unavailable'
  | 'timeout'
  | 'service_error';

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  locationName,
  latitude,
  longitude,
  country: initialCountry,
  city: initialCity,
  state: initialState,
  area: initialArea,
  onChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Structured location metadata
  const [structuredInfo, setStructuredInfo] = useState<{
    country?: string;
    city?: string;
    state?: string;
    area?: string;
  }>({
    country: initialCountry,
    city: initialCity,
    state: initialState,
    area: initialArea,
  });

  // Coordinates state (null if unselected)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  // Detection & UI states
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [customLabelInput, setCustomLabelInput] = useState(locationName || '');

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationDetails[]>([]);
  const [searchError, setSearchError] = useState('');
  const searchDebounceRef = useRef<any>(null);

  // Initialize Leaflet icons safely
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const createMarkerIcon = () => {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
          <div class="w-9 h-9 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white ring-4 ring-rose-500/30 animate-bounce">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center map on existing coordinates or neutral global center (zoom 2)
    const initialCenter: [number, number] = coords
      ? [coords.lat, coords.lng]
      : [30.3753, 69.3451]; // Default view centered on South Asia
    const initialZoom = coords ? 15 : 5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    new CachedTileLayer().addTo(map);

    if (coords) {
      const marker = L.marker([coords.lat, coords.lng], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(map);

      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        await reverseGeocode(pos.lat, pos.lng);
      });

      markerRef.current = marker;
    }

    // Click anywhere on map to reposition pin
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      setCoords({ lat, lng });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const newMarker = L.marker([lat, lng], {
          icon: createMarkerIcon(),
          draggable: true,
        }).addTo(map);

        newMarker.on('dragend', async () => {
          const pos = newMarker.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          await reverseGeocode(pos.lat, pos.lng);
        });

        markerRef.current = newMarker;
      }

      await reverseGeocode(lat, lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync coords to map if updated externally
  const panToCoords = (lat: number, lng: number, zoomLevel: number = 15) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([lat, lng], zoomLevel);

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const newMarker = L.marker([lat, lng], {
        icon: createMarkerIcon(),
        draggable: true,
      }).addTo(mapInstanceRef.current);

      newMarker.on('dragend', async () => {
        const pos = newMarker.getLatLng();
        setCoords({ lat: pos.lat, lng: pos.lng });
        await reverseGeocode(pos.lat, pos.lng);
      });

      markerRef.current = newMarker;
    }
  };

  // Real Reverse Geocoding via backend proxy (Nominatim)
  const reverseGeocode = async (lat: number, lng: number): Promise<void> => {
    try {
      const res = await fetch(`/api/location/reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.location) {
          const loc = data.location;
          const details = {
            country: loc.country || '',
            city: loc.city || '',
            state: loc.state || '',
            area: loc.area || '',
          };
          setStructuredInfo(details);
          const finalName = loc.formattedAddress || loc.displayName || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
          setCustomLabelInput(finalName);
          onChange(finalName, lat, lng, details);
          setDetectionStatus('success');
          setStatusMessage('Location identified successfully.');
          return;
        }
      }
      // If geocoding failed, fallback to coordinate label without faking country
      const fallbackName = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setCustomLabelInput(fallbackName);
      onChange(fallbackName, lat, lng);
      setDetectionStatus('service_error');
      setStatusMessage('Address resolution unavailable for these coordinates. Location pin set.');
    } catch {
      const fallbackName = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setCustomLabelInput(fallbackName);
      onChange(fallbackName, lat, lng);
      setDetectionStatus('service_error');
      setStatusMessage('Address lookup service timed out. Coordinates set.');
    }
  };

  // Device Geolocation Handler
  const handleDetectCurrentLocation = () => {
    setDetectionStatus('detecting');
    setStatusMessage('Requesting GPS coordinates from your device...');
    setSearchError('');

    if (!navigator.geolocation) {
      setDetectionStatus('unavailable');
      setStatusMessage('Geolocation is not supported by your browser or operating system.');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        panToCoords(lat, lng, 16);

        setStatusMessage('Converting your real-time coordinates to address...');
        await reverseGeocode(lat, lng);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setDetectionStatus('denied');
            setStatusMessage('Location permission denied. Please allow location access or enter location manually below.');
            break;
          case err.POSITION_UNAVAILABLE:
            setDetectionStatus('unavailable');
            setStatusMessage('Location unavailable from device sensors. Please search or enter your location manually.');
            break;
          case err.TIMEOUT:
            setDetectionStatus('timeout');
            setStatusMessage('Location request timed out. You can retry or enter your location manually.');
            break;
          default:
            setDetectionStatus('unavailable');
            setStatusMessage('Could not retrieve real-time location. Please enter manually.');
        }
      },
      options
    );
  };

  // Autocomplete search input change
  const handleSearchInputChange = (val: string) => {
    setSearchQuery(val);
    setSearchError('');

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(val.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.results || []);
            if ((data.results || []).length === 0) {
              setSearchError('No matching places found. Try entering a nearby road, neighborhood, or city.');
            }
          }
        } else {
          setSearchError('Search service error. Please try again.');
        }
      } catch {
        setSearchError('Failed to reach location search service.');
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  // Select search result
  const handleSelectSearchResult = (item: LocationDetails) => {
    const lat = item.latitude;
    const lng = item.longitude;
    setCoords({ lat, lng });
    panToCoords(lat, lng, 15);

    const details = {
      country: item.country,
      city: item.city,
      state: item.state,
      area: item.area,
    };
    setStructuredInfo(details);
    const label = item.formattedAddress || item.displayName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setCustomLabelInput(label);
    onChange(label, lat, lng, details);

    setSearchResults([]);
    setSearchQuery('');
    setIsManualEntryOpen(false);
    setDetectionStatus('success');
    setStatusMessage(`Location selected: ${label}`);
  };

  // Apply custom edited label
  const handleSaveCustomLabel = () => {
    if (customLabelInput.trim() && coords) {
      onChange(customLabelInput.trim(), coords.lat, coords.lng, structuredInfo);
    }
    setIsEditingLabel(false);
  };

  return (
    <div id="location-picker-system" className="space-y-3.5">
      {/* Real Location Detection Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            id="detect-real-location-btn"
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={detectionStatus === 'detecting'}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-lg text-xs font-bold shadow-xs transition-all disabled:opacity-60"
          >
            {detectionStatus === 'detecting' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Detecting Real Location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5" />
                <span>Detect My Real Location</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsManualEntryOpen(!isManualEntryOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>{isManualEntryOpen ? 'Close Search' : 'Enter Location Manually'}</span>
          </button>
        </div>

        {/* Current status indicator badge */}
        <div className="flex items-center gap-1.5 text-xs self-start sm:self-center">
          {detectionStatus === 'detecting' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-900">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Locating via GPS...</span>
            </span>
          )}
          {detectionStatus === 'success' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
              <CheckCircle2 className="w-3 h-3" />
              <span>Location Set</span>
            </span>
          )}
          {detectionStatus === 'denied' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
              <AlertCircle className="w-3 h-3" />
              <span>Permission Denied</span>
            </span>
          )}
          {detectionStatus === 'unavailable' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3 h-3" />
              <span>GPS Unavailable</span>
            </span>
          )}
          {detectionStatus === 'timeout' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-900">
              <AlertCircle className="w-3 h-3" />
              <span>Request Timed Out</span>
            </span>
          )}
          {detectionStatus === 'service_error' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              <Compass className="w-3 h-3" />
              <span>Coordinates Set</span>
            </span>
          )}
        </div>
      </div>

      {/* Status Message Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            detectionStatus === 'success'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
              : detectionStatus === 'denied' || detectionStatus === 'timeout'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
              : detectionStatus === 'detecting'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
          }`}
        >
          {detectionStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : detectionStatus === 'detecting' ? (
            <Loader2 className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          )}
          <span className="leading-relaxed">{statusMessage}</span>
        </div>
      )}

      {/* Manual Search & Autocomplete Dropdown */}
      {isManualEntryOpen && (
        <div className="relative p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl shadow-md space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-rose-600" />
              <span>Search Location or Corridor Manually</span>
            </span>
            <button
              type="button"
              onClick={() => setIsManualEntryOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              placeholder="e.g. Okara, Lahore Mall Road, F-7 Islamabad, Karachi Clifton..."
              className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>

          {searchError && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">{searchError}</p>
          )}

          {/* Autocomplete Results List */}
          {searchResults.length > 0 && (
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.latitude}-${item.longitude}-${idx}`}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-start gap-2 text-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {item.formattedAddress || item.displayName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {[item.area, item.city, item.state, item.country].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Interactive Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md">
        <div ref={mapContainerRef} className="h-64 sm:h-80 w-full z-0" />

        {/* Selected Location Overlay Card */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg z-10 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>

              {isEditingLabel ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="text"
                    value={customLabelInput}
                    onChange={(e) => setCustomLabelInput(e.target.value)}
                    className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white flex-1 focus:ring-1 focus:ring-rose-500"
                    placeholder="Enter custom location name..."
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomLabel}
                    className="px-2 py-1 bg-rose-600 text-white rounded-md text-[11px] font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingLabel(false)}
                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate block">
                    {locationName || (coords ? `Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : 'Click map or detect location')}
                  </span>
                </div>
              )}
            </div>

            {!isEditingLabel && (
              <button
                type="button"
                onClick={() => setIsEditingLabel(true)}
                className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit location name"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Structured location hierarchy badges */}
          {coords && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              {structuredInfo.country && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  🌍 {structuredInfo.country}
                </span>
              )}
              {structuredInfo.city && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  🏙️ {structuredInfo.city}
                </span>
              )}
              {structuredInfo.state && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  📍 {structuredInfo.state}
                </span>
              )}
              {structuredInfo.area && (
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  🏘️ {structuredInfo.area}
                </span>
              )}
              <span className="font-mono text-slate-400 dark:text-slate-500 ml-auto hidden sm:inline">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Situational Assessment Notice */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>Click anywhere on the map or drag the pin to reposition your route coordinates.</span>
        </span>
        <span className="font-medium text-slate-600 dark:text-slate-300 hidden md:inline">
          No residential addresses are saved
        </span>
      </div>
    </div>
  );
};
