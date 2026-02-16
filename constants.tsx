
import { PortfolioType } from './types';

export const TYPE_COLORS: Record<PortfolioType, string> = {
  [PortfolioType.SAVINGS]: 'glossy-green',
  [PortfolioType.INVESTMENTS]: 'glossy-blue',
  [PortfolioType.DEBTS]: 'glossy-red',
  [PortfolioType.EMIS]: 'glossy-orange'
};

export const INITIAL_RATES = {
  CAD: { CAD: 1, INR: 61.45, USD: 0.74 },
  INR: { CAD: 0.016, INR: 1, USD: 0.012 },
  USD: { CAD: 1.35, INR: 83.15, USD: 1 }
};

export interface SymbolData {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex';
  sector?: string;
  keywords?: string[];
}

export const POPULAR_SYMBOLS: SymbolData[] = [
  // AI & SOFTWARE
  { symbol: 'APP', name: 'AppLovin Corp', type: 'stock', sector: 'Software', keywords: ['APP', 'APPLOVIN'] },
  { symbol: 'PLTR', name: 'Palantir Technologies', type: 'stock', sector: 'Software', keywords: ['PLTR', 'PALANTIR', 'AI'] },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', sector: 'Technology', keywords: ['NVDA', 'NVIDIA', 'AI', 'CHIPS'] },
  { symbol: 'AI', name: 'C3.ai, Inc.', type: 'stock', sector: 'Software', keywords: ['AI', 'C3AI'] },
  { symbol: 'PATH', name: 'UiPath Inc.', type: 'stock', sector: 'Software', keywords: ['PATH', 'UIPATH', 'AI', 'RPA'] },
  { symbol: 'MSFT', name: 'Microsoft Corp', type: 'stock', sector: 'Technology', keywords: ['MSFT', 'MICROSOFT'] },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', sector: 'Technology', keywords: ['GOOGL', 'GOOGLE', 'ALPHABET'] },
  { symbol: 'AMZN', name: 'Amazon.com', type: 'stock', sector: 'Retail', keywords: ['AMZN', 'AMAZON'] },
  { symbol: 'META', name: 'Meta Platforms', type: 'stock', sector: 'Technology', keywords: ['META', 'FACEBOOK', 'INSTAGRAM'] },
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', sector: 'Technology', keywords: ['AAPL', 'APPLE', 'IPHONE'] },
  { symbol: 'SNOW', name: 'Snowflake Inc.', type: 'stock', sector: 'Cloud', keywords: ['SNOW', 'SNOWFLAKE'] },
  { symbol: 'CRM', name: 'Salesforce', type: 'stock', sector: 'Software', keywords: ['CRM', 'SALESFORCE'] },
  { symbol: 'ADBE', name: 'Adobe Inc.', type: 'stock', sector: 'Software', keywords: ['ADBE', 'ADOBE'] },
  { symbol: 'ORCL', name: 'Oracle Corp', type: 'stock', sector: 'Technology', keywords: ['ORCL', 'ORACLE'] },
  { symbol: 'IBM', name: 'IBM Corp', type: 'stock', sector: 'Technology', keywords: ['IBM'] },
  { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'stock', sector: 'Technology', keywords: ['AMD', 'CHIPS'] },
  { symbol: 'INTC', name: 'Intel Corp', type: 'stock', sector: 'Technology', keywords: ['INTC', 'INTEL'] },
  { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'stock', sector: 'Technology', keywords: ['AVGO', 'BROADCOM'] },
  { symbol: 'TSM', name: 'Taiwan Semi', type: 'stock', sector: 'Technology', keywords: ['TSM', 'TSMC'] },
  { symbol: 'SMCI', name: 'Super Micro Computer', type: 'stock', sector: 'Technology', keywords: ['SMCI', 'SUPERMICRO'] },
  
  // FINTECH & FINANCE
  { symbol: 'PYPL', name: 'PayPal Holdings', type: 'stock', sector: 'Financial', keywords: ['PYPL', 'PAYPAL'] },
  { symbol: 'SQ', name: 'Block, Inc.', type: 'stock', sector: 'Financial', keywords: ['SQ', 'BLOCK', 'SQUARE', 'CASHAPP'] },
  { symbol: 'SOFI', name: 'SoFi Technologies', type: 'stock', sector: 'Financial', keywords: ['SOFI'] },
  { symbol: 'HOOD', name: 'Robinhood Markets', type: 'stock', sector: 'Financial', keywords: ['HOOD', 'ROBINHOOD'] },
  { symbol: 'COIN', name: 'Coinbase Global', type: 'stock', sector: 'Financial', keywords: ['COIN', 'COINBASE', 'CRYPTO'] },
  { symbol: 'V', name: 'Visa Inc.', type: 'stock', sector: 'Financial', keywords: ['V', 'VISA'] },
  { symbol: 'MA', name: 'Mastercard Inc.', type: 'stock', sector: 'Financial', keywords: ['MA', 'MASTERCARD'] },
  { symbol: 'JPM', name: 'JPMorgan Chase', type: 'stock', sector: 'Financial', keywords: ['JPM', 'JPMORGAN'] },
  { symbol: 'GS', name: 'Goldman Sachs', type: 'stock', sector: 'Financial', keywords: ['GS', 'GOLDMAN'] },
  { symbol: 'MSTR', name: 'MicroStrategy', type: 'stock', sector: 'Software', keywords: ['MSTR', 'MICROSTRATEGY', 'BITCOIN'] },
  
  // AUTOMOTIVE & ENERGY
  { symbol: 'TSLA', name: 'Tesla, Inc.', type: 'stock', sector: 'Automotive', keywords: ['TSLA', 'TESLA', 'EV'] },
  { symbol: 'RIVN', name: 'Rivian Automotive', type: 'stock', sector: 'Automotive', keywords: ['RIVN', 'RIVIAN'] },
  { symbol: 'LCID', name: 'Lucid Group', type: 'stock', sector: 'Automotive', keywords: ['LCID', 'LUCID'] },
  { symbol: 'F', name: 'Ford Motor', type: 'stock', sector: 'Automotive', keywords: ['F', 'FORD'] },
  { symbol: 'GM', name: 'General Motors', type: 'stock', sector: 'Automotive', keywords: ['GM'] },
  { symbol: 'NIO', name: 'NIO Inc.', type: 'stock', sector: 'Automotive', keywords: ['NIO'] },
  { symbol: 'XPEV', name: 'Xpeng Inc.', type: 'stock', sector: 'Automotive', keywords: ['XPEV', 'XPENG'] },
  
  // CONSUMER & RETAIL
  { symbol: 'NFLX', name: 'Netflix, Inc.', type: 'stock', sector: 'Media', keywords: ['NFLX', 'NETFLIX'] },
  { symbol: 'DIS', name: 'Disney', type: 'stock', sector: 'Media', keywords: ['DIS', 'DISNEY'] },
  { symbol: 'SPOT', name: 'Spotify', type: 'stock', sector: 'Media', keywords: ['SPOT', 'SPOTIFY'] },
  { symbol: 'UBER', name: 'Uber Technologies', type: 'stock', sector: 'Transportation', keywords: ['UBER'] },
  { symbol: 'LYFT', name: 'Lyft, Inc.', type: 'stock', sector: 'Transportation', keywords: ['LYFT'] },
  { symbol: 'ABNB', name: 'Airbnb Inc.', type: 'stock', sector: 'Travel', keywords: ['ABNB', 'AIRBNB'] },
  { symbol: 'BKNG', name: 'Booking Holdings', type: 'stock', sector: 'Travel', keywords: ['BKNG', 'BOOKING'] },
  { symbol: 'SHOP', name: 'Shopify', type: 'stock', sector: 'Retail', keywords: ['SHOP', 'SHOPIFY'] },
  { symbol: 'BABA', name: 'Alibaba Group', type: 'stock', sector: 'Retail', keywords: ['BABA', 'ALIBABA'] },
  { symbol: 'JD', name: 'JD.com', type: 'stock', sector: 'Retail', keywords: ['JD'] },
  { symbol: 'PDD', name: 'Pinduoduo', type: 'stock', sector: 'Retail', keywords: ['PDD', 'TEMU'] },
  { symbol: 'WMT', name: 'Walmart', type: 'stock', sector: 'Retail', keywords: ['WMT', 'WALMART'] },
  { symbol: 'TGT', name: 'Target Corp', type: 'stock', sector: 'Retail', keywords: ['TGT', 'TARGET'] },
  { symbol: 'COST', name: 'Costco Wholesale', type: 'stock', sector: 'Retail', keywords: ['COST', 'COSTCO'] },
  { symbol: 'SBUX', name: 'Starbucks', type: 'stock', sector: 'Retail', keywords: ['SBUX', 'STARBUCKS'] },
  { symbol: 'KO', name: 'Coca-Cola', type: 'stock', sector: 'Retail', keywords: ['KO', 'COKE'] },
  { symbol: 'PEP', name: 'PepsiCo', type: 'stock', sector: 'Retail', keywords: ['PEP', 'PEPSI'] },

  // CRYPTO
  { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', keywords: ['BTC', 'BITCOIN'] },
  { symbol: 'ETH', name: 'Ethereum', type: 'crypto', keywords: ['ETH', 'ETHEREUM'] },
  { symbol: 'SOL', name: 'Solana', type: 'crypto', keywords: ['SOL', 'SOLANA'] },
  { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', keywords: ['BNB', 'BINANCE'] },
  { symbol: 'XRP', name: 'Ripple', type: 'crypto', keywords: ['XRP', 'RIPPLE'] },
  { symbol: 'ADA', name: 'Cardano', type: 'crypto', keywords: ['ADA', 'CARDANO'] },
  { symbol: 'AVAX', name: 'Avalanche', type: 'crypto', keywords: ['AVAX', 'AVALANCHE'] },
  { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', keywords: ['DOGE', 'DOGECOIN'] },
  { symbol: 'DOT', name: 'Polkadot', type: 'crypto', keywords: ['DOT', 'POLKADOT'] },
  { symbol: 'LINK', name: 'Chainlink', type: 'crypto', keywords: ['LINK', 'CHAINLINK'] },
  { symbol: 'MATIC', name: 'Polygon', type: 'crypto', keywords: ['MATIC', 'POLYGON'] },
  { symbol: 'PEPE', name: 'Pepe', type: 'crypto', keywords: ['PEPE', 'PEPECOIN'] },
  { symbol: 'SUI', name: 'Sui Network', type: 'crypto', keywords: ['SUI'] },
  { symbol: 'APT', name: 'Aptos', type: 'crypto', keywords: ['APT', 'APTOS'] },
  { symbol: 'NEAR', name: 'Near Protocol', type: 'crypto', keywords: ['NEAR'] },
  
  // FOREX
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex', keywords: ['EUR', 'USD', 'EURO'] },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex', keywords: ['GBP', 'POUND'] },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'forex', keywords: ['JPY', 'YEN'] },
  { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', type: 'forex', keywords: ['AUD', 'AUSSIE'] },
  { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', type: 'forex', keywords: ['CAD', 'LOONIE'] },
  { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', type: 'forex', keywords: ['CHF', 'FRANC'] },
  { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', type: 'forex', keywords: ['NZD', 'KIWI'] },
];
