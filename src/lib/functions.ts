export interface AccountingFunction {
  id: string;
  name: string;
  description: string;
  code: string;
  tags: string[];
}

export const ACCOUNTING_FUNCTIONS: AccountingFunction[] = [
  {
    id: '1',
    name: 'Calculate Gross Profit',
    description: 'Calculates the gross profit by subtracting the cost of goods sold (COGS) from total revenue. This is a key indicator of profitability.',
    code: `function calculateGrossProfit(revenue, cogs) {
  if (revenue < 0 || cogs < 0) {
    throw new Error("Revenue and COGS must be non-negative.");
  }
  return revenue - cogs;
}

const revenue = 500000;
const cogs = 200000;
const grossProfit = calculateGrossProfit(revenue, cogs);
console.log(\`Gross Profit: \${grossProfit}\`);`,
    tags: ['profitability', 'income statement'],
  },
  {
    id: '2',
    name: 'Calculate Net Income',
    description: 'Determines the net income by subtracting all expenses, including taxes and interest, from all revenues.',
    code: `function calculateNetIncome(grossProfit, operatingExpenses, taxRate, interest) {
  const earningsBeforeTax = grossProfit - operatingExpenses - interest;
  const netIncome = earningsBeforeTax * (1 - taxRate);
  return netIncome;
}

const grossProfit = 300000;
const operatingExpenses = 150000;
const interest = 10000;
const taxRate = 0.21; // 21%
const netIncome = calculateNetIncome(grossProfit, operatingExpenses, taxRate, interest);
console.log(\`Net Income: \${netIncome.toFixed(2)}\`);`,
    tags: ['profitability', 'income statement', 'core'],
  },
  {
    id: '3',
    name: 'Calculate Current Ratio',
    description: 'Measures a company\'s ability to pay short-term obligations (due within one year). It indicates how a company can use current assets to cover current debts.',
    code: `function calculateCurrentRatio(currentAssets, currentLiabilities) {
  if (currentLiabilities === 0) {
    return Infinity; // or handle as an error for division by zero
  }
  return currentAssets / currentLiabilities;
}

const currentAssets = 708000;
const currentLiabilities = 430000;
const currentRatio = calculateCurrentRatio(currentAssets, currentLiabilities);
console.log(\`Current Ratio: \${currentRatio.toFixed(2)}\`);`,
    tags: ['liquidity', 'balance sheet', 'ratio'],
  },
  {
    id: '4',
    name: 'Depreciation (Straight-Line)',
    description: 'Calculates asset depreciation using the straight-line method, which evenly distributes the cost over its useful life.',
    code: `function calculateStraightLineDepreciation(cost, salvageValue, usefulLife) {
  if (usefulLife <= 0) {
    throw new Error("Useful life must be positive.");
  }
  const depreciableAmount = cost - salvageValue;
  return depreciableAmount / usefulLife;
}

const assetCost = 10000;
const salvageValue = 1000;
const usefulLifeYears = 5;
const annualDepreciation = calculateStraightLineDepreciation(assetCost, salvageValue, usefulLifeYears);
console.log(\`Annual Depreciation: \${annualDepreciation}\`);`,
    tags: ['assets', 'depreciation', 'expense'],
  },
];
