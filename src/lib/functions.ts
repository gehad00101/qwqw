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
  return (cost - salvageValue) / usefulLife;
}

// مثال: أصل تكلفته 10,000، قيمته التخريدية 1,000، وعمره 5 سنوات
const annualDepreciation = calculateStraightLineDepreciation(10000, 1000, 5);
console.log(\`الإهلاك السنوي: \${annualDepreciation}\`);`,
    tags: ['أصول ثابتة', 'إهلاك', 'قوائم مالية'],
  },
  {
    id: '2',
    name: 'تسجيل قيد يومية بسيط',
    description: 'إنشاء دالة لتسجيل معاملة مالية بسيطة من طرفين (مدين ودائن).',
    code: `function createJournalEntry(date, debitAccount, creditAccount, amount, description) {
  const entry = {
    date: date,
    debit: { account: debitAccount, amount: amount },
    credit: { account: creditAccount, amount: amount },
    description: description
  };
  console.log('تم إنشاء قيد اليومية:');
  console.log(entry);
  return entry;
}

createJournalEntry('2023-10-27', 'مصروفات الإيجار', 'النقدية', 5000, 'سداد إيجار شهر أكتوبر');`,
    tags: ['قيود يومية', 'محاسبة عامة', 'تسجيل'],
  },
  {
    id: '3',
    name: 'حساب نسبة السيولة الحالية',
    description: 'قياس قدرة الشركة على سداد التزاماتها قصيرة الأجل باستخدام أصولها قصيرة الأجل.',
    code: `function calculateCurrentRatio(currentAssets, currentLiabilities) {
  if (currentLiabilities === 0) {
    return Infinity; // تجنب القسمة على صفر
  }
  return currentAssets / currentLiabilities;
}

const ratio = calculateCurrentRatio(50000, 25000);
console.log(\`نسبة السيولة الحالية: \${ratio.toFixed(2)}\`);`,
    tags: ['تحليل مالي', 'نسب مالية', 'سيولة'],
  },
  {
    id: '4',
    name: 'حساب نقطة التعادل',
    description: 'تحديد حجم المبيعات الذي تتساوى عنده الإيرادات الكلية مع التكاليف الكلية.',
    code: `function calculateBreakevenPoint(fixedCosts, salesPricePerUnit, variableCostPerUnit) {
  const contributionMargin = salesPricePerUnit - variableCostPerUnit;
  if (contributionMargin <= 0) {
    return 'لا يمكن الوصول لنقطة التعادل';
  }
  return fixedCosts / contributionMargin;
}

const units = calculateBreakevenPoint(100000, 50, 30);
console.log(\`نقطة التعادل (بالوحدات): \${Math.ceil(units)}\`);`,
    tags: ['محاسبة تكاليف', 'تحليل', 'تخطيط'],
  },
];
