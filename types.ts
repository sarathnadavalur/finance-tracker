
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

export enum TransactionCategory {
  FOOD = 'Food',
  RENT = 'Rent',
  UTILITIES = 'Utilities',
  GROCERY = 'Grocery',
  ENTERTAINMENT = 'Entertainment',
  SALARY = 'Salary',
  OTHER = 'Other'
}

export type AuthMethod = 'local' | 'google' | null;

export interface Transaction {
  id: string;
  portfolioId: string;
  amount: number;
  category: TransactionCategory;
  note: string;
  date: number; // timestamp
  type: 'income' | 'expense';
  updatedAt: number;
}

export interface Portfolio {
  id: string;
  name: string;
  type: PortfolioType;
  currency: Currency;
  value: number;
  totalEmiValue?: number;
  emiStartDate?: string;
  monthlyEmiAmount?: number;
  paymentDate?: string;
  updatedAt: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currency: Currency;
  portfolioIds: string[]; // Linked portfolios that contribute to this goal
  deadline?: string;
  color: string;
  updatedAt: number;
}

export interface UserProfile {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
  age?: string;
  dob?: string;
  avatar?: string;
  authMethod: AuthMethod;
  pin?: string;
  biometricId?: string;
  lastActive?: number;
  syncEnabled?: boolean;
  lastCloudSync?: number;
  trackedSymbols?: string[];
}

export interface AppSettings {
  darkMode: boolean;
  fontSize: number;
  privacyMode: boolean;
  autoSync: boolean;
  selectedModel: string;
}

export interface ExchangeRates {
  [Currency.CAD]: { [key in Currency]: number };
  [Currency.INR]: { [key in Currency]: number };
  [Currency.USD]: { [key in Currency]: number };
}
