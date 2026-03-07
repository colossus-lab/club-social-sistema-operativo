import { create } from 'zustand';

// Simulated database
const initialSocios = [
  { id: '1001', nombre: 'Carlos Gardel', dni: '12345678', categoria: 'Vitalicio', estado: 'Al día', cuota: 0, avatar: 'CG', telefono: '1122334455' },
  { id: '1002', nombre: 'Lionel Messi', dni: '33445566', categoria: 'Activo', estado: 'Al día', cuota: 5000, avatar: 'LM', telefono: '1133445566' },
  { id: '1003', nombre: 'Diego Maradona', dni: '14222333', categoria: 'Activo', estado: 'Moroso', cuota: 5000, avatar: 'DM', telefono: '1144556677' },
  { id: '1004', nombre: 'Juan Riquelme', dni: '45678901', categoria: 'Cadete', estado: 'Moroso', cuota: 3000, avatar: 'JR', telefono: '1155667788' },
  { id: '1005', nombre: 'Martin Palermo', dni: '56789012', categoria: 'Vitalicio', estado: 'Al día', cuota: 0, avatar: 'MP', telefono: '1166778899' },
  { id: '1006', nombre: 'Carlos Tevez', dni: '67890123', categoria: 'Becado', estado: 'Al día', cuota: 0, avatar: 'CT', telefono: '1177889900' },
];

const initialTransactions = [
  { id: 'T001', socio: 'Lionel Messi', fecha: '2026-03-01', monto: 5000, concepto: 'Cuota Marzo' },
  { id: 'T002', socio: 'Juan Riquelme', fecha: '2026-03-02', monto: 5000, concepto: 'Cuota Marzo' },
  { id: 'T003', socio: 'Emanuel Ginóbili', fecha: '2026-03-05', monto: 3000, concepto: 'Cuota Marzo' },
];

const historicalRevenue = [
  { month: 'Oct', revenue: 6200000, expenses: 4800000 },
  { month: 'Nov', revenue: 6500000, expenses: 5100000 },
  { month: 'Dic', revenue: 7800000, expenses: 6200000 },
  { month: 'Ene', revenue: 6900000, expenses: 4900000 },
  { month: 'Feb', revenue: 7100000, expenses: 5300000 },
  { month: 'Mar', revenue: 7250000, expenses: 5000000 },
];

const memberGrowth = [
  { month: 'Oct', vitalicios: 200, activos: 850, cadetes: 150 },
  { month: 'Nov', vitalicios: 205, activos: 880, cadetes: 160 },
  { month: 'Dic', vitalicios: 210, activos: 920, cadetes: 180 },
  { month: 'Ene', vitalicios: 210, activos: 900, cadetes: 175 },
  { month: 'Feb', vitalicios: 215, activos: 940, cadetes: 190 },
  { month: 'Mar', vitalicios: 220, activos: 980, cadetes: 250 },
];

const accessTrends = [
  { time: '08:00', accesses: 45 },
  { time: '10:00', accesses: 120 },
  { time: '12:00', accesses: 85 },
  { time: '14:00', accesses: 60 },
  { time: '16:00', accesses: 150 },
  { time: '18:00', accesses: 320 },
  { time: '20:00', accesses: 210 },
  { time: '22:00', accesses: 40 },
];
const initialDisciplinas = [
  { id: 'D001', nombre: 'Fútbol Infantil', profesor: 'Mario Kempes', horario: 'Lun/Mie 18:00', cupoMaximo: 20, inscriptos: ['1001', '1002'] },
  { id: 'D002', nombre: 'Patín Artístico', profesor: 'Luciana Aymar', horario: 'Mar/Jue 17:30', cupoMaximo: 15, inscriptos: ['1005'] },
  { id: 'D003', nombre: 'Básquet Primera', profesor: 'Manu Ginóbili', horario: 'Lun/Mie/Vie 20:00', cupoMaximo: 25, inscriptos: ['1003', '1004'] },
  { id: 'D004', nombre: 'Taekwondo', profesor: 'Seb. Crismanich', horario: 'Mar/Jue 19:00', cupoMaximo: 15, inscriptos: [] },
];

const initialRecursos = [
  { id: 'REC01', nombre: 'Cancha Papi Fútbol (Sintético)', tipo: 'Deportivo', precioHora: 15000 },
  { id: 'REC02', nombre: 'Quincho Principal', tipo: 'Eventos', precioHora: 25000 },
];

const initialReservas = [
  { id: 'RES001', recursoId: 'REC01', reservadoPor: 'Carlos Gardel (Socio)', fecha: new Date().toISOString().split('T')[0], hora: '20:00', estado: 'Confirmada', señaPagada: 15000 },
  { id: 'RES002', recursoId: 'REC02', reservadoPor: 'Juan Perez (Externo)', fecha: new Date(Date.now() + 86400000).toISOString().split('T')[0], hora: '21:00', estado: 'Pendiente Seña', señaPagada: 0 },
];

export const useClubStore = create((set) => ({
  theme: 'dark-theme', // Default theme
  socios: initialSocios,
  disciplinas: initialDisciplinas,
  recursos: initialRecursos,
  reservas: initialReservas,
  transactions: initialTransactions,
  historicalRevenue,
  memberGrowth,
  accessTrends,
  clubInfo: {
    name: 'Club Social OS',
    location: 'Argentina',
    foundation: '',
    activeMembers: 1450,
    monthlyRevenue: 7250000,
    pendingDues: 850000
  },
  isOnboarded: false,

  // Actions
  registerClub: (data) => set((state) => ({
    isOnboarded: true,
    clubInfo: {
      ...state.clubInfo,
      name: data.name,
      location: data.location,
      foundation: data.foundation
    }
  })),
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    document.body.className = newTheme;
    return { theme: newTheme };
  }),
  payDue: (socioId) => set((state) => {
    const socioIndex = state.socios.findIndex(s => s.id === socioId);
    if (socioIndex === -1) return state;

    const socio = state.socios[socioIndex];
    if (socio.estado === 'Al día') return state; // Already paid

    const updatedSocios = [...state.socios];
    updatedSocios[socioIndex] = { ...socio, estado: 'Al día' };

    const newTransaction = {
      id: `T${Date.now()}`,
      socio: socio.nombre,
      fecha: new Date().toISOString().split('T')[0],
      monto: socio.cuota,
      concepto: 'Pago Atrasado Cuota'
    };

    return {
      socios: updatedSocios,
      transactions: [newTransaction, ...state.transactions],
      clubInfo: {
        ...state.clubInfo,
        monthlyRevenue: state.clubInfo.monthlyRevenue + socio.cuota,
        pendingDues: state.clubInfo.pendingDues - socio.cuota
      }
    };
  }),

  addSocio: (socioData) => set((state) => {
    const newSocio = {
      ...socioData,
      id: `${1000 + state.socios.length + 1}`,
      estado: 'Al día',
      avatar: socioData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };

    return {
      socios: [newSocio, ...state.socios],
      clubInfo: {
        ...state.clubInfo,
        activeMembers: state.clubInfo.activeMembers + 1
      }
    };
  }),

  updateCategoriaSocio: (id, nuevaCategoria) => set((state) => ({
    socios: state.socios.map(s =>
      s.id === id
        ? { ...s, categoria: nuevaCategoria, cuota: (nuevaCategoria === 'Becado' || nuevaCategoria === 'Vitalicio') ? 0 : 5000 }
        : s
    )
  })),

  inscribirSocioADisciplina: (socioId, disciplinaId) => set((state) => {
    const disciplinasActualizadas = state.disciplinas.map(d => {
      if (d.id === disciplinaId && !d.inscriptos.includes(socioId)) {
        if (d.inscriptos.length >= d.cupoMaximo) return d; // Cupo lleno
        return { ...d, inscriptos: [...d.inscriptos, socioId] };
      }
      return d;
    });
    return { disciplinas: disciplinasActualizadas };
  }),

  registrarReserva: (reservaData) => set((state) => {
    const newReserva = {
      ...reservaData,
      id: `RES00${state.reservas.length + 1}`,
      estado: reservaData.señaPagada > 0 ? 'Confirmada' : 'Pendiente Seña'
    };
    return { reservas: [newReserva, ...state.reservas] };
  }),

  pagarSena: (reservaId, monto) => set((state) => {
    let transaction = null;
    const reservasActualizadas = state.reservas.map(r => {
      if (r.id === reservaId) {
        transaction = {
          id: `TX00${state.transactions.length + 1}`,
          date: new Date().toISOString().split('T')[0],
          amount: monto,
          type: 'ingreso',
          description: `Pago Adelanto/Seña - Reserva ${r.id} (${r.recursoId})`
        };
        return { ...r, señaPagada: r.señaPagada + monto, estado: 'Confirmada' };
      }
      return r;
    });

    return {
      reservas: reservasActualizadas,
      transactions: transaction ? [transaction, ...state.transactions] : state.transactions
    };
  }),

  registrarIngresoEvento: (eventoData) => set((state) => {
    const newTransaction = {
      id: `TX00${state.transactions.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      amount: eventoData.monto,
      type: 'ingreso',
      description: `Ingreso Extra: ${eventoData.nombre} ${eventoData.descripcion ? ' - ' + eventoData.descripcion : ''}`
    };

    return {
      transactions: [newTransaction, ...state.transactions],
      clubInfo: {
        ...state.clubInfo,
        monthlyRevenue: state.clubInfo.monthlyRevenue + eventoData.monto
      }
    };
  })
}));
