import { useState, useEffect } from 'react';
import { BarChart3, Clock } from 'lucide-react';
import { getAllBills, getAllExpenses } from '../store';
import { InlineLoadingState } from './LoadingSpinner';
import { toast } from'../lib/toast';
import { getFinancialYearOptions } from '../lib/periods';
import ReportsFilterPanel from './reports/ReportsFilterPanel';
import PLStatement from './reports/PLStatement';
import AgingAnalysis from './reports/AgingAnalysis';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getBillCurrency = (b) => b.currency || b.data?.invoiceOptions?.currency || 'INR';

export default function ReportsView() {
  const [bills, setBills] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [activeTab, setActiveTab] = useState('pl');
  const [filterMode, setFilterMode] = useState('fy');
  const [fyFilter, setFyFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [agingSearch, setAgingSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('INR');
  const [loading, setLoading] = useState(true);

  const fyOptions = getFinancialYearOptions();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = currentYear; y >= currentYear - 5; y--) yearOptions.push(y);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billData, expData] = await Promise.all([getAllBills(), getAllExpenses()]);
      setBills(billData);
      setExpenses(expData);
    } catch {
      toast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const fy = fyOptions[0];
    if (fy) setFyFilter(fy.value);
    setYearFilter(String(now.getFullYear()));
    setMonthFilter(String(now.getMonth()));
    loadData();
  }, []);

  const filterByPeriod = (date) => {
    if (!date) return false;
    if (filterMode === 'fy') {
      const fy = fyOptions.find(f => f.value === fyFilter);
      return fy ? date >= fy.from && date <= fy.to : true;
    } else {
      const d = new Date(date);
      return d.getFullYear() === parseInt(yearFilter) && d.getMonth() === parseInt(monthFilter);
    }
  };

  const allFilteredBills = bills.filter(bill => bill.data && filterByPeriod(bill.invoiceDate));
  const filteredExpenses = expenses.filter(exp => filterByPeriod(exp.date));

  const allCurrencies = [...new Set(allFilteredBills.map(getBillCurrency))].sort();

  // const allCurrenciesKey = allCurrencies.join(',');
  // useEffect(() => {
  //   if (allCurrencies.length > 0 && !allCurrencies.includes(currencyFilter)) {
  //     setCurrencyFilter(allCurrencies[0]);
  //   }
  // }, [allCurrenciesKey, currencyFilter]);

  const firstCurrency = allCurrencies[0];

  useEffect(() => {
    if (!firstCurrency) return;

    if (!allCurrencies.includes(currencyFilter)) {
      setCurrencyFilter(firstCurrency);
    }
  }, [firstCurrency, allCurrencies, currencyFilter]);
  const plBills = allFilteredBills.filter(b => getBillCurrency(b) === currencyFilter);

  const totalRevenue = plBills.reduce((s, b) => s + (b.totalAmount || 0), 0);
  const totalTaxCollected = plBills.reduce((s, b) => s + (b.totalTaxAmount || 0), 0);
  const revenueExTax = totalRevenue - totalTaxCollected;
  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpenseGST = filteredExpenses.reduce((s, e) => s + (e.gstAmount || 0), 0);
  const expenseExGST = totalExpenseAmount - totalExpenseGST;
  const netProfit = revenueExTax - expenseExGST;

  const monthlyPL = {};
  plBills.forEach(b => {
    if (!b.invoiceDate) return;
    const key = b.invoiceDate.substring(0, 7);
    if (!monthlyPL[key]) monthlyPL[key] = { revenue: 0, tax: 0, expense: 0, expGst: 0 };
    monthlyPL[key].revenue += b.totalAmount || 0;
    monthlyPL[key].tax += b.totalTaxAmount || 0;
  });
  filteredExpenses.forEach(e => {
    if (!e.date) return;
    const key = e.date.substring(0, 7);
    if (!monthlyPL[key]) monthlyPL[key] = { revenue: 0, tax: 0, expense: 0, expGst: 0 };
    monthlyPL[key].expense += e.amount || 0;
    monthlyPL[key].expGst += e.gstAmount || 0;
  });

  const today = new Date();
  const unpaidBills = bills.filter(b => b.status !== 'paid');
  const agingData = unpaidBills.map(b => {
    const dueDate = b.data?.details?.dueDate || b.invoiceDate;
    const due = new Date(dueDate);
    const daysOverdue = Math.max(0, Math.floor((today - due) / 86400000));
    const outstanding = (b.totalAmount || 0) - (b.paidAmount || 0);
    let bucket = 'current';
    if (daysOverdue > 90) bucket = '90plus';
    else if (daysOverdue > 60) bucket = '61to90';
    else if (daysOverdue > 30) bucket = '31to60';
    return {
      clientName: b.clientName || 'Unknown',
      invoiceNumber: b.invoiceNumber,
      invoiceDate: b.invoiceDate,
      dueDate,
      totalAmount: b.totalAmount || 0,
      paidAmount: b.paidAmount || 0,
      outstanding,
      daysOverdue,
      bucket,
      currency: getBillCurrency(b),
    };
  }).filter(r => r.outstanding > 0);

  const agingFiltered = agingSearch.trim()
    ? agingData.filter(r => r.clientName.toLowerCase().includes(agingSearch.toLowerCase()))
    : agingData;

  const agingByCurrency = {};
  agingFiltered.forEach(r => {
    if (!agingByCurrency[r.currency]) agingByCurrency[r.currency] = { total: 0, current: 0, '31to60': 0, '61to90': 0, '90plus': 0 };
    agingByCurrency[r.currency].total += r.outstanding;
    agingByCurrency[r.currency][r.bucket] += r.outstanding;
  });
  const agingCurrencies = Object.keys(agingByCurrency).sort((a, b) => a === 'INR' ? -1 : b === 'INR' ? 1 : a.localeCompare(b));
  const agingSorted = [...agingFiltered].sort((a, b) => b.daysOverdue - a.daysOverdue);

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Financial reports and receivables analysis</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button className={`btn ${activeTab === 'pl' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('pl')}>
          <BarChart3 size={16} /> Profit & Loss
        </button>
        <button className={`btn ${activeTab === 'aging' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('aging')}>
          <Clock size={16} /> Outstanding & Aging
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-6">
          <InlineLoadingState title="Loading reports" />
        </div>
      ) : (
        <>
          {activeTab === 'pl' && (
            <>
              <ReportsFilterPanel
                filterMode={filterMode} setFilterMode={setFilterMode}
                fyFilter={fyFilter} setFyFilter={setFyFilter}
                monthFilter={monthFilter} setMonthFilter={setMonthFilter}
                yearFilter={yearFilter} setYearFilter={setYearFilter}
                currencyFilter={currencyFilter} setCurrencyFilter={setCurrencyFilter}
                allCurrencies={allCurrencies}
              />
              <PLStatement
                totalRevenue={totalRevenue} totalTaxCollected={totalTaxCollected}
                revenueExTax={revenueExTax} totalExpenseAmount={totalExpenseAmount}
                totalExpenseGST={totalExpenseGST} expenseExGST={expenseExGST}
                netProfit={netProfit} currencyFilter={currencyFilter}
                monthlyPL={monthlyPL} allCurrencies={allCurrencies}
              />
            </>
          )}

          {activeTab === 'aging' && (
            <AgingAnalysis
              agingByCurrency={agingByCurrency} agingCurrencies={agingCurrencies}
              agingSearch={agingSearch} setAgingSearch={setAgingSearch}
              agingSorted={agingSorted}
            />
          )}
        </>
      )}
    </div>
  );
}
