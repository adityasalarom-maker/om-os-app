/**
 * ॐ Om Knowledge OS — Metaphysical & Jyotish Ephemeris Computational Engine
 * 
 * Features:
 * 1. Offline Astronomical Planetary Coordinate Calculator (Grahas 1-9) using
 *    sidereal Nirayana zodiac with Indian standard Lahiri (Chitra Paksha) Ayanamsha.
 * 2. High-precision astronomical algorithms (Jean Meeus analytical models)
 *    computing Surya, Chandra, Mangala, Budha, Guru, Shukra, Shani, Rahu & Ketu.
 * 3. Retrograde (Vakri) orbital motion detection for Tara Grahas.
 * 4. Local Sidereal Time (LST) and Ascendant (Lagna) with 12 Bhavas.
 * 5. D9 (Navamsha) divisional harmonic chart calculation.
 * 6. Vedic Panchang (5 Limbs of Time):
 *    - Tithi (Lunar day, Paksha, elapsed percentage)
 *    - Nakshatra (27 Lunar mansions, 4 Padas, Ruling Graha)
 *    - Yoga (27 Solilunar combinations)
 *    - Karana (Half-tithi, 11 rotating/fixed Karanas, Bhadra check)
 *    - Vara (Solar weekday)
 * 7. Daily Muhurta Engine:
 *    - Sunrise, Sunset & local solar noon
 *    - Brahma Muhurta (Pre-dawn meditation window: 96m to 48m before sunrise)
 *    - Abhijit Muhurta (Midday auspicious victory window)
 *    - Rahu Kaal, Yamaghanta & Gulika Kaal inauspicious windows
 *    - Real-time active Muhurta classification
 */

export interface LocationCoordinates {
  name: string;
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  timezoneOffsetHours: number; // e.g. +5.5 for IST (Indian Standard Time)
}

// Canonical Location Presets
export const LOCATION_PRESETS: Record<string, LocationCoordinates> = {
  tehri: {
    name: 'Tehri Garhwal (Himalayas)',
    latitude: 30.3842,
    longitude: 78.4802,
    altitudeMeters: 1750,
    timezoneOffsetHours: 5.5
  },
  delhi: {
    name: 'New Delhi (Capital)',
    latitude: 28.6139,
    longitude: 77.2090,
    altitudeMeters: 216,
    timezoneOffsetHours: 5.5
  },
  rishikesh: {
    name: 'Rishikesh (Ganga Valley)',
    latitude: 30.0869,
    longitude: 78.2676,
    altitudeMeters: 340,
    timezoneOffsetHours: 5.5
  },
  varanasi: {
    name: 'Varanasi (Kashi)',
    latitude: 25.3176,
    longitude: 82.9739,
    altitudeMeters: 80,
    timezoneOffsetHours: 5.5
  },
  mumbai: {
    name: 'Mumbai',
    latitude: 19.0760,
    longitude: 72.8777,
    altitudeMeters: 14,
    timezoneOffsetHours: 5.5
  },
  bengaluru: {
    name: 'Bengaluru',
    latitude: 12.9716,
    longitude: 77.5946,
    altitudeMeters: 920,
    timezoneOffsetHours: 5.5
  }
};

export const RASHI_NAMES = [
  'Mesha (Aries)',
  'Vrishabha (Taurus)',
  'Mithuna (Gemini)',
  'Karka (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makara (Capricorn)',
  'Kumbha (Aquarius)',
  'Meena (Pisces)'
];

export const RASHI_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

export const NAKSHATRA_LORDS = [
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangala', 'Rahu',
  'Guru', 'Shani', 'Budha', 'Ketu', 'Shukra', 'Surya',
  'Chandra', 'Mangala', 'Rahu', 'Guru', 'Shani', 'Budha',
  'Ketu', 'Shukra', 'Surya', 'Chandra', 'Mangala', 'Rahu',
  'Guru', 'Shani', 'Budha'
];

export const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Asiddhi', 'Vyatipata', 'Variyan',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti'
];

export const KARANA_NAMES = [
  'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti (Bhadra)',
  'Shakuni', 'Chatushpada', 'Naga', 'Kintughna'
];

export const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima / Amavasya'
];

export const GRAHA_COLORS: Record<string, string> = {
  Surya: '#f59e0b', // Amber
  Chandra: '#38bdf8', // Sky Blue
  Mangala: '#ef4444', // Red
  Budha: '#10b981', // Emerald
  Guru: '#fbbf24', // Yellow Gold
  Shukra: '#ec4899', // Pink
  Shani: '#6366f1', // Indigo
  Rahu: '#8b5cf6', // Violet
  Ketu: '#a855f7'  // Purple
};

export interface GrahaPosition {
  name: string;
  sanskritName: string;
  symbol: string;
  tropicalLongitude: number;
  longitude: number; // Sidereal Nirayana degrees 0-360
  rashiIndex: number; // 0-11
  rashiName: string;
  degreeInRashi: number; // 0-30
  formattedDegree: string;
  nakshatraIndex: number; // 0-26
  nakshatraName: string;
  nakshatraLord: string;
  pada: number; // 1-4
  isRetrograde: boolean;
  house: number; // 1-12
  d9RashiIndex: number; // Navamsha Rashi
  d9RashiName: string;
}

export interface PanchangData {
  tithiNumber: number; // 1-30
  tithiName: string;
  paksha: 'Shukla' | 'Krishna';
  tithiElapsedPercentage: number;
  nakshatraIndex: number;
  nakshatraName: string;
  nakshatraLord: string;
  pada: number;
  yogaIndex: number;
  yogaName: string;
  karanaIndex: number;
  karanaName: string;
  isBhadra: boolean;
  varaName: string;
  sunriseTime: string;
  sunsetTime: string;
  solarNoonTime: string;
  dayDurationHours: number;
}

export interface MuhurtaWindow {
  name: string;
  type: 'auspicious' | 'inauspicious' | 'spiritual' | 'neutral';
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  description: string;
}

export interface JyotishCalculationResult {
  dateTime: Date;
  location: LocationCoordinates;
  julianDay: number;
  ayanamsha: number;
  lagna: {
    longitude: number;
    rashiIndex: number;
    rashiName: string;
    degreeInRashi: number;
    formattedDegree: string;
    nakshatraName: string;
    pada: number;
    d9RashiIndex: number;
  };
  grahas: GrahaPosition[];
  houses: Array<{
    houseNumber: number;
    rashiIndex: number;
    rashiName: string;
    grahas: GrahaPosition[];
  }>;
  panchang: PanchangData;
  muhurtas: MuhurtaWindow[];
  activeMuhurta: MuhurtaWindow | null;
}

// --- Mathematical & Astronomical Ephemeris Functions ---

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180.0;
}

function radToDeg(rad: number): number {
  return (rad * 180.0) / Math.PI;
}

function normalizeDegrees(deg: number): number {
  let d = deg % 360.0;
  if (d < 0) d += 360.0;
  return d;
}

function formatDegreeMinutes(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.round(((deg - d) * 60 - m) * 60);
  return `${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
}

/**
 * Calculate Julian Day Number from a standard JavaScript Date in UTC
 */
export function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60.0 + date.getUTCSeconds() / 3600.0;

  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  const jd = Math.floor(365.25 * (y + 4716)) +
             Math.floor(30.6001 * (m + 1)) +
             day + (hours / 24.0) + b - 1524.5;
  return jd;
}

/**
 * Calculate Lahiri (Chitra Paksha) Ayanamsha for a given Julian Day
 * Standard epoch: 23° 51' 25.53" at J2000.0 with ~50.29" annual precession rate
 */
export function getLahiriAyanamsha(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0; // Julian centuries from J2000.0
  // Indian Government Astronomical Ephemeris formula for Lahiri Ayanamsha
  const ayanamsha = 23.857092 + (1.396971 * t) - (0.000308 * t * t);
  return ayanamsha;
}

/**
 * Obliquity of the Ecliptic (Earth's axial tilt)
 */
function getEclipticObliquity(t: number): number {
  return 23.4392911 - (0.0130042 * t) - (0.00000016 * t * t);
}

/**
 * Greenwich Mean Sidereal Time in degrees
 */
function getGreenwichMeanSiderealTime(jd: number): number {
  const d = jd - 2451545.0;
  const t = d / 36525.0;
  let gmst = 280.46061837 + (360.98564736629 * d) + (0.000387933 * t * t) - (t * t * t / 38710000.0);
  return normalizeDegrees(gmst);
}

/**
 * Compute Sun's true geocentric ecliptic longitude
 */
function calculateSunLongitude(t: number): number {
  const l0 = 280.46646 + (36000.76983 * t) + (0.0003032 * t * t);
  const m = 357.52911 + (35999.05029 * t) - (0.0001537 * t * t);
  const mRad = degToRad(m);

  const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(mRad) +
            (0.019993 - 0.000101 * t) * Math.sin(2 * mRad) +
            0.000289 * Math.sin(3 * mRad);

  return normalizeDegrees(l0 + c);
}

/**
 * Compute Moon's true geocentric ecliptic longitude with primary perturbations
 */
function calculateMoonLongitude(t: number): number {
  const lp = 218.3164477 + 481267.88123421 * t;
  const d = 297.8501921 + 445267.1114034 * t;
  const m = 357.5291092 + 35999.0502909 * t;
  const mp = 134.9633964 + 477198.8675055 * t;
  const f = 93.2720950 + 483202.0175233 * t;

  const dRad = degToRad(d);
  const mRad = degToRad(m);
  const mpRad = degToRad(mp);
  const fRad = degToRad(f);

  // Key periodic perturbation terms (Meeus Chap 47)
  const deltaL = 
    6.288774 * Math.sin(mpRad) +
    1.274027 * Math.sin(2 * dRad - mpRad) +
    0.658314 * Math.sin(2 * dRad) +
    0.213618 * Math.sin(2 * mpRad) -
    0.185116 * Math.sin(mRad) -
    0.114332 * Math.sin(2 * fRad) +
    0.058793 * Math.sin(2 * dRad - 2 * mpRad) +
    0.057066 * Math.sin(2 * dRad - mRad - mpRad) +
    0.053322 * Math.sin(2 * dRad + mpRad) +
    0.045758 * Math.sin(2 * dRad - mRad);

  return normalizeDegrees(lp + deltaL);
}

/**
 * Mean position of Rahu (North Node)
 */
function calculateRahuLongitude(t: number): number {
  const omega = 125.04452 - (1934.136261 * t) + (0.0020708 * t * t);
  return normalizeDegrees(omega);
}

/**
 * Keplerian Geocentric Longitude for Tara Grahas
 */
interface OrbitalElements {
  a: number; // semi-major axis (AU)
  e0: number; e_rate: number;
  i0: number; i_rate: number;
  l0: number; l_rate: number;
  w0: number; w_rate: number; // longitude of perihelion
  node0: number; node_rate: number; // longitude of ascending node
}

const PLANETARY_ELEMENTS: Record<string, OrbitalElements> = {
  Mangala: {
    a: 1.523662,
    e0: 0.09341233, e_rate: 0.00011902,
    i0: 1.85061, i_rate: -0.000675,
    l0: 355.45332, l_rate: 19140.30268,
    w0: 336.04084, w_rate: 1.84105,
    node0: 49.5574, node_rate: 0.7721
  },
  Budha: {
    a: 0.387098,
    e0: 0.20563069, e_rate: 0.00002527,
    i0: 7.00487, i_rate: -0.005947,
    l0: 252.25091, l_rate: 149472.67411,
    w0: 77.45645, w_rate: 1.55648,
    node0: 48.3313, node_rate: 1.1862
  },
  Guru: {
    a: 5.203363,
    e0: 0.04839266, e_rate: -0.0001100,
    i0: 1.30530, i_rate: -0.00415,
    l0: 34.40438, l_rate: 3034.74612,
    w0: 14.75385, w_rate: 1.61263,
    node0: 100.55615, node_rate: 1.2117
  },
  Shukra: {
    a: 0.723332,
    e0: 0.00677323, e_rate: -0.00004938,
    i0: 3.39471, i_rate: -0.0007889,
    l0: 181.97973, l_rate: 58517.81539,
    w0: 131.57294, w_rate: 1.40222,
    node0: 76.68069, node_rate: 0.7889
  },
  Shani: {
    a: 9.537070,
    e0: 0.05415060, e_rate: -0.00036762,
    i0: 2.48446, i_rate: 0.001936,
    l0: 49.94424, l_rate: 1222.49362,
    w0: 92.43194, w_rate: 1.95842,
    node0: 113.6634, node_rate: 0.8771
  }
};

/**
 * Solve Kepler's equation M = E - e*sin(E)
 */
function solveKepler(M: number, e: number): number {
  let E = M;
  for (let i = 0; i < 7; i++) {
    const dE = (M - E + e * Math.sin(E)) / (1.0 - e * Math.cos(E));
    E += dE;
    if (Math.abs(dE) < 1e-6) break;
  }
  return E;
}

/**
 * Calculate Geocentric Ecliptic Longitude for a Tara Graha
 */
function calculatePlanetLongitude(name: string, t: number, sunLongRad: number): { longitude: number; isRetrograde: boolean } {
  const el = PLANETARY_ELEMENTS[name];
  if (!el) return { longitude: 0, isRetrograde: false };

  const computePosAtT = (timeT: number) => {
    const e = el.e0 + el.e_rate * timeT;
    const l = normalizeDegrees(el.l0 + el.l_rate * timeT);
    const w = normalizeDegrees(el.w0 + el.w_rate * timeT);
    const m = degToRad(normalizeDegrees(l - w));

    const E = solveKepler(m, e);
    // True anomaly v
    const x = el.a * (Math.cos(E) - e);
    const y = el.a * Math.sqrt(1 - e * e) * Math.sin(E);
    const r = Math.sqrt(x * x + y * y);
    const v = Math.atan2(y, x);

    // Heliocentric longitude
    const lHelio = normalizeDegrees(radToDeg(v) + w);
    const lHelioRad = degToRad(lHelio);

    // Geocentric projection
    // Earth-Sun distance approx 1.0 AU
    const xGeo = r * Math.cos(lHelioRad) + 1.0 * Math.cos(sunLongRad);
    const yGeo = r * Math.sin(lHelioRad) + 1.0 * Math.sin(sunLongRad);
    let lGeo = radToDeg(Math.atan2(yGeo, xGeo));
    return normalizeDegrees(lGeo);
  };

  const currentLong = computePosAtT(t);
  const nextLong = computePosAtT(t + 0.0001); // 0.0001 century ≈ 3.65 days
  let diff = nextLong - currentLong;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;

  const isRetrograde = diff < 0;
  return { longitude: currentLong, isRetrograde };
}

/**
 * Calculate Ascendant (Lagna) Longitude
 */
function calculateLagna(jd: number, lat: number, lon: number, ayanamsha: number): {
  longitude: number;
  rashiIndex: number;
  rashiName: string;
  degreeInRashi: number;
  formattedDegree: string;
  nakshatraName: string;
  pada: number;
  d9RashiIndex: number;
} {
  const t = (jd - 2451545.0) / 36525.0;
  const gmst = getGreenwichMeanSiderealTime(jd);
  const lmst = normalizeDegrees(gmst + lon); // Local Mean Sidereal Time
  const eps = getEclipticObliquity(t);

  const lmstRad = degToRad(lmst);
  const epsRad = degToRad(eps);
  const latRad = degToRad(lat);

  // Tropical Ascendant calculation
  const y = Math.cos(lmstRad);
  const x = -Math.sin(lmstRad) * Math.cos(epsRad) - Math.tan(latRad) * Math.sin(epsRad);
  let ascendantTropical = radToDeg(Math.atan2(y, x));
  ascendantTropical = normalizeDegrees(ascendantTropical);

  // Nirayana Sidereal Lagna
  const lagnaSidereal = normalizeDegrees(ascendantTropical - ayanamsha);

  const rashiIndex = Math.floor(lagnaSidereal / 30);
  const degreeInRashi = lagnaSidereal % 30;
  const nakshatraIndex = Math.floor(lagnaSidereal / (360 / 27));
  const pada = Math.floor((lagnaSidereal % (360 / 27)) / (360 / 108)) + 1;
  const d9RashiIndex = calculateNavamshaRashi(rashiIndex, degreeInRashi);

  return {
    longitude: lagnaSidereal,
    rashiIndex,
    rashiName: RASHI_NAMES[rashiIndex],
    degreeInRashi,
    formattedDegree: formatDegreeMinutes(degreeInRashi),
    nakshatraName: NAKSHATRA_NAMES[nakshatraIndex],
    pada,
    d9RashiIndex
  };
}

/**
 * Compute D9 (Navamsha) Rashi index (0 to 11)
 * Rule: Fire signs start at Mesha (0), Earth at Makara (9), Air at Tula (6), Water at Karka (3)
 */
function calculateNavamshaRashi(rashiIndex: number, degreeInRashi: number): number {
  const padaIndex = Math.floor(degreeInRashi / (30.0 / 9.0)); // 0 to 8
  const elementGroup = rashiIndex % 4;
  let startRashi = 0;
  if (elementGroup === 0) startRashi = 0; // Fire -> Mesha (0)
  else if (elementGroup === 1) startRashi = 9; // Earth -> Makara (9)
  else if (elementGroup === 2) startRashi = 6; // Air -> Tula (6)
  else if (elementGroup === 3) startRashi = 3; // Water -> Karka (3)

  return (startRashi + padaIndex) % 12;
}

/**
 * Compute Sunrise and Sunset for a given date and location
 */
function calculateSunriseSunset(date: Date, lat: number, lon: number, tzOffset: number): {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dayLengthMinutes: number;
} {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Day of year N
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const currentDate = new Date(Date.UTC(year, month, day));
  const dayOfYear = Math.floor((currentDate.getTime() - startOfYear.getTime()) / 86400000) + 1;

  // Approximate solar longitude
  const b = (360 / 365.0) * (dayOfYear - 81);
  const bRad = degToRad(b);
  const eot = 9.87 * Math.sin(2 * bRad) - 7.53 * Math.cos(bRad) - 1.5 * Math.sin(bRad); // Equation of Time (minutes)
  const declination = 23.45 * Math.sin(bRad); // Solar declination in degrees

  const latRad = degToRad(lat);
  const decRad = degToRad(declination);

  // Solar zenith for sunrise/sunset (90.833° accounting for atmospheric refraction)
  const zenithRad = degToRad(90.833);
  const cosHourAngle = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  // Default fallback if polar day/night
  const clampedCos = Math.max(-1, Math.min(1, cosHourAngle));
  const hourAngleDeg = radToDeg(Math.acos(clampedCos));
  const hourAngleHours = hourAngleDeg / 15.0;

  // Solar noon in Local Time
  const timeCorrection = 4 * lon + eot; // in minutes
  const solarNoonMinutes = 720 - timeCorrection + (tzOffset * 60);

  const sunriseMinutes = solarNoonMinutes - (hourAngleHours * 60);
  const sunsetMinutes = solarNoonMinutes + (hourAngleHours * 60);

  const makeDate = (totalMinutes: number) => {
    const d = new Date(year, month, day);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    d.setHours(hrs, mins, 0, 0);
    return d;
  };

  return {
    sunrise: makeDate(sunriseMinutes),
    sunset: makeDate(sunsetMinutes),
    solarNoon: makeDate(solarNoonMinutes),
    dayLengthMinutes: (sunsetMinutes - sunriseMinutes)
  };
}

/**
 * Format Date to HH:MM AM/PM
 */
function formatTime12(d: Date): string {
  let hrs = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  return `${hrs}:${mins} ${ampm}`;
}

// --- Main Master Jyotish & Panchang Calculation Function ---

export function calculateJyotishEphemeris(
  targetDate: Date,
  location: LocationCoordinates = LOCATION_PRESETS.tehri
): JyotishCalculationResult {
  const jd = getJulianDay(targetDate);
  const t = (jd - 2451545.0) / 36525.0;
  const ayanamsha = getLahiriAyanamsha(jd);

  // 1. Surya (Sun)
  const sunTrop = calculateSunLongitude(t);
  const sunSidereal = normalizeDegrees(sunTrop - ayanamsha);

  // 2. Chandra (Moon)
  const moonTrop = calculateMoonLongitude(t);
  const moonSidereal = normalizeDegrees(moonTrop - ayanamsha);

  // 3. Rahu & Ketu
  const rahuTrop = calculateRahuLongitude(t);
  const rahuSidereal = normalizeDegrees(rahuTrop - ayanamsha);
  const ketuSidereal = normalizeDegrees(rahuSidereal + 180.0);

  // 4. Tara Grahas
  const sunTropRad = degToRad(sunTrop);
  const mars = calculatePlanetLongitude('Mangala', t, sunTropRad);
  const mercury = calculatePlanetLongitude('Budha', t, sunTropRad);
  const jupiter = calculatePlanetLongitude('Guru', t, sunTropRad);
  const venus = calculatePlanetLongitude('Shukra', t, sunTropRad);
  const saturn = calculatePlanetLongitude('Shani', t, sunTropRad);

  // 5. Lagna (Ascendant)
  const lagna = calculateLagna(jd, location.latitude, location.longitude, ayanamsha);

  // 6. Build Raw Graha Array
  const rawGrahas = [
    { name: 'Surya', sanskritName: 'सूर्य', symbol: '☉', trop: sunTrop, sid: sunSidereal, vakri: false },
    { name: 'Chandra', sanskritName: 'चन्द्र', symbol: '☽', trop: moonTrop, sid: moonSidereal, vakri: false },
    { name: 'Mangala', sanskritName: 'मंगल', symbol: '♂', trop: mars.longitude, sid: normalizeDegrees(mars.longitude - ayanamsha), vakri: mars.isRetrograde },
    { name: 'Budha', sanskritName: 'बुध', symbol: '☿', trop: mercury.longitude, sid: normalizeDegrees(mercury.longitude - ayanamsha), vakri: mercury.isRetrograde },
    { name: 'Guru', sanskritName: 'गुरु', symbol: '♃', trop: jupiter.longitude, sid: normalizeDegrees(jupiter.longitude - ayanamsha), vakri: jupiter.isRetrograde },
    { name: 'Shukra', sanskritName: 'शुक्र', symbol: '♀', trop: venus.longitude, sid: normalizeDegrees(venus.longitude - ayanamsha), vakri: venus.isRetrograde },
    { name: 'Shani', sanskritName: 'शनि', symbol: '♄', trop: saturn.longitude, sid: normalizeDegrees(saturn.longitude - ayanamsha), vakri: saturn.isRetrograde },
    { name: 'Rahu', sanskritName: 'राहु', symbol: '☊', trop: rahuTrop, sid: rahuSidereal, vakri: true }, // Rahu is always retrograde in mean motion
    { name: 'Ketu', sanskritName: 'केतु', symbol: '☋', trop: normalizeDegrees(rahuTrop + 180), sid: ketuSidereal, vakri: true }
  ];

  const grahas: GrahaPosition[] = rawGrahas.map(g => {
    const rashiIndex = Math.floor(g.sid / 30);
    const degreeInRashi = g.sid % 30;
    const nakshatraIndex = Math.floor(g.sid / (360 / 27));
    const pada = Math.floor((g.sid % (360 / 27)) / (360 / 108)) + 1;
    const d9RashiIndex = calculateNavamshaRashi(rashiIndex, degreeInRashi);

    // Vedic House placement based on Whole Sign Lagna Rashi
    // House 1 = Lagna Rashi, House 2 = Lagna Rashi + 1, etc.
    let house = ((rashiIndex - lagna.rashiIndex + 12) % 12) + 1;

    return {
      name: g.name,
      sanskritName: g.sanskritName,
      symbol: g.symbol,
      tropicalLongitude: g.trop,
      longitude: g.sid,
      rashiIndex,
      rashiName: RASHI_NAMES[rashiIndex],
      degreeInRashi,
      formattedDegree: formatDegreeMinutes(degreeInRashi),
      nakshatraIndex,
      nakshatraName: NAKSHATRA_NAMES[nakshatraIndex],
      nakshatraLord: NAKSHATRA_LORDS[nakshatraIndex],
      pada,
      isRetrograde: g.vakri,
      house,
      d9RashiIndex,
      d9RashiName: RASHI_NAMES[d9RashiIndex]
    };
  });

  // Group grahas into 12 Bhavas
  const houses = Array.from({ length: 12 }, (_, i) => {
    const houseNumber = i + 1;
    const rashiIndex = (lagna.rashiIndex + i) % 12;
    return {
      houseNumber,
      rashiIndex,
      rashiName: RASHI_NAMES[rashiIndex],
      grahas: grahas.filter(g => g.house === houseNumber)
    };
  });

  // 7. Vedic Panchang (The 5 Limbs of Time)
  // Angular separation between Moon and Sun
  const moonSunAngle = normalizeDegrees(moonSidereal - sunSidereal);
  const tithiFloat = moonSunAngle / 12.0;
  const tithiNumber = Math.floor(tithiFloat) + 1; // 1 to 30
  const tithiElapsedPercentage = Math.round((tithiFloat - Math.floor(tithiFloat)) * 100);

  const paksha: 'Shukla' | 'Krishna' = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
  const tithiIndexInPaksha = (tithiNumber - 1) % 15;
  let tithiName = `${paksha} ${TITHI_NAMES[tithiIndexInPaksha]}`;
  if (tithiNumber === 15) tithiName = 'Purnima (Full Moon)';
  if (tithiNumber === 30) tithiName = 'Amavasya (New Moon)';

  // Moon's Nakshatra
  const moonNakshatraIndex = Math.floor(moonSidereal / (360 / 27));
  const moonPada = Math.floor((moonSidereal % (360 / 27)) / (360 / 108)) + 1;

  // Yoga: (Sun + Moon) / 13° 20'
  const yogaAngle = normalizeDegrees(sunSidereal + moonSidereal);
  const yogaIndex = Math.floor(yogaAngle / (360 / 27));

  // Karana: Half of a Tithi (6° increments)
  const karanaHalf = Math.floor(moonSunAngle / 6.0); // 0 to 59
  let karanaIndex = 0;
  let karanaName = '';
  if (karanaHalf === 0) {
    karanaName = 'Kintughna';
  } else if (karanaHalf >= 57) {
    if (karanaHalf === 57) karanaName = 'Shakuni';
    else if (karanaHalf === 58) karanaName = 'Chatushpada';
    else karanaName = 'Naga';
  } else {
    // 7 repeating Karanas (Bava, Balava, Kaulava, Taitila, Gara, Vanija, Vishti)
    const repeatingIndex = (karanaHalf - 1) % 7;
    karanaName = KARANA_NAMES[repeatingIndex];
  }
  const isBhadra = karanaName.includes('Vishti');

  // Vara (Weekday)
  const weekdayNames = ['Ravivara (Sunday)', 'Somavara (Monday)', 'Mangalavara (Tuesday)', 'Budhavara (Wednesday)', 'Guruvara (Thursday)', 'Shukravara (Friday)', 'Shanivara (Saturday)'];
  const varaName = weekdayNames[targetDate.getDay()];

  // 8. Sunrise, Sunset & Muhurtas
  const sunTimes = calculateSunriseSunset(targetDate, location.latitude, location.longitude, location.timezoneOffsetHours);
  const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
  const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();
  const daySpan = sunsetMinutes - sunriseMinutes;
  const kaalSegment = daySpan / 8.0; // 8 segments of daylight

  // Day of week index (0=Sun, 1=Mon, ..., 6=Sat)
  const dow = targetDate.getDay();

  // Rahu Kaal offsets (1-indexed segment: 1 to 8)
  const rahuKaalSegmentByDay = [8, 2, 7, 5, 6, 4, 3];
  const yamaghantaSegmentByDay = [5, 4, 3, 2, 1, 7, 6];
  const gulikaKaalSegmentByDay = [7, 6, 5, 4, 3, 2, 1];

  const getKaalWindow = (segment: number) => {
    const startM = sunriseMinutes + (segment - 1) * kaalSegment;
    const endM = sunriseMinutes + segment * kaalSegment;
    return {
      start: formatTimeFromMinutes(startM),
      end: formatTimeFromMinutes(endM),
      startM,
      endM
    };
  };

  const rahuWindow = getKaalWindow(rahuKaalSegmentByDay[dow]);
  const yamaWindow = getKaalWindow(yamaghantaSegmentByDay[dow]);
  const gulikaWindow = getKaalWindow(gulikaKaalSegmentByDay[dow]);

  // Brahma Muhurta: 96 to 48 minutes before sunrise
  const brahmaStartM = sunriseMinutes - 96;
  const brahmaEndM = sunriseMinutes - 48;

  // Abhijit Muhurta: 8th Muhurta of the 15 daylight muhurtas (midday noon window)
  const muhurtaLength = daySpan / 15.0;
  const abhijitStartM = sunriseMinutes + (7 * muhurtaLength);
  const abhijitEndM = sunriseMinutes + (8 * muhurtaLength);

  const muhurtas: MuhurtaWindow[] = [
    {
      name: 'Brahma Muhurta',
      type: 'spiritual',
      startTime: formatTimeFromMinutes(brahmaStartM),
      endTime: formatTimeFromMinutes(brahmaEndM),
      startMinutes: brahmaStartM,
      endMinutes: brahmaEndM,
      description: 'Sacred pre-dawn window ideal for Advaita contemplation, Pranayama, and high-clarity study.'
    },
    {
      name: 'Abhijit Muhurta',
      type: 'auspicious',
      startTime: formatTimeFromMinutes(abhijitStartM),
      endTime: formatTimeFromMinutes(abhijitEndM),
      startMinutes: abhijitStartM,
      endMinutes: abhijitEndM,
      description: 'Midday victory window auspicious for inaugurations, investments, and signing property deeds.'
    },
    {
      name: 'Rahu Kaal',
      type: 'inauspicious',
      startTime: rahuWindow.start,
      endTime: rahuWindow.end,
      startMinutes: rahuWindow.startM,
      endMinutes: rahuWindow.endM,
      description: 'Inauspicious Rahu period; avoid starting new ventures, contracts, or long journeys.'
    },
    {
      name: 'Yamaghanta',
      type: 'inauspicious',
      startTime: yamaWindow.start,
      endTime: yamaWindow.end,
      startMinutes: yamaWindow.startM,
      endMinutes: yamaWindow.endM,
      description: 'Yama governance; best reserved for concluding pending tasks and inner contemplation.'
    },
    {
      name: 'Gulika Kaal',
      type: 'neutral',
      startTime: gulikaWindow.start,
      endTime: gulikaWindow.end,
      startMinutes: gulikaWindow.startM,
      endMinutes: gulikaWindow.endM,
      description: 'Saturnine segment; suitable for routine maintenance and sustained physical deep work.'
    }
  ];

  // Current Active Muhurta detection
  const currentMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();
  let activeMuhurta: MuhurtaWindow | null = null;
  for (const m of muhurtas) {
    if (currentMinutes >= m.startMinutes && currentMinutes <= m.endMinutes) {
      activeMuhurta = m;
      break;
    }
  }

  const panchang: PanchangData = {
    tithiNumber,
    tithiName,
    paksha,
    tithiElapsedPercentage,
    nakshatraIndex: moonNakshatraIndex,
    nakshatraName: NAKSHATRA_NAMES[moonNakshatraIndex],
    nakshatraLord: NAKSHATRA_LORDS[moonNakshatraIndex],
    pada: moonPada,
    yogaIndex,
    yogaName: YOGA_NAMES[yogaIndex],
    karanaIndex,
    karanaName,
    isBhadra,
    varaName,
    sunriseTime: formatTime12(sunTimes.sunrise),
    sunsetTime: formatTime12(sunTimes.sunset),
    solarNoonTime: formatTime12(sunTimes.solarNoon),
    dayDurationHours: Number((daySpan / 60.0).toFixed(2))
  };

  return {
    dateTime: targetDate,
    location,
    julianDay: jd,
    ayanamsha,
    lagna,
    grahas,
    houses,
    panchang,
    muhurtas,
    activeMuhurta
  };
}

function formatTimeFromMinutes(totalMinutes: number): string {
  let m = Math.floor(totalMinutes);
  if (m < 0) m += 1440;
  m = m % 1440;
  let hrs = Math.floor(m / 60);
  const mins = Math.floor(m % 60).toString().padStart(2, '0');
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  return `${hrs}:${mins} ${ampm}`;
}
