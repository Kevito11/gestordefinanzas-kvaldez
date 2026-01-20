# Gestión Financiera Personal

Una aplicación web moderna para el control de finanzas personales, construida con React, TypeScript y Vite.

## Características

- **Gestión de Cuentas**: Administra tus fuentes de ingresos
- **Control de Transacciones**: Registra ingresos y gastos fácilmente
- **Gastos Fijos**: Gestiona tus gastos recurrentes (semanal, quincenal, mensual, anual)
- **Dashboard Interactivo**: Visualiza tu información financiera en tiempo real

## Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Node.js, Express
- **Base de Datos**: JSON files (para desarrollo)
- **Estilos**: CSS Modules
- **Estado**: React Context + Hooks

## Instalación y Uso

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. En otra terminal, inicia la API:
   ```bash
   npm run api
   ```

La aplicación estará disponible en `http://localhost:5175`

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run api` - Inicia el servidor de la API
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción

## Estructura del Proyecto

```
src/
├── app/              # Configuración de la aplicación
├── components/       # Componentes reutilizables
├── contexts/         # Contextos de React
├── features/         # Funcionalidades principales
│   ├── accounts/     # Gestión de cuentas
│   ├── budgets/      # Gastos fijos
│   └── transactions/ # Transacciones
├── lib/              # Utilidades
├── pages/            # Páginas de la aplicación
└── types/            # Definiciones de tipos
```
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
