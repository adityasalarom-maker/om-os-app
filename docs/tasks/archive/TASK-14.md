# TASK-14: Advanced Himalayan Homestead & Land Diligence Spatial GIS

**System Component:** Land & Property Due Diligence Hub  
**Milestone:** Phase 14  
**Target Platform:** Windows 11 Desktop (x64) & Samsung Galaxy S25 Ultra (Local-First Offline PWA)  
**Storage Substratum:** Dexie.js (IndexedDB v8) + RFC 7946 GeoJSON  

---

## 1. Executive Specification & Operational Intent

This specification establishes an offline, zero-dependency Spatial Geographic Information System (GIS) and Revenue Land Diligence Engine designed specifically for Himalayan property acquisitions, mountain homestead diligence, and Khasra cadastral mapping in Uttarakhand and Himachal Pradesh.

### Core Problems Solved
1. **Cadastral Spatial Disconnect:** Traditional revenue records (Khatauni) provide textual descriptions of ownership and area in local units (Nali / Mutthi / Bigha), but lack visual boundary demarcation.
2. **Offline Field Resilience:** In remote Himalayan valleys (e.g. Uttarkashi, Ranikhet, Mukteshwar), internet connectivity drops to zero. Standard cloud mapping libraries (Mapbox, Google Maps API) fail completely. This module provides a 100% offline interactive vector GIS canvas rendered via SVG/Canvas.
3. **Topographical Hazards & Solar Aspect:** Mountain land viability is determined by elevation, slope aspect (South-facing slopes receive winter sun; North-facing slopes stay frozen), and proximity to perennial mountain streams (*gadheras*), which provide gravity water supply while requiring flood safety buffers.
4. **5-Point Legal Diligence & Title Integrity:** Mountain land purchases face strict statutory restrictions (e.g., Uttarakhand Section 154 outsider land ceiling of 250 sq meters / 1.25 Nali without government sanction, Section 143 non-agricultural land use conversion, and 12-year non-encumbrance verification).

---

## 2. Mathematical & Algorithmic Foundations

### 2.1 Polygon Shoelace Area Calculation
For a planar polygon with vertices $(x_0, y_0), (x_1, y_1), \dots, (x_{n-1}, y_{n-1})$ where $(x_n, y_n) = (x_0, y_0)$:

$$\text{Area} = \frac{1}{2} \left| \sum_{i=0}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) \right|$$

For geographic coordinates $(\text{lat}_i, \text{lon}_i)$, coordinates are projected to local conformal Euclidean meters $(x_i, y_i)$ using the reference origin $(\text{lat}_0, \text{lon}_0)$:

$$x_i = (\text{lon}_i - \text{lon}_0) \times \frac{\pi}{180} \times R \times \cos\left(\text{lat}_0 \times \frac{\pi}{180}\right)$$
$$y_i = (\text{lat}_i - \text{lat}_0) \times \frac{\pi}{180} \times R$$

*(where $R = 6,378,137\text{ m}$ is the WGS-84 Earth equatorial radius).*

### 2.2 Traditional Himalayan Land Unit Conversions
Standardized conversions for Uttarakhand:
* $1 \text{ Nali} = 2,160 \text{ sq ft} = 200.67072 \text{ m}^2$
* $1 \text{ Mutthi} = \frac{1}{16} \text{ Nali} = 135 \text{ sq ft} = 12.54192 \text{ m}^2$
* $1 \text{ Bigha} = 12 \text{ Nali} = 25,920 \text{ sq ft} = 2,408.04864 \text{ m}^2$
* $1 \text{ Hectare} = 10,000 \text{ m}^2 \approx 49.8329 \text{ Nali}$

### 2.3 Slope Gradient & Aspect Calculation
Given parcel minimum elevation $E_{\min}$ and maximum elevation $E_{\max}$ across horizontal run distance $D$:

$$\text{Slope Grade (\%)} = \frac{E_{\max} - E_{\min}}{D} \times 100$$
$$\text{Slope Angle } \theta = \arctan\left(\frac{E_{\max} - E_{\min}}{D}\right) \times \frac{180^\circ}{\pi}$$

**Solar Aspect Evaluation:**
* **South / South-East (135°–225°):** Optimal solar exposure (8–10 hours in winter). Highest rating.
* **East / West (45°–135°, 225°–315°):** Moderate solar exposure (5–7 hours).
* **North / North-East (315°–45°):** Shadow zone / frost pocket (< 4 hours winter sunlight). Caution alert.

### 2.4 Quantitative Legal Diligence Risk Score (0–100)
Calculated from 5 weighted statutory benchmarks:
1. **12-Year Khatauni Audit (Weight: 25):** Continuous title chain verified at Tehsil; no undocumented heirs or disputed tenancy.
2. **Non-Encumbrance Certificate (Weight: 25):** 12-year register search at Sub-Registrar showing zero hypothecations or bank claims.
3. **Section 154 / 143 Clearance (Weight: 20):** Uttarakhand outsider purchase ceiling compliance (within 250 sq m limit or prior State permission obtained).
4. **Physical Demarcation & Total Station Check (Weight: 15):** Revenue Patwari boundary stones matched with electronic survey.
5. **Disaster & Flood Safety Buffer (Weight: 15):** Stable bedrock; perennial stream buffer > 50m and river buffer > 200m.

$$\text{Risk Score} = \sum (\text{Weight}_i \times \text{Checked}_i)$$

* **Score 85–100:** Clear Title & Low Risk (Emerald)
* **Score 60–84:** Conditional / In Diligence (Amber)
* **Score < 60:** High Risk / Legal Blockers (Rose)

---

## 3. Data Schema & Architecture

### 3.1 KhasraParcelRecord Interface (`src/db/index.ts`)
```typescript
export interface KhasraParcelRecord {
  id: string; // e.g. "khasra-142-1"
  khasraNumber: string; // e.g. "142/1"
  khataNumber: string; // e.g. "00045"
  fasliYear: string; // e.g. "1431-1436 Fasli"
  villageTehsil: string; // e.g. "Netala, Bhatwari Tehsil, Uttarkashi"
  landClassification: 'Krishi (Agricultural)' | 'Bagicha (Orchard)' | 'Abadi (Residential)' | 'Banjar (Uncultivated)';
  bhumidharNames: string[];
  shareFraction?: string;
  areaNali: number;
  areaMutthi: number;
  areaSqMeters: number;
  coordinates: [number, number][]; // [lon, lat]
  elevationMin: number;
  elevationMax: number;
  slopePercent: number;
  aspectDirection: 'South' | 'South-East' | 'East' | 'South-West' | 'North' | 'North-East' | 'North-West' | 'West';
  waterStreamDistanceMeters: number;
  roadDistanceMeters: number;
  riskScore: number;
  diligenceStatus: 'Clear' | 'Conditional' | 'High Risk' | 'Pending';
  legalChecks: {
    khatauni12Yr: boolean;
    nec12Yr: boolean;
    section143Cleared: boolean;
    patwariDemarcated: boolean;
    disasterSafe: boolean;
  };
  encumbranceNotes: string;
  propertyId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 3.2 RFC 7946 GeoJSON Export / Import Specification
Standard FeatureCollection with Geometry type `Polygon`, properties containing Khasra cadastral metadata, area conversions, and diligence risk scores.
