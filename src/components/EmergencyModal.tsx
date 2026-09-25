/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  X,
  Copy,
  Check,
  ShieldAlert,
  Send,
  Radio,
  MapPin,
  Globe,
  RefreshCw,
  Compass,
  ShieldCheck,
  Edit3,
  RotateCcw,
  MessageSquare,
  Share2,
  ExternalLink,
  Navigation,
  Plus,
} from 'lucide-react';
import { apiFetch } from '../utils/api.ts';

interface EmergencyModalProps {
  onClose: () => void;
  initialLocationName?: string;
  initialCoordinates?: { lat: number; lng: number };
}

interface HelplineItem {
  name: string;
  number: string;
  subtext: string;
  badge?: string;
  isPrimary?: boolean;
}

interface RegionConfig {
  code: string;
  countryName: string;
  flag: string;
  primaryEmergencyNumber: string;
  helplines: HelplineItem[];
  secondaryContacts?: { label: string; number: string }[];
  sosUrduNote?: boolean;
  localSilentProtocol?: string;
}

const REGION_CONFIGS: Record<string, RegionConfig> = {
  pk: {
    code: 'pk',
    countryName: 'Pakistan',
    flag: '🇵🇰',
    primaryEmergencyNumber: '15',
    sosUrduNote: true,
    localSilentProtocol: 'If in danger, dial 15 or 1043 and keep the line open or press any keypad number to confirm distress.',
    helplines: [
      {
        name: 'Police Emergency (15)',
        number: '15',
        subtext: 'Pucar 15 / Punjab & National Police Dispatch',
        badge: '24/7 Police',
        isPrimary: true,
      },
      {
        name: 'Women Safety Helpline (1043)',
        number: '1043',
        subtext: 'PCSW Toll-Free Anti-Harassment & Protection',
        badge: 'Women Safety',
        isPrimary: true,
      },
      {
        name: 'Rescue 1122',
        number: '1122',
        subtext: 'Immediate Medical Ambulance & Fire Service',
        badge: 'Medical & Fire',
      },
      {
        name: 'Women Rights & Legal Aid (1099)',
        number: '1099',
        subtext: 'Ministry of Human Rights Women Protection Cell',
        badge: 'Legal Aid',
      },
      {
        name: 'Motorway Police (130)',
        number: '130',
        subtext: 'National Highways & Motorways Emergency Help',
        badge: 'Highway Police',
      },
      {
        name: 'FIA Cyber Harassment (1991)',
        number: '1991',
        subtext: 'Online Blackmail & Cyber Crime Wing',
        badge: 'Cyber Crime',
      },
    ],
    secondaryContacts: [
      { label: 'PEHEL National Emergency', number: '911' },
      { label: 'Edhi Ambulance', number: '115' },
      { label: 'Chhipa Welfare', number: '1020' },
    ],
  },
  us: {
    code: 'us',
    countryName: 'United States',
    flag: '🇺🇸',
    primaryEmergencyNumber: '911',
    localSilentProtocol: 'In many US 911 centers, you can text 911 if calling would put you in danger, or press digits if asked.',
    helplines: [
      {
        name: 'Emergency Dispatch (911)',
        number: '911',
        subtext: 'Police, Ambulance & Fire Dispatch',
        badge: 'Emergency',
        isPrimary: true,
      },
      {
        name: 'National Domestic Violence (800-799-7233)',
        number: '1-800-799-7233',
        subtext: 'Confidential 24/7 Crisis Support & Shelters',
        badge: 'Women Crisis',
        isPrimary: true,
      },
      {
        name: 'RAINN Sexual Assault Hotline',
        number: '1-800-656-4673',
        subtext: 'National Sexual Assault Hotline 24/7',
        badge: 'Specialized Care',
      },
      {
        name: 'Suicide & Crisis Lifeline (988)',
        number: '988',
        subtext: 'Free and confidential emotional support',
        badge: 'Mental Health',
      },
    ],
    secondaryContacts: [
      { label: 'Text Support', number: 'Text LOVEIS to 22522' },
      { label: 'VictimConnect Resource Center', number: '1-855-484-2846' },
    ],
  },
  gb: {
    code: 'gb',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    primaryEmergencyNumber: '999',
    localSilentProtocol: 'UK Silent Solution: If you call 999 and cannot speak, press 55 when prompted to alert the operator that you are in real danger.',
    helplines: [
      {
        name: 'Emergency Services (999)',
        number: '999',
        subtext: 'Police, Fire and Ambulance Dispatch',
        badge: 'Emergency',
        isPrimary: true,
      },
      {
        name: 'National Domestic Abuse Helpline',
        number: '0808 2000 247',
        subtext: 'Refuge 24-hour Freephone Support',
        badge: 'Women Crisis',
        isPrimary: true,
      },
      {
        name: 'Non-Emergency Police (101)',
        number: '101',
        subtext: 'Report incidents that do not require immediate 999 response',
        badge: 'Non-Urgent Police',
      },
      {
        name: 'Rape Crisis England & Wales',
        number: '0808 500 2222',
        subtext: 'Free 24/7 support line for women and girls',
        badge: 'Specialized Care',
      },
    ],
    secondaryContacts: [
      { label: 'NHS Non-Emergency Health', number: '111' },
      { label: 'Samaritans', number: '116 123' },
    ],
  },
  ca: {
    code: 'ca',
    countryName: 'Canada',
    flag: '🇨🇦',
    primaryEmergencyNumber: '911',
    localSilentProtocol: 'Text with 911 is available in many Canadian jurisdictions for registered users or special services.',
    helplines: [
      {
        name: 'Emergency Services (911)',
        number: '911',
        subtext: 'Police, Ambulance & Fire Dispatch',
        badge: 'Emergency',
        isPrimary: true,
      },
      {
        name: 'Assaulted Women’s Helpline',
        number: '1-866-863-0511',
        subtext: 'Free, 24/7 crisis line across Ontario & Canada',
        badge: 'Women Crisis',
        isPrimary: true,
      },
      {
        name: 'Suicide Crisis Helpline (988)',
        number: '988',
        subtext: 'National bilingual mental health support',
        badge: 'Mental Health',
      },
      {
        name: 'Canadian Human Trafficking Hotline',
        number: '1-833-900-1010',
        subtext: 'Confidential 24/7 multilingual assistance',
        badge: 'Anti-Trafficking',
      },
    ],
    secondaryContacts: [
      { label: 'Hope for Wellness (Indigenous)', number: '1-855-242-3310' },
      { label: 'ShelterSafe Directory', number: 'Online 24/7' },
    ],
  },
  ae: {
    code: 'ae',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    primaryEmergencyNumber: '999',
    localSilentProtocol: 'For anonymous reporting or police security without escalation, use the Aman or Dubai Police Eye services.',
    helplines: [
      {
        name: 'Police Emergency (999)',
        number: '999',
        subtext: 'General Police Emergency Dispatch',
        badge: 'Emergency',
        isPrimary: true,
      },
      {
        name: 'Women & Child Abuse (800 111)',
        number: '800-111',
        subtext: 'Dubai Foundation for Women & Children (DFWAC)',
        badge: 'Women Protection',
        isPrimary: true,
      },
      {
        name: 'Ambulance Emergency (998)',
        number: '998',
        subtext: 'National Ambulance Emergency Service',
        badge: 'Medical',
      },
      {
        name: 'Aman Police Security (800 2626)',
        number: '800-2626',
        subtext: 'Abu Dhabi Police Confidential Reporting',
        badge: 'Confidential',
      },
    ],
    secondaryContacts: [
      { label: 'Civil Defence (Fire)', number: '997' },
      { label: 'Coast Guard', number: '996' },
    ],
  },
  sa: {
    code: 'sa',
    countryName: 'Saudi Arabia',
    flag: '🇸🇦',
    primaryEmergencyNumber: '911',
    localSilentProtocol: 'Dial 911 for all security and medical emergencies across Makkah, Riyadh, Eastern Province and nationwide.',
    helplines: [
      {
        name: 'Unified Security Operations (911)',
        number: '911',
        subtext: 'Unified Police, Civil Defense & Ambulance',
        badge: 'Unified 911',
        isPrimary: true,
      },
      {
        name: 'Domestic Violence Hotline (1919)',
        number: '1919',
        subtext: 'Ministry of Human Resources & Family Protection',
        badge: 'Family Protection',
        isPrimary: true,
      },
      {
        name: 'Police Emergency (999)',
        number: '999',
        subtext: 'Direct Public Security Police',
        badge: 'Police',
      },
      {
        name: 'Red Crescent Ambulance (997)',
        number: '997',
        subtext: 'Emergency Medical Care Dispatch',
        badge: 'Ambulance',
      },
    ],
    secondaryContacts: [
      { label: 'Traffic Accidents (Najm)', number: '920000560' },
      { label: 'Child Helpline', number: '116111' },
    ],
  },
  au: {
    code: 'au',
    countryName: 'Australia',
    flag: '🇦🇺',
    primaryEmergencyNumber: '000',
    localSilentProtocol: 'Calling from mobile with no service: 112 connects to emergency services regardless of provider in Australia.',
    helplines: [
      {
        name: 'Emergency Services (000)',
        number: '000',
        subtext: 'Triple Zero: Police, Fire and Ambulance',
        badge: 'Emergency',
        isPrimary: true,
      },
      {
        name: '1800RESPECT (1800 737 732)',
        number: '1800-737-732',
        subtext: 'National Domestic, Family & Sexual Violence Counseling',
        badge: 'Women Crisis',
        isPrimary: true,
      },
      {
        name: 'Police Assistance Line (131 444)',
        number: '131-444',
        subtext: 'For non-urgent police assistance',
        badge: 'Non-Urgent',
      },
      {
        name: 'Lifeline Crisis Support (13 11 14)',
        number: '13-11-14',
        subtext: '24/7 crisis support and suicide prevention',
        badge: 'Crisis Support',
      },
    ],
    secondaryContacts: [
      { label: 'Kids Helpline', number: '1800-55-1800' },
      { label: 'Emergency via GSM mobile', number: '112' },
    ],
  },
};

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  onClose,
  initialLocationName,
  initialCoordinates,
}) => {
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Location and Region Detection State
  const [activeRegionCode, setActiveRegionCode] = useState<string>('pk'); // Default to Pakistan
  const [detectedLocationName, setDetectedLocationName] = useState<string>(
    initialLocationName || 'Locating current area...'
  );
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(
    initialCoordinates ? { lat: initialCoordinates.lat, lng: initialCoordinates.lng } : null
  );
  const [coordinatesText, setCoordinatesText] = useState<string>(
    initialCoordinates
      ? `Lat: ${initialCoordinates.lat.toFixed(5)}, Lng: ${initialCoordinates.lng.toFixed(5)}`
      : 'Acquiring GPS...'
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(true);
  const [locationSource, setLocationSource] = useState<'gps' | 'preset' | 'manual' | 'default'>('default');
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);

  // Manual Location override
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [manualLocationInput, setManualLocationInput] = useState('');

  // Editable SOS Distress Message State
  const [sosMessage, setSosMessage] = useState<string>('');
  const [isUserEdited, setIsUserEdited] = useState<boolean>(false);
  const isUserEditedRef = useRef<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>('');

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Helper to construct dynamic SOS message with live location & Google Maps link
  const buildDefaultSOSMessage = (
    locName: string,
    coordsStr: string,
    coordsObj: { lat: number; lng: number } | null,
    regionCode: string
  ) => {
    const reg = REGION_CONFIGS[regionCode] || REGION_CONFIGS.pk;
    const mapLink = coordsObj
      ? `https://maps.google.com/?q=${coordsObj.lat.toFixed(6)},${coordsObj.lng.toFixed(6)}`
      : '';

    if (reg.code === 'pk') {
      return `🚨 EMERGENCY ALERT (مدد درکار ہے) 🚨\nI need immediate assistance!\n📍 Location: ${locName}\n📌 Coordinates: ${coordsStr}${mapLink ? `\n🗺️ Live Map: ${mapLink}` : ''}\n⚡ Please immediately alert Police (15) or Women Safety Helpline (1043) / Rescue (1122)!`;
    }

    return `🚨 EMERGENCY ALERT 🚨\nI need immediate assistance!\n📍 Location: ${locName}\n📌 Coordinates: ${coordsStr}${mapLink ? `\n🗺️ Live Map: ${mapLink}` : ''}\n⚡ Please alert emergency services (${reg.primaryEmergencyNumber}) immediately!`;
  };

  // Initialize message on mount
  useEffect(() => {
    const initialMsg = buildDefaultSOSMessage(
      detectedLocationName,
      coordinatesText,
      currentCoords,
      activeRegionCode
    );
    setSosMessage(initialMsg);
  }, []);

  // Detect location via GPS on mount
  useEffect(() => {
    detectLocationAndRegion();
  }, []);

  const detectLocationAndRegion = () => {
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      setIsDetectingLocation(false);
      const fallbackName = detectedLocationName || 'Location unavailable';
      setDetectedLocationName(fallbackName);
      setCoordinatesText('Geolocation not supported by device');
      setLocationSource('default');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 0);
        setGpsAccuracyMeters(accuracy);
        const coordsObj = { lat, lng, accuracy };
        setCurrentCoords(coordsObj);
        const coordsString = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        setCoordinatesText(coordsString);
        setLocationSource('gps');

        try {
          const data = await apiFetch<{ location?: any }>(`/api/location/reverse?lat=${lat}&lng=${lng}`);
          const loc = data?.location || {};
          const countryCode = (loc.countryCode || '').toLowerCase();
          const formatted = loc.formattedAddress || loc.displayName || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
          setDetectedLocationName(formatted);

          // Match region config if supported
          let targetRegion = activeRegionCode;
          if (countryCode && REGION_CONFIGS[countryCode]) {
            targetRegion = countryCode;
            setActiveRegionCode(countryCode);
          } else if (countryCode === 'uk') {
            targetRegion = 'gb';
            setActiveRegionCode('gb');
          }

          // Auto-update message if user hasn't typed custom message
          if (!isUserEditedRef.current) {
            setSosMessage(buildDefaultSOSMessage(formatted, coordsString, coordsObj, targetRegion));
          }
        } catch {
          const gpsLabel = `GPS Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
          setDetectedLocationName(gpsLabel);
          if (!isUserEditedRef.current) {
            setSosMessage(buildDefaultSOSMessage(gpsLabel, coordsString, coordsObj, activeRegionCode));
          }
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation failed or denied:', err.message);
        setIsDetectingLocation(false);
        if (locationSource !== 'gps') {
          setCoordinatesText('Location permission not granted');
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Handle region switch and auto-update message template if not customized
  const handleSelectRegion = (regCode: string) => {
    setActiveRegionCode(regCode);
    if (!isUserEdited) {
      setSosMessage(buildDefaultSOSMessage(detectedLocationName, coordinatesText, currentCoords, regCode));
    }
  };

  // Handle manual location update
  const handleApplyManualLocation = (customLoc: string) => {
    const trimmed = customLoc.trim();
    if (!trimmed) return;
    setDetectedLocationName(trimmed);
    setLocationSource('manual');
    setIsEditingLocation(false);

    // Approximate center coordinates for common cities to re-orient the map and tile cache
    const lower = trimmed.toLowerCase();
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      lahore: { lat: 31.5204, lng: 74.3587 },
      karachi: { lat: 24.8607, lng: 67.0011 },
      islamabad: { lat: 33.6844, lng: 73.0479 },
      rawalpindi: { lat: 33.5651, lng: 73.0169 },
      faisalabad: { lat: 31.4504, lng: 73.1350 },
      multan: { lat: 30.1575, lng: 71.5249 },
      peshawar: { lat: 34.0151, lng: 71.5249 },
      quetta: { lat: 30.1798, lng: 66.9750 },
      london: { lat: 51.5074, lng: -0.1278 },
      dubai: { lat: 25.2048, lng: 55.2708 },
    };

    let matchedCoords = currentCoords;
    for (const [cityName, c] of Object.entries(cityCoords)) {
      if (lower.includes(cityName)) {
        matchedCoords = { lat: c.lat, lng: c.lng, accuracy: 60 };
        setCurrentCoords(matchedCoords);
        setCoordinatesText(`Lat: ${c.lat.toFixed(5)}, Lng: ${c.lng.toFixed(5)}`);
        break;
      }
    }

    if (!isUserEdited) {
      setSosMessage(buildDefaultSOSMessage(trimmed, coordinatesText, matchedCoords, activeRegionCode));
    }
  };

  // Message edit handlers
  const handleMessageChange = (newVal: string) => {
    setSosMessage(newVal);
    setIsUserEdited(true);
    isUserEditedRef.current = true;
  };

  const handleResetMessage = () => {
    setIsUserEdited(false);
    isUserEditedRef.current = false;
    const defaultMsg = buildDefaultSOSMessage(
      detectedLocationName,
      coordinatesText,
      currentCoords,
      activeRegionCode
    );
    setSosMessage(defaultMsg);
  };

  const handleAppendChip = (chipText: string) => {
    setIsUserEdited(true);
    isUserEditedRef.current = true;
    setSosMessage((prev) => `${prev.trim()}\n${chipText}`);
  };

  const handleInsertMapLink = () => {
    const link = currentCoords
      ? `https://maps.google.com/?q=${currentCoords.lat.toFixed(6)},${currentCoords.lng.toFixed(6)}`
      : `https://maps.google.com/?q=${encodeURIComponent(detectedLocationName)}`;
    handleAppendChip(`🗺️ Live Map Link: ${link}`);
  };

  // Web Audio Alarm Synthesizer
  const toggleSiren = () => {
    if (sirenPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const startSiren = () => {
    try {
      stopSiren();

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      let high = false;
      const interval = setInterval(() => {
        if (!osc || !ctx) return;
        high = !high;
        osc.frequency.setTargetAtTime(high ? 1100 : 750, ctx.currentTime, 0.05);
      }, 350);

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
      sirenIntervalRef.current = interval;
      setSirenPlaying(true);
    } catch (e) {
      console.error('Audio synthesizer error', e);
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscRef.current) {
      try {
        oscRef.current.stop();
        oscRef.current.disconnect();
      } catch {}
      oscRef.current = null;
    }
    if (gainRef.current) {
      try {
        gainRef.current.disconnect();
      } catch {}
      gainRef.current = null;
    }
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      try {
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {}
    }
    setSirenPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  const activeRegion = REGION_CONFIGS[activeRegionCode] || REGION_CONFIGS.pk;

  // Build WhatsApp URL with optional phone number
  const getWhatsAppUrl = () => {
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(sosMessage)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(sosMessage)}`;
  };

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(sosMessage);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 3000);
  };

  // Helper to capture current GPS coordinates asynchronously
  const getCurrentGPSCoordinates = (): Promise<{ lat: number; lng: number; accuracy?: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(currentCoords);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy || 0);
          const coords = { lat, lng, accuracy };
          setCurrentCoords(coords);
          setCoordinatesText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
          setGpsAccuracyMeters(accuracy);
          setLocationSource('gps');
          resolve(coords);
        },
        (err) => {
          console.warn('GPS capture failed during action, using cached coordinates:', err.message);
          resolve(currentCoords);
        },
        { timeout: 7000, enableHighAccuracy: true, maximumAge: 10000 }
      );
    });
  };

  // Automatically appends GPS coordinates and Google Maps link to the SOS/WhatsApp template
  const ensureGPSAndMapInTemplate = async (): Promise<string> => {
    const coords = await getCurrentGPSCoordinates();
    let updated = sosMessage;

    if (coords) {
      const mapLink = `https://maps.google.com/?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;
      const coordsString = `Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)}`;

      const hasCoords = updated.includes(coords.lat.toFixed(3)) || updated.includes('📌 Coordinates');
      const hasMap = updated.includes('maps.google.com') || updated.includes('google.com/maps');

      let additions = '';
      if (!hasCoords) {
        additions += `\n📌 Coordinates: ${coordsString}`;
      }
      if (!hasMap) {
        additions += `\n🗺️ Live Map: ${mapLink}`;
      }

      if (additions) {
        updated = `${updated.trim()}${additions}`;
        setSosMessage(updated);
        setIsUserEdited(true);
        isUserEditedRef.current = true;
      }
    } else if (detectedLocationName && !updated.includes('maps.google.com')) {
      const fallbackMapLink = `https://maps.google.com/?q=${encodeURIComponent(detectedLocationName)}`;
      if (!updated.includes(fallbackMapLink)) {
        updated = `${updated.trim()}\n🗺️ Location Map: ${fallbackMapLink}`;
        setSosMessage(updated);
        setIsUserEdited(true);
        isUserEditedRef.current = true;
      }
    }

    return updated;
  };

  const handleSendSMS = async () => {
    const messageToSend = await ensureGPSAndMapInTemplate();
    const cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');
    window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(messageToSend)}`;
  };

  const handleShare = async () => {
    const messageToSend = await ensureGPSAndMapInTemplate();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '🚨 EMERGENCY SOS ALERT',
          text: messageToSend,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed, falling back to SMS:', err);
          handleSendSMS();
        }
        return;
      }
    }
    // Fallback if Web Share API is unavailable
    handleSendSMS();
  };

  const mapPreviewUrl = currentCoords
    ? `https://maps.google.com/?q=${currentCoords.lat.toFixed(6)},${currentCoords.lng.toFixed(6)}`
    : `https://maps.google.com/?q=${encodeURIComponent(detectedLocationName)}`;

  return (
    <div
      id="emergency-sos-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden animate-in zoom-in-95 my-auto transition-colors">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base uppercase tracking-wider">Emergency SOS Station</h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  {activeRegion.flag} {activeRegion.countryName}
                </span>
              </div>
              <p className="text-[11px] text-rose-100">Location-aware immediate response & helplines</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSiren();
              onClose();
            }}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto">
          {/* Location Detection & Region Switcher Bar */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white break-words">
                      {detectedLocationName}
                    </span>
                    {locationSource === 'gps' && (
                      <span className="text-[9px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Live GPS{gpsAccuracyMeters ? ` (±${gpsAccuracyMeters}m)` : ''}</span>
                      </span>
                    )}
                    {locationSource === 'manual' && (
                      <span className="text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                        Manual Location
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    <span>{coordinatesText}</span>
                    {currentCoords && (
                      <a
                        href={mapPreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 hover:underline font-sans font-medium"
                      >
                        <span>Open in Maps</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingLocation(!isEditingLocation)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Edit3 className="w-3 h-3 text-slate-500" />
                  <span>{isEditingLocation ? 'Close Edit' : 'Edit Location'}</span>
                </button>
                <button
                  type="button"
                  onClick={detectLocationAndRegion}
                  disabled={isDetectingLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                  <span>{isDetectingLocation ? 'Detecting...' : 'Re-sync GPS'}</span>
                </button>
              </div>
            </div>

            {/* Manual Location Input Form if toggled */}
            {isEditingLocation && (
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-rose-600" />
                    <span>Enter current street, building or city:</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Automatically syncs with WhatsApp message</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={manualLocationInput}
                    onChange={(e) => setManualLocationInput(e.target.value)}
                    placeholder="e.g., Gulberg III, Main Boulevard, Lahore"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyManualLocation(manualLocationInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyManualLocation(manualLocationInput)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 pt-1">
                  <span className="font-medium">Quick Pick:</span>
                  {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'London', 'Dubai'].map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => handleApplyManualLocation(`${city}, Pakistan`)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Region Selector Pills */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span>Helpline Region:</span>
                </span>
                <span className="text-[10px] text-slate-400">Tap to manually switch region</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {Object.values(REGION_CONFIGS).map((reg) => (
                  <button
                    key={reg.code}
                    type="button"
                    onClick={() => handleSelectRegion(reg.code)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg font-medium text-xs flex items-center gap-1 transition-all ${
                      activeRegionCode === reg.code
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{reg.flag}</span>
                    <span>{reg.countryName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Siren Beacon Button */}
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-ping shrink-0" />
                <span>Audible Distress Siren</span>
              </span>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-snug">
                Loud high-frequency audio beacon to deter perpetrators and attract bystanders.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSiren}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 ${
                sirenPlaying
                  ? 'bg-rose-700 text-white animate-pulse ring-4 ring-rose-300'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {sirenPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{sirenPlaying ? 'Stop Siren' : 'Sound Siren'}</span>
            </button>
          </div>

          {/* Region-Specific Helplines */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span>{activeRegion.flag} {activeRegion.countryName} Emergency Helplines</span>
              </h3>
              <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                Tap to Call Directly
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {activeRegion.helplines.map((item, idx) => (
                <a
                  key={idx}
                  href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}
                  className={`p-3 rounded-xl flex items-center justify-between transition-all group shadow-xs ${
                    item.isPrimary
                      ? 'bg-rose-700 text-white hover:bg-rose-800 ring-2 ring-rose-300'
                      : 'bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="block font-bold truncate text-white">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                            item.isPrimary ? 'bg-white/20 text-white' : 'bg-slate-800 dark:bg-slate-700 text-rose-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-normal line-clamp-1 ${
                        item.isPrimary ? 'text-rose-100' : 'text-slate-400 dark:text-slate-300'
                      }`}
                    >
                      {item.subtext}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.isPrimary ? 'bg-white/20 text-white' : 'bg-slate-800 dark:bg-slate-700 text-rose-400'
                    } group-hover:scale-110 transition-transform`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>

            {/* Secondary Contacts Strip if available */}
            {activeRegion.secondaryContacts && activeRegion.secondaryContacts.length > 0 && (
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Additional Hotlines:</span>
                <div className="flex items-center gap-3">
                  {activeRegion.secondaryContacts.map((sc, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span>{sc.label}:</span>
                      <strong className="text-slate-900 dark:text-white">{sc.number}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick SOS Message to Contacts (Fully Editable & Live Location Synced) */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 text-xs shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Instant SOS Distress Message (WhatsApp & SMS)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {isUserEdited ? (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Edit3 className="w-2.5 h-2.5" />
                    <span>Custom Message</span>
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live GPS Synced</span>
                  </span>
                )}
                {isUserEdited && (
                  <button
                    type="button"
                    onClick={handleResetMessage}
                    className="text-[10px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-0.5 font-medium transition-colors"
                    title="Reset to default auto-generated GPS message"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Editable Textarea with live character counter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-rose-500" />
                  <span>Customize your alert message below before sending:</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">{sosMessage.length} characters</span>
              </div>

              <textarea
                value={sosMessage}
                onChange={(e) => handleMessageChange(e.target.value)}
                rows={4}
                placeholder="Write or edit your emergency distress message... Your live GPS location and Google Maps link are automatically included."
                className="w-full p-3 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-all leading-relaxed resize-y"
              />
            </div>

            {/* Quick-Insert Tags / Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                Quick-Add Emergency Details to Message:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleInsertMapLink}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>📍 Live Map Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendChip('⚠️ IMMEDIATE DANGER: Someone is following or threatening me!')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-950/80 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>🚨 Urgent Danger</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendChip('🚕 RIDE ALERT: I am in a taxi/cab. Please monitor my location until I confirm arrival!')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>🚕 Cab / Taxi Alert</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendChip('🔋 BATTERY ALERT: My phone battery is under 10%. Please track my last known location!')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>🔋 Battery Low</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAppendChip('🚶 En route walking home. Will message upon arrival.')}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-950/80 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-lg transition-colors"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>🏠 Heading Home</span>
                </button>
              </div>
            </div>

            {/* Target WhatsApp Number Input (Optional) */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <label htmlFor="sos-whatsapp-number" className="font-semibold text-slate-700 dark:text-slate-300">
                  Target Contact WhatsApp Number (Optional):
                </label>
                <span className="text-[10px] text-slate-400">Leave blank to choose from WhatsApp chats</span>
              </div>
              <input
                id="sos-whatsapp-number"
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="e.g. +923001234567 or 03001234567"
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Primary Action Buttons: WhatsApp, Copy, SMS */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[170px] inline-flex items-center justify-center gap-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLocation}
                className="inline-flex items-center justify-center gap-1.5 font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-950/80 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-800 transition-colors text-xs"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCoords ? 'Copied to Clipboard!' : 'Copy Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendSMS}
                className="inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-xs"
                title="Send via SMS with automatically attached GPS coordinates & Google Maps link"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Send SMS</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors text-xs"
                title="Share via device apps with automatically attached GPS coordinates & Google Maps link"
              >
                {shareSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{shareSuccess ? 'Shared!' : 'Share'}</span>
              </button>
            </div>
          </div>

          {/* Silent Protocol Advisory */}
          {activeRegion.localSilentProtocol && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center leading-normal bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Safety Advisory: </span>
              {activeRegion.localSilentProtocol}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
