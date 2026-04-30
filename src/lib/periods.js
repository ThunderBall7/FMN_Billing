export function getFinancialYearOptions(now = new Date(), count = 5) {
  const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const options = [];

  for (let i = 0; i < count; i++) {
    const year = currentYear - i;
    options.push({
      value: `${year}-${year + 1}`,
      label: `FY ${year}-${String(year + 1).slice(-2)}`,
      from: `${year}-04-01`,
      to: `${year + 1}-03-31`,
    });
  }

  return options;
}
