import { INVOICE_TYPES, calculateLineItemTax, getStateCode } from '../../utils';
import { getFinancialYearOptions } from '../../lib/periods';

export const GST_TYPES = ['tax-invoice', 'credit-note'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const QUARTERS = [
  { id: 'Q1', label: 'Q1 (Apr-Jun)', months: [3, 4, 5] },
  { id: 'Q2', label: 'Q2 (Jul-Sep)', months: [6, 7, 8] },
  { id: 'Q3', label: 'Q3 (Oct-Dec)', months: [9, 10, 11] },
  { id: 'Q4', label: 'Q4 (Jan-Mar)', months: [0, 1, 2] },
];

const EMPTY_TAX_TOTALS = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };

export const getFYOptions = getFinancialYearOptions;

export function round2(value) {
  return Math.round(value * 100) / 100;
}

export function computeItemTaxSplit(item, isInterState) {
  const { afterDiscount, taxAmount } = calculateLineItemTax(item);
  if (isInterState) return { taxable: afterDiscount, cgst: 0, sgst: 0, igst: taxAmount };
  const half = round2(taxAmount / 2);
  return { taxable: afterDiscount, cgst: half, sgst: taxAmount - half, igst: 0 };
}

export function getTaxableAmount(totals) {
  return totals?.taxableAmount ?? ((totals?.subtotal || 0) - (totals?.totalDiscount || 0));
}

export function filterDateByPeriod(date, { filterMode, fyFilter, fyOptions, quarterFilter, yearFilter, monthFilter }) {
  if (!date) return false;

  if (filterMode === 'fy') {
    const fy = fyOptions.find((option) => option.value === fyFilter);
    return fy ? date >= fy.from && date <= fy.to : true;
  }

  const parsedDate = new Date(date);

  if (filterMode === 'quarter') {
    const quarter = QUARTERS.find((option) => option.id === quarterFilter);
    if (!quarter) return false;
    return quarter.months.includes(parsedDate.getMonth()) && parsedDate.getFullYear() === parseInt(yearFilter);
  }

  return parsedDate.getFullYear() === parseInt(yearFilter) && parsedDate.getMonth() === parseInt(monthFilter);
}

export function sumTaxRows(rows) {
  return rows.reduce((acc, row) => ({
    taxable: acc.taxable + row.taxable,
    cgst: acc.cgst + row.cgst,
    sgst: acc.sgst + row.sgst,
    igst: acc.igst + row.igst,
    total: acc.total + row.total,
  }), { ...EMPTY_TAX_TOTALS });
}

function isInterState(profile, client) {
  return Boolean(profile?.state && client?.state && profile.state.toLowerCase() !== client.state.toLowerCase());
}

function buildRateSummary(bills) {
  const byRate = {};
  bills.forEach((bill) => {
    const { profile, client, items } = bill.data;
    const interState = isInterState(profile, client);
    (items || []).forEach((item) => {
      const rate = item.taxPercent || 0;
      if (!byRate[rate]) byRate[rate] = { ...EMPTY_TAX_TOTALS };
      const split = computeItemTaxSplit(item, interState);
      byRate[rate].taxable += split.taxable;
      byRate[rate].cgst += split.cgst;
      byRate[rate].sgst += split.sgst;
      byRate[rate].igst += split.igst;
      byRate[rate].total += split.taxable + split.cgst + split.sgst + split.igst;
    });
  });
  return byRate;
}

function buildHsnRows(bills) {
  const hsnMap = {};
  bills.forEach((bill) => {
    const { profile, client, items } = bill.data;
    const interState = isInterState(profile, client);
    (items || []).forEach((item) => {
      const hsn = item.hsn || 'N/A';
      if (!hsnMap[hsn]) hsnMap[hsn] = { hsn, description: item.name || '', quantity: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
      const split = computeItemTaxSplit(item, interState);
      hsnMap[hsn].quantity += item.quantity || 0;
      hsnMap[hsn].taxable += split.taxable;
      hsnMap[hsn].cgst += split.cgst;
      hsnMap[hsn].sgst += split.sgst;
      hsnMap[hsn].igst += split.igst;
      hsnMap[hsn].totalTax += split.cgst + split.sgst + split.igst;
    });
  });
  return Object.values(hsnMap).sort((a, b) => a.hsn.localeCompare(b.hsn));
}

function calculateITC(expenses, purchases, filterByPeriod) {
  const itcFromExpensesOnly = expenses.reduce((acc, expense) => {
    const gst = expense.gstAmount || 0;
    const half = round2(gst / 2);
    return { cgst: acc.cgst + half, sgst: acc.sgst + (gst - half), igst: acc.igst };
  }, { cgst: 0, sgst: 0, igst: 0 });

  const filteredPurchases = purchases.filter((purchase) => filterByPeriod(purchase.date));
  const itcFromPurchases = filteredPurchases.reduce((acc, purchase) => {
    const tax = purchase.totalTax || (purchase.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.rate || 0) * (item.taxPercent || 0)) / 100, 0);
    const half = round2(tax / 2);
    return { cgst: acc.cgst + half, sgst: acc.sgst + (tax - half), igst: acc.igst };
  }, { cgst: 0, sgst: 0, igst: 0 });

  return {
    cgst: itcFromExpensesOnly.cgst + itcFromPurchases.cgst,
    sgst: itcFromExpensesOnly.sgst + itcFromPurchases.sgst,
    igst: itcFromExpensesOnly.igst + itcFromPurchases.igst,
  };
}

function buildDocumentSummary(bills) {
  const docSummary = {};
  bills.forEach((bill) => {
    const type = bill.invoiceType || 'tax-invoice';
    const prefix = INVOICE_TYPES[type]?.prefix || 'INV';
    if (!docSummary[prefix]) docSummary[prefix] = { type: INVOICE_TYPES[type]?.label || type, from: bill.invoiceNumber, to: bill.invoiceNumber, total: 0 };
    docSummary[prefix].total++;
    if (bill.invoiceNumber < docSummary[prefix].from) docSummary[prefix].from = bill.invoiceNumber;
    if (bill.invoiceNumber > docSummary[prefix].to) docSummary[prefix].to = bill.invoiceNumber;
  });
  return docSummary;
}

function buildWarnings(bills, profile) {
  const warnings = [];
  bills.forEach((bill) => {
    const { client, items } = bill.data;
    if (client?.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d{1}[A-Z]{1}\d{1}$/.test(client.gstin)) {
      warnings.push({ type: 'error', msg: `Invoice ${bill.invoiceNumber}: Invalid client GSTIN format - ${client.gstin}` });
    }
    (items || []).forEach((item) => {
      if (!item.hsn || item.hsn === 'N/A') {
        warnings.push({ type: 'warning', msg: `Invoice ${bill.invoiceNumber}: Item "${item.name || 'Unnamed'}" has no HSN/SAC code` });
      }
    });
    if (client?.gstin && !client?.state) {
      warnings.push({ type: 'warning', msg: `Invoice ${bill.invoiceNumber}: Client ${client.name} has GSTIN but no State - Place of Supply may be wrong` });
    }
  });
  if (!profile.gstin) warnings.push({ type: 'error', msg: 'Your business GSTIN is not set. Go to Settings -> Company Details to add it.' });
  return warnings;
}

export function buildGstReturnSummary({ bills, expenses, purchases, profile, filterByPeriod }) {
  const filteredBills = bills.filter((bill) => GST_TYPES.includes(bill.invoiceType || 'tax-invoice') && bill.data && filterByPeriod(bill.invoiceDate));
  const allFilteredBills = bills.filter((bill) => bill.data && filterByPeriod(bill.invoiceDate));
  const filteredExpenses = expenses.filter((expense) => filterByPeriod(expense.date));
  const creditNotes = filteredBills.filter((bill) => (bill.invoiceType || 'tax-invoice') === 'credit-note');
  const regularBills = filteredBills.filter((bill) => (bill.invoiceType || 'tax-invoice') !== 'credit-note');
  const b2bRegular = regularBills.filter((bill) => bill.data?.client?.gstin);
  const b2cRegular = regularBills.filter((bill) => !bill.data?.client?.gstin);
  const b2cLarge = b2cRegular.filter((bill) => isInterState(bill.data?.profile, bill.data?.client) && (bill.totalAmount || 0) > 250000);
  const b2cSmall = b2cRegular.filter((bill) => !(isInterState(bill.data?.profile, bill.data?.client) && (bill.totalAmount || 0) > 250000));

  const b2bRows = b2bRegular.map((bill) => {
    const { client, totals, details, profile: billProfile } = bill.data;
    const interState = isInterState(billProfile, client);
    return {
      gstin: client.gstin,
      clientName: client.name || bill.clientName || '',
      invoiceNo: bill.invoiceNumber || '',
      date: bill.invoiceDate || '',
      pos: getStateCode(details?.placeOfSupply || client?.state || ''),
      supplyType: interState ? 'Inter' : 'Intra',
      taxable: getTaxableAmount(totals),
      cgst: interState ? 0 : (totals?.cgst || 0),
      sgst: interState ? 0 : (totals?.sgst || 0),
      igst: interState ? (totals?.igst || 0) : 0,
      total: totals?.total || 0,
    };
  });

  const b2cBills = filteredBills.filter((bill) => !bill.data?.client?.gstin);
  const b2cByRate = buildRateSummary(b2cBills);
  const b2cRates = Object.keys(b2cByRate).map(Number).sort((a, b) => a - b);
  const hsnRows = buildHsnRows(filteredBills);
  const b2bTotals = sumTaxRows(b2bRows);
  const b2cTotals = b2cRates.reduce((acc, rate) => {
    const row = b2cByRate[rate];
    return {
      taxable: acc.taxable + row.taxable,
      cgst: acc.cgst + row.cgst,
      sgst: acc.sgst + row.sgst,
      igst: acc.igst + row.igst,
      total: acc.total + row.total,
    };
  }, { ...EMPTY_TAX_TOTALS });
  const grandTotals = {
    taxable: b2bTotals.taxable + b2cTotals.taxable,
    cgst: b2bTotals.cgst + b2cTotals.cgst,
    sgst: b2bTotals.sgst + b2cTotals.sgst,
    igst: b2bTotals.igst + b2cTotals.igst,
    total: b2bTotals.total + b2cTotals.total,
  };
  const outputTax = { cgst: grandTotals.cgst, sgst: grandTotals.sgst, igst: grandTotals.igst };
  const itcFromExpenses = calculateITC(filteredExpenses, purchases, filterByPeriod);
  const netTax = {
    cgst: Math.max(0, outputTax.cgst - itcFromExpenses.cgst),
    sgst: Math.max(0, outputTax.sgst - itcFromExpenses.sgst),
    igst: Math.max(0, outputTax.igst - itcFromExpenses.igst),
  };

  return {
    filteredBills,
    allFilteredBills,
    filteredExpenses,
    creditNotes,
    regularBills,
    b2bRegular,
    b2cRegular,
    b2cLarge,
    b2cSmall,
    b2bRows,
    b2cBills,
    b2cByRate,
    b2cRates,
    hsnRows,
    b2bTotals,
    b2cTotals,
    grandTotals,
    outputTax,
    itcFromExpenses,
    netTax,
    docSummary: buildDocumentSummary(allFilteredBills),
    warnings: buildWarnings(filteredBills, profile),
    isNilReturn: filteredBills.length === 0 && filteredExpenses.length === 0,
  };
}
