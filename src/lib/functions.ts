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
    name: 'حساب الإهلاك بالقسط الثابت',
    description: 'حساب مصروف الإهلاك السنوي للأصل على مدى عمره الإنتاجي.',
    code: `function calculateStraightLineDepreciation(cost, salvageValue, usefulLife) {
  // (تكلفة الأصل - القيمة التخريدية) / العمر الإنتاجي
  if (usefulLife <= 0) {
    return 0; // تجنب القسمة على صفر أو قيمة سالبة
  }
  return (cost - salvageValue) / usefulLife;
}

// مثال:
const cost = 50000; // تكلفة الأصل بالريال
const salvageValue = 5000; // القيمة المتبقية بعد نهاية عمره
const usefulLife = 5; // العمر الإنتاجي بالسنوات
const annualDepreciation = calculateStraightLineDepreciation(cost, salvageValue, usefulLife);
console.log(\`الإهلاك السنوي: \${annualDepreciation} ريال\`);`,
    tags: ['أصول ثابتة', 'إهلاك', 'قوائم مالية'],
  },
  {
    id: '2',
    name: 'تسجيل قيد يومية بسيط',
    description: 'إنشاء دالة لتسجيل معاملة مالية بسيطة من طرفين (مدين ودائن).',
    code: `function createJournalEntry(date, debitAccount, creditAccount, amount, description) {
  const entry = {
    date: date,
    description: description,
    debits: [{ account: debitAccount, amount: amount }],
    credits: [{ account: creditAccount, amount: amount }]
  };
  
  console.log('--- قيد يومية جديد ---');
  console.log(\`التاريخ: \${entry.date}\`);
  console.log(\`الوصف: \${entry.description}\`);
  console.log(\`مدين: \${entry.debits[0].account} بمبلغ \${entry.debits[0].amount}\`);
  console.log(\`دائن: \${entry.credits[0].account} بمبلغ \${entry.credits[0].amount}\`);
  
  return entry;
}

// مثال:
createJournalEntry('2024-05-15', 'مصروفات الإيجار', 'النقدية', 5000, 'سداد إيجار شهر مايو');`,
    tags: ['قيود يومية', 'محاسبة عامة', 'تسجيل'],
  },
  {
    id: '3',
    name: 'حساب نسبة السيولة الحالية',
    description: 'قياس قدرة الشركة على سداد التزاماتها قصيرة الأجل.',
    code: `function calculateCurrentRatio(currentAssets, currentLiabilities) {
  // الأصول المتداولة / الخصوم المتداولة
  if (currentLiabilities === 0) {
    return Infinity; // لا يمكن حساب النسبة إذا كانت الخصوم صفر
  }
  return currentAssets / currentLiabilities;
}

// مثال:
const currentAssets = 250000; // إجمالي الأصول المتداولة
const currentLiabilities = 125000; // إجمالي الخصوم المتداولة
const ratio = calculateCurrentRatio(currentAssets, currentLiabilities);
console.log(\`نسبة السيولة الحالية: \${ratio.toFixed(2)}\`);
// نسبة أكبر من 1 تعتبر مؤشر جيد بشكل عام`,
    tags: ['تحليل مالي', 'نسب مالية', 'سيولة'],
  },
  {
    id: '4',
    name: 'حساب نقطة التعادل بالوحدات',
    description: 'تحديد عدد الوحدات التي يجب بيعها لتغطية جميع التكاليف.',
    code: `function calculateBreakevenPointUnits(fixedCosts, salesPricePerUnit, variableCostPerUnit) {
  // التكاليف الثابتة / (سعر بيع الوحدة - التكلفة المتغيرة للوحدة)
  const contributionMargin = salesPricePerUnit - variableCostPerUnit;
  if (contributionMargin <= 0) {
    return 'لا يمكن الوصول لنقطة التعادل لأن التكلفة المتغيرة أعلى من سعر البيع.';
  }
  return Math.ceil(fixedCosts / contributionMargin);
}

// مثال:
const fixedCosts = 100000; // إجمالي التكاليف الثابتة
const salesPrice = 50; // سعر بيع المنتج الواحد
const variableCost = 30; // التكلفة المتغيرة للمنتج الواحد
const units = calculateBreakevenPointUnits(fixedCosts, salesPrice, variableCost);
console.log(\`يجب بيع \${units} وحدة للوصول لنقطة التعادل\`);`,
    tags: ['محاسبة تكاليف', 'تحليل', 'تخطيط'],
  },
  {
    id: '5',
    name: 'حساب هامش الربح الإجمالي',
    description: 'قياس ربحية الشركة من بيع منتجاتها بعد خصم تكلفة البضاعة المباعة.',
    code: `function calculateGrossProfitMargin(revenue, costOfGoodsSold) {
  // ((الإيرادات - تكلفة البضاعة المباعة) / الإيرادات) * 100
  if (revenue === 0) {
    return 0;
  }
  const grossProfit = revenue - costOfGoodsSold;
  return (grossProfit / revenue) * 100;
}

// مثال:
const revenue = 1000000; // إجمالي الإيرادات
const cogs = 600000; // تكلفة البضاعة المباعة
const margin = calculateGrossProfitMargin(revenue, cogs);
console.log(\`هامش الربح الإجمالي: \${margin.toFixed(2)}%\`);`,
    tags: ['تحليل مالي', 'ربحية', 'قائمة الدخل'],
  },
  {
    id: '6',
    name: 'حساب تكلفة المخزون بطريقة الوارد أولاً صادر أولاً (FIFO)',
    description: 'تقييم تكلفة المخزون المباع بافتراض أن أول الوحدات شراءً هي أول ما يتم بيعه.',
    code: `function calculateFifoCost(inventoryPurchases, unitsSold) {
  let remainingUnits = unitsSold;
  let totalCost = 0;
  
  for (const purchase of inventoryPurchases) {
    if (remainingUnits === 0) break;
    
    const unitsToTake = Math.min(remainingUnits, purchase.units);
    totalCost += unitsToTake * purchase.costPerUnit;
    remainingUnits -= unitsToTake;
  }
  
  if (remainingUnits > 0) {
    console.warn("تحذير: عدد الوحدات المباعة أكبر من المخزون المتاح.");
  }

  return totalCost;
}

// مثال:
const purchases = [
  { units: 10, costPerUnit: 100 }, // أول عملية شراء
  { units: 20, costPerUnit: 110 },
  { units: 15, costPerUnit: 120 }
];
const sold = 25; // عدد الوحدات المباعة
const costOfSale = calculateFifoCost(purchases, sold);

// التكلفة: (10 وحدات * 100 ريال) + (15 وحدة * 110 ريال) = 1000 + 1650 = 2650
console.log(\`تكلفة البضاعة المباعة (FIFO): \${costOfSale} ريال\`);`,
    tags: ['مخزون', 'محاسبة تكاليف', 'FIFO'],
  }
];
