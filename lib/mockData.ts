import { Fact } from './types';

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

export const MOCK_FACTS: Fact[] = [
  {
    id: 'fed-funds-rate',
    headline: 'Federal Funds Rate',
    currentValue: '4.25–4.50% (held)',
    category: 'economy',
    importance: 'breaking',
    confidence: 'confirmed',
    tags: ['federal-reserve', 'interest-rates', 'monetary-policy'],
    lastUpdated: hoursAgo(2),
    relatedFacts: ['us-cpi-inflation', 'us-10y-treasury', 'us-unemployment'],
    sources: [
      { name: 'Federal Reserve', url: 'https://federalreserve.gov', tier: 'primary', retrievedAt: hoursAgo(2) },
      { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: hoursAgo(2) },
    ],
    timeline: [
      {
        id: 'fed-r4',
        timestamp: hoursAgo(2),
        previousValue: 'Market expected 25bp cut',
        newValue: '4.25–4.50% (held)',
        delta: 'Rate held steady — first hold after 3 consecutive cuts',
        whyItMatters: 'The Fed\'s pause signals renewed concern about inflation persistence, pushing back expectations for further easing into late 2026.',
        source: { name: 'Federal Reserve', url: 'https://federalreserve.gov', tier: 'primary', retrievedAt: hoursAgo(2) },
        revisionType: 'update',
      },
      {
        id: 'fed-r3',
        timestamp: daysAgo(30),
        previousValue: '4.50–4.75%',
        newValue: '4.25–4.50%',
        delta: 'Third consecutive 25bp cut',
        whyItMatters: 'The January cut completed a 75bp easing cycle begun in late 2025, bringing rates to their lowest since early 2023.',
        source: { name: 'Federal Reserve', url: 'https://federalreserve.gov', tier: 'primary', retrievedAt: daysAgo(30) },
        revisionType: 'update',
      },
      {
        id: 'fed-r2',
        timestamp: daysAgo(60),
        previousValue: '4.75–5.00%',
        newValue: '4.50–4.75%',
        delta: 'Second consecutive 25bp cut',
        whyItMatters: 'Back-to-back cuts confirmed the Fed\'s pivot toward accommodation as labor market data softened.',
        source: { name: 'Federal Reserve', url: 'https://federalreserve.gov', tier: 'primary', retrievedAt: daysAgo(60) },
        revisionType: 'update',
      },
      {
        id: 'fed-r1',
        timestamp: daysAgo(90),
        previousValue: null,
        newValue: '4.75–5.00%',
        delta: 'First cut since 2020',
        whyItMatters: 'The Fed\'s initial rate cut marked the end of the most aggressive tightening cycle in four decades.',
        source: { name: 'Federal Reserve', url: 'https://federalreserve.gov', tier: 'primary', retrievedAt: daysAgo(90) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'us-cpi-inflation',
    headline: 'US CPI Inflation Rate',
    currentValue: '3.1% (Jan 2026)',
    category: 'economy',
    importance: 'high',
    confidence: 'confirmed',
    tags: ['inflation', 'cpi', 'consumer-prices'],
    lastUpdated: hoursAgo(6),
    relatedFacts: ['fed-funds-rate', 'us-10y-treasury'],
    sources: [
      { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: hoursAgo(6) },
      { name: 'AP', url: 'https://apnews.com', tier: 'wire', retrievedAt: hoursAgo(6) },
    ],
    timeline: [
      {
        id: 'cpi-r3',
        timestamp: hoursAgo(6),
        previousValue: '2.9% (Dec 2025)',
        newValue: '3.1% (Jan 2026)',
        delta: 'Inflation ticked up 0.2pp, above 2.9% forecast',
        whyItMatters: 'The unexpected rise reinforces the Fed\'s decision to pause rate cuts, keeping pressure on household budgets and bond markets.',
        source: { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: hoursAgo(6) },
        revisionType: 'update',
      },
      {
        id: 'cpi-r2',
        timestamp: daysAgo(30),
        previousValue: '3.2% (Nov 2025)',
        newValue: '2.9% (Dec 2025)',
        delta: 'Fell to 2.9%, first sub-3% reading since Feb 2021',
        whyItMatters: 'December\'s drop toward the Fed\'s 2% target fueled optimism for additional rate cuts in early 2026.',
        source: { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: daysAgo(30) },
        revisionType: 'update',
      },
      {
        id: 'cpi-r1',
        timestamp: daysAgo(60),
        previousValue: null,
        newValue: '3.2% (Nov 2025)',
        delta: 'Initial reading for this tracking period',
        whyItMatters: 'Inflation remained above the Fed\'s 2% target, keeping monetary policy discussions active.',
        source: { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: daysAgo(60) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'us-10y-treasury',
    headline: '10-Year Treasury Yield',
    currentValue: '4.61%',
    category: 'economy',
    importance: 'medium',
    confidence: 'confirmed',
    tags: ['bonds', 'treasury', 'yield', 'interest-rates'],
    lastUpdated: hoursAgo(1),
    relatedFacts: ['fed-funds-rate', 'us-cpi-inflation'],
    sources: [
      { name: 'US Treasury', url: 'https://treasury.gov', tier: 'primary', retrievedAt: hoursAgo(1) },
      { name: 'Bloomberg', url: 'https://bloomberg.com', tier: 'reporting', retrievedAt: hoursAgo(1) },
    ],
    timeline: [
      {
        id: '10y-r2',
        timestamp: hoursAgo(1),
        previousValue: '4.41%',
        newValue: '4.61%',
        delta: 'Rose 20bps following hotter-than-expected CPI print',
        whyItMatters: 'Rising yields signal bond markets are pricing in fewer Fed cuts, increasing borrowing costs for mortgages and corporate debt.',
        source: { name: 'US Treasury', url: 'https://treasury.gov', tier: 'primary', retrievedAt: hoursAgo(1) },
        revisionType: 'update',
      },
      {
        id: '10y-r1',
        timestamp: daysAgo(7),
        previousValue: null,
        newValue: '4.41%',
        delta: 'Initial tracking value',
        whyItMatters: 'The 10-year yield serves as the global benchmark rate, affecting trillions in financial contracts.',
        source: { name: 'US Treasury', url: 'https://treasury.gov', tier: 'primary', retrievedAt: daysAgo(7) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'ukraine-russia-ceasefire',
    headline: 'Ukraine-Russia Ceasefire Negotiations',
    currentValue: 'Talks ongoing — no agreement',
    category: 'geopolitics',
    importance: 'breaking',
    confidence: 'developing',
    tags: ['ukraine', 'russia', 'war', 'ceasefire', 'nato'],
    lastUpdated: hoursAgo(3),
    relatedFacts: ['nato-defense-spending', 'eu-energy-prices'],
    sources: [
      { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: hoursAgo(3) },
      { name: 'AP', url: 'https://apnews.com', tier: 'wire', retrievedAt: hoursAgo(3) },
      { name: 'White House', url: 'https://whitehouse.gov', tier: 'primary', retrievedAt: hoursAgo(5) },
    ],
    timeline: [
      {
        id: 'ukr-r4',
        timestamp: hoursAgo(3),
        previousValue: 'US-brokered framework proposed',
        newValue: 'Talks ongoing — no agreement',
        delta: 'Russia rejected US framework; counter-proposal expected within 72 hours',
        whyItMatters: 'The rejection delays a potential ceasefire and prolongs uncertainty over European energy and security arrangements.',
        source: { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: hoursAgo(3) },
        revisionType: 'update',
      },
      {
        id: 'ukr-r3',
        timestamp: hoursAgo(48),
        previousValue: 'Bilateral talks refused',
        newValue: 'US-brokered framework proposed',
        delta: 'Trump administration presented a 30-day ceasefire framework to both parties',
        whyItMatters: 'The US proposal represents the first concrete Western-mediated peace initiative since hostilities escalated in 2022.',
        source: { name: 'White House', url: 'https://whitehouse.gov', tier: 'primary', retrievedAt: hoursAgo(48) },
        revisionType: 'escalation',
      },
      {
        id: 'ukr-r2',
        timestamp: daysAgo(14),
        previousValue: 'Active frontline fighting',
        newValue: 'Bilateral talks refused',
        delta: 'Ukraine formally declined direct talks with Russia without security guarantees',
        whyItMatters: 'Ukraine\'s condition for NATO membership assurances as a precondition for talks hardened negotiating positions.',
        source: { name: 'AP', url: 'https://apnews.com', tier: 'wire', retrievedAt: daysAgo(14) },
        revisionType: 'update',
      },
      {
        id: 'ukr-r1',
        timestamp: daysAgo(30),
        previousValue: null,
        newValue: 'Active frontline fighting',
        delta: 'Tracking period begins with ongoing conflict in eastern Ukraine',
        whyItMatters: 'The conflict has displaced millions and reshaped European security architecture.',
        source: { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: daysAgo(30) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'nato-defense-spending',
    headline: 'NATO Defense Spending Target',
    currentValue: '3% of GDP (proposed)',
    category: 'geopolitics',
    importance: 'high',
    confidence: 'developing',
    tags: ['nato', 'defense', 'europe', 'military-spending'],
    lastUpdated: hoursAgo(18),
    relatedFacts: ['ukraine-russia-ceasefire'],
    sources: [
      { name: 'NATO', url: 'https://nato.int', tier: 'primary', retrievedAt: hoursAgo(18) },
      { name: 'WSJ', url: 'https://wsj.com', tier: 'reporting', retrievedAt: hoursAgo(18) },
    ],
    timeline: [
      {
        id: 'nato-r2',
        timestamp: hoursAgo(18),
        previousValue: '2% of GDP (current target)',
        newValue: '3% of GDP (proposed)',
        delta: 'US formally demanded NATO allies raise target to 3% GDP',
        whyItMatters: 'Only 11 of 32 NATO members currently meet the existing 2% target; a 3% threshold would require unprecedented defense budget increases across Europe.',
        source: { name: 'NATO', url: 'https://nato.int', tier: 'primary', retrievedAt: hoursAgo(18) },
        revisionType: 'escalation',
      },
      {
        id: 'nato-r1',
        timestamp: daysAgo(45),
        previousValue: null,
        newValue: '2% of GDP (current target)',
        delta: 'Existing NATO spending commitment',
        whyItMatters: 'The 2% GDP target was established in 2014 following Russia\'s annexation of Crimea.',
        source: { name: 'NATO', url: 'https://nato.int', tier: 'primary', retrievedAt: daysAgo(45) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'openai-o3-model',
    headline: 'OpenAI o3 Model Benchmark Performance',
    currentValue: '87.5% on ARC-AGI-2',
    category: 'technology',
    importance: 'high',
    confidence: 'confirmed',
    tags: ['openai', 'ai', 'benchmark', 'agi', 'reasoning'],
    lastUpdated: hoursAgo(12),
    relatedFacts: ['ai-chip-shortage', 'anthropic-funding'],
    sources: [
      { name: 'OpenAI', url: 'https://openai.com', tier: 'primary', retrievedAt: hoursAgo(12) },
      { name: 'The Verge', url: 'https://theverge.com', tier: 'reporting', retrievedAt: hoursAgo(12) },
    ],
    timeline: [
      {
        id: 'o3-r3',
        timestamp: hoursAgo(12),
        previousValue: '75.7% on ARC-AGI-2',
        newValue: '87.5% on ARC-AGI-2',
        delta: 'Updated o3 achieves 87.5% on ARC-AGI-2, up from 75.7%',
        whyItMatters: 'The score surpasses average human performance (85%) on ARC-AGI-2 for the first time, a milestone AI researchers have used as a proxy for general reasoning.',
        source: { name: 'OpenAI', url: 'https://openai.com', tier: 'primary', retrievedAt: hoursAgo(12) },
        revisionType: 'update',
      },
      {
        id: 'o3-r2',
        timestamp: daysAgo(14),
        previousValue: '43.1% on ARC-AGI (original)',
        newValue: '75.7% on ARC-AGI-2',
        delta: 'OpenAI released o3 evaluation on harder ARC-AGI-2 benchmark',
        whyItMatters: 'ARC-AGI-2 was designed to be significantly harder than the original, making o3\'s 75.7% score notable despite being below human-level.',
        source: { name: 'OpenAI', url: 'https://openai.com', tier: 'primary', retrievedAt: daysAgo(14) },
        revisionType: 'update',
      },
      {
        id: 'o3-r1',
        timestamp: daysAgo(60),
        previousValue: null,
        newValue: '43.1% on ARC-AGI (original)',
        delta: 'Initial o3 ARC-AGI benchmark reported at release',
        whyItMatters: 'The score dramatically exceeded GPT-4\'s 5% on the same benchmark, signaling a qualitative leap in AI reasoning capability.',
        source: { name: 'OpenAI', url: 'https://openai.com', tier: 'primary', retrievedAt: daysAgo(60) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'ai-chip-shortage',
    headline: 'AI GPU Supply Constraint',
    currentValue: 'H100/H200: 6–9 month lead time',
    category: 'technology',
    importance: 'medium',
    confidence: 'developing',
    tags: ['nvidia', 'chips', 'ai', 'hardware', 'supply-chain'],
    lastUpdated: hoursAgo(24),
    relatedFacts: ['openai-o3-model', 'us-chip-export-controls'],
    sources: [
      { name: 'Nvidia', url: 'https://nvidia.com', tier: 'primary', retrievedAt: hoursAgo(24) },
      { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: hoursAgo(24) },
    ],
    timeline: [
      {
        id: 'chip-r3',
        timestamp: hoursAgo(24),
        previousValue: '9–12 month lead time',
        newValue: '6–9 month lead time',
        delta: 'Lead times improved as TSMC expanded CoWoS packaging capacity',
        whyItMatters: 'Shorter wait times ease bottlenecks for AI infrastructure buildout, though demand continues to outpace supply.',
        source: { name: 'Nvidia', url: 'https://nvidia.com', tier: 'primary', retrievedAt: hoursAgo(24) },
        revisionType: 'update',
      },
      {
        id: 'chip-r2',
        timestamp: daysAgo(90),
        previousValue: '12+ month lead time',
        newValue: '9–12 month lead time',
        delta: 'Lead times shortened slightly as production scaled',
        whyItMatters: 'Even marginal improvements in GPU availability accelerate AI model training timelines for major labs.',
        source: { name: 'Reuters', url: 'https://reuters.com', tier: 'wire', retrievedAt: daysAgo(90) },
        revisionType: 'update',
      },
      {
        id: 'chip-r1',
        timestamp: daysAgo(180),
        previousValue: null,
        newValue: '12+ month lead time',
        delta: 'Severe shortage emerged following ChatGPT-driven demand surge',
        whyItMatters: 'GPU scarcity became a primary constraint on AI model development speed and competitive positioning.',
        source: { name: 'Nvidia', url: 'https://nvidia.com', tier: 'primary', retrievedAt: daysAgo(180) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'us-tariff-policy',
    headline: 'US Import Tariff Rate (China)',
    currentValue: '60% blanket tariff (active)',
    category: 'economy',
    importance: 'high',
    confidence: 'confirmed',
    tags: ['tariffs', 'trade', 'china', 'trade-war'],
    lastUpdated: hoursAgo(36),
    relatedFacts: ['us-cpi-inflation', 'ai-chip-shortage'],
    sources: [
      { name: 'White House', url: 'https://whitehouse.gov', tier: 'primary', retrievedAt: hoursAgo(36) },
      { name: 'WSJ', url: 'https://wsj.com', tier: 'reporting', retrievedAt: hoursAgo(36) },
    ],
    timeline: [
      {
        id: 'tariff-r3',
        timestamp: hoursAgo(36),
        previousValue: '25% (sector-specific)',
        newValue: '60% blanket tariff (active)',
        delta: 'Blanket 60% tariff on all Chinese imports went into effect',
        whyItMatters: 'The tariff is the broadest since Smoot-Hawley and is expected to raise consumer goods prices 0.5–1.2% according to CBO estimates.',
        source: { name: 'White House', url: 'https://whitehouse.gov', tier: 'primary', retrievedAt: hoursAgo(36) },
        revisionType: 'escalation',
      },
      {
        id: 'tariff-r2',
        timestamp: daysAgo(20),
        previousValue: '10% proposed',
        newValue: '25% (sector-specific)',
        delta: 'Tariff rate raised to 25% on electronics, steel, and EVs',
        whyItMatters: 'Targeted sectors saw immediate price pressure; auto manufacturers began supply chain restructuring.',
        source: { name: 'WSJ', url: 'https://wsj.com', tier: 'reporting', retrievedAt: daysAgo(20) },
        revisionType: 'update',
      },
      {
        id: 'tariff-r1',
        timestamp: daysAgo(40),
        previousValue: null,
        newValue: '10% proposed',
        delta: 'Administration announced intent to impose 10% universal tariff on Chinese goods',
        whyItMatters: 'Initial proposal sparked market volatility and diplomatic protests from Beijing.',
        source: { name: 'White House', url: 'https://whitehouse.gov', tier: 'primary', retrievedAt: daysAgo(40) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'us-unemployment',
    headline: 'US Unemployment Rate',
    currentValue: '4.1% (Jan 2026)',
    category: 'economy',
    importance: 'medium',
    confidence: 'confirmed',
    tags: ['unemployment', 'jobs', 'labor-market', 'economy'],
    lastUpdated: hoursAgo(72),
    relatedFacts: ['fed-funds-rate', 'us-cpi-inflation'],
    sources: [
      { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: hoursAgo(72) },
    ],
    timeline: [
      {
        id: 'unemp-r2',
        timestamp: hoursAgo(72),
        previousValue: '4.2% (Dec 2025)',
        newValue: '4.1% (Jan 2026)',
        delta: 'Fell 0.1pp; 256K non-farm payrolls added vs 185K expected',
        whyItMatters: 'The strong jobs report reduces Fed urgency to cut rates, supporting the February hold decision.',
        source: { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: hoursAgo(72) },
        revisionType: 'update',
      },
      {
        id: 'unemp-r1',
        timestamp: daysAgo(35),
        previousValue: null,
        newValue: '4.2% (Dec 2025)',
        delta: 'Initial reading for this tracking period',
        whyItMatters: 'The labor market remained resilient despite restrictive monetary policy.',
        source: { name: 'Bureau of Labor Statistics', url: 'https://bls.gov', tier: 'primary', retrievedAt: daysAgo(35) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'anthropic-funding',
    headline: 'Anthropic Total Funding',
    currentValue: '$14.8B (cumulative)',
    category: 'technology',
    importance: 'medium',
    confidence: 'confirmed',
    tags: ['anthropic', 'ai', 'funding', 'venture-capital'],
    lastUpdated: hoursAgo(48),
    relatedFacts: ['openai-o3-model', 'ai-chip-shortage'],
    sources: [
      { name: 'Anthropic', url: 'https://anthropic.com', tier: 'primary', retrievedAt: hoursAgo(48) },
      { name: 'Bloomberg', url: 'https://bloomberg.com', tier: 'reporting', retrievedAt: hoursAgo(48) },
    ],
    timeline: [
      {
        id: 'anth-r3',
        timestamp: hoursAgo(48),
        previousValue: '$7.3B cumulative',
        newValue: '$14.8B (cumulative)',
        delta: 'Anthropic closed $7.5B Series E round led by Google',
        whyItMatters: 'The raise values Anthropic at $61.5B and provides capital to compete with OpenAI on compute and talent.',
        source: { name: 'Bloomberg', url: 'https://bloomberg.com', tier: 'reporting', retrievedAt: hoursAgo(48) },
        revisionType: 'update',
      },
      {
        id: 'anth-r2',
        timestamp: daysAgo(180),
        previousValue: '$4.1B cumulative',
        newValue: '$7.3B cumulative',
        delta: 'Amazon invested additional $2.75B to complete $4B commitment',
        whyItMatters: 'Amazon\'s full commitment secured Anthropic\'s position as the primary AI provider for AWS customers.',
        source: { name: 'Anthropic', url: 'https://anthropic.com', tier: 'primary', retrievedAt: daysAgo(180) },
        revisionType: 'update',
      },
      {
        id: 'anth-r1',
        timestamp: daysAgo(365),
        previousValue: null,
        newValue: '$4.1B cumulative',
        delta: 'Initial tracking period begins after Google $300M investment',
        whyItMatters: 'Google\'s early backing positioned Anthropic as the leading alternative to OpenAI in the enterprise AI market.',
        source: { name: 'Bloomberg', url: 'https://bloomberg.com', tier: 'reporting', retrievedAt: daysAgo(365) },
        revisionType: 'initial',
      },
    ],
  },
  {
    id: 'global-temp-record',
    headline: 'Global Average Surface Temperature Anomaly',
    currentValue: '+1.62°C above pre-industrial baseline',
    category: 'climate',
    importance: 'high',
    confidence: 'confirmed',
    tags: ['climate-change', 'temperature', 'paris-agreement', 'global-warming'],
    lastUpdated: hoursAgo(12),
    relatedFacts: [],
    sources: [
      { name: 'Copernicus Climate Change Service', url: 'https://climate.copernicus.eu', tier: 'primary', retrievedAt: hoursAgo(12) },
      { name: 'NASA GISS', url: 'https://nasa.gov', tier: 'primary', retrievedAt: hoursAgo(12) },
    ],
    timeline: [
      {
        id: 'temp-r3',
        timestamp: hoursAgo(12),
        previousValue: '+1.55°C (2024 annual average)',
        newValue: '+1.62°C above pre-industrial baseline',
        delta: 'January 2026 recorded +1.62°C, second hottest January ever',
        whyItMatters: 'Consecutive months above the 1.5°C Paris Agreement threshold are increasing pressure on governments to accelerate emissions reduction pledges.',
        source: { name: 'Copernicus Climate Change Service', url: 'https://climate.copernicus.eu', tier: 'primary', retrievedAt: hoursAgo(12) },
        revisionType: 'update',
      },
      {
        id: 'temp-r2',
        timestamp: daysAgo(30),
        previousValue: '+1.48°C (2023 annual average)',
        newValue: '+1.55°C (2024 annual average)',
        delta: '2024 confirmed as hottest year on record, first full calendar year above 1.5°C',
        whyItMatters: '2024 breached the 1.5°C Paris Agreement limit on an annual basis for the first time, a threshold scientists warn is critical for limiting catastrophic impacts.',
        source: { name: 'NASA GISS', url: 'https://nasa.gov', tier: 'primary', retrievedAt: daysAgo(30) },
        revisionType: 'escalation',
      },
      {
        id: 'temp-r1',
        timestamp: daysAgo(365),
        previousValue: null,
        newValue: '+1.48°C (2023 annual average)',
        delta: 'Initial tracking period baseline established',
        whyItMatters: '2023 was then the hottest year recorded, marking a step-change in warming acceleration.',
        source: { name: 'Copernicus Climate Change Service', url: 'https://climate.copernicus.eu', tier: 'primary', retrievedAt: daysAgo(365) },
        revisionType: 'initial',
      },
    ],
  },
];

export const CATEGORIES = [
  { id: 'economy', label: 'Economy', sfSymbol: 'chart.bar.fill', iconName: 'bar-chart-2' },
  { id: 'geopolitics', label: 'Geopolitics', sfSymbol: 'globe.americas.fill', iconName: 'globe' },
  { id: 'technology', label: 'Technology', sfSymbol: 'cpu.fill', iconName: 'cpu' },
  { id: 'science', label: 'Science', sfSymbol: 'atom', iconName: 'zap' },
  { id: 'health', label: 'Health', sfSymbol: 'heart.fill', iconName: 'heart' },
  { id: 'climate', label: 'Climate', sfSymbol: 'thermometer.sun.fill', iconName: 'thermometer' },
  { id: 'legal', label: 'Legal', sfSymbol: 'scale.3d', iconName: 'scale' },
  { id: 'security', label: 'Security', sfSymbol: 'shield.fill', iconName: 'shield' },
] as const;

export function getFactsForCategory(category: string): Fact[] {
  if (category === 'all') return MOCK_FACTS;
  return MOCK_FACTS.filter(f => f.category === category);
}

export function getFactById(id: string): Fact | undefined {
  return MOCK_FACTS.find(f => f.id === id);
}

export function searchFacts(query: string): Fact[] {
  const q = query.toLowerCase();
  return MOCK_FACTS.filter(f =>
    f.headline.toLowerCase().includes(q) ||
    f.currentValue.toLowerCase().includes(q) ||
    f.tags.some(t => t.toLowerCase().includes(q)) ||
    f.timeline.some(r =>
      r.delta.toLowerCase().includes(q) ||
      r.whyItMatters.toLowerCase().includes(q)
    )
  );
}

export function getUpdateCountToday(category: string): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const facts = category === 'all' ? MOCK_FACTS : MOCK_FACTS.filter(f => f.category === category);
  return facts.reduce((acc, f) => {
    const todayRevisions = f.timeline.filter(r => r.timestamp > cutoff).length;
    return acc + todayRevisions;
  }, 0);
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
