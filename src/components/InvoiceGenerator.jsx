import { useState, useEffect, useRef } from 'react';
import { saveBill, getNextInvoiceNumber, peekNextInvoiceNumber, getTermsTemplates, getAllClients, saveClient, getAllProducts, saveProduct, getInvoiceDisplayOptions, saveInvoiceDisplayOptions, getAllProfiles } from '../store';
import { INVOICE_TYPES, generateEWayBillJSON, formatCurrency, getStatesForCountry } from '../utils';
import { downloadJSON } from '../lib/download';
import InvoicePreview from './InvoicePreview';
import { toast } from'../lib/toast';
import InvoiceToolbar from './invoice/InvoiceToolbar';
import BusinessProfileSelector from './invoice/BusinessProfileSelector';
import ClientDetailsSection from './invoice/ClientDetailsSection';
import InvoiceTypeSettings from './invoice/InvoiceTypeSettings';
import LineItemsSection from './invoice/LineItemsSection';
import TermsAndSections from './invoice/TermsAndSections';
import { DEFAULT_INVOICE_OPTIONS, clearInvoiceDraft, loadInvoiceDraft } from './invoice/invoiceConfig';
import { calculateInvoiceTotals, createEmptyLineItem } from './invoice/invoiceMath';
import { buildInvoicePDF } from './invoice/pdfBuilder';

export default function InvoiceGenerator({ onBack, profile: profileProp, editingBill }) {
  const draft = loadInvoiceDraft();
  const [allProfiles, setAllProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(profileProp);
  const profile = activeProfile || profileProp;
  const [invoiceType, setInvoiceType] = useState(draft?.invoiceType || 'tax-invoice');
  const [client, setClient] = useState(draft?.client || { name: '', address: '', city: '', pin: '', state: '', gstin: '', country: '' });
  const [details, setDetails] = useState(draft?.details || {
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    placeOfSupply: '',
    originalInvoiceRef: '',
  });

  const [items, setItems] = useState(draft?.items || [
    createEmptyLineItem(true)
  ]);
  const [taxInclusive, setTaxInclusive] = useState(draft?.taxInclusive || false);

  const [totals, setTotals] = useState({ subtotal: 0, totalDiscount: 0, cgst: 0, sgst: 0, igst: 0, total: 0 });
  const [saving, setSaving] = useState(false);
  const [savingPDF, setSavingPDF] = useState(false);
  const [termsTemplates, setTermsTemplates] = useState([]);
  const [selectedTermsId, setSelectedTermsId] = useState(draft?.selectedTermsId || '');
  const [customTerms, setCustomTerms] = useState(draft?.customTerms || '');
  const [customNotes, setCustomNotes] = useState(draft?.customNotes || '');
  const [internalNote, setInternalNote] = useState(draft?.internalNote || '');
  const [extraSections, setExtraSections] = useState(draft?.extraSections || []);
  const [savedClients, setSavedClients] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [modalClient, setModalClient] = useState(null);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const clientNameRef = useRef(null);
  const clientSuggestionsRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState({ itemId: null, query: '' });
  const [invoiceOptions, setInvoiceOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('fmnBilling_invoiceOptions');
      const persisted = saved ? JSON.parse(saved) : {};
      return { ...DEFAULT_INVOICE_OPTIONS, ...persisted, ...(draft?.invoiceOptions || {}) };
    } catch { return draft?.invoiceOptions || { ...DEFAULT_INVOICE_OPTIONS }; }
  });
  const [showOptions, setShowOptions] = useState(false);
  const printRef = useRef(null);
  const draftInitialized = useRef(!!draft);
  const stockDeducted = useRef(!!editingBill); // skip stock deduction for existing invoices
  const suggestedInvoiceNumberRef = useRef(draft?.details?.invoiceNumber || '');

  const typeConfig = INVOICE_TYPES[invoiceType];
  const showGST = invoiceOptions.showGST;

  useEffect(() => {
    localStorage.setItem('fmnBilling_invoiceOptions', JSON.stringify(invoiceOptions));
    saveInvoiceDisplayOptions(invoiceOptions).catch(() => {});
  }, [invoiceOptions]);

  useEffect(() => {
    getInvoiceDisplayOptions().then(serverOpts => {
      if (serverOpts) {
        const merged = { ...DEFAULT_INVOICE_OPTIONS, ...serverOpts };
        setInvoiceOptions(prev => {
          // Only update if different to avoid unnecessary re-renders
          const changed = Object.keys(merged).some(k => merged[k] !== prev[k]);
          if (changed) {
            localStorage.setItem('fmnBilling_invoiceOptions', JSON.stringify(merged));
            return merged;
          }
          return prev;
        });
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const draftData = { invoiceType, client, details, items, customTerms, customNotes, internalNote, extraSections, selectedTermsId, invoiceOptions, taxInclusive };
    sessionStorage.setItem('gst_invoiceDraft', JSON.stringify(draftData));
  }, [invoiceType, client, details, items, customTerms, customNotes, internalNote, extraSections, selectedTermsId, invoiceOptions, taxInclusive]);

  const clearDraft = () => {
    clearInvoiceDraft();
  };

  const loadSuggestedInvoiceNumber = async (type, invoiceDate, { overwrite = false } = {}) => {
    const prefix = INVOICE_TYPES[type]?.prefix || 'INV';
    const previousSuggested = suggestedInvoiceNumberRef.current;
    const suggestedNumber = await peekNextInvoiceNumber(prefix, invoiceDate);
    suggestedInvoiceNumberRef.current = suggestedNumber;
    setDetails((prev) => {
      const shouldReplace = overwrite || !prev.invoiceNumber || prev.invoiceNumber === previousSuggested;
      return shouldReplace ? { ...prev, invoiceNumber: suggestedNumber } : prev;
    });
    return suggestedNumber;
  };

  useEffect(() => {
    getAllProfiles().then(p => { setAllProfiles(p); if (!activeProfile && p.length > 0) setActiveProfile(profileProp); }).catch(() => {});
    getTermsTemplates().then(templates => {
      setTermsTemplates(templates);
      if (templates.length > 0 && !selectedTermsId && !draftInitialized.current) {
        setSelectedTermsId(templates[0].id);
        setCustomTerms(templates[0].content);
      }
    });
    getAllClients().then(clients => {
      setSavedClients(clients);
      if (client.name.trim()) {
        const match = clients.find(c => c.name.toLowerCase() === client.name.trim().toLowerCase());
        if (match) setSelectedClientId(match.id);
      }
    });
    getAllProducts().then(setProducts);
  }, []);

  useEffect(() => {
    if (draftInitialized.current) {
      draftInitialized.current = false;
      return;
    }
    if (editingBill?.data) {
      const d = editingBill.data;
      setClient(d.client);
      setItems(d.items);
      setInvoiceType(d.invoiceType || 'tax-invoice');
      if (d.customTerms !== undefined) setCustomTerms(d.customTerms);
      if (d.customNotes !== undefined) setCustomNotes(d.customNotes);
      if (d.internalNote !== undefined) setInternalNote(d.internalNote);
      if (d.extraSections) setExtraSections(d.extraSections);
      if (d.taxInclusive !== undefined) setTaxInclusive(d.taxInclusive);
      if (d.invoiceOptions) {
        try {
          const saved = localStorage.getItem('fmnBilling_invoiceOptions');
          const persisted = saved ? JSON.parse(saved) : {};
          setInvoiceOptions({ ...DEFAULT_INVOICE_OPTIONS, ...persisted, ...d.invoiceOptions });
        } catch { setInvoiceOptions({ ...DEFAULT_INVOICE_OPTIONS, ...d.invoiceOptions }); }
      }

      if (editingBill._isDuplicate) {
        const convertType = editingBill._convertToType;
        const type = convertType || d.invoiceType || 'tax-invoice';
        if (convertType) {
          setInvoiceType(convertType);
          const config = INVOICE_TYPES[convertType];
          if (config) setInvoiceOptions(prev => ({ ...prev, showGST: config.showGST, showPlaceOfSupply: config.showGST }));
        }
        const nextInvoiceDate = new Date().toISOString().split('T')[0];
        setDetails({ ...d.details, invoiceNumber: '', invoiceDate: nextInvoiceDate });
        loadSuggestedInvoiceNumber(type, nextInvoiceDate, { overwrite: true }).catch(() => {});
      } else {
        suggestedInvoiceNumberRef.current = d.details?.invoiceNumber || '';
        setDetails(d.details);
      }
    } else if (!details.invoiceNumber) {
      loadSuggestedInvoiceNumber('tax-invoice', details.invoiceDate, { overwrite: true }).catch(() => {});
    }
  }, [editingBill, details.invoiceDate, details.invoiceNumber]);

  const handleTypeChange = async (type) => {
    const config = INVOICE_TYPES[type];
    const previousSuggested = suggestedInvoiceNumberRef.current;
    setInvoiceType(type);
    const shouldRefreshNumber = !details.invoiceNumber || details.invoiceNumber === previousSuggested;
    if (shouldRefreshNumber) {
      const suggestedNumber = await peekNextInvoiceNumber(config?.prefix || 'INV', details.invoiceDate);
      suggestedInvoiceNumberRef.current = suggestedNumber;
      setDetails(prev => ({ ...prev, invoiceNumber: suggestedNumber }));
    }

    if (type === 'bill-of-supply') {
      setInvoiceOptions(prev => ({ ...prev, showGST: false, showPlaceOfSupply: false }));
    } else {
      setInvoiceOptions(prev => ({ ...prev, showGST: config.showGST, showPlaceOfSupply: config.showGST }));
    }
  };

  useEffect(() => {
    const isEditingExisting = editingBill && !editingBill._isDuplicate;
    if (isEditingExisting) return;
    if (!details.invoiceDate) return;
    if (!details.invoiceNumber || details.invoiceNumber !== suggestedInvoiceNumberRef.current) return;
    loadSuggestedInvoiceNumber(invoiceType, details.invoiceDate, { overwrite: true }).catch(() => {});
  }, [details.invoiceDate, invoiceType, editingBill, details.invoiceNumber]);

  const toggleOption = (key) => {
    setInvoiceOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    setTotals(calculateInvoiceTotals({
      items,
      clientState: client.state,
      businessState: profile?.state,
      showGST,
      taxInclusive,
    }));
  }, [items, client.state, profile?.state, showGST, taxInclusive]);

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    if (field === 'name') {
      setProductSearch({ itemId: id, query: value });
    }
  };

  const selectProduct = (itemId, product) => {
    setItems(prev => prev.map(item => item.id === itemId ? {
      ...item,
      name: product.name,
      hsn: product.hsn || '',
      rate: product.rate || 0,
      taxPercent: product.taxPercent ?? 18,
      productId: product.id,
    } : item));
    setProductSearch({ itemId: null, query: '' });
  };

  const getProductSuggestions = (itemId) => {
    if (productSearch.itemId !== itemId || !productSearch.query.trim()) return [];
    const q = productSearch.query.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) || p.hsn?.toLowerCase().includes(q)
    ).slice(0, 5);
  };

  const addItem = () => {
    setItems(prev => [...prev, createEmptyLineItem(showGST)]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleTermsSelect = (templateId) => {
    setSelectedTermsId(templateId);
    const tpl = termsTemplates.find(t => t.id === templateId);
    if (tpl) setCustomTerms(tpl.content);
  };

  const selectSavedClient = (cli) => {
    setClient({ name: cli.name, address: cli.address || '', city: cli.city || '', pin: cli.pin || '', state: cli.state || '', gstin: cli.gstin || '' });
    setSelectedClientId(cli.id);
    setShowClientSuggestions(false);
    toast(`Loaded client: ${cli.name}`, 'info');
  };

  const openAddClientModal = () => {
    setModalClient({ name: client.name || '', address: client.address || '', city: client.city || '', pin: client.pin || '', state: client.state || '', gstin: client.gstin || '' });
    setIsEditingClient(false);
    setShowClientModal(true);
    setShowClientSuggestions(false);
  };

  const openEditClientModal = (cli) => {
    setModalClient(cli);
    setIsEditingClient(true);
    setShowClientModal(true);
  };

  const handleClientModalSave = async (formData) => {
    const data = { ...formData };
    if (isEditingClient && modalClient?.id) data.id = modalClient.id;
    await saveClient(data);
    const updated = await getAllClients();
    setSavedClients(updated);
    setClient({ name: data.name, address: data.address, city: data.city || '', pin: data.pin || '', state: data.state, gstin: data.gstin });
    if (isEditingClient && modalClient?.id) {
      setSelectedClientId(modalClient.id);
      toast(`Client "${data.name}" updated!`, 'success');
    } else {
      const found = updated.find(c => c.name === data.name.trim() && !savedClients.some(old => old.id === c.id));
      if (found) setSelectedClientId(found.id);
      toast(`Client "${data.name}" saved!`, 'success');
    }
    setShowClientModal(false);
  };

  const filteredClients = client.name.trim()
    ? savedClients.filter(cli => cli.name.toLowerCase().includes(client.name.trim().toLowerCase()))
    : savedClients;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clientSuggestionsRef.current && !clientSuggestionsRef.current.contains(e.target) &&
          clientNameRef.current && !clientNameRef.current.contains(e.target)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveInvoiceToDB = async (skipStockDeduction = false) => {
    let resolvedInvoiceNumber = details.invoiceNumber;
    const activePrefix = INVOICE_TYPES[invoiceType]?.prefix || 'INV';
    const isEditingExisting = editingBill && !editingBill._isDuplicate;
    const shouldReserveSequence =
      !isEditingExisting &&
      (!details.invoiceNumber || details.invoiceNumber === suggestedInvoiceNumberRef.current);

    if (shouldReserveSequence) {
      resolvedInvoiceNumber = await getNextInvoiceNumber(activePrefix, details.invoiceDate);
      suggestedInvoiceNumberRef.current = resolvedInvoiceNumber;
      setDetails(prev => ({ ...prev, invoiceNumber: resolvedInvoiceNumber }));
    }

    const bill = {
      id: resolvedInvoiceNumber,
      clientName: client.name,
      invoiceNumber: resolvedInvoiceNumber,
      invoiceDate: details.invoiceDate,
      invoiceType,
      currency: invoiceOptions.currency || 'INR',
      totalAmount: totals.total,
      totalTaxAmount: totals.cgst + totals.sgst + totals.igst,
      status: editingBill?.status || 'unpaid',
      paidAmount: editingBill?.paidAmount || 0,
      payments: editingBill?.payments || [],
      data: {
        profile,
        client,
        details: { ...details, invoiceNumber: resolvedInvoiceNumber },
        items,
        totals,
        invoiceType,
        customTerms,
        customNotes,
        internalNote,
        extraSections,
        invoiceOptions,
        taxInclusive
      }
    };
    await saveBill(bill);

    if (!skipStockDeduction && !stockDeducted.current) {
      stockDeducted.current = true;
      const currentProducts = await getAllProducts();
      const lowStockWarnings = [];

      for (const item of items) {
        if (!item.productId) continue;
        const product = currentProducts.find(p => p.id === item.productId);
        if (!product) continue;

        const updatedStock = (product.stock || 0) - (item.quantity || 0);
        await saveProduct({ ...product, stock: updatedStock });

        if (updatedStock <= 0) {
          lowStockWarnings.push(`${product.name} is now out of stock!`);
        } else if (updatedStock <= 5) {
          lowStockWarnings.push(`${product.name} has only ${updatedStock} left in stock`);
        }
      }

      const refreshed = await getAllProducts();
      setProducts(refreshed);

      for (const warning of lowStockWarnings) {
        toast(warning, 'warning');
      }
    }
  };

  const generatePDF = async () => {
    if (!printRef.current) return;
    try {
      setSavingPDF(true)
      await saveInvoiceToDB();
      const pdf = await buildInvoicePDF(printRef.current);
      const fileName = `${typeConfig.prefix}_${details.invoiceNumber.replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);
      clearDraft();
      toast('Invoice saved and PDF downloaded', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to generate PDF.', 'error');
    } finally {
      setSavingPDF(false)

    }
  };

  const handleSaveInvoice = async () => {
    try {
      setSaving(true);
      await saveInvoiceToDB();
      toast('Invoice saved', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to save invoice.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const shareWhatsApp = () => {
    const phone = client?.phone ? client.phone.replace(/\D/g, '') : '';
    const amount = formatCurrency(items.reduce((s, i) => s + (i.quantity * i.rate), 0));
    const msg = `*Invoice: ${details.invoiceNumber}*\nClient: ${client?.name || ''}\nAmount: ${amount}\nDate: ${details.invoiceDate}`;
    const encoded = encodeURIComponent(msg);
    const waUrl = phone ? `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.location.href = waUrl;
  };

  const exportEWayBill = () => {
    if (!profile?.gstin) { toast('Set your GSTIN in Settings first', 'warning'); return; }
    const ewb = generateEWayBillJSON(profile, client, details, items, totals, invoiceType);
    downloadJSON(`EWB-${details.invoiceNumber?.replace(/\//g, '-') || 'draft'}.json`, ewb);
    toast('E-Way Bill JSON downloaded', 'success');
  };

  return (
    <div className="generator-container">
      <InvoiceToolbar
        invoiceType={invoiceType}
        onBack={() => { clearInvoiceDraft(); onBack(); }}
        onSave={handleSaveInvoice}
        onDownloadPDF={generatePDF}
        onShareWhatsApp={shareWhatsApp}
        onExportEWayBill={exportEWayBill}
        saving={saving}
        savingPDF={savingPDF}
      />

      <div className="split-view">
        <div className="editor-pane">
          <BusinessProfileSelector
            profiles={allProfiles}
            activeProfile={activeProfile}
            fallbackProfile={profileProp}
            onSelect={setActiveProfile}
          />
          <InvoiceTypeSettings
            invoiceType={invoiceType}
            typeConfig={typeConfig}
            invoiceOptions={invoiceOptions}
            showOptions={showOptions}
            onTypeChange={handleTypeChange}
            onToggleOptions={() => setShowOptions(prev => !prev)}
            onUpdateOptions={(updates) => setInvoiceOptions(prev => ({ ...prev, ...updates }))}
            onToggleOption={toggleOption}
          />
          <ClientDetailsSection
            client={client}
            profile={profile}
            invoiceOptions={invoiceOptions}
            savedClients={savedClients}
            filteredClients={filteredClients}
            selectedClientId={selectedClientId}
            showClientSuggestions={showClientSuggestions}
            showClientModal={showClientModal}
            modalClient={modalClient}
            isEditingClient={isEditingClient}
            clientNameRef={clientNameRef}
            clientSuggestionsRef={clientSuggestionsRef}
            onClientChange={(updates) => setClient(prev => ({ ...prev, ...updates }))}
            onSelectClient={selectSavedClient}
            onOpenAddClient={openAddClientModal}
            onOpenEditClient={openEditClientModal}
            onClientModalSave={handleClientModalSave}
            onCloseClientModal={() => setShowClientModal(false)}
            onShowSuggestions={setShowClientSuggestions}
            onClearSelectedClient={() => setSelectedClientId(null)}
          />

          <div className="glass-panel p-6 mb-6">
            <h3 className="section-title">Invoice Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Invoice Number</label>
                <input type="text" className="form-input" value={details.invoiceNumber}
                  onChange={(e) => setDetails({ ...details, invoiceNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Date</label>
                <input type="date" className="form-input" value={details.invoiceDate}
                  onChange={(e) => setDetails({ ...details, invoiceDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={details.dueDate}
                  onChange={(e) => setDetails({ ...details, dueDate: e.target.value })} />
              </div>
              {invoiceOptions.showPlaceOfSupply && (() => {
                const posOpts = getStatesForCountry(profile?.country);
                return (
                  <div className="form-group">
                    <label className="form-label">Place of Supply</label>
                    {posOpts.length > 0 ? (
                      <select className="form-input" value={details.placeOfSupply}
                        onChange={(e) => setDetails({ ...details, placeOfSupply: e.target.value })}>
                        <option value="">Defaults to Client State</option>
                        {posOpts.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" className="form-input" value={details.placeOfSupply}
                        onChange={(e) => setDetails({ ...details, placeOfSupply: e.target.value })} placeholder="State / Region" />
                    )}
                  </div>
                );
              })()}
              {invoiceType === 'credit-note' && (
                <div className="form-group full-width">
                  <label className="form-label">Original Invoice Reference</label>
                  <input type="text" className="form-input" value={details.originalInvoiceRef}
                    onChange={(e) => setDetails({ ...details, originalInvoiceRef: e.target.value })} placeholder="e.g. INV/2025-26/0001" />
                </div>
              )}
            </div>
          </div>
          <LineItemsSection
            items={items}
            invoiceOptions={invoiceOptions}
            showGST={showGST}
            taxInclusive={taxInclusive}
            onTaxInclusiveChange={setTaxInclusive}
            onItemChange={handleItemChange}
            onSelectProduct={selectProduct}
            getProductSuggestions={getProductSuggestions}
            onProductSearchBlur={() => setTimeout(() => setProductSearch({ itemId: null, query: '' }), 200)}
            onAddItem={addItem}
            onRemoveItem={removeItem}
          />
          <TermsAndSections
            termsTemplates={termsTemplates}
            selectedTermsId={selectedTermsId}
            customTerms={customTerms}
            customNotes={customNotes}
            internalNote={internalNote}
            extraSections={extraSections}
            onTermsSelect={handleTermsSelect}
            onCustomTermsChange={(value) => { setCustomTerms(value); setSelectedTermsId(''); }}
            onCustomNotesChange={setCustomNotes}
            onInternalNoteChange={setInternalNote}
            onExtraSectionsChange={setExtraSections}
          />
        </div>

        <div className="preview-pane">
          <div className="preview-pane-label">PDF Preview — This is how your invoice will look</div>
          <div className="preview-scaler">
            <InvoicePreview ref={printRef} profile={profile} client={client} details={details}
              items={items} totals={totals} invoiceType={invoiceType} customTerms={customTerms}
              customNotes={customNotes} extraSections={extraSections} options={invoiceOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
