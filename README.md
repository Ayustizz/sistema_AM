# BizAdmin — Sistema Profesional de Administración de Negocio

Sistema web completo de administración de negocio e inventario, diseñado para negocios de tecnología y reventa de electrónicos, pero totalmente adaptable a cualquier tipo de producto.

![BizAdmin Dashboard](https://placehold.co/1200x600/3b82f6/white?text=BizAdmin+Dashboard)

## Características Principales

### Dashboard Inteligente
- Resumen visual de ventas del día, semana y mes
- Ganancias netas en tiempo real
- Alertas de stock bajo
- Cotización actual del dólar
- Gráficos de ventas y tendencias
- Top productos más vendidos
- Últimas transacciones

### Sistema de Productos
- SKU generado automáticamente
- Costos en USD y ARS con conversión automática
- Precio de venta, costo y margen de ganancia
- Control de stock con alertas personalizables
- Soporte para variantes (modelo, capacidad, color, IMEI, etc.)
- Categorías y marcas personalizables
- Filtros avanzados y búsqueda instantánea

### Conversión de Moneda
- Cotización USD/ARS configurable
- Historial completo de cotizaciones
- Conversor en tiempo real
- Recálculo automático de costos al actualizar la cotización

### Sistema de Ventas
- Flujo de venta en 2 pasos (productos → pago)
- Búsqueda instantánea de productos
- Múltiples métodos de pago:
  - Efectivo
  - Transferencia bancaria
  - Tarjeta débito/crédito
  - Mercado Pago
  - Cuotas con interés configurable
- Descuentos por venta
- Clientes frecuentes con historial
- Número de venta automático

### Simulador y Control de Cuotas
- Simulador interactivo (1, 3, 6, 12, 18, 24 cuotas)
- Tasas de interés personalizables
- Cálculo de costo financiero
- Seguimiento de cuotas por venta

### Inventario y Movimientos
- Registro de entradas, salidas y ajustes de stock
- Historial completo de movimientos (Kardex)
- Referencia y motivo por movimiento
- Vinculado automáticamente a ventas

### Gestión de Clientes
- Base de datos completa de clientes
- Historial de compras
- Control de deudas
- Datos de contacto y notas internas

### Gestión de Proveedores
- Directorio de proveedores
- Información de contacto
- Historial de compras
- Productos asociados

### Finanzas
- Registro de gastos por categoría
- Gráfico de distribución de gastos
- Balance mensual de ingresos vs egresos
- Categorías: Alquiler, Sueldos, Servicios, Marketing, Logística, etc.

### Reportes
- Ventas por período
- Productos más vendidos
- Reporte de stock
- Filtros por fecha

### Configuración
- Gestión de usuarios y roles (Admin / Empleado)
- Categorías de productos
- Marcas
- Seguridad basada en JWT

## Stack Tecnológico

| Tecnología | Descripción |
|-----------|-------------|
| Next.js 16 | Framework React con App Router |
| TypeScript | Tipado estático |
| Prisma 7 | ORM para PostgreSQL |
| PostgreSQL | Base de datos relacional |
| TailwindCSS 4 | Estilos utilitarios |
| Radix UI | Componentes accesibles |
| Recharts | Gráficos y visualizaciones |
| JWT | Autenticación segura |
| bcryptjs | Hash de contraseñas |
| Zod | Validación de esquemas |

## Estructura del Proyecto

```
bizadmin/
├── prisma/
│   ├── schema.prisma       # Modelos de base de datos
│   ├── migrations/         # Migraciones SQL
│   └── seed.ts             # Datos de ejemplo
├── src/
│   ├── app/
│   │   ├── api/            # API Routes (Next.js)
│   │   │   ├── auth/       # Login, logout, me
│   │   │   ├── products/   # CRUD productos
│   │   │   ├── sales/      # CRUD ventas
│   │   │   ├── customers/  # CRUD clientes
│   │   │   ├── suppliers/  # CRUD proveedores
│   │   │   ├── inventory/  # Movimientos de stock
│   │   │   ├── finances/   # Gastos
│   │   │   ├── currency/   # Cotización USD/ARS
│   │   │   ├── dashboard/  # Stats del dashboard
│   │   │   └── reports/    # Reportes
│   │   ├── dashboard/      # Página principal
│   │   ├── products/       # Gestión de productos
│   │   ├── sales/          # Gestión de ventas
│   │   ├── inventory/      # Control de stock
│   │   ├── customers/      # Clientes
│   │   ├── suppliers/      # Proveedores
│   │   ├── finances/       # Finanzas
│   │   ├── reports/        # Reportes
│   │   ├── currency/       # Cotización dólar
│   │   ├── installments/   # Simulador de cuotas
│   │   ├── settings/       # Configuración
│   │   └── login/          # Autenticación
│   ├── components/
│   │   ├── ui/             # Componentes base (Button, Input, etc.)
│   │   ├── layout/         # Sidebar, Topbar, AppLayout
│   │   ├── products/       # ProductFormModal
│   │   └── sales/          # NewSaleModal
│   ├── hooks/
│   │   ├── use-auth.ts     # Autenticación
│   │   ├── use-api.ts      # Cliente HTTP
│   │   ├── use-theme.ts    # Dark mode
│   │   └── use-toast.ts    # Notificaciones
│   ├── lib/
│   │   ├── prisma.ts       # Cliente Prisma
│   │   ├── auth.ts         # Funciones JWT
│   │   └── utils.ts        # Utilidades
│   └── types/
│       └── index.ts        # Tipos TypeScript
├── .env.example            # Variables de entorno (ejemplo)
├── next.config.ts          # Configuración Next.js
├── prisma.config.ts        # Configuración Prisma
└── package.json
```

## Instalación y Configuración

### Requisitos Previos
- Node.js 20+
- PostgreSQL 14+
- npm o pnpm

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd bizadmin
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/bizadmin"
NEXTAUTH_SECRET="clave-secreta-muy-larga-y-segura"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Crear la base de datos

```bash
# En PostgreSQL
createdb bizadmin
# O con psql:
psql -U postgres -c "CREATE DATABASE bizadmin;"
```

### 5. Ejecutar migraciones

```bash
npm run db:migrate
```

### 6. Cargar datos de ejemplo

```bash
npm run db:seed
```

### 7. Iniciar el servidor

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Credenciales por defecto

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@bizadmin.com | admin123 |
| Empleado | empleado@bizadmin.com | empleado123 |

---

## Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build para producción
npm run start        # Servidor de producción

npm run db:migrate   # Ejecutar migraciones
npm run db:push      # Push del schema sin migración
npm run db:seed      # Cargar datos de ejemplo
npm run db:studio    # Abrir Prisma Studio
npm run db:reset     # Resetear BD y re-seedear
npm run db:generate  # Regenerar cliente Prisma
```

## Funcionalidades de Negocio Electrónico

El sistema está optimizado para negocios de electrónica con:

### Productos con Variantes
Ejemplo para iPhone:
- Modelo (iPhone 15 Pro, 14, etc.)
- Capacidad (128GB, 256GB, 512GB)
- Color
- Porcentaje de batería
- Estado físico (Nuevo, Excelente, Bueno)
- IMEI
- Número de serie

### Importación y Costos en USD
- Todos los costos se registran en dólares
- Conversión automática al actualizar la cotización
- Historial de cotizaciones para auditoría
- Cálculo automático de rentabilidad en ambas monedas

### Ventas con Cuotas
- Cuotas con interés configurable
- Diferenciación entre contado y financiado
- Cálculo transparente del costo financiero

## API Reference

### Autenticación

```http
POST /api/auth/login
Content-Type: application/json

{ "email": "admin@bizadmin.com", "password": "admin123" }
```

Todas las demás rutas requieren el header:
```http
Authorization: Bearer <token>
```

### Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/dashboard | Stats del dashboard |
| GET/POST | /api/products | Listar/crear productos |
| GET/PUT/DELETE | /api/products/:id | Obtener/editar/eliminar producto |
| GET/POST | /api/sales | Listar/crear ventas |
| GET/POST | /api/customers | Listar/crear clientes |
| GET/POST | /api/suppliers | Listar/crear proveedores |
| GET/POST | /api/inventory | Movimientos de stock |
| GET/POST | /api/finances | Gastos |
| GET/POST | /api/currency | Cotización USD/ARS |
| GET | /api/reports | Reportes (tipo: sales, products, stock, expenses) |

## Dark Mode

El sistema soporta modo oscuro. Se puede activar desde el ícono de luna en la barra superior. La preferencia se guarda en localStorage.

## Producción

Para desplegar en producción:

1. Configurar las variables de entorno en el servidor
2. Ejecutar `npm run build`
3. Ejecutar `npm run start`

Se recomienda usar:
- **Vercel** o **Railway** para el hosting
- **Supabase** o **Neon** para PostgreSQL en la nube
- **Docker** para containerización (ver `docker-compose.yml`)

## Licencia

MIT — Libre para uso comercial y personal.

---

Desarrollado con Next.js, Prisma, PostgreSQL y TailwindCSS.
