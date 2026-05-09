import { useState, useEffect } from "react";
import { Plus, StickyNote } from "lucide-react";
import {
  getAllBills,
  deleteBill,
  saveBill,
  getAllProducts,
  saveProduct,
  getProfile,
  getAllClients,
} from "../store";
import { formatCurrency, INVOICE_TYPES } from "../utils";
import { InlineLoadingState } from "./LoadingSpinner";
import { toast } from "../lib/toast";
import { getFinancialYearOptions } from "../lib/periods";
import DashboardStats from "./dashboard/DashboardStats";
import LowStockAlert from "./dashboard/LowStockAlert";
import OverdueBanner from "./dashboard/OverdueBanner";
import PaymentModal from "./dashboard/PaymentModal";
import RemindAllModal from "./dashboard/RemindAllModal";
import DashboardTable from "./dashboard/DashboardTable";
import { STATUS_CONFIG } from "./dashboard/dashboardConfig";

export default function Dashboard({ onNew, onEdit, onDuplicate, onConvert }) {
  const [bills, setBills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({ byCurrency: {}, count: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fyFilter, setFyFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentInput, setPaymentInput] = useState({
    amount: "",
    date: "",
    mode: "bank-transfer",
    note: "",
  });
  const [showRemindAll, setShowRemindAll] = useState(false);
  const [profile, setProfileState] = useState(null);
  const [clients, setClients] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fyOptions = getFinancialYearOptions();

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await getAllBills();
      const today = new Date().toISOString().split("T")[0];

      for (const bill of data) {
        const dueDate = bill.data?.details?.dueDate;
        if (
          dueDate &&
          dueDate < today &&
          bill.status !== "paid" &&
          bill.status !== "overdue"
        ) {
          bill.status = "overdue";
          await saveBill(bill);
        }
      }

      setBills(data);

      const byCurrency = {};
      for (const b of data) {
        const cur = b.currency || b.data?.invoiceOptions?.currency || "INR";
        if (!byCurrency[cur]) byCurrency[cur] = { total: 0, tax: 0, unpaid: 0 };
        byCurrency[cur].total += b.totalAmount || 0;
        byCurrency[cur].tax += b.totalTaxAmount || 0;
        if (b.status !== "paid")
          byCurrency[cur].unpaid += (b.totalAmount || 0) - (b.paidAmount || 0);
      }
      setStats({ byCurrency, count: data.length });
    } catch {
      toast("Failed to load invoices", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
    getProfile()
      .then((p) => setProfileState(p))
      .catch(() => {});
    getAllClients()
      .then((c) => setClients(c))
      .catch(() => {});
    getAllProducts()
      .then((prods) => {
        setLowStockProducts(prods.filter((p) => (p.stock ?? 0) <= 5));
      })
      .catch(() => {});
  }, []);

  function getComputedStatus(bill) {
    const dueDate = bill.data?.details?.dueDate;

    const isOverdue =
      bill.status !== "paid" && dueDate && new Date(dueDate) < new Date();

    if (isOverdue) return "overdue";

    return bill.status || "unpaid";
  }

  function applyFilters({
    bills,
    search,
    typeFilter,
    statusFilter,
    fyFilter,
    dateFrom,
    dateTo,
    fyOptions,
  }) {
    return bills.filter((b) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          (b.clientName || "").toLowerCase().includes(q) ||
          (b.invoiceNumber || "").toLowerCase().includes(q);

        if (!matches) return false;
      }

      if (typeFilter !== "all") {
        if ((b.invoiceType || "tax-invoice") !== typeFilter) return false;
      }

      if (statusFilter !== "all") {
        const computedStatus = getComputedStatus(b);
        if (computedStatus !== statusFilter) return false;
      }

      if (fyFilter !== "all") {
        const fy = fyOptions.find((f) => f.value === fyFilter);
        if (fy && (b.invoiceDate < fy.from || b.invoiceDate > fy.to)) {
          return false;
        }
      }

      if (dateFrom && b.invoiceDate < dateFrom) return false;
      if (dateTo && b.invoiceDate > dateTo) return false;

      return true;
    });
  }

  useEffect(() => {
    const result = applyFilters({
      bills,
      search,
      typeFilter,
      statusFilter,
      fyFilter,
      dateFrom,
      dateTo,
      fyOptions,
    });

    setFiltered(result);
  }, [
    bills,
    search,
    typeFilter,
    statusFilter,
    fyFilter,
    dateFrom,
    dateTo,
    fyOptions,
  ]);

  const handleDelete = async (bill) => {
    if (confirm("Delete this invoice? This cannot be undone.")) {
      try {
        if (bill.data?.items) {
          const products = await getAllProducts();
          for (const item of bill.data.items) {
            if (!item.productId) continue;
            const product = products.find((p) => p.id === item.productId);
            if (!product) continue;
            await saveProduct({
              ...product,
              stock: (product.stock || 0) + (item.quantity || 0),
            });
          }
        }
        await deleteBill(bill.id);

        toast("Invoice deleted & stock restored", "success");
        loadBills();
      } catch {
        toast("Failed to delete", "error");
      }
    }
  };

  const handleView = (bill) => {
    if (bill.data) onEdit(bill);
    else toast("No editable data saved for this invoice", "warning");
  };

  const handleStatusFilterChange = (status) => {
  setStatusFilter(status);
};

  const changeStatus = async (bill, newStatus) => {
    const updated = { ...bill, status: newStatus };
    if (newStatus === "paid") updated.paidAmount = bill.totalAmount;
    await saveBill(updated);
    toast(`Marked as ${STATUS_CONFIG[newStatus].label}`, "info");
    loadBills();
  };

  const openPaymentModal = (bill) => {
    setPaymentModal(bill);
    setPaymentInput({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      mode: "bank-transfer",
      note: "",
    });
  };

  const recordPayment = async () => {
    if (!paymentInput.amount || parseFloat(paymentInput.amount) <= 0) {
      toast("Enter a valid amount", "warning");
      return;
    }
    const amount = parseFloat(paymentInput.amount);
    const bill = paymentModal;
    const payments = [
      ...(bill.payments || []),
      {
        amount,
        date: paymentInput.date,
        mode: paymentInput.mode,
        note: paymentInput.note,
        recordedAt: new Date().toISOString(),
      },
    ];
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    await saveBill({
      ...bill,
      payments,
      paidAmount: totalPaid,
      status: totalPaid >= bill.totalAmount ? "paid" : "partial",
    });
    toast(
      `Payment of ${formatCurrency(amount, bill.currency)} recorded`,
      "success",
    );
    setPaymentModal(null);
    loadBills();
  };

  const shareWhatsApp = (bill) => {
    const phone = bill.clientPhone ? bill.clientPhone.replace(/\D/g, "") : "";
    const msg = `*Invoice: ${bill.invoiceNumber}*\nClient: ${bill.clientName}\nAmount: ${formatCurrency(bill.totalAmount)}\nDate: ${new Date(bill.invoiceDate).toLocaleDateString("en-IN")}\nStatus: ${(bill.status || "unpaid").toUpperCase()}`;
    const encoded = encodeURIComponent(msg);
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.location.href = waUrl;
  };

  const shareEmail = (bill) => {
    const subject = `Invoice ${bill.invoiceNumber} - ${formatCurrency(bill.totalAmount)}`;
    const body = `Dear ${bill.clientName},\n\nInvoice No: ${bill.invoiceNumber}\nAmount: ${formatCurrency(bill.totalAmount)}\nDate: ${new Date(bill.invoiceDate).toLocaleDateString("en-IN")}\nStatus: ${bill.status === "paid" ? "Paid" : "Payment Pending"}\n\nRegards`;
    window.open(
      `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
    );
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setFyFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasFilters =
    search ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    fyFilter !== "all" ||
    dateFrom ||
    dateTo;

  const sendReminder = (bill) => {
    const clientPhone = bill.clientPhone || bill.data?.client?.phone || "";
    const phone = clientPhone.replace(/\D/g, "");
    const clientName = bill.clientName || "Sir/Madam";
    const dueDate = bill.data?.details?.dueDate
      ? new Date(bill.data.details.dueDate).toLocaleDateString("en-IN")
      : "N/A";
    const businessName = profile?.businessName || "Our Company";
    const amount = formatCurrency(
      bill.totalAmount - (bill.paidAmount || 0),
      bill.currency,
    );
    const msg = `Hi ${clientName}, this is a gentle reminder that Invoice ${bill.invoiceNumber} for ${amount} was due on ${dueDate}. Kindly arrange the payment at your earliest convenience. Thank you! - ${businessName}`;
    const encoded = encodeURIComponent(msg);
    const waUrl = phone
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.location.href = waUrl;
  };

  const getClientPhone = (bill) => {
    if (bill.clientPhone) return bill.clientPhone;
    if (bill.data?.client?.phone) return bill.data.client.phone;
    const savedClient = clients.find((c) => c.name === bill.clientName);
    return savedClient?.phone || "";
  };

  const overdueBills = bills.filter((b) => b.status === "overdue");
  // Group overdue totals by currency for banner display
  const overdueByCurrency = {};
  for (const b of overdueBills) {
    const cur = b.currency || b.data?.invoiceOptions?.currency || "INR";
    overdueByCurrency[cur] =
      (overdueByCurrency[cur] || 0) +
      (b.totalAmount || 0) -
      (b.paidAmount || 0);
  }
  const overdueStr = Object.entries(overdueByCurrency)
    .map(([cur, amt]) => formatCurrency(amt, cur))
    .join(" + ");

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your invoices</p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <Plus size={18} /> New Invoice
        </button>
      </div>

      <OverdueBanner
        overdueCount={overdueBills.length}
        overdueText={overdueStr}
        onView={() => setStatusFilter("overdue")}
        onRemindAll={(event) => {
          event.stopPropagation();
          setShowRemindAll(true);
        }}
      />

      <RemindAllModal
        show={showRemindAll}
        overdueBills={overdueBills}
        getClientPhone={getClientPhone}
        onClose={() => setShowRemindAll(false)}
        onSendReminder={sendReminder}
      />

      <DashboardStats stats={stats} />
      <LowStockAlert products={lowStockProducts} />

      {loading ? (
        <div className="glass-panel p-6">
          <InlineLoadingState title="Loading invoices" />
        </div>
      ) : (
        <>
          <DashboardTable
            filtered={filtered}
            bills={bills}
            fyFilter={fyFilter}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            search={search}
            hasFilters={hasFilters}
            fyOptions={fyOptions}
            loading={loading}
            onSearch={setSearch}
            onFyChange={setFyFilter}
            onTypeChange={setTypeFilter}
            onStatusChange={changeStatus}
            onStatusFilterChange={handleStatusFilterChange}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearFilters={clearFilters}
            onNew={onNew}
            onView={handleView}
            onDuplicate={onDuplicate}
            onConvert={onConvert}
            onPayment={openPaymentModal}
            onShareWhatsApp={shareWhatsApp}
            onShareEmail={shareEmail}
            onDelete={handleDelete}
            showNote={true}
          />
          {paymentModal && (
            <PaymentModal
              bill={paymentModal}
              paymentInput={paymentInput}
              setPaymentInput={setPaymentInput}
              onClose={() => setPaymentModal(null)}
              onRecordPayment={recordPayment}
            />
          )}
        </>
      )}
    </div>
  );
}
