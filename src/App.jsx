import React, { useState, useEffect } from 'react';

// 1. IMPORTACIONES DE FIREBASE
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "firebase/firestore";

// 2. CONFIGURACIÓN
const firebaseConfig = {
  apiKey: "AIzaSyCYKvO_rQo8gKNHNNrAtMb8CDv2l7Ch2xk",
  authDomain: "mis-finanzas-app-c6de7.firebaseapp.com",
  projectId: "mis-finanzas-app-c6de7",
  storageBucket: "mis-finanzas-app-c6de7.firebasestorage.app",
  messagingSenderId: "67154196666",
  appId: "1:67154196666:web:00536e3072f7dddb712a83",
  measurementId: "G-6B69YQ980G"
};

// 3. INICIALIZAR APP
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- COMPONENTES VISUALES ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
        {children}
    </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-md hover:shadow-lg",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-md",
        outline: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
    };
    return (
        <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
};

const ProgressBar = ({ current, total, colorClass = "bg-indigo-600" }) => {
    const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
    return (
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-500 ease-out ${colorClass}`} style={{ width: `${percentage}%` }} />
        </div>
    );
};

const Badge = ({ children, type }) => {
    const styles = {
        income: "bg-emerald-100 text-emerald-800",
        variable: "bg-orange-100 text-orange-800",
        fixed: "bg-blue-100 text-blue-800",
        debt: "bg-red-100 text-red-800"
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
            {children}
        </span>
    );
};

// --- PANTALLA DE BLOQUEO (MEJORADA CON TIEMPO DE ESPERA) ---
const LoginScreen = ({ onLogin }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [attempts, setAttempts] = useState(0); // Contador de intentos
    const [lockoutTime, setLockoutTime] = useState(null); // Fecha fin del bloqueo
    const [timeLeft, setTimeLeft] = useState(0); // Cuenta regresiva visual

    // 1. Al cargar, revisar si está bloqueado por un intento anterior
    useEffect(() => {
        const savedLock = localStorage.getItem('finance_app_lock_until');
        if (savedLock) {
            const unlockTime = parseInt(savedLock);
            if (unlockTime > Date.now()) {
                setLockoutTime(unlockTime); // Restaurar bloqueo
            } else {
                localStorage.removeItem('finance_app_lock_until'); // Ya pasó el tiempo
            }
        }
    }, []);

    // 2. Temporizador para la cuenta regresiva
    useEffect(() => {
        if (!lockoutTime) return;

        const interval = setInterval(() => {
            const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
            if (remaining <= 0) {
                // Desbloquear
                setLockoutTime(null);
                setAttempts(0);
                setTimeLeft(0);
                localStorage.removeItem('finance_app_lock_until');
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutTime]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (lockoutTime) return; // Si está bloqueado, no hacer nada

        if (pin === '2008') { 
            onLogin();
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setError(true);
            setPin('');

            // Si llega a 5 intentos fallidos
            if (newAttempts >= 5) {
                const lockDuration = 5 * 60 * 1000; // 5 minutos en milisegundos
                const unlockTime = Date.now() + lockDuration;
                setLockoutTime(unlockTime);
                localStorage.setItem('finance_app_lock_until', unlockTime.toString());
            }
        }
    };

    // Formatear segundos a MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center space-y-6 py-10 relative overflow-hidden">
                {lockoutTime && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 animate-in fade-in">
                        <div className="text-4xl mb-4">⏳</div>
                        <h3 className="text-xl font-bold text-red-600 mb-2">Sistema Bloqueado</h3>
                        <p className="text-slate-500 text-sm mb-4">Demasiados intentos fallidos.</p>
                        <div className="text-3xl font-mono font-bold text-slate-800">
                            {formatTime(timeLeft)}
                        </div>
                        <p className="text-xs text-slate-400 mt-4">Espera para intentar de nuevo</p>
                    </div>
                )}

                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-4xl">
                    🔒
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Acceso Restringido</h2>
                    <p className="text-slate-500 text-sm mt-2">Ingresa tu PIN de seguridad</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="password" 
                        inputMode="numeric" 
                        className="w-full text-center text-3xl tracking-[1em] font-bold p-3 border-b-2 border-gray-300 focus:border-indigo-600 outline-none bg-transparent transition-colors disabled:opacity-50"
                        placeholder="••••"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => { setPin(e.target.value); setError(false); }}
                        autoFocus
                        disabled={!!lockoutTime}
                    />
                    {error && !lockoutTime && (
                        <p className="text-red-500 text-sm font-medium animate-pulse">
                            PIN Incorrecto ({5 - attempts} intentos restantes)
                        </p>
                    )}
                    <Button type="submit" className="w-full" disabled={!!lockoutTime}>Entrar</Button>
                </form>
            </Card>
        </div>
    );
};

// --- APP PRINCIPAL ---

export default function App() {
    // Estado de Autenticación
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // Estados de Datos
    const [transactions, setTransactions] = useState([]);
    const [goals, setGoals] = useState([]);
    const [upcomingPayments, setUpcomingPayments] = useState([]); 
    const [internalDebt, setInternalDebt] = useState(0);

    const [newTransaction, setNewTransaction] = useState({ type: 'variable', amount: '', description: '' });
    const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', initialAmount: '' });
    const [newPayment, setNewPayment] = useState({ name: '', amount: '', date: '' }); 
    const [activeTab, setActiveTab] = useState('dashboard');

    // Verificar si ya inició sesión antes (localStorage)
    useEffect(() => {
        const loggedIn = localStorage.getItem('finance_app_auth');
        if (loggedIn === 'true') {
            setIsAuthenticated(true);
        }
        setLoadingAuth(false);
    }, []);

    const handleLogin = () => {
        localStorage.setItem('finance_app_auth', 'true');
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        if(confirm("¿Cerrar sesión?")) {
            localStorage.removeItem('finance_app_auth');
            setIsAuthenticated(false);
        }
    };

    // --- ESCUCHAR FIREBASE (Solo si está autenticado) ---
    useEffect(() => {
        if (!isAuthenticated) return;

        const q1 = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        const unsub1 = onSnapshot(q1, (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const q2 = query(collection(db, "goals"));
        const unsub2 = onSnapshot(q2, (snap) => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const q3 = query(collection(db, "upcoming_payments"), orderBy("date", "asc"));
        const unsub3 = onSnapshot(q3, (snap) => setUpcomingPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

        const docRef = doc(db, "financialData", "general");
        const unsub4 = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) setInternalDebt(docSnap.data().internalDebt || 0);
            else setDoc(docRef, { internalDebt: 0 });
        });

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, [isAuthenticated]);

    // Cálculos
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = transactions.filter(t => ['variable', 'fixed'].includes(t.type)).reduce((acc, curr) => acc + curr.amount, 0);
    const totalSavingsInGoals = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
    const currentBalance = totalIncome - totalExpenses - totalSavingsInGoals;
    const totalPendingPayments = upcomingPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // --- FUNCIONES CRUD ---
    const handleAddTransaction = async (e) => {
        e.preventDefault();
        if (!newTransaction.amount || !newTransaction.description) return;
        try {
            await addDoc(collection(db, "transactions"), {
                type: newTransaction.type,
                amount: parseFloat(newTransaction.amount),
                description: newTransaction.description,
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date()
            });
            setNewTransaction({ type: 'variable', amount: '', description: '' });
        } catch (error) { console.error("Error:", error); }
    };

    const handleAddUpcomingPayment = async (e) => {
        e.preventDefault();
        if (!newPayment.name || !newPayment.amount || !newPayment.date) { alert("Completa todos los campos"); return; }
        try {
            await addDoc(collection(db, "upcoming_payments"), {
                name: newPayment.name,
                amount: parseFloat(newPayment.amount),
                date: newPayment.date,
                createdAt: new Date()
            });
            setNewPayment({ name: '', amount: '', date: '' });
        } catch (error) { console.error("Error:", error); }
    };

    const handlePayUpcomingPayment = async (payment) => {
        if (!confirm(`¿Pagar ${payment.name}?`)) return;
        try {
            await addDoc(collection(db, "transactions"), {
                type: 'fixed', amount: payment.amount, description: payment.name, date: new Date().toISOString().split('T')[0], createdAt: new Date()
            });
            await deleteDoc(doc(db, "upcoming_payments", payment.id));
        } catch (error) { console.error("Error:", error); }
    };

    const handleDeleteUpcomingPayment = async (id) => { if (confirm("¿Eliminar?")) await deleteDoc(doc(db, "upcoming_payments", id)); };

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoal.name || !newGoal.targetAmount) return;
        const initial = parseFloat(newGoal.initialAmount) || 0;
        const bal = parseFloat(currentBalance.toFixed(2));
        if (initial > bal) { alert("Saldo insuficiente"); return; }
        try {
            await addDoc(collection(db, "goals"), { name: newGoal.name, targetAmount: parseFloat(newGoal.targetAmount), currentAmount: initial, createdAt: new Date() });
            setNewGoal({ name: '', targetAmount: '', initialAmount: '' });
        } catch (error) { console.error(error); }
    };

    const handleAddFundsToGoal = async (goalId, amount, currentAmount) => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        const bal = parseFloat(currentBalance.toFixed(2));
        if (val > bal) { alert(`Saldo insuficiente (Tienes $${bal})`); return; }
        try { await updateDoc(doc(db, "goals", goalId), { currentAmount: currentAmount + val }); } catch (error) { console.error(error); }
    };

    const handleAutoLoan = async (goalId, amount, currentGoalAmount) => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;
        if (val > currentGoalAmount) { alert("No puedes retirar más de lo que tienes."); return; }
        try {
            await updateDoc(doc(db, "goals", goalId), { currentAmount: currentGoalAmount - val });
            await updateDoc(doc(db, "financialData", "general"), { internalDebt: internalDebt + val });
        } catch (error) { console.error(error); }
    };

    const formatDateShort = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString + 'T00:00:00'); 
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    };

    const inputStyle = "w-full rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-gray-900";

    // --- RENDERIZADO CONDICIONAL ---
    if (loadingAuth) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Cargando...</div>;
    if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8 w-full">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                
                {/* Header con Logout */}
                <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                Finanzas Personales
                            </h1>
                            <p className="text-slate-500 mt-1 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                En línea
                            </p>
                        </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm text-slate-500">Saldo Disponible</p>
                            <p className={`text-3xl font-bold ${currentBalance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Salir">
                            <span className="text-xl">🚪</span>
                        </button>
                    </div>
                </header>

                {/* Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-l-4 border-l-indigo-500">
                        <h3 className="text-slate-500 font-medium text-sm">Ahorro (Metas)</h3>
                        <p className="text-xl font-bold text-indigo-700 mt-1">${totalSavingsInGoals.toLocaleString()}</p>
                    </Card>
                    <Card className="border-l-4 border-l-red-400">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-slate-500 font-medium text-sm">Deuda Interna</h3>
                                <p className="text-xl font-bold text-red-600 mt-1">${internalDebt.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                    <Card className="border-l-4 border-l-pink-500 bg-pink-50/30">
                        <h3 className="text-slate-500 font-medium text-sm">Por Pagar</h3>
                        <p className="text-xl font-bold text-pink-600 mt-1">${totalPendingPayments.toLocaleString()}</p>
                    </Card>
                    <Card className="border-l-4 border-l-orange-400">
                        <h3 className="text-slate-500 font-medium text-sm">Gastos Mes</h3>
                        <p className="text-xl font-bold text-orange-600 mt-1">${totalExpenses.toLocaleString()}</p>
                    </Card>
                </div>

                {/* Navegación */}
                <div className="flex gap-2 border-b border-gray-200 pb-1">
                    {['dashboard', 'transactions', 'goals'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === tab ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                    ))}
                </div>

                {/* PESTAÑA DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <section className="space-y-4">
                                <h2 className="text-xl font-bold text-slate-700">Registrar Movimiento</h2>
                                <Card>
                                    <form onSubmit={handleAddTransaction} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                                <select className={inputStyle} value={newTransaction.type} onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value })}>
                                                    <option value="income">Ingreso</option>
                                                    <option value="variable">Gasto Variable</option>
                                                    <option value="fixed">Gasto Fijo</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                                <input type="number" step="0.01" className={inputStyle} placeholder="0.00" value={newTransaction.amount} onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                            <input type="text" className={inputStyle} placeholder="Ej. Tacos, Renta..." value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} />
                                        </div>
                                        <Button type="submit" className="w-full">Registrar</Button>
                                    </form>
                                </Card>
                            </section>

                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-slate-700">⏳ Próximos Pagos</h2>
                                    <span className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-bold">${totalPendingPayments.toLocaleString()}</span>
                                </div>
                                <Card className="bg-slate-50 border-slate-200">
                                    <form onSubmit={handleAddUpcomingPayment} className="flex flex-col gap-2 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Concepto..." className="flex-1 text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none" value={newPayment.name} onChange={e => setNewPayment({...newPayment, name: e.target.value})} />
                                            <input type="number" step="0.01" placeholder="$" className="w-20 text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} />
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="date" className="flex-1 text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none text-gray-500" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} />
                                            <Button type="submit" variant="secondary" className="text-sm px-4">Agregar</Button>
                                        </div>
                                    </form>
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        {upcomingPayments.map(payment => (
                                            <div key={payment.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 group">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">{payment.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-pink-600 font-bold text-sm">${payment.amount.toLocaleString()}</p>
                                                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">📅 {formatDateShort(payment.date)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handlePayUpcomingPayment(payment)} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white p-2 rounded-lg transition-colors text-xs font-bold" title="Pagar">✅</button>
                                                    <button onClick={() => handleDeleteUpcomingPayment(payment.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors" title="Eliminar">🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </section>
                        </div>
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold text-slate-700">Historial Reciente</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {transactions.slice(0, 6).map(t => (
                                    <div key={t.id} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : t.type === 'fixed' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                            <div><p className="font-semibold text-gray-800">{t.description}</p><Badge type={t.type}>{t.type}</Badge></div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`block font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-600'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}</span>
                                            <span className="text-xs text-gray-400">{t.date}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
                {/* OTRAS PESTAÑAS (Transactions y Goals) */}
                {activeTab === 'transactions' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                             <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {transactions.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.description}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm"><Badge type={t.type}>{t.type}</Badge></td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-600'}`}>{t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'goals' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <Card className="sticky top-8">
                                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-800">Nueva Meta</h3><span className="text-2xl">🎯</span></div>
                                    <form onSubmit={handleAddGoal} className="space-y-5">
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" className={inputStyle} placeholder="Ej. Viaje" value={newGoal.name} onChange={e => setNewGoal({ ...newGoal, name: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo</label><input type="number" step="0.01" className={inputStyle} placeholder="0.00" value={newGoal.targetAmount} onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })} /></div>
                                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Inicial</label><input type="number" step="0.01" className={inputStyle} placeholder="0.00" value={newGoal.initialAmount} onChange={e => setNewGoal({ ...newGoal, initialAmount: e.target.value })} /></div>
                                        <Button type="submit" className="w-full mt-2">Crear Meta</Button>
                                    </form>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                {goals.map(goal => {
                                    const gap = goal.targetAmount - goal.currentAmount;
                                    return (
                                        <Card key={goal.id} className="relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <div><h3 className="text-xl font-bold text-slate-800">{goal.name}</h3><p className="text-sm text-slate-500">Meta: ${goal.targetAmount.toLocaleString()}</p></div>
                                                <div className="text-right"><p className="text-2xl font-bold text-indigo-600">${goal.currentAmount.toLocaleString()}</p><p className="text-xs text-orange-500 font-medium">Faltan ${gap.toLocaleString()}</p></div>
                                            </div>
                                            <ProgressBar current={goal.currentAmount} total={goal.targetAmount} />
                                            <div className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg mt-6">
                                                <div className="flex-1"><form onSubmit={(e) => { e.preventDefault(); handleAddFundsToGoal(goal.id, e.target.elements.deposit.value, goal.currentAmount); e.target.reset(); }} className="flex gap-2"><input name="deposit" type="number" step="0.01" placeholder="$ Ingresar" className="w-full text-sm border-gray-300 border rounded-lg px-3 py-2 outline-none" /><Button type="submit" variant="secondary" className="text-sm px-3 font-bold">+</Button></form></div>
                                                <div className="w-px h-8 bg-gray-300"></div>
                                                <div className="flex-1"><form onSubmit={(e) => { e.preventDefault(); handleAutoLoan(goal.id, e.target.elements.withdraw.value, goal.currentAmount); e.target.reset(); }} className="flex gap-2 justify-end"><input name="withdraw" type="number" step="0.01" placeholder="$ Retirar" className="w-full text-sm border-red-200 border rounded-lg px-3 py-2 outline-none text-red-700" /><Button type="submit" variant="danger" className="text-sm px-3 font-bold">-</Button></form></div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}