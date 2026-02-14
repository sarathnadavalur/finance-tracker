
export enum PortfolioType {
  SAVINGS = 'Savings',
  INVESTMENTS = 'Investments',
  DEBTS = 'Debts',
  EMIS = 'EMIs'
}

export enum Currency {
  CAD = 'CAD',
  INR = 'INR',
  USD = 'USD'
}

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  currency: Currency;
  value: number;
  // EMI specific fields
  totalEmiValue?: number;
  emiStartDate?: string;
  monthlyEmiAmount?: number;
  paymentDate?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export interface AppSettings {
  darkMode: boolean;
  fontSize: number; // base size in pixels
}

export interface ExchangeRates {
  [Currency.CAD]: { [key in Currency]: number };
  [Currency.INR]: { [key in Currency]: number };
  [Currency.USD]: { [key in Currency]: number };
}
