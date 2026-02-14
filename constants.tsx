
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
