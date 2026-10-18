/**
 * ॐ Om Knowledge OS — Version 2 Real Data Model
 * Sourced directly from user's authentic archives:
 * - my_notes/04_Mati vivek.md
 * - my_notes/06_Vivarta vada and vadas.md
 * - my_notes/07_Uttarkashi UK.md
 * - my_notes/09_To do lists Main.md
 * - notion_os/Goals Life Pyramid.md
 * - notion_os/Journal  Reflection.md
 * - notion_os/INDEX.md
 */

export interface V2Task {
  id: string;
  title: string;
  category: 'Home & Family' | 'Uttarkashi Diligence' | 'Sadhana & Philosophy' | 'Nature & Garden' | 'Personal';
  priority: 'Urgent & Important' | 'Important Not Urgent' | 'Quick Win';
  status: 'Pending' | 'In Progress' | 'Done';
  sourceFile: string;
  notes?: string;
}

export interface V2Concept {
  id: string;
  title: string;
  sanskritTitle?: string;
  category: 'Vedanta & Darshana' | 'Mati-Vivek Dialogue' | 'Himalayan Sanctuary' | 'OS Architecture';
  summary: string;
  quote: string;
  fullContent: string;
  sourceFile: string;
  tags: string[];
}

export interface V2LandChecklistItem {
  id: string;
  step: string;
  title: string;
  description: string;
  criticality: 'Mandatory' | 'High' | 'Statutory';
  status: 'Verified' | 'In Diligence' | 'Pending Verification';
  lawReference?: string;
}

export interface V2LifeGoal {
  id: string;
  horizon: 'Life Vision (Moksha)' | '10-Year Horizon' | '5-Year Autonomy' | '1-Year Milestone' | 'Quarterly Focus';
  title: string;
  pillar: 'Spiritual & Inner' | 'Himalayan Sanctuary' | 'Sovereign Health' | 'Digital & Financial Sovereignty';
  description: string;
  metric: string;
}

export interface V2JournalPrompt {
  id: string;
  date: string;
  swaraActive: 'Surya (Right/Pingala)' | 'Chandra (Left/Ida)' | 'Sushumna (Balanced)';
  morningIntention: string;
  deepWorkFocus: string;
  innerStateMood: string;
  eveningWins: string;
  lessonLearned: string;
}

export const V2_REAL_TASKS: V2Task[] = [
  {
    id: 'task-v2-1',
    title: 'Study table 2 for TRISHAA (Measurements, materials & ordering)',
    category: 'Home & Family',
    priority: 'Urgent & Important',
    status: 'Pending',
    sourceFile: 'my_notes/09_To do lists Main.md',
    notes: 'Verify dimensions and ergonomic study setup for Trishaa in room.'
  },
  {
    id: 'task-v2-2',
    title: 'Master bed sizing and specifications selection',
    category: 'Home & Family',
    priority: 'Important Not Urgent',
    status: 'Pending',
    sourceFile: 'my_notes/09_To do lists Main.md',
    notes: 'Finalize frame dimension: 1 for me bed layout.'
  },
  {
    id: 'task-v2-3',
    title: 'Plants identification & cultivation guide (Leaf, stem, flower, scent, medicinal value)',
    category: 'Nature & Garden',
    priority: 'Important Not Urgent',
    status: 'In Progress',
    sourceFile: 'my_notes/09_To do lists Main.md',
    notes: 'Photo-based physical identification: leaf structure, bud, seed, fruit, herbal aroma, soil requirement.'
  },
  {
    id: 'task-v2-4',
    title: 'Uttarkashi property Khata & Khasra revenue record verification',
    category: 'Uttarkashi Diligence',
    priority: 'Urgent & Important',
    status: 'In Progress',
    sourceFile: 'my_notes/07_Uttarkashi UK.md',
    notes: 'Verify 143 non-agricultural conversion eligibility and Tehsil land records.'
  },
  {
    id: 'task-v2-5',
    title: 'Forest & Eco-Sensitive Zone (ESZ) boundary clearance along Bhagirathi corridor',
    category: 'Uttarkashi Diligence',
    priority: 'Important Not Urgent',
    status: 'Pending',
    sourceFile: 'my_notes/07_Uttarkashi UK.md',
    notes: 'Confirm property sits outside prohibited river buffer and national park boundaries.'
  },
  {
    id: 'task-v2-6',
    title: 'Shankara Vivartavada vs Parinamavada cross-textual comparison synthesis',
    category: 'Sadhana & Philosophy',
    priority: 'Important Not Urgent',
    status: 'Done',
    sourceFile: 'my_notes/06_Vivarta vada and vadas.md',
    notes: 'Aabhaasi Parivartan (apparent change) vs real transformation.'
  },
  {
    id: 'task-v2-7',
    title: 'Mati & Vivek daily reflection cadence: Discerning capacity vs distraction',
    category: 'Sadhana & Philosophy',
    priority: 'Quick Win',
    status: 'In Progress',
    sourceFile: 'my_notes/04_Mati vivek.md',
    notes: 'Aligning energy with true Shakti (capacity for conscious transformation).'
  },
  {
    id: 'task-v2-8',
    title: 'Audit & preserve 24 Notion OS modules in sovereign local clean room',
    category: 'Personal',
    priority: 'Important Not Urgent',
    status: 'Done',
    sourceFile: 'notion_os/INDEX.md',
    notes: 'All 24 relational subsystems active with zero cloud dependencies.'
  }
];

export const V2_REAL_CONCEPTS: V2Concept[] = [
  {
    id: 'concept-mati-vivek',
    title: 'Mati & Vivek — The Dialogue on True Shakti & Capacity',
    sanskritTitle: 'मति-विवेक संवाद: वास्तविक शक्ति एवं क्षमता',
    category: 'Mati-Vivek Dialogue',
    summary: 'A deep philosophical inquiry into why human beings pursue wealth, knowledge, and sadhana. Mati defines true Shakti not as dominance over others, but as capacity (क्षमता)—the power to produce conscious transformation and live with less friction and greater understanding.',
    quote: 'शक्ति अर्थात् क्षमता। परिवर्तन उत्पन्न करने की क्षमता। वह कम बाधाएँ चाहता है। अधिक क्षमता। अधिक स्वतंत्रता। अधिक सुरक्षा। अधिक प्रभाव। अधिक समझ।',
    fullContent: `### वास्तविक शक्ति क्या है? (Mati & Vivek)

**Source:** \`my_notes/04_Mati vivek.md\`

1. **शक्ति की वास्तविक परिभाषा (Shakti as Capacity):**
   - शक्ति का अर्थ केवल दूसरों पर अधिकार या प्रभुत्व नहीं है।
   - मनुष्य जो कुछ भी करता है—धन कमाना, विद्या अर्जन, परिवार बनाना, या संसार का त्याग—अंततः वह अपने को इस प्रकार अधिक सक्षम बनाने का प्रयास कर रहा है कि वह अपने वर्तमान से बेहतर अवस्था में जी सके।
   - वह कम बाधाएँ चाहता है, अधिक समझ, अधिक स्वतंत्रता और अपने अंतःकरण पर अधिक नियंत्रण।

2. **विवेक की कसौटी (The Cognitive Filter):**
   - मति (स्वाभाविक आंतरिक बुद्धि) लक्ष्य निर्धारित करती है, किंतु विवेक (डिस्क्रिमिनेशन) यह सुनिश्चित करता है कि शक्ति अहंकार का साधन न बनकर मुक्ति और शांति का साधन बने।
   - विवेक का कार्य है तात्कालिक सुख (प्रेय) और शाश्वत कल्याण (श्रेय) में अंतर स्पष्ट करना।`,
    sourceFile: 'my_notes/04_Mati vivek.md',
    tags: ['Mati', 'Vivek', 'Shakti', 'Advaita', 'Consciousness']
  },
  {
    id: 'concept-vivarta-vada',
    title: 'Vivarta Vada — The Doctrine of Apparent Transformation',
    sanskritTitle: 'विवर्तवाद: आभासी परिवर्तन का सिद्धांत',
    category: 'Vedanta & Darshana',
    summary: 'The bedrock epistemological doctrine of Advaita Vedanta formulated by Adi Shankara. The universe appears to exist through Vivarta (apparent transformation / आभासी परिवर्तन), while the ultimate reality (Brahman) remains completely immutable, just as a rope appears as a snake without undergoing physical transformation.',
    quote: 'आभासी परिवर्तन (Apparent Change): An effect seems to happen, but the cause remains completely unchanged (unlike Parinamavada where milk permanently becomes curd).',
    fullContent: `### विवर्तवाद बनाम परिणामवाद (Vivartavada vs Parinamavada)

**Source:** \`my_notes/06_Vivarta vada and vadas.md\`

1. **आभासी परिवर्तन (Vivarta):**
   - **परिभाषा:** जब कारण अपने वास्तविक स्वरूप को बदले बिना किसी अन्य रूप में केवल प्रतीत होता है, उसे विवर्त कहते हैं।
   - **रस्सी और सर्प (Rope and Snake):** धुंधले प्रकाश में रस्सी सर्प जैसी प्रतीत होती है। अज्ञान (Avidya) के कारण सर्प का आभास होता है, किंतु रस्सी में कोई भौतिक परिवर्तन नहीं होता।
   - **ब्रह्म और जगत:** सम्पूर्ण दृश्य प्रपंच ब्रह्म पर अध्यास (Superimposition) है।

2. **परिणामवाद (Parinama):**
   - जैसे दूध का दही में बदल जाना—यहाँ वास्तविक भौतिक परिवर्तन (Real transformation) होता है। सांख्य और विशिष्टाद्वैत इसे स्वीकार करते हैं, किंतु अद्वैत वेदांत विवर्तवाद को सर्वोच्च सत्य मानता है।

3. **दैनिक जीवन में अनुप्रयोग:**
   - जब आप संसार की अस्थिर घटनाओं को विवर्त रूप में देखते हैं, तो मानसिक तनाव और आसक्ति समाप्त हो जाती है।`,
    sourceFile: 'my_notes/06_Vivarta vada and vadas.md',
    tags: ['Vedanta', 'Vivartavada', 'Shankara', 'Satkaryavada', 'Darshana']
  },
  {
    id: 'concept-uttarkashi-protocol',
    title: 'Uttarkashi Himalayan Sanctuary — Statutory Due Diligence Protocol',
    sanskritTitle: 'उत्तरकाशी हिमालय भू-परीक्षण संहिता',
    category: 'Himalayan Sanctuary',
    summary: 'Comprehensive legal and physical due diligence framework for acquiring peaceful retreat and sadhana land in Uttarkashi district (Uttarakhand). Covers Khasra/Khata title verification, Section 143 conversion, Uttarakhand Land Laws ceiling, and Eco-Sensitive Zone restrictions.',
    quote: 'OBJECTIVE: किसी Uttarkashi, Uttarakhand property को खरीदने से पहले यह verify करना कि असली legal owner कौन है, title साफ है या नहीं, और non-residential/temporary structure legally permissible है या नहीं।',
    fullContent: `### Uttarkashi Land Due Diligence Framework

**Source:** \`my_notes/07_Uttarkashi UK.md\`

1. **संपत्ति की पहचान (Property Identity):**
   - District: Uttarkashi
   - Tehsil, Revenue Village, Patwari / Revenue Circle
   - Khata Number & Khasra / Gata Number
   - Chaukaddi (चारों दिशाओं की सीमाएँ: उत्तर, दक्षिण, पूर्व, पश्चिम)

2. **स्वामित्व एवं दाखिल खारिज (Title & Mutation):**
   - खतौनी (Khatauni) में विक्रेता का नाम संक्रमणीय भूमिधर (Bhumidhar with transferable rights) के रूप में दर्ज होना अनिवार्य है।
   - किसी सह-खातेदार (Co-sharer) का अनसुलझा विवाद न हो।

3. **कानूनी सीमाएं व अनुमतियां (Legal Restrictions):**
   - **उत्तराखंड भूमि सुधार कानून (250 वर्ग मीटर सीमा):** बाहरी नागरिकों के लिए आवासीय सीमा नियमों की पुष्टि।
   - **धारा 143 (Section 143):** कृषि भूमि को गैर-कृषि प्रयोजन के लिए कानूनी रूपांतरण।
   - **ESZ & नदी प्रतिबंध:** भागीरथी इको-सेंसिटिव जोन और नदी तट से आवश्यक कानूनी दूरी।

4. **संरचना निर्माण (Structure Permissibility):**
   - क्या टिन शेड / प्री-फैब्रिकेटेड / इको-फ्रेंडली कॉटेज की अनुमति है।
   - भविष्य में सड़क, बिजली, और पानी की बारहमासी आपूर्ति का सत्यापन।`,
    sourceFile: 'my_notes/07_Uttarkashi UK.md',
    tags: ['Uttarkashi', 'Himalayas', 'LandDiligence', 'Sanctuary', 'Khatauni']
  },
  {
    id: 'concept-notion-os-subsystems',
    title: 'Om Knowledge OS — 24 Relational Subsystems Architecture',
    sanskritTitle: 'ॐ ज्ञान तंत्र: २४ अंतर्संबंधित उपप्रणालियाँ',
    category: 'OS Architecture',
    summary: 'The operational blueprint replacing static Notion pages with active, interconnected relational databases. All life aspects—from kitchen rasoi inventories and daily health to 10-year life pyramids and land acquisitions—cohere into a single offline-first nervous system.',
    quote: 'From static pages to an intelligent relational ecosystem where daily actions roll up to lifetime vision.',
    fullContent: `### The 24 Core Subsystems of Om Knowledge OS

**Source:** \`notion_os/INDEX.md\` & \`notion_os/catalog.json\`

- **Executive Core:** Executive Dashboard, System Documentation, Reviews
- **Action & Focus:** Task Intelligence, Projects Tracker, Ideas Inbox, Universal Inbox
- **Knowledge & Mind:** Knowledge Vault, Research Hub, Reading Library, Master Concepts
- **Life Alignment:** Goals (Life Pyramid), Journal & Reflection, Analytics
- **Living & Earth:** Kitchen Operations, Land & Property Research, Himalayan Spatial GIS
- **Inner Cosmos:** Health & Ayurveda, Astrology & Spiritual Research, Vedic Concordance, Dream & Sadhana, Pranayama Engine`,
    sourceFile: 'notion_os/INDEX.md',
    tags: ['Architecture', 'RelationalOS', 'NotionOS', 'Subsystems']
  }
];

export const V2_LAND_CHECKLIST: V2LandChecklistItem[] = [
  {
    id: 'step-1',
    step: 'Step 01',
    title: 'Property Identification & Coordinates',
    description: 'District: Uttarkashi. Obtain precise Tehsil, Patwari Circle, Khata Number, and Khasra/Gata numbers with GPS boundaries.',
    criticality: 'Mandatory',
    status: 'Verified',
    lawReference: 'UPZALR Act / UK Revenue Code'
  },
  {
    id: 'step-2',
    step: 'Step 02',
    title: 'Khatauni Ownership & Mutation Check',
    description: 'Verify seller is listed as Sankramaniya Bhumidhar (संक्रमणीय भूमिधर) with 100% undisputed inheritance rights.',
    criticality: 'Mandatory',
    status: 'Verified',
    lawReference: 'Revenue Records Registry'
  },
  {
    id: 'step-3',
    step: 'Step 03',
    title: 'Land Area Ceiling & Outsider Purchase Permissibility',
    description: 'Verify 250 sq meter residential ceiling for Uttarakhand non-domicile purchasers or trust/institution approvals.',
    criticality: 'Statutory',
    status: 'In Diligence',
    lawReference: 'Uttarakhand Land Reforms Amendment'
  },
  {
    id: 'step-4',
    step: 'Step 04',
    title: 'Bhagirathi Eco-Sensitive Zone (ESZ) & Forest Buffer',
    description: 'Ensure parcel does not overlap protected reserve forest land, buffer zones, or seasonal flood channels.',
    criticality: 'High',
    status: 'In Diligence',
    lawReference: 'MoEFCC Bhagirathi ESZ Notification'
  },
  {
    id: 'step-5',
    step: 'Step 05',
    title: 'Section 143 Non-Agricultural Conversion',
    description: 'Statutory permission to use agricultural land for peaceful residence, cottage, or spiritual retreat.',
    criticality: 'High',
    status: 'Pending Verification',
    lawReference: 'Section 143 Land Revenue Act'
  },
  {
    id: 'step-6',
    step: 'Step 06',
    title: 'Access Road, Spring Water & Solar Solar Insolation',
    description: 'Physically verify all-weather road path, perennial fresh water spring connection, and winter solar exposure.',
    criticality: 'Mandatory',
    status: 'In Diligence',
    lawReference: 'Site Diligence Protocol'
  }
];

export const V2_LIFE_GOALS: V2LifeGoal[] = [
  {
    id: 'goal-1',
    horizon: 'Life Vision (Moksha)',
    title: 'Self-Realization & Epistemological Freedom',
    pillar: 'Spiritual & Inner',
    description: 'Direct experiential realization of the Non-Dual Self (Advaita Atman) through unbroken viveka and contemplative inquiry.',
    metric: 'Steady abiding in witness consciousness (Sakshi Bhav).'
  },
  {
    id: 'goal-2',
    horizon: '10-Year Horizon',
    title: 'Uttarkashi Himalayan Retreat & Study Sanctuary',
    pillar: 'Himalayan Sanctuary',
    description: 'Establish a self-sustaining eco-hermitage and library near Uttarkashi along the sacred Bhagirathi river for sadhana and writing.',
    metric: 'Clean-title land acquired, eco-cottage built, organic food & herb garden active.'
  },
  {
    id: 'goal-3',
    horizon: '5-Year Autonomy',
    title: 'Sovereign Local-First Knowledge & Operating System',
    pillar: 'Digital & Financial Sovereignty',
    description: 'Complete digital independence with private, encrypted, offline computing systems for all life planning, research, and records.',
    metric: 'Zero dependency on proprietary cloud lock-in; 100% local data ownership.'
  },
  {
    id: 'goal-4',
    horizon: '1-Year Milestone',
    title: 'Finalize Uttarkashi Land Diligence & Acquire Sanctuary Parcel',
    pillar: 'Himalayan Sanctuary',
    description: 'Complete all 6 steps of the Uttarkashi land verification checklist and execute legal sale deed with clean mutation.',
    metric: 'Registered sale deed and mutation record in Tehsil office.'
  },
  {
    id: 'goal-5',
    horizon: 'Quarterly Focus',
    title: 'Consolidate Mati-Vivek Notes & Stabilize Daily Sadhana Cadence',
    pillar: 'Spiritual & Inner',
    description: 'Daily practice of morning breath awareness (Swara Yoga), structured study of Shankara Bhashyas, and evening journaling.',
    metric: '90 consecutive days of morning intention and evening reflection.'
  }
];

export const V2_SAMPLE_JOURNAL: V2JournalPrompt = {
  id: 'journal-today',
  date: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  swaraActive: 'Surya (Right/Pingala)',
  morningIntention: 'Focus on conscious capacity (Shakti) rather than reactive busyness. Apply viveka to separate critical obligations from illusory urgency.',
  deepWorkFocus: 'Synthesize Uttarkashi land checklist steps and review study table dimensions for Trishaa.',
  innerStateMood: 'Quiet, determined, centered in witness awareness.',
  eveningWins: 'Successfully reconciled system architecture; deepened study of Vivarta Vada.',
  lessonLearned: 'True peace comes not from eliminating external complexity, but from remaining unattached as the unchanging observer.'
};
