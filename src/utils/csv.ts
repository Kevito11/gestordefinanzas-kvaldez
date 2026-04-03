import Papa from 'papaparse';
import { isoNow } from '../lib/date';

type DataType = 'transactions' | 'accounts' | 'budgets';

/**
 * Retorna las columnas por defecto (plantilla) para el tipo de dato especificado.
 */
const getTemplateData = (type: DataType) => {
    switch (type) {
        case 'transactions':
            return [{
                accountId: '',
                type: 'expense',
                amount: 0,
                currency: 'DOP',
                category: '',
                description: '',
                date: isoNow().split('T')[0] // solo la fecha por defecto
            }];
        case 'accounts':
            return [{
                name: '',
                currency: 'DOP',
                salaryType: 'monthly',
                salary: 0,
                extras: 0
            }];
        case 'budgets':
            return [{
                name: '',
                category: '',
                currency: 'DOP',
                amount: 0,
                period: 'monthly',
                startDate: isoNow().split('T')[0]
            }];
        default:
            return [];
    }
}

/**
 * Descarga una plantilla CSV (o datos reales) para el usuario
 */
export const downloadCsv = (type: DataType, data: any[] = []) => {
    // Si no hay datos, usamos la plantilla vacía
    const exportData = data.length > 0 ? data : getTemplateData(type);

    // Para evitar exportar campos irrelevantes de la BD (id, createdAt, updated_at, userId, etc)
    // Limpiamos los datos guiándonos por las llaves de la plantilla:
    const templateKeys = Object.keys(getTemplateData(type)[0]);

    const cleanedData = exportData.map(row => {
        const cleanRow: Record<string, any> = {};
        templateKeys.forEach(key => {
            cleanRow[key] = row[key] !== undefined ? row[key] : '';
        });
        return cleanRow;
    });

    const csv = Papa.unparse(cleanedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * Parsea un archivo CSV subido por el usuario
 */
export const parseCsv = <T = any>(file: File): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Convierte números automáticamente
            complete: (results) => {
                // Elimina filas completamente vacías o header solitario
                const data = results.data as T[];
                resolve(data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
