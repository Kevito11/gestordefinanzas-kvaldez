// src/components/layout/Sidebar.tsx
export default function Sidebar() {
  return (
    <aside style={{ width: '200px', background: '#f5f5f5', padding: '1rem' }}>
      <ul>
        <li><a href="/">Inicio</a></li>
        <li><a href="/accounts">Ingresos</a></li>
        <li><a href="/transactions">Transacciones</a></li>
        <li><a href="/budgets">Presupuestos</a></li>
        <li><a href="/reports">Reportes</a></li>
      </ul>
    </aside>
  );
}
