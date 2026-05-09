import { useState, useEffect, useRef } from "react";
import {
  Home,
  FileText,
  Settings,
  Plus,
  Users,
  Package,
  BarChart3,
  Wallet,
  RefreshCw,
  Receipt,
  BookOpen,
  Moon,
  Sun,
  Download,
  X,
  ShoppingCart,
  ChevronDown,
  Building2,
  Pencil,
  LogOut,
  Menu,
  LayoutDashboard,
  Mail,
} from "lucide-react";
import { getAllProfiles, getProfile, saveProfile } from "./store";
import {
  isFirebaseAuthConfigured,
  listenToAuthState,
  signOutUser,
} from "./services/firebaseAuth";
import Dashboard from "./components/Dashboard";
import InvoiceGenerator from "./components/InvoiceGenerator";
import SettingsView from "./components/SettingsView";
import ClientsView from "./components/ClientsView";
import InventoryView from "./components/InventoryView";
import ReportsView from "./components/ReportsView";
import ExpenseTracker from "./components/ExpenseTracker";
import RecurringInvoices from "./components/RecurringInvoices";
import ReceiptVoucher from "./components/ReceiptVoucher";
import GSTReturns from "./components/GSTReturns";
import PurchaseBills from "./components/PurchaseBills";
import LeadsView from "./components/LeadsView";
import WelcomeGuide from "./components/WelcomeGuide";
import LoginView from "./components/LoginView";
import { LoadingPanel } from "./components/LoadingSpinner";
import ToastContainer from "./components/Toast";
import { PrivacyProvider, PrivacyToggleButton } from "./components/PrivacyContext";

const VIEW_IDS = new Set([
  "dashboard",
  "new",
  "clients",
  "leads",
  "inventory",
  "expenses",
  "purchases",
  "recurring",
  "receipts",
  "reports",
  "filing",
  "settings",
]);

function getHashView() {
  const hashView = window.location.hash.replace(/^#\/?/, "");
  return VIEW_IDS.has(hashView) ? hashView : "";
}

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hashView = getHashView();
    return hashView || sessionStorage.getItem("gst_currentView") || "dashboard";
  });
  const [profile, setProfile] = useState(null);
  const [editingBill, setEditingBill] = useState(() => {
    try {
      const saved = sessionStorage.getItem("gst_editingBill");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("fmnBilling_theme") === "dark";
  });
  const [showWelcome, setShowWelcome] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [serverDown, setServerDown] = useState(false);
  const deferredPrompt = useRef(null);
  const retryTimer = useRef(null);

  const [serverStatus, setServerStatus] = useState("checking");
  const profileLoaded = useRef(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const authConfigured = isFirebaseAuthConfigured();
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!authConfigured) {
      return;
    }

    const unsubscribe = listenToAuthState((user) => {
      setAuthUser(user);
      setAuthChecked(true);

      if (!user) {
        profileLoaded.current = false;
      }
    });

    return () => unsubscribe();
  }, [authConfigured]);

  useEffect(() => {
    if (!authConfigured || !authChecked || !authUser) return;
    let cancelled = false;

    const checkServer = async () => {
      try {
        const p = await getProfile();
        if (cancelled) return;
        setServerDown(false);
        setServerStatus("online");
        if (!profileLoaded.current) {
          profileLoaded.current = true;
          setProfile(p);
          if (
            !p.businessName &&
            !localStorage.getItem("fmnBilling_onboarded")
          ) {
            setShowWelcome(true);
          }
        }
      } catch {
        if (!cancelled) {
          setServerDown(false);
          setServerStatus("offline");
          if (!profileLoaded.current) {
            profileLoaded.current = true;
            setProfile({});
            setCurrentView("settings");
          }
        }
      }
    };

    checkServer();
    retryTimer.current = setInterval(checkServer, 5000);

    return () => {
      cancelled = true;
      if (retryTimer.current) clearInterval(retryTimer.current);
    };
  }, [authConfigured, authChecked, authUser]);

  // Capture PWA install prompt
  useEffect(() => {
    const dismissed = localStorage.getItem("fmnBilling_pwa_dismissed");
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)",
    ).matches;
    if (dismissed || isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("gst_currentView", currentView);
    if (VIEW_IDS.has(currentView) && window.location.hash !== `#${currentView}`) {
      window.history.replaceState(null, "", `#${currentView}`);
    }
  }, [currentView]);

  useEffect(() => {
    const handleHashChange = () => {
      const hashView = getHashView();
      if (hashView) setCurrentView(hashView);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (editingBill) {
      sessionStorage.setItem("gst_editingBill", JSON.stringify(editingBill));
    } else {
      sessionStorage.removeItem("gst_editingBill");
    }
  }, [editingBill]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("fmnBilling_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (serverStatus === "online") {
      getAllProfiles()
        .then(setAllProfiles)
        .catch(() => {});
    }
  }, [serverStatus]);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handler = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfileMenu]);

  const handleSwitchProfile = async (bp) => {
    setShowProfileMenu(false);
    const loaded = { ...bp };
    delete loaded.id;
    await saveProfile(loaded);
    setProfile(loaded);
  };

  const handleNewInvoice = () => {
    sessionStorage.removeItem("gst_invoiceDraft");
    setEditingBill(null);
    setCurrentView("new");
  };

  const handleEditInvoice = (bill) => {
    sessionStorage.removeItem("gst_invoiceDraft");
    setEditingBill(bill);
    setCurrentView("new");
  };

  const handleDuplicateInvoice = (bill) => {
    sessionStorage.removeItem("gst_invoiceDraft");
    const clone = JSON.parse(JSON.stringify(bill));
    clone._isDuplicate = true;
    setEditingBill(clone);
    setCurrentView("new");
  };

  const handleInstallPWA = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    deferredPrompt.current = null;
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("fmnBilling_pwa_dismissed", "1");
  };

  const handleConvertToInvoice = (bill) => {
    sessionStorage.removeItem("gst_invoiceDraft");
    const clone = JSON.parse(JSON.stringify(bill));
    clone._isDuplicate = true;
    clone._convertToType = "tax-invoice";
    setEditingBill(clone);
    setCurrentView("new");
  };

  const navItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "new", icon: Plus, label: "New Invoice", onClick: handleNewInvoice },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "leads", icon: Mail, label: "Leads" },
    { id: "inventory", icon: Package, label: "Products" },
    { id: "expenses", icon: Wallet, label: "Expenses" },
    { id: "purchases", icon: ShoppingCart, label: "Purchases" },
    { id: "recurring", icon: RefreshCw, label: "Recurring" },
    { id: "receipts", icon: Receipt, label: "Receipts" },
    { id: "reports", icon: BarChart3, label: "Reports" },
    { id: "filing", icon: BookOpen, label: "GST Returns" },
  ];

  if (!authConfigured) {
    return (
      <>
        <div className="auth-overlay">
          <div className="auth-card">
            <div className="auth-brand">
              <div className="auth-logo"><FileText size={20} /></div>
              <div>
                <h2>Authentication Required</h2>
                <p>Auth must be configured before accessing workspace</p>
              </div>
            </div>
            <p className="auth-error" style={{ marginBottom: 0 }}>
              Please contact admin @ kumarmanish204050@gmail.com.
            </p>
          </div>
        </div>
        <ToastContainer />
      </>
    );
  }

  if (!authChecked) {
    return (
      <div className="server-down-overlay">
        <LoadingPanel
          title="Signing you in"
          message="Connecting..."
        />
      </div>
    );
  }

  if (!authUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  if (serverStatus === "checking") {
    return (
      <div className="server-down-overlay">
        <LoadingPanel
          title="Loading workspace"
          message="Syncing your billing data..."
        />
      </div>
    );
  }

  if (serverDown) {
    return (
      <div className="server-down-overlay">
        <div className="server-down-modal">
          <FileText size={48} color="#3b82f6" />
          <h2>Backend Is Not Connected</h2>

          <p className="server-down-safe">
            No invoice or business data is written to local JSON storage.
          </p>
          <div className="server-down-waiting">
            <span>Waiting for configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <>
        <WelcomeGuide
          onComplete={(p) => {
            if (p) setProfile(p);
            setShowWelcome(false);
          }}
        />
        <ToastContainer />
      </>
    );
  }

  return (
    <PrivacyProvider>
      <div className="app-layout">
        {drawerOpen && (
          <div
            className="drawer-overlay"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      <div className={`sidebar ${drawerOpen ? 'sidebar-open' : ''}`}>
          {/* <button
            className="sidebar-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button> */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <LayoutDashboard size={22}/>
          </div>
          <div>
            <h2 className="sidebar-title">FMN-Billing</h2>
            <p className="sidebar-subtitle">Business Workspace</p>
          </div>
        </div>

        <div
          className="profile-switcher"
          ref={profileMenuRef}
          style={{ position: "relative" }}
        >
          <div className="profile-switcher-row">
            <button
              className="profile-switcher-btn"
              onClick={() =>
                allProfiles.length > 1 && setShowProfileMenu((v) => !v)
              }
              title={
                allProfiles.length > 1
                  ? "Switch business profile"
                  : profile?.businessName || "My Business"
              }
              style={{ cursor: allProfiles.length > 1 ? "pointer" : "default" }}
            >
              <Building2 size={14} />
              <span className="profile-switcher-name">
                {profile?.businessName || "My Business"}
              </span>
              {allProfiles.length > 1 && (
                <ChevronDown
                  size={13}
                  style={{ marginLeft: "auto", opacity: 0.6 }}
                />
              )}
            </button>
            <button
              className="profile-switcher-edit"
              onClick={() => {
                setShowProfileMenu(false);
                setCurrentView("settings");
                setDrawerOpen(false);
              }}
              title="Edit business profile"
            >
              <Pencil size={13} />
            </button>
          </div>
          {showProfileMenu && (
            <div className="profile-switcher-menu">
              {allProfiles.map((bp) => (
                <button
                  key={bp.id || bp.businessName}
                  className={`profile-switcher-item${bp.businessName?.trim().toLowerCase() === profile?.businessName?.trim().toLowerCase() ? " active" : ""}`}
                  onClick={() => handleSwitchProfile(bp)}
                >
                  {bp.businessName}
                </button>
              ))}
              <button
                className="profile-switcher-item profile-switcher-manage"
                onClick={() => {
                  setShowProfileMenu(false);
                  setCurrentView("settings");
                }}
              >
                Manage profiles...
              </button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-btn ${currentView === item.id ? "nav-btn-active" : ""}`}
              onClick={() => {
                (item.onClick || (() => setCurrentView(item.id)))();
                setDrawerOpen(false);
              }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
          <div
            style={{
              marginTop: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <button
              className="nav-btn"
              onClick={() => {
                signOutUser();
                setDrawerOpen(false);
              }}
              title={authUser?.email || "Sign out"}
            >
              <LogOut size={18} /> Sign Out
            </button>
            <button
              className="nav-btn"
              onClick={() => {
                setDarkMode(!darkMode);
                setDrawerOpen(false);
              }}
              title={darkMode ? "Light Mode" : "Dark Mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <PrivacyToggleButton />
            <button
              className={`nav-btn ${currentView === "settings" ? "nav-btn-active" : ""}`}
              onClick={() => {
                setCurrentView("settings");
                setDrawerOpen(false);
              }}
            >
              <Settings size={18} /> Settings
            </button>
            <div className={`server-status server-status-${serverStatus}`}>
              <span className="server-status-dot" />
              {serverStatus === "online"
                ? "Ready"
                : serverStatus === "offline"
                  ? "Offline"
                  : "Connecting..."}
            </div>
          </div>
        </nav>
      </div>

      <div className="app-main-wrapper">
        <div className="mobile-header">
          <button
            className="mobile-hamburger-btn"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="mobile-header-brand">
            <FileText size={18} />
            <span className="mobile-company-name">{profile?.businessName || "FMNBilling"}</span>
          </div>
          <div className="mobile-header-spacer" />
        </div>

        {showInstallBanner && (
        <div className="pwa-install-banner">
          <Download size={18} />
          <span>
            <strong>Install as Desktop App</strong> — opens instantly, no
            browser needed!
          </span>
          <button className="pwa-install-btn" onClick={handleInstallPWA}>
            Install App
          </button>
          <button
            className="pwa-dismiss-btn"
            onClick={dismissInstallBanner}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="main-content">
        {currentView === "dashboard" && (
          <Dashboard
            onNew={handleNewInvoice}
            onEdit={handleEditInvoice}
            onDuplicate={handleDuplicateInvoice}
            onConvert={handleConvertToInvoice}
          />
        )}
        {currentView === "new" && (
          <InvoiceGenerator
            onBack={() => {
              setEditingBill(null);
              setCurrentView("dashboard");
            }}
            profile={profile}
            editingBill={editingBill}
          />
        )}
        {currentView === "clients" && (
          <ClientsView
            onNew={handleNewInvoice}
            onEdit={handleEditInvoice}
            onDuplicate={handleDuplicateInvoice}
          />
        )}
        {currentView === "leads" && <LeadsView />}
        {currentView === "inventory" && <InventoryView />}
        {currentView === "expenses" && <ExpenseTracker />}
        {currentView === "purchases" && <PurchaseBills />}
        {currentView === "recurring" && (
          <RecurringInvoices onEdit={handleEditInvoice} />
        )}
        {currentView === "receipts" && <ReceiptVoucher />}
        {currentView === "reports" && <ReportsView />}
        {currentView === "filing" && <GSTReturns />}
        {currentView === "settings" && (
          <SettingsView onSaved={(p) => setProfile(p)} />
        )}
      </div>
      <ToastContainer />
      </div>
      </div>
    </PrivacyProvider>
  );
}

export default App;
