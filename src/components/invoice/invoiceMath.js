export function createEmptyLineItem(showGST = true) {
  return {
    id: Date.now().toString(),
    name: '',
    hsn: '',
    quantity: 1,
    rate: 0,
    discount: 0,
    taxPercent: showGST ? 18 : 0,
  };
}

export function calculateInvoiceTotals({ items, clientState, businessState, showGST, taxInclusive }) {
  let subtotal = 0;
  let totalDiscount = 0;
  let taxTotal = 0;

  items.forEach((item) => {
    const amount = item.quantity * item.rate;
    const discount = item.discount || 0;
    const afterDiscount = amount - discount;

    subtotal += amount;
    totalDiscount += discount;

    if (!showGST) return;

    if (taxInclusive) {
      const taxPercent = item.taxPercent || 0;
      const taxableValue = afterDiscount / (1 + taxPercent / 100);
      taxTotal += afterDiscount - taxableValue;
      return;
    }

    taxTotal += (afterDiscount * (item.taxPercent || 0)) / 100;
  });

  const normalizedBusinessState = businessState?.trim().toLowerCase();
  const normalizedClientState = clientState?.trim().toLowerCase();
  const isInterstate = normalizedBusinessState && normalizedClientState && normalizedBusinessState !== normalizedClientState;
  const taxableAmount = subtotal - totalDiscount - (taxInclusive && showGST ? taxTotal : 0);
  const total = taxInclusive && showGST ? subtotal - totalDiscount : subtotal - totalDiscount + taxTotal;

  return {
    subtotal,
    totalDiscount,
    taxableAmount,
    cgst: isInterstate ? 0 : taxTotal / 2,
    sgst: isInterstate ? 0 : taxTotal / 2,
    igst: isInterstate ? taxTotal : 0,
    total,
    taxInclusive: Boolean(taxInclusive && showGST),
  };
}
