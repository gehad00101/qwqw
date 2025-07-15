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
    name: 'إسبريسو كلاسيكي',
    description: 'جرعة مركزة من القهوة تُحضّر عن طريق دفع الماء الساخن المضغوط عبر حبوب البن المطحونة جيدًا.',
    code: `function makeEspresso(coffeeGrams, waterMl) {
  const strength = coffeeGrams / waterMl;
  console.log(\`Espresso ready! Strength: \${strength.toFixed(2)}\`);
  return { coffeeGrams, waterMl, type: 'Espresso' };
}

makeEspresso(18, 36);`,
    tags: ['ساخن', 'مركز', 'أساسي'],
  },
  {
    id: '2',
    name: 'كابتشينو',
    description: 'مزيج متناغم من الإسبريسو والحليب المبخر ورغوة الحليب الغنية.',
    code: `function makeCappuccino(espressoShots, milkMl) {
  const espresso = makeEspresso(18 * espressoShots, 36 * espressoShots);
  const steamedMilk = milkMl * 0.6;
  const foam = milkMl * 0.4;
  console.log(\`Cappuccino prepared with \${steamedMilk}ml steamed milk and \${foam}ml foam.\`);
  return { espresso, steamedMilk, foam };
}

function makeEspresso(coffeeGrams, waterMl) {
  // A simplified espresso function for this recipe
  return { coffeeGrams, waterMl };
}

makeCappuccino(1, 150);`,
    tags: ['حليب', 'رغوة', 'كلاسيكي'],
  },
  {
    id: '3',
    name: 'قهوة مقطرة (Pour Over)',
    description: 'طريقة تحضير يدوية تبرز النكهات الدقيقة للقهوة عن طريق سكب الماء الساخن ببطء على البن المطحون.',
    code: `function makePourOver(coffeeGrams, waterMl, bloomTimeSeconds) {
  const ratio = waterMl / coffeeGrams;
  console.log(\`Starting pour-over with a \${ratio.toFixed(1)}:1 ratio.\`);
  console.log(\`Blooming for \${bloomTimeSeconds} seconds...\`);
  // Simulate the rest of the pour
  console.log('Pour-over complete!');
  return { coffeeGrams, waterMl, ratio };
}

makePourOver(20, 320, 30);`,
    tags: ['يدوي', 'مقطرة', 'نكهات واضحة'],
  },
  {
    id: '4',
    name: 'لاتيه مثلج',
    description: 'مشروب منعش يجمع بين الإسبريسو والحليب البارد والثلج، مثالي للأيام الحارة.',
    code: `function makeIcedLatte(espressoShots, milkMl, iceCubes) {
  const espresso = makeEspresso(18 * espressoShots, 36 * espressoShots);
  console.log(\`Making Iced Latte with \${milkMl}ml of cold milk and \${iceCubes} ice cubes.\`);
  return { espresso, milkMl, iceCubes };
}

function makeEspresso(coffeeGrams, waterMl) {
  return { coffeeGrams, waterMl };
}

makeIcedLatte(2, 200, 8);`,
    tags: ['بارد', 'حليب', 'منعش'],
  },
];
