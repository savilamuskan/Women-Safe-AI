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
} from 'lucide-react';

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
  
  // Location and Region Detection State
  const [activeRegionCode, setActiveRegionCode] = useState<string>('pk'); // Default to Pakistan
  const [detectedLocationName, setDetectedLocationName] = useState<string>(
    initialLocationName || 'Locating current area...'
  );
  const [coordinatesText, setCoordinatesText] = useState<string>(
    initialCoordinates
      ? `Lat: ${initialCoordinates.lat.toFixed(4)}, Lng: ${initialCoordinates.lng.toFixed(4)}`
      : 'Acquiring GPS...'
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(true);
  const [locationSource, setLocationSource] = useState<'gps' | 'preset' | 'default'>('default');

  // Web Audio refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Detect location via GPS on mount
  useEffect(() => {
    detectLocationAndRegion();
  }, []);

  const detectLocationAndRegion = () => {
    setIsDetectingLocation(true);

    if (!navigator.geolocation) {
      setIsDetectingLocation(false);
      setDetectedLocationName('Lahore, Punjab, Pakistan (Default)');
      setCoordinatesText('Lat: 31.5204, Lng: 74.3587 (Standard)');
      setActiveRegionCode('pk');
      setLocationSource('default');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoordinatesText(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        setLocationSource('gps');

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=12&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );

          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            const countryCode = (address.country_code || '').toLowerCase();
            const city = address.city || address.town || address.suburb || address.county || '';
            const state = address.state || address.province || '';
            const country = address.country || '';

            const parts = [city, state, country].filter(Boolean);
            const readableLoc = parts.length > 0 ? parts.join(', ') : `Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setDetectedLocationName(readableLoc);

            // Match region config if supported, otherwise map or fallback
            if (REGION_CONFIGS[countryCode]) {
              setActiveRegionCode(countryCode);
            } else if (countryCode === 'uk') {
              setActiveRegionCode('gb');
            } else {
              // Default to Pakistan if not specifically matched, but show detected country
              setActiveRegionCode('pk');
            }
          } else {
            setDetectedLocationName(`GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setActiveRegionCode('pk');
          }
        } catch {
          setDetectedLocationName(`GPS Fix (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setActiveRegionCode('pk');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geolocation failed or denied:', err.message);
        setIsDetectingLocation(false);
        setDetectedLocationName('Lahore / Punjab, Pakistan (Default)');
        setCoordinatesText('Lat: 31.5204, Lng: 74.3587');
        setActiveRegionCode('pk');
        setLocationSource('default');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
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

  // Generate dynamic SOS message
  const getSOSMessage = () => {
    if (activeRegion.code === 'pk') {
      return `EMERGENCY ALERT (مدد درکار ہے): I need immediate assistance! Location: ${detectedLocationName} (${coordinatesText}). Please alert Police (15) or Women Safety Helpline (1043) / Rescue (1122) immediately!`;
    }
    return `EMERGENCY ALERT: I need immediate assistance! Location: ${detectedLocationName} (${coordinatesText}). Please alert emergency services (${activeRegion.primaryEmergencyNumber}) immediately!`;
  };

  const handleCopyLocation = () => {
    navigator.clipboard.writeText(getSOSMessage());
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 3000);
  };

  return (
    <div
      id="emergency-sos-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden animate-in zoom-in-95 my-auto">
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-900 truncate">
                      {detectedLocationName}
                    </span>
                    {locationSource === 'gps' && (
                      <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                        GPS Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{coordinatesText}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={detectLocationAndRegion}
                disabled={isDetectingLocation}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>{isDetectingLocation ? 'Detecting...' : 'Redetect Location'}</span>
              </button>
            </div>

            {/* Region Selector Pills */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
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
                    onClick={() => setActiveRegionCode(reg.code)}
                    className={`shrink-0 px-2.5 py-1 rounded-lg font-medium text-xs flex items-center gap-1 transition-all ${
                      activeRegionCode === reg.code
                        ? 'bg-rose-600 text-white font-bold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
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
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-600 animate-ping shrink-0" />
                <span>Audible Distress Siren</span>
              </span>
              <p className="text-[11px] text-rose-700 leading-snug">
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
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span>{activeRegion.flag} {activeRegion.countryName} Emergency Helplines</span>
              </h3>
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
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
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="block font-bold truncate text-white">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                            item.isPrimary ? 'bg-white/20 text-white' : 'bg-slate-800 text-rose-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-normal line-clamp-1 ${
                        item.isPrimary ? 'text-rose-100' : 'text-slate-400'
                      }`}
                    >
                      {item.subtext}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      item.isPrimary ? 'bg-white/20 text-white' : 'bg-slate-800 text-rose-400'
                    } group-hover:scale-110 transition-transform`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                </a>
              ))}
            </div>

            {/* Secondary Contacts Strip if available */}
            {activeRegion.secondaryContacts && activeRegion.secondaryContacts.length > 0 && (
              <div className="p-2 bg-slate-100 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Additional Hotlines:</span>
                <div className="flex items-center gap-3">
                  {activeRegion.secondaryContacts.map((sc, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span>{sc.label}:</span>
                      <strong className="text-slate-900">{sc.number}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick SOS Message to Contacts */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant SOS Distress Message:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(getSOSMessage())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
                >
                  {copiedCoords ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCoords ? 'Copied!' : 'Copy Alert'}</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 font-mono leading-relaxed select-all break-words">
              {getSOSMessage()}
            </p>
          </div>

          {/* Silent Protocol Advisory */}
          {activeRegion.localSilentProtocol && (
            <div className="text-[11px] text-slate-500 text-center leading-normal bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-semibold text-slate-700">Safety Tip: </span>
              {activeRegion.localSilentProtocol}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
