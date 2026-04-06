import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { isoNow } from '../lib/date';

export type DataType = 'transactions' | 'accounts' | 'budgets';
export type ExportFormat = '.csv' | '.xlsx' | '.txt';

export interface ParsedDataPayload {
    transactions: any[];
    accounts: any[];
    budgets: any[];
}

/**
 * Retorna las columnas por defecto (plantilla) para el tipo de dato especificado.
 */
const getTemplateData = (type: DataType | 'all') => {
    switch (type) {
        case 'transactions':
            return [{
                accountId: '',
                type: 'expense',
                amount: 0,
                currency: 'DOP',
                category: '',
                description: '',
                date: isoNow().split('T')[0],
                payDay: 0,
                isExecuted: false
            }];
        case 'accounts':
            return [{
                name: '',
                currency: 'DOP',
                salaryType: 'monthly',
                salary: 0,
                extras: 0,
                payDay: 0,
                isExecuted: false
            }];
        case 'budgets':
            return [{
                name: '',
                category: '',
                currency: 'DOP',
                amount: 0,
                period: 'monthly',
                startDate: isoNow().split('T')[0],
                payDay: 0,
                isExecuted: false
            }];
        case 'all':
            return [{
                data_type: 'I', // P = Gastos Fijos, I = Ingreso, V = Gastos Variables, A = Ahorros
                accountId: '',
                type: 'expense',
                amount: 0,
                currency: 'DOP',
                category: '',
                description: '',
                date: isoNow().split('T')[0],
                name: '',
                salaryType: 'monthly',
                salary: 0,
                extras: 0,
                period: 'monthly',
                startDate: isoNow().split('T')[0],
                payDay: 0,
                isExecuted: false
            }];
        default:
            return [];
    }
}

/**
 * Detecta automáticamente el tipo de dato analizando las columnas de la primera fila.
 */
const detectDataType = (firstRow: any): DataType | 'unknown' => {
    if (!firstRow) return 'unknown';
    const keys = Object.keys(firstRow).map(k => k.toLowerCase());
    
    if (keys.includes('accountid') || (keys.includes('date') && keys.includes('amount') && !keys.includes('period'))) return 'transactions';
    if (keys.includes('salarytype') || keys.includes('salary')) return 'accounts';
    if (keys.includes('period') || keys.includes('periodicity') || keys.includes('frecuencia') || keys.includes('startdate')) return 'budgets';
    
    return 'unknown';
};

/**
 * Descarga una plantilla unificada (Libro Maestro) u hojas individuales pobladas con datos reales.
 */
export const downloadFileData = (type: DataType | 'all', data: any[] | ParsedDataPayload = [], format: ExportFormat = '.csv') => {
    const prefix = Array.isArray(data) && data.length === 0 ? 'plantilla' : 'respaldo';
    const fileName = `${prefix}_${type}_${new Date().toISOString().split('T')[0]}${format}`;

    if (format === '.xlsx') {
        const workbook = XLSX.utils.book_new();
        
        if (type === 'all') {
            const payload = data as ParsedDataPayload;
            const types: DataType[] = ['transactions', 'accounts', 'budgets'];
            types.forEach(t => {
                const realItems = payload[t] || [];
                const exportItems = realItems.length > 0 ? realItems : getTemplateData(t);
                const worksheet = XLSX.utils.json_to_sheet(exportItems);
                XLSX.utils.book_append_sheet(workbook, worksheet, t);
            });
        } else {
            const exportData = Array.isArray(data) ? data : [];
            const finalData = exportData.length > 0 ? exportData : getTemplateData(type as DataType);
            const worksheet = XLSX.utils.json_to_sheet(finalData);
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        }

        // Generar el archivo binario y forzar descarga vía Blob para asegurar compatibilidad
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
    }

    let exportData: any[] = [];
    if (type === 'all' && !Array.isArray(data)) {
        const payload = data as ParsedDataPayload;
        exportData = [
            ...payload.accounts.map(i => ({ ...i, data_type: 'I' })),
            ...payload.budgets.map(i => ({ ...i, data_type: 'P' })),
            ...payload.transactions.filter(t => t.type !== 'savings').map(i => ({ ...i, data_type: 'V' })),
            ...payload.transactions.filter(t => t.type === 'savings').map(i => ({ ...i, data_type: 'A' }))
        ];
    } else {
        exportData = Array.isArray(data) ? data : [];
    }

    const templateType = type === 'all' ? 'all' : type as DataType;
    const finalData = exportData.length > 0 ? exportData : getTemplateData(templateType);
    const templateKeys = Object.keys(getTemplateData(templateType)[0]);

    const cleanedData = finalData.map(row => {
        const cleanRow: Record<string, any> = {};
        templateKeys.forEach(key => {
            cleanRow[key] = row[key] !== undefined && row[key] !== null ? row[key] : '';
        });
        return cleanRow;
    });

    if (format === '.txt' || format === '.csv') {
        const csvString = Papa.unparse(cleanedData, { delimiter: format === '.txt' ? '\t' : ',' });
        const blob = new Blob([csvString], { type: format === '.txt' ? 'text/plain;charset=utf-8;' : 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

/**
 * Parsea un archivo (.csv, .txt, .xlsx, .xls) subido por el usuario e identifica su contenido
 */
export const parseFileData = (file: File): Promise<ParsedDataPayload> => {
    return new Promise((resolve, reject) => {
        const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        const payload: ParsedDataPayload = {
            transactions: [],
            accounts: [],
            budgets: []
        };

        if (extension === '.xlsx' || extension === '.xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Normalizar propiedades y procesar todas las hojas
                    workbook.SheetNames.forEach(sheetName => {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
                        const validData = jsonData.filter(row => Object.values(row as object).some(val => val !== '' && val !== null));
                        
                        if (validData.length > 0) {
                            const normalizedData = validData.map(row => {
                                const normalized: any = { ...row };
                                // Mapear descripción a name
                                if (!normalized.name && normalized.description) normalized.name = normalized.description;
                                if (!normalized.name && normalized.concepto) normalized.name = normalized.concepto;
                                // Mapear periodicidad
                                if (!normalized.period && normalized.periodicity) normalized.period = normalized.periodicity;
                                if (!normalized.period && normalized.frecuencia) normalized.period = normalized.frecuencia;
                                // Mapear día de pago
                                if (!normalized.payDay && normalized.dia_de_pago) normalized.payDay = Number(normalized.dia_de_pago);
                                if (!normalized.payDay && normalized.vencimiento) normalized.payDay = Number(normalized.vencimiento);
                                // Mapear estado efectuado
                                if (normalized.isExecuted === undefined && normalized.efectuado !== undefined) normalized.isExecuted = normalized.efectuado;
                                if (normalized.isExecuted === undefined && normalized.pagado !== undefined) normalized.isExecuted = normalized.pagado;
                                if (normalized.isExecuted === undefined && normalized.hecho !== undefined) normalized.isExecuted = normalized.hecho;
                                return normalized;
                            });

                            let detectedType: DataType | 'unknown' = detectDataType(normalizedData[0]);
                            // Si el nombre de la hoja es explícito y no detectamos nada, usamos el nombre de la hoja
                            if (detectedType === 'unknown' && ['transactions', 'accounts', 'budgets'].includes(sheetName.toLowerCase())) {
                                detectedType = sheetName.toLowerCase() as DataType;
                            }

                            if (detectedType !== 'unknown') {
                                payload[detectedType] = [...payload[detectedType], ...normalizedData];
                            }
                        }
                    });
                    
                    resolve(payload);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        } 
        else if (extension === '.csv' || extension === '.txt') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
                complete: (results) => {
                    const validData = results.data as any[];
                    if (validData.length > 0) {
                        validData.forEach(row => {
                            if (row.data_type && ['I', 'P', 'V', 'A'].includes(row.data_type.toUpperCase())) {
                                const code = row.data_type.toUpperCase();
                                if (code === 'I') payload.accounts.push(row);
                                else if (code === 'P') payload.budgets.push(row);
                                else if (code === 'V') payload.transactions.push({...row, type: 'expense'});
                                else if (code === 'A') payload.transactions.push({...row, type: 'savings'});
                            } else {
                                const detectedType = detectDataType(row);
                                if (detectedType !== 'unknown') {
                                    payload[detectedType].push(row);
                                }
                            }
                        });
                    }
                    resolve(payload);
                },
                error: (error) => reject(error)
            });
        }
        else if (extension === '.json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);
                    resolve({
                        transactions: Array.isArray(data.transactions) ? data.transactions : [],
                        accounts: Array.isArray(data.accounts) ? data.accounts : [],
                        budgets: Array.isArray(data.budgets) ? data.budgets : []
                    });
                } catch (error) {
                    reject(new Error('Error al parsear el archivo JSON. Formato inválido.'));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        }
        else {
            reject(new Error(`Extensión de archivo no soportada: ${extension}`));
        }
    });
};
