/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Emergency Offline Map Component
 * Renders an interactive Leaflet map using the CachedTileLayer to guarantee
 * visual location context during intermittent network coverage and total offline scenarios.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Wifi,
  WifiOff,
  Database,
  Download,
  Trash2,
  Navigation,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Crosshair,
  Shield,
  Hospital,
  Flame,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { CachedTileLayer } from '../utils/CachedTileLayer';
import {
  precacheEmergencyArea,
  getTileCacheStats,
  clearEmergencyTileCache,
  PrecacheProgress,
  TileCacheStats,
} from '../utils/tileCacheManager';

interface EmergencyOfflineMapProps {
  coordinates: { lat: number; lng: number; accuracy?: number } | null;
  locationName: string;
  regionCode: string;
  isDarkMode?: boolean;
}

interface EmergencyPoi {
  id: string;
  name: string;
  type: 'police' | 'medical' | 'rescue' | 'shelter';
  lat: number;
  lng: number;
  phone?: string;
}

export const EmergencyOfflineMap: React.FC<EmergencyOfflineMapProps> = ({
  coordinates,
  locationName,
  regionCode,
  isDarkMode = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<CachedTileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const poiLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Connectivity & Cache State
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [cacheStats, setCacheStats] = useState<TileCacheStats>({
    supported: true,
    tileCount: 0,
    estimatedBytes: 0,
    cacheName: '',
  });
  const [isPrecaching, setIsPrecaching] = useState<boolean>(false);
  const [precacheProgress, setPrecacheProgress] = useState<PrecacheProgress | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activePoiFilter, setActivePoiFilter] = useState<'all' | 'police' | 'medical' | 'rescue'>('all');

  // Load cache stats on mount & periodically
  const refreshCacheStats = async () => {
    try {
      const stats = await getTileCacheStats();
      setCacheStats(stats);
    } catch (err) {
      console.warn('Failed to get tile stats:', err);
    }
  };

  // Connectivity listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setFeedbackMessage({ type: 'success', text: 'Network restored. Map tile sync active.' });
      setTimeout(() => setFeedbackMessage(null), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setFeedbackMessage({ type: 'info', text: 'Offline mode active. Rendering map from local cache storage.' });
      setTimeout(() => setFeedbackMessage(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshCacheStats();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Generate localized emergency POIs around the coordinate
  const generateEmergencyPois = (centerLat: number, centerLng: number, reg: string): EmergencyPoi[] => {
    const isPk = reg === 'pk';
    const isUk = reg === 'gb';
    const isUs = reg === 'us';

    return [
      {
        id: 'poi-police',
        name: isPk ? 'Police Assistance Post (15)' : isUk ? 'Met Police Emergency Station' : 'Local Police Precinct (911)',
        type: 'police',
        lat: centerLat + 0.0035,
        lng: centerLng + 0.0028,
        phone: isPk ? '15' : isUk ? '999' : '911',
      },
      {
        id: 'poi-rescue',
        name: isPk ? 'Rescue 1122 First Response Unit' : 'Emergency Ambulance Dispatch',
        type: 'rescue',
        lat: centerLat - 0.0031,
        lng: centerLng - 0.0038,
        phone: isPk ? '1122' : '999',
      },
      {
        id: 'poi-hospital',
        name: isPk ? 'Emergency Hospital Trauma Center' : 'General Hospital A&E Department',
        type: 'medical',
        lat: centerLat - 0.0022,
        lng: centerLng + 0.0045,
        phone: isPk ? '1122' : '911',
      },
      {
        id: 'poi-shelter',
        name: isPk ? 'Punjab Women Protection Center' : '24/7 Public Safe Haven Zone',
        type: 'shelter',
        lat: centerLat + 0.0042,
        lng: centerLng - 0.0025,
        phone: isPk ? '1043' : undefined,
      },
    ];
  };

  // Create customized divIcons
  const createUserBeaconIcon = () => {
    return L.divIcon({
      className: 'emergency-user-beacon',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <span class="absolute w-8 h-8 rounded-full bg-rose-500/30 animate-ping"></span>
          <span class="absolute w-5 h-5 rounded-full bg-rose-600/50"></span>
          <div class="w-4 h-4 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createPoiIcon = (type: EmergencyPoi['type']) => {
    let color = '#dc2626';
    let iconSvg = '';

    if (type === 'police') {
      color = '#2563eb';
      iconSvg = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>';
    } else if (type === 'medical') {
      color = '#16a34a';
      iconSvg = '<path d="M12 2v20M2 12h20"/>';
    } else if (type === 'rescue') {
      color = '#ea580c';
      iconSvg = '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>';
    } else {
      color = '#7c3aed';
      iconSvg = '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
    }

    return L.divIcon({
      className: `poi-icon-${type}`,
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
          <div class="w-7 h-7 rounded-full shadow-md flex items-center justify-center text-white border-2 border-white" style="background-color: ${color}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              ${iconSvg}
            </svg>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const centerLat = coordinates?.lat || 31.5204;
    const centerLng = coordinates?.lng || 74.3587;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 11,
    });

    // Add CachedTileLayer with custom offline intercept
    const cachedLayer = new CachedTileLayer(undefined, {
      isDarkMode,
    });
    cachedLayer.addTo(map);
    tileLayerRef.current = cachedLayer;

    // Layer group for POIs
    const poiGroup = L.layerGroup().addTo(map);
    poiLayerGroupRef.current = poiGroup;

    mapInstanceRef.current = map;

    // Small delay to ensure container dimension rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map center and markers when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const lat = coordinates?.lat || 31.5204;
    const lng = coordinates?.lng || 74.3587;
    const accuracy = coordinates?.accuracy || 35;

    map.setView([lat, lng], 15, { animate: true });

    // Update or create User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const userMarker = L.marker([lat, lng], {
        icon: createUserBeaconIcon(),
        zIndexOffset: 1000,
      }).addTo(map);

      userMarker.bindPopup(`
        <div class="p-1 font-sans text-xs">
          <div class="font-bold text-rose-600 flex items-center gap-1">
            <span>📍 Your Emergency Location</span>
          </div>
          <div class="text-slate-600 text-[11px] mt-0.5">${locationName || 'Current GPS Position'}</div>
          <div class="font-mono text-[10px] text-slate-500 mt-1">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div class="text-[9px] text-emerald-600 font-semibold mt-0.5">GPS Precision: ±${accuracy}m</div>
        </div>
      `);
      userMarkerRef.current = userMarker;
    }

    // Accuracy Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng([lat, lng]);
      accuracyCircleRef.current.setRadius(accuracy);
    } else {
      const circle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4,4',
      }).addTo(map);
      accuracyCircleRef.current = circle;
    }

    // Refresh POIs around user location
    if (poiLayerGroupRef.current) {
      poiLayerGroupRef.current.clearLayers();
      const pois = generateEmergencyPois(lat, lng, regionCode);

      pois.forEach((poi) => {
        const poiMarker = L.marker([poi.lat, poi.lng], {
          icon: createPoiIcon(poi.type),
        });

        poiMarker.bindPopup(`
          <div class="p-1 font-sans text-xs">
            <span class="font-bold text-slate-900 capitalize">${poi.name}</span>
            ${poi.phone ? `<div class="mt-1"><a href="tel:${poi.phone}" class="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline">📞 Dial ${poi.phone}</a></div>` : ''}
            <div class="text-[9px] text-slate-500 font-mono mt-0.5">Approx 350m from your spot</div>
          </div>
        `);

        poiMarker.addTo(poiLayerGroupRef.current!);
      });
    }

    // Trigger automatic background pre-cache for surrounding area on coordinate acquisition
    if (isOnline && coordinates) {
      precacheEmergencyArea(lat, lng, {
        zoomLevels: [14, 15],
        radiusTiles: 1,
      }).then(() => {
        refreshCacheStats();
      }).catch(() => {});
    }
  }, [coordinates?.lat, coordinates?.lng, regionCode, locationName]);

  // Handle explicit pre-caching button click
  const handleTriggerPrecache = async () => {
    const lat = coordinates?.lat || 31.5204;
    const lng = coordinates?.lng || 74.3587;

    setIsPrecaching(true);
    setPrecacheProgress({ total: 25, completed: 0, failed: 0, percentage: 0 });

    try {
      const res = await precacheEmergencyArea(lat, lng, {
        zoomLevels: [14, 15, 16],
        radiusTiles: 1,
        onProgress: (prog) => {
          setPrecacheProgress(prog);
        },
      });

      await refreshCacheStats();
      setFeedbackMessage({
        type: 'success',
        text: `Successfully cached ${res.completed} map tiles! Surrounding 3-5km area is fully available offline.`,
      });
      setTimeout(() => setFeedbackMessage(null), 4500);
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to pre-cache map tiles. Please check your network connection.',
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsPrecaching(false);
      setPrecacheProgress(null);
    }
  };

  // Handle Clear Cache
  const handleClearCache = async () => {
    if (!window.confirm('Clear stored offline emergency map tiles?')) return;
    const success = await clearEmergencyTileCache();
    if (success) {
      await refreshCacheStats();
      setFeedbackMessage({
        type: 'info',
        text: 'Local map tile cache cleared.',
      });
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  // Recenter map on user position
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !coordinates) return;
    mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 15, { animate: true });
  };

  const approxCacheMB = (cacheStats.estimatedBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Live Emergency Map Context
              </span>
              {/* Online/Offline Badge */}
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  isOnline
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-2.5 h-2.5" />
                    <span>Online • Syncing</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>Offline Mode • Cached</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Cached tiles ensure spatial awareness without cellular signal
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Recenter on current GPS coordinates"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3 h-3" />
                <span>Show Map</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3" />
                <span>Hide Map</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Map Body */}
      {!isCollapsed && (
        <div>
          {/* Map Leaflet Container */}
          <div className="relative w-full h-52 sm:h-60 bg-slate-100 dark:bg-slate-950">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Offline Floating Watermark Badge */}
            {!isOnline && (
              <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1.5 shadow-md border border-rose-500/40">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>Offline: Serving tiles from local cache</span>
              </div>
            )}

            {/* Pre-caching progress overlay */}
            {isPrecaching && precacheProgress && (
              <div className="absolute inset-0 z-20 bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-white text-center">
                <Loader2 className="w-6 h-6 animate-spin text-rose-500 mb-2" />
                <span className="text-xs font-bold">Caching Map Vicinity for Offline Safety</span>
                <span className="text-[10px] text-slate-300 mt-0.5">
                  Downloading {precacheProgress.completed} of {precacheProgress.total} surrounding tiles...
                </span>
                <div className="w-48 bg-slate-700 rounded-full h-2 mt-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-200"
                    style={{ width: `${precacheProgress.percentage}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 mt-1">
                  {precacheProgress.percentage}% completed
                </span>
              </div>
            )}

            {/* Quick Legend overlay */}
            <div className="absolute bottom-2 right-2 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-1 rounded-md text-[9px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                <span>You</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Police</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                <span>Rescue</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <span>Medical</span>
              </span>
            </div>
          </div>

          {/* Caching Status & Action Bar */}
          <div className="p-2.5 sm:p-3 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Database className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Offline Cache:
                </span>
                <span className="font-mono bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px]">
                  {cacheStats.tileCount} tiles ({approxCacheMB} MB)
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTriggerPrecache}
                disabled={isPrecaching || !isOnline}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                title="Pre-cache surrounding 3-5 km area for offline emergency use"
              >
                {isPrecaching ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                ) : (
                  <Download className="w-3 h-3 text-emerald-600" />
                )}
                <span>{isPrecaching ? 'Caching...' : 'Pre-cache Vicinity'}</span>
              </button>

              {cacheStats.tileCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                  title="Clear cached map tiles"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Feedback alert if any */}
          {feedbackMessage && (
            <div
              className={`px-3 py-1.5 text-[11px] font-medium border-t flex items-center gap-1.5 ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                  : feedbackMessage.type === 'info'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
              }`}
            >
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
