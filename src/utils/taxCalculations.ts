export interface DeductionResult {
    afp: number;
    sfs: number;
    isr: number;
    totalDeductions: number;
    netSalary: number;
}

// Tasas 2024-2025
const RATES = {
    AFP: 0.0287, // 2.87%
    SFS: 0.0304, // 3.04%
};

// Topes Salariales TSS (Efectivo Abril 2025)
// Salario Mínimo Nacional referencia: 21,674.80
const CAPS = {
    AFP: 433496.00, // 20 salarios mínimos
    SFS: 216748.00, // 10 salarios mínimos
};

// Escala Anual ISR (DGII 2025)
const ISR_SCALE = [
    { limit: 416220.00, rate: 0, base: 0 },
    { limit: 624329.00, rate: 0.15, base: 0, excessOf: 416220.01 },
    { limit: 867123.00, rate: 0.20, base: 31216.00, excessOf: 624329.01 },
    { limit: Infinity, rate: 0.25, base: 79776.00, excessOf: 867123.01 },
];

/**
 * Calcula las deducciones de ley basandose en el monto y periodicidad.
 * Proyecta los ingresos anualmente para determinar la tasa de ISR correcta,
 * y luego divide el impuesto anual entre el número de periodos.
 */
export const calculateSalaryDeductions = (amount: number, periodicity: string = 'mensual'): DeductionResult => {
    if (amount <= 0) return { afp: 0, sfs: 0, isr: 0, totalDeductions: 0, netSalary: 0 };

    // Normalizar a ingreso mensual para aplicar topes TSS (que son mensuales)
    // Asumimos que el usuario ingresa su sueldo por periodo. 
    // Para calcular TSS correctamente necesitamos el sueldo mensual proyectado.

    let projectedMonthlyIncome = 0;
    if (periodicity === 'mensual') projectedMonthlyIncome = amount;
    else if (periodicity === 'quincenal') projectedMonthlyIncome = amount * 2;
    else if (periodicity === 'semanal') projectedMonthlyIncome = amount * 52 / 12;
    else if (periodicity === 'anual') projectedMonthlyIncome = amount / 12;
    else projectedMonthlyIncome = amount; // Fallback

    // Aplicar Topes
    const applicableIncomeAFP = Math.min(projectedMonthlyIncome, CAPS.AFP);
    const applicableIncomeSFS = Math.min(projectedMonthlyIncome, CAPS.SFS);

    // Calcular TSS Mensual Estimado
    const monthlyAFP = applicableIncomeAFP * RATES.AFP;
    const monthlySFS = applicableIncomeSFS * RATES.SFS;

    // Convertir de vuelta al periodo (Deducción del periodo)
    // Ejemplo: Si gana 500,000 mensual. Tope AFP 433k. AFP Mensual = 433k * 2.87%.
    // Si pago es quincenal (250,000), la deduccion es la mitad del mensual.

    let periodAFP = 0;
    let periodSFS = 0;

    if (periodicity === 'mensual') {
        periodAFP = monthlyAFP;
        periodSFS = monthlySFS;
    } else if (periodicity === 'quincenal') {
        periodAFP = monthlyAFP / 2;
        periodSFS = monthlySFS / 2;
    } else if (periodicity === 'semanal') {
        periodAFP = monthlyAFP * 12 / 52;
        periodSFS = monthlySFS * 12 / 52;
    } else if (periodicity === 'anual') {
        periodAFP = monthlyAFP * 12;
        periodSFS = monthlySFS * 12;
    } else {
        // Default fallback (trimestral, etc - asumiendo base directa sin tope complejo o lineal)
        // Para simplificar en otros periodos raros usamos lineal con tope
        periodAFP = (Math.min(amount, CAPS.AFP) * RATES.AFP);
        periodSFS = (Math.min(amount, CAPS.SFS) * RATES.SFS);
    }

    // 1. Calculo TSS (AFP y SFS)
    const afp = periodAFP;
    const sfs = periodSFS;

    // 2. Base Imponible Anual Proyecto
    // Ingreso neto del periodo para ISR = Bruto - TSS
    const netTaxablePeriod = amount - afp - sfs;

    let periodsPerYear = 12;
    if (periodicity === 'quincenal') periodsPerYear = 24;
    if (periodicity === 'anual') periodsPerYear = 1;
    if (periodicity === 'semanal') periodsPerYear = 52;

    const annualIncome = netTaxablePeriod * periodsPerYear;

    // 3. Calculo ISR Anual
    let annualISR = 0;

    if (annualIncome <= ISR_SCALE[0].limit) {
        annualISR = 0;
    } else if (annualIncome <= ISR_SCALE[1].limit) {
        annualISR = (annualIncome - ISR_SCALE[1].excessOf!) * ISR_SCALE[1].rate;
    } else if (annualIncome <= ISR_SCALE[2].limit) {
        annualISR = ISR_SCALE[2].base + (annualIncome - ISR_SCALE[2].excessOf!) * ISR_SCALE[2].rate;
    } else {
        annualISR = ISR_SCALE[3].base + (annualIncome - ISR_SCALE[3].excessOf!) * ISR_SCALE[3].rate;
    }

    // 4. ISR del Periodo
    const periodISR = annualISR / periodsPerYear;

    const totalDeductions = afp + sfs + periodISR;
    const netSalary = amount - totalDeductions;

    return {
        afp,
        sfs,
        isr: periodISR, // Return period specific ISR
        totalDeductions,
        netSalary
    };
};
