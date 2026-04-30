import { Pencil, UserPlus } from 'lucide-react';
import { COUNTRIES, getCountryConfig, getStatesForCountry } from '../../utils';
import ClientModal from '../ClientModal';

export default function ClientDetailsSection({
  client,
  profile,
  invoiceOptions,
  savedClients,
  filteredClients,
  selectedClientId,
  showClientSuggestions,
  showClientModal,
  modalClient,
  isEditingClient,
  clientNameRef,
  clientSuggestionsRef,
  onClientChange,
  onSelectClient,
  onOpenAddClient,
  onOpenEditClient,
  onClientModalSave,
  onCloseClientModal,
  onShowSuggestions,
  onClearSelectedClient,
}) {
  const selectedClient = savedClients.find((savedClient) => savedClient.id === selectedClientId);

  return (
    <>
      <ClientModal show={showClientModal} onClose={onCloseClientModal} onSave={onClientModalSave} client={modalClient} isEditing={isEditingClient} />

      <div className="glass-panel p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title" style={{ margin: 0 }}>Billed To</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-group full-width" style={{ position: 'relative' }}>
            <label className="form-label">Client Name</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                value={client.name}
                ref={clientNameRef}
                onChange={(event) => {
                  onClientChange({ name: event.target.value });
                  onClearSelectedClient();
                  onShowSuggestions(true);
                }}
                onFocus={() => { if (savedClients.length > 0) onShowSuggestions(true); }}
                placeholder="Type client name to search or add new"
                autoComplete="off"
              />
              {selectedClientId && (
                <button type="button" className="btn-client-edit" onClick={() => onOpenEditClient(selectedClient)} title="Edit saved client">
                  <Pencil size={14} />
                </button>
              )}
            </div>
            {showClientSuggestions && savedClients.length > 0 && (
              <div className="client-suggestions" ref={clientSuggestionsRef}>
                {filteredClients.length > 0 && filteredClients.map((savedClient) => (
                  <div key={savedClient.id} className="client-suggestion-row">
                    <button type="button" className="client-suggestion-item" onClick={() => onSelectClient(savedClient)}>
                      <div className="client-suggestion-main">
                        <strong>{savedClient.name}</strong>
                        {(savedClient.city || savedClient.address) && <small className="client-suggestion-addr">{savedClient.city || savedClient.address.substring(0, 30)}{!savedClient.city && savedClient.address.length > 30 ? '...' : ''}</small>}
                      </div>
                      <span>{savedClient.state}{savedClient.gstin ? ` · ${savedClient.gstin}` : ''}</span>
                    </button>
                    <button type="button" className="client-suggestion-edit" onClick={() => { onOpenEditClient(savedClient); onShowSuggestions(false); }} title="Edit client">
                      <Pencil size={12} />
                    </button>
                  </div>
                ))}
                {client.name.trim() && (
                  <button type="button" className="client-suggestion-save" onClick={onOpenAddClient}>
                    <UserPlus size={14} /> Save "{client.name.trim()}" as new client
                  </button>
                )}
                {filteredClients.length === 0 && !client.name.trim() && (
                  <div className="client-picker-empty">Type to search clients</div>
                )}
              </div>
            )}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Billing Address</label>
            <input type="text" className="form-input" value={client.address} onChange={(event) => onClientChange({ address: event.target.value })} placeholder="Street address, locality" />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="form-input" value={client.country || profile?.country || 'India'} onChange={(event) => onClientChange({ country: event.target.value, state: '' })}>
              {COUNTRIES.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City</label>
            <input type="text" className="form-input" value={client.city} onChange={(event) => onClientChange({ city: event.target.value })} placeholder="e.g. Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">{getCountryConfig(client.country || profile?.country).postalLabel}</label>
            <input type="text" className="form-input" value={client.pin} onChange={(event) => onClientChange({ pin: event.target.value })} placeholder="Postal / PIN code" />
          </div>
          {invoiceOptions.showState && (() => {
            const countryConfig = getCountryConfig(client.country || profile?.country);
            const stateOptions = getStatesForCountry(client.country || profile?.country);
            return (
              <div className="form-group">
                <label className="form-label">{countryConfig.stateLabel}</label>
                {stateOptions.length > 0 ? (
                  <select className="form-input" value={client.state} onChange={(event) => onClientChange({ state: event.target.value })}>
                    <option value="">Select {countryConfig.stateLabel}</option>
                    {stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}
                  </select>
                ) : (
                  <input type="text" className="form-input" value={client.state} onChange={(event) => onClientChange({ state: event.target.value })} placeholder={countryConfig.stateLabel} />
                )}
              </div>
            );
          })()}
          {invoiceOptions.showGSTIN && (() => {
            const countryConfig = getCountryConfig(client.country || profile?.country);
            return (
              <div className="form-group">
                <label className="form-label">{countryConfig.taxIdLabel}</label>
                <input type="text" className="form-input" value={client.gstin} onChange={(event) => onClientChange({ gstin: event.target.value.toUpperCase() })} placeholder="Optional" maxLength={20} />
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
