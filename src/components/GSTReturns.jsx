import { useState, useEffect } from 'react';
import { getAllBills, getAllExpenses, getAllPurchases, getProfile } from '../store';
import { getStateCode, formatDateGST, getFilingPeriod } from '../utils';
import { InlineLoadingState } from './LoadingSpinner';
import { toast } from'../lib/toast';
import { downloadCSV, downloadJSON } from '../lib/download';
import GSTGuideTab from './gst/GSTGuideTab';
import GSTR1Tab from './gst/GSTR1Tab';
import GSTR3BTab from './gst/GSTR3BTab';
import GSTReturnsHeader from './gst/GSTReturnsHeader';
import GSTStatusNotices from './gst/GSTStatusNotices';
import GSTSummaryBar from './gst/GSTSummaryBar';
import GSTTabNav from './gst/GSTTabNav';
import {
  MONTHS,
  QUARTERS,
  buildGstReturnSummary,
  computeItemTaxSplit,
  filterDateByPeriod,
  getFYOptions,
  getTaxableAmount,
  round2,
} from './gst/gstReturnUtils';

export default function GSTReturns() {
  const [bills, setBills] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [profile, setProfile] = useState({});
  const [filterMode, setFilterMode] = useState('month');
  const [fyFilter, setFyFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [quarterFilter, setQuarterFilter] = useState('Q1');
  const [activeTab, setActiveTab] = useState('gstr1');
  const [guideTab, setGuideTab] = useState('regular');
  const [loading, setLoading] = useState(true);
  const [filingStatus, setFilingStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gst_filing_status') || '{}'); } catch { return {}; }
  });

  const fyOptions = getFYOptions();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) yearOptions.push(y);

  const loadData = async () => {
    try {
      setLoading(true);
      const [b, e, p] = await Promise.all([getAllBills(), getAllExpenses(), getProfile()]);
      setBills(b); setExpenses(e); setProfile(p || {});
      try { const pur = await getAllPurchases(); setPurchases(pur || []); } catch {console.error('failed to get data');
      }
    } catch { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const now = new Date();
    const fy = fyOptions[0];
    if (fy) setFyFilter(fy.value);
    setYearFilter(String(now.getFullYear()));
    setMonthFilter(String(now.getMonth()));
    const m = now.getMonth();
    const q = QUARTERS.find(q => q.months.includes(m));
    if (q) setQuarterFilter(q.id);
    loadData();
  }, []);
  const periodFilterConfig = { filterMode, fyFilter, fyOptions, quarterFilter, yearFilter, monthFilter };
  const filterByPeriod = (date) => filterDateByPeriod(date, periodFilterConfig);
  const {
    filteredBills,
    creditNotes,
    b2bRegular,
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
    docSummary,
    warnings,
    isNilReturn,
  } = buildGstReturnSummary({ bills, expenses, purchases, profile, filterByPeriod });
  const getPeriodKey = () => {
    if (filterMode === 'month') return `${monthFilter}_${yearFilter}`;
    if (filterMode === 'quarter') return `${quarterFilter}_${yearFilter}`;
    return fyFilter;
  };
  const periodKey = getPeriodKey();
  const periodFiling = filingStatus[periodKey] || {};

  const markFiled = (returnType) => {
    const updated = { ...filingStatus, [periodKey]: { ...periodFiling, [returnType]: true, [`${returnType}Date`]: new Date().toISOString() } };
    setFilingStatus(updated);
    localStorage.setItem('gst_filing_status', JSON.stringify(updated));
    toast(`${returnType.toUpperCase()} marked as filed for this period`, 'success');
  };

  const exportB2B = () => {
    if (b2bRows.length === 0) { toast('No B2B data to export', 'warning'); return; }
    downloadCSV('GSTR1_B2B_Invoices.csv',
      ['GSTIN/UIN', 'Receiver Name', 'Invoice Number', 'Invoice Date', 'Invoice Value', 'Place of Supply', 'Reverse Charge', 'Invoice Type', 'Supply Type', 'Taxable Value', 'CGST Amount', 'SGST Amount', 'IGST Amount'],
      b2bRegular.map(bill => {
        const { client, profile: prof, totals, details } = bill.data;
        const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
        const pos = getStateCode(details?.placeOfSupply || client?.state || '');
        return [client.gstin, client.name || bill.clientName || '', bill.invoiceNumber || '', formatDateGST(bill.invoiceDate), (totals?.total || 0).toFixed(2), pos, 'N', 'Regular', isInter ? 'Inter State' : 'Intra State', getTaxableAmount(totals).toFixed(2), isInter ? 0 : (totals?.cgst || 0).toFixed(2), isInter ? 0 : (totals?.sgst || 0).toFixed(2), isInter ? (totals?.igst || 0).toFixed(2) : 0];
      }));
    toast('B2B CSV downloaded — matches GSTR-1 Table 4A format', 'success');
  };

  const exportB2C = () => {
    if (b2cRates.length === 0 && b2cLarge.length === 0) { toast('No B2C data to export', 'warning'); return; }
    const b2csData = {};
    b2cSmall.forEach(bill => {
      const { profile: prof, client, items, details } = bill.data;
      const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
      const pos = getStateCode(details?.placeOfSupply || client?.state || prof?.state || '');
      const splyType = isInter ? 'INTER' : 'INTRA';
      (items || []).forEach(item => {
        const rate = item.taxPercent || 0;
        const key = `${splyType}_${pos}_${rate}`;
        if (!b2csData[key]) b2csData[key] = { splyType, pos, rate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        const split = computeItemTaxSplit(item, isInter);
        b2csData[key].taxable += split.taxable; b2csData[key].cgst += split.cgst; b2csData[key].sgst += split.sgst; b2csData[key].igst += split.igst;
      });
    });
    downloadCSV('GSTR1_B2C_Small.csv', ['Type', 'Place of Supply', 'Rate', 'Taxable Value', 'CGST Amount', 'SGST Amount', 'IGST Amount', 'Cess Amount'],
      Object.values(b2csData).map(d => [d.splyType === 'INTER' ? 'Inter State' : 'Intra State', d.pos, d.rate + '%', d.taxable.toFixed(2), d.cgst.toFixed(2), d.sgst.toFixed(2), d.igst.toFixed(2), '0.00']));
    if (b2cLarge.length > 0) {
      downloadCSV('GSTR1_B2C_Large.csv', ['Invoice Number', 'Invoice Date', 'Invoice Value', 'Place of Supply', 'Taxable Value', 'IGST Amount', 'Cess Amount'],
        b2cLarge.map(bill => { const { client, totals, details } = bill.data; const pos = getStateCode(details?.placeOfSupply || client?.state || ''); return [bill.invoiceNumber, formatDateGST(bill.invoiceDate), (totals?.total || 0).toFixed(2), pos, getTaxableAmount(totals).toFixed(2), (totals?.igst || 0).toFixed(2), '0.00']; }));
    }
    toast('B2C CSV downloaded', 'success');
  };

  const exportHSN = () => {
    if (hsnRows.length === 0) { toast('No HSN data', 'warning'); return; }
    const hsnDetailed = {};
    filteredBills.forEach(bill => {
      const { profile: prof, client, items } = bill.data;
      const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
      (items || []).forEach(item => {
        const hsn = item.hsn || 'N/A'; const rate = item.taxPercent || 0; const key = `${hsn}_${rate}`;
        if (!hsnDetailed[key]) hsnDetailed[key] = { hsn, desc: item.name || '', uqc: 'NOS', qty: 0, rate, taxable: 0, cgst: 0, sgst: 0, igst: 0, totalValue: 0 };
        const split = computeItemTaxSplit(item, isInter);
        hsnDetailed[key].qty += item.quantity || 0; hsnDetailed[key].taxable += split.taxable;
        hsnDetailed[key].cgst += split.cgst; hsnDetailed[key].sgst += split.sgst; hsnDetailed[key].igst += split.igst;
        hsnDetailed[key].totalValue += split.taxable + split.cgst + split.sgst + split.igst;
      });
    });
    downloadCSV('GSTR1_HSN_Summary.csv', ['HSN', 'Description', 'UQC', 'Total Quantity', 'Rate %', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount', 'Cess Amount', 'Total Value'],
      Object.values(hsnDetailed).map(r => [r.hsn, r.desc, r.uqc, r.qty, r.rate, r.taxable.toFixed(2), r.igst.toFixed(2), r.cgst.toFixed(2), r.sgst.toFixed(2), '0.00', r.totalValue.toFixed(2)]));
    toast('HSN CSV downloaded — GSTR-1 Table 12 format', 'success');
  };

  const exportCDNR = () => {
    const cdnrBills = creditNotes.filter(b => b.data?.client?.gstin);
    const cdnurBills = creditNotes.filter(b => !b.data?.client?.gstin);
    if (cdnrBills.length === 0 && cdnurBills.length === 0) { toast('No Credit Notes', 'warning'); return; }
    if (cdnrBills.length > 0) {
      downloadCSV('GSTR1_CDNR.csv', ['GSTIN/UIN', 'Receiver Name', 'Note Number', 'Note Date', 'Note Type', 'Place of Supply', 'Reverse Charge', 'Note Value', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'SGST Amount'],
        cdnrBills.map(bill => { const { client, profile: prof, totals } = bill.data; const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase(); const pos = getStateCode(bill.data.details?.placeOfSupply || client?.state || ''); return [client.gstin, client.name || bill.clientName, bill.invoiceNumber, formatDateGST(bill.invoiceDate), 'C', pos, 'N', (totals?.total || 0).toFixed(2), getTaxableAmount(totals).toFixed(2), isInter ? (totals?.igst || 0).toFixed(2) : '0.00', isInter ? '0.00' : (totals?.cgst || 0).toFixed(2), isInter ? '0.00' : (totals?.sgst || 0).toFixed(2)]; }));
    }
    if (cdnurBills.length > 0) {
      downloadCSV('GSTR1_CDNUR.csv', ['Note Number', 'Note Date', 'Note Type', 'Place of Supply', 'Note Value', 'Taxable Value', 'IGST Amount', 'Cess Amount'],
        cdnurBills.map(bill => { const { client, totals } = bill.data; const pos = getStateCode(bill.data.details?.placeOfSupply || client?.state || ''); return [bill.invoiceNumber, formatDateGST(bill.invoiceDate), 'C', pos, (totals?.total || 0).toFixed(2), getTaxableAmount(totals).toFixed(2), (totals?.igst || 0).toFixed(2), '0.00']; }));
    }
    toast('Credit Notes exported', 'success');
  };

  const exportDocSummary = () => {
    if (Object.keys(docSummary).length === 0) { toast('No documents', 'warning'); return; }
    downloadCSV('GSTR1_Doc_Summary.csv', ['Document Type', 'Sr. No. From', 'Sr. No. To', 'Total Number', 'Cancelled'],
      Object.entries(docSummary).map(([, d]) => [d.type, d.from, d.to, d.total, 0]));
    toast('Document Summary CSV downloaded', 'success');
  };

  const exportGSTR3B = () => {
    downloadCSV('GSTR3B_Summary.csv', ['Description', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total'], [
      ['3.1(a) Outward taxable supplies', grandTotals.taxable.toFixed(2), grandTotals.igst.toFixed(2), grandTotals.cgst.toFixed(2), grandTotals.sgst.toFixed(2), (grandTotals.igst + grandTotals.cgst + grandTotals.sgst).toFixed(2)],
      ['4(A) ITC Available', '', itcFromExpenses.igst.toFixed(2), itcFromExpenses.cgst.toFixed(2), itcFromExpenses.sgst.toFixed(2), (itcFromExpenses.igst + itcFromExpenses.cgst + itcFromExpenses.sgst).toFixed(2)],
      ['6.1 Tax Payable', '', netTax.igst.toFixed(2), netTax.cgst.toFixed(2), netTax.sgst.toFixed(2), (netTax.igst + netTax.cgst + netTax.sgst).toFixed(2)],
    ]);
    toast('GSTR-3B summary CSV downloaded', 'success');
  };

  const exportGSTR1JSON = () => {
    if (filteredBills.length === 0) { toast('No invoices to export', 'warning'); return; }
    const gstin = profile.gstin || '';
    const fp = filterMode === 'month'
      ? String(parseInt(monthFilter) + 1).padStart(2, '0') + yearFilter
      : getFilingPeriod(filteredBills[0]?.invoiceDate);

    const b2bMap = {};
    b2bRegular.forEach(bill => {
      const { client, profile: prof, totals, items, details } = bill.data;
      const ctin = client.gstin;
      if (!b2bMap[ctin]) b2bMap[ctin] = { ctin, inv: [] };
      const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
      const pos = getStateCode(details?.placeOfSupply || client?.state || '');
      const rateMap = {};
      (items || []).forEach(item => {
        const rate = item.taxPercent || 0;
        if (!rateMap[rate]) rateMap[rate] = { txval: 0, iamt: 0, camt: 0, samt: 0 };
        const split = computeItemTaxSplit(item, isInter);
        rateMap[rate].txval += split.taxable; rateMap[rate].iamt += split.igst; rateMap[rate].camt += split.cgst; rateMap[rate].samt += split.sgst;
      });
      b2bMap[ctin].inv.push({
        inum: bill.invoiceNumber, idt: formatDateGST(bill.invoiceDate), val: round2(totals?.total || 0), pos, rchrg: 'N', inv_typ: 'R',
        itms: Object.entries(rateMap).map(([rt, d], i) => ({ num: i + 1, itm_det: { rt: Number(rt), txval: round2(d.txval), iamt: round2(d.iamt), camt: round2(d.camt), samt: round2(d.samt), csamt: 0 } })),
      });
    });

    const b2csMap = {};
    b2cSmall.forEach(bill => {
      const { profile: prof, client, items, details } = bill.data;
      const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
      const pos = getStateCode(details?.placeOfSupply || client?.state || prof?.state || '');
      const splyTy = isInter ? 'INTER' : 'INTRA';
      (items || []).forEach(item => {
        const rate = item.taxPercent || 0; const key = `${splyTy}_${pos}_${rate}`;
        if (!b2csMap[key]) b2csMap[key] = { sply_ty: splyTy, pos, rt: rate, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        const split = computeItemTaxSplit(item, isInter);
        b2csMap[key].txval += split.taxable; b2csMap[key].iamt += split.igst; b2csMap[key].camt += split.cgst; b2csMap[key].samt += split.sgst;
      });
    });
    const b2csArr = Object.values(b2csMap).map(d => ({ ...d, txval: round2(d.txval), iamt: round2(d.iamt), camt: round2(d.camt), samt: round2(d.samt) }));

    const b2clMap = {};
    b2cLarge.forEach(bill => {
      const { client, totals, items, details } = bill.data;
      const pos = getStateCode(details?.placeOfSupply || client?.state || '');
      if (!b2clMap[pos]) b2clMap[pos] = { pos, inv: [] };
      const rateMap = {};
      (items || []).forEach(item => {
        const rate = item.taxPercent || 0; if (!rateMap[rate]) rateMap[rate] = { txval: 0, iamt: 0 };
        const split = computeItemTaxSplit(item, true); rateMap[rate].txval += split.taxable; rateMap[rate].iamt += split.igst;
      });
      b2clMap[pos].inv.push({ inum: bill.invoiceNumber, idt: formatDateGST(bill.invoiceDate), val: round2(totals?.total || 0), itms: Object.entries(rateMap).map(([rt, d], i) => ({ num: i + 1, itm_det: { rt: Number(rt), txval: round2(d.txval), iamt: round2(d.iamt), csamt: 0 } })) });
    });

    const cdnrMap = {};
    creditNotes.filter(b => b.data?.client?.gstin).forEach(bill => {
      const { client, profile: prof, totals, items, details } = bill.data;
      const ctin = client.gstin; if (!cdnrMap[ctin]) cdnrMap[ctin] = { ctin, nt: [] };
      const isInter = prof?.state && client?.state && prof.state.toLowerCase() !== client.state.toLowerCase();
      const pos = getStateCode(details?.placeOfSupply || client?.state || '');
      const rateMap = {};
      (items || []).forEach(item => {
        const rate = item.taxPercent || 0; if (!rateMap[rate]) rateMap[rate] = { txval: 0, iamt: 0, camt: 0, samt: 0 };
        const split = computeItemTaxSplit(item, isInter); rateMap[rate].txval += split.taxable; rateMap[rate].iamt += split.igst; rateMap[rate].camt += split.cgst; rateMap[rate].samt += split.sgst;
      });
      cdnrMap[ctin].nt.push({ ntty: 'C', nt_num: bill.invoiceNumber, nt_dt: formatDateGST(bill.invoiceDate), val: round2(totals?.total || 0), pos, rchrg: 'N', inv_typ: 'R',
        itms: Object.entries(rateMap).map(([rt, d], i) => ({ num: i + 1, itm_det: { rt: Number(rt), txval: round2(d.txval), iamt: round2(d.iamt), camt: round2(d.camt), samt: round2(d.samt), csamt: 0 } })) });
    });

    const hsnJsonMap = {};
    filteredBills.forEach(bill => {
      const { profile: prof, client, items } = bill.data;
      const isInter = prof?.state && client?.state && prof.state !== client.state;
      (items || []).forEach(item => {
        const hsn = item.hsn || ''; const rate = item.taxPercent || 0; const key = `${hsn}_${rate}`;
        if (!hsnJsonMap[key]) hsnJsonMap[key] = { hsn_sc: hsn, desc: item.name || '', uqc: 'NOS', qty: 0, rt: rate, txval: 0, iamt: 0, camt: 0, samt: 0, csamt: 0 };
        const split = computeItemTaxSplit(item, isInter);
        hsnJsonMap[key].qty += item.quantity || 0; hsnJsonMap[key].txval += split.taxable; hsnJsonMap[key].iamt += split.igst; hsnJsonMap[key].camt += split.cgst; hsnJsonMap[key].samt += split.sgst;
      });
    });

    const docDet = Object.entries(docSummary).map(([, d], i) => ({ doc_num: i + 1, docs: [{ num: 1, from: d.from, to: d.to, totnum: d.total, cancel: 0, net_issue: d.total }] }));

    const gstr1 = {
      gstin, fp,
      b2b: Object.values(b2bMap), b2cs: b2csArr,
      ...(Object.keys(b2clMap).length > 0 ? { b2cl: Object.values(b2clMap) } : {}),
      ...(Object.keys(cdnrMap).length > 0 ? { cdnr: Object.values(cdnrMap) } : {}),
      hsn: { data: Object.values(hsnJsonMap).map((r, i) => ({ num: i + 1, ...r, txval: round2(r.txval), iamt: round2(r.iamt), camt: round2(r.camt), samt: round2(r.samt) })) },
      doc_issue: { doc_det: docDet },
    };

    downloadJSON(`GSTR1_${gstin || 'export'}_${fp}.json`, gstr1);
    toast(`GSTR-1 JSON exported — upload to GST portal offline tool`, 'success');
  };

  const totalTax = grandTotals.cgst + grandTotals.sgst + grandTotals.igst;
  const netPayable = netTax.igst + netTax.cgst + netTax.sgst;

  return (
    <div className="dashboard-container">
      <GSTReturnsHeader
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        fyOptions={fyOptions}
        fyFilter={fyFilter}
        setFyFilter={setFyFilter}
        quarterFilter={quarterFilter}
        setQuarterFilter={setQuarterFilter}
        yearOptions={yearOptions}
        yearFilter={yearFilter}
        setYearFilter={setYearFilter}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        periodFiling={periodFiling}
      />

      <GSTStatusNotices warnings={warnings} isNilReturn={isNilReturn} />
      <GSTSummaryBar invoiceCount={filteredBills.length} grandTotals={grandTotals} totalTax={totalTax} netPayable={netPayable} />
      <GSTTabNav activeTab={activeTab} onChange={setActiveTab} />

      {loading ? (
        <div className="glass-panel p-6">
          <InlineLoadingState title="Loading GST data" />
        </div>
      ) : (
        <>
          {activeTab === 'gstr1' && (
            <GSTR1Tab
              periodFiling={periodFiling}
              markFiled={markFiled}
              exports={{ gstr1Json: exportGSTR1JSON, b2b: exportB2B, b2c: exportB2C, hsn: exportHSN, cdnr: exportCDNR, docs: exportDocSummary }}
              b2bRows={b2bRows}
              b2bTotals={b2bTotals}
              creditNotes={creditNotes}
              b2cBills={b2cBills}
              b2cLarge={b2cLarge}
              b2cByRate={b2cByRate}
              b2cRates={b2cRates}
              b2cTotals={b2cTotals}
              hsnRows={hsnRows}
              docSummary={docSummary}
              grandTotals={grandTotals}
            />
          )}

          {activeTab === 'gstr3b' && (
            <GSTR3BTab
              exports={{ gstr3b: exportGSTR3B }}
              periodFiling={periodFiling}
              markFiled={markFiled}
              grandTotals={grandTotals}
              b2cBills={b2cBills}
              itcFromExpenses={itcFromExpenses}
              outputTax={outputTax}
              netTax={netTax}
              netPayable={netPayable}
            />
          )}

          {activeTab === 'guide' && <GSTGuideTab guideTab={guideTab} onGuideTabChange={setGuideTab} />}
        </>
      )}
    </div>
  );
}