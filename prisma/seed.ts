import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || "postgresql://bizadmin:bizadmin123@localhost:5432/bizadmin",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bizadmin.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@bizadmin.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Employee user
  const empPassword = await bcrypt.hash("empleado123", 12);
  await prisma.user.upsert({
    where: { email: "empleado@bizadmin.com" },
    update: {},
    create: {
      name: "María González",
      email: "empleado@bizadmin.com",
      password: empPassword,
      role: "EMPLOYEE",
    },
  });

  // Exchange rate
  const existingRate = await prisma.exchangeRate.findFirst();
  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: { usdToArs: 1050, note: "Cotización inicial", setBy: "Sistema" },
    });
  }
  console.log("✅ Exchange rate set: $1050 ARS/USD");

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: "Smartphones" }, update: {}, create: { name: "Smartphones", description: "Teléfonos inteligentes", color: "#3b82f6" } }),
    prisma.category.upsert({ where: { name: "Consolas" }, update: {}, create: { name: "Consolas", description: "Consolas de videojuegos", color: "#8b5cf6" } }),
    prisma.category.upsert({ where: { name: "Accesorios" }, update: {}, create: { name: "Accesorios", description: "Accesorios electrónicos", color: "#10b981" } }),
    prisma.category.upsert({ where: { name: "Audio" }, update: {}, create: { name: "Audio", description: "Auriculares y parlantes", color: "#f59e0b" } }),
    prisma.category.upsert({ where: { name: "Smartwatches" }, update: {}, create: { name: "Smartwatches", description: "Relojes inteligentes", color: "#ef4444" } }),
    prisma.category.upsert({ where: { name: "Tablets" }, update: {}, create: { name: "Tablets", description: "Tablets y iPads", color: "#06b6d4" } }),
  ]);
  console.log("✅ Categories created");

  // Brands
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: "Apple" }, update: {}, create: { name: "Apple", description: "Marca premium de tecnología" } }),
    prisma.brand.upsert({ where: { name: "Samsung" }, update: {}, create: { name: "Samsung", description: "Electrónica coreana" } }),
    prisma.brand.upsert({ where: { name: "Sony" }, update: {}, create: { name: "Sony", description: "Electrónica japonesa" } }),
    prisma.brand.upsert({ where: { name: "JBL" }, update: {}, create: { name: "JBL", description: "Audio de calidad" } }),
    prisma.brand.upsert({ where: { name: "AirPods" }, update: {}, create: { name: "AirPods", description: "Auriculares Apple" } }),
    prisma.brand.upsert({ where: { name: "Xiaomi" }, update: {}, create: { name: "Xiaomi", description: "Electrónica china" } }),
  ]);
  console.log("✅ Brands created");

  // Suppliers
  const supplierCount = await prisma.supplier.count();
  let supplier1: { id: string }, supplier2: { id: string };
  if (supplierCount === 0) {
    supplier1 = await prisma.supplier.create({
      data: {
        name: "TechImport Argentina",
        contact: "Carlos Rodríguez",
        email: "carlos@techimport.com.ar",
        phone: "+54 11 4567-8901",
        address: "Av. Corrientes 1234, CABA",
        notes: "Importador oficial Apple. Pago a 30 días.",
      },
    });
    supplier2 = await prisma.supplier.create({
      data: {
        name: "ElectroMayorista",
        contact: "Laura Fernández",
        email: "laura@electromayorista.com",
        phone: "+54 11 3456-7890",
        notes: "Mayorista de electrónica general. Envío en 48hs.",
      },
    });
    console.log("✅ Suppliers created");
  } else {
    const suppliers = await prisma.supplier.findMany({ take: 2 });
    supplier1 = suppliers[0];
    supplier2 = suppliers[1] || suppliers[0];
    console.log("ℹ️ Suppliers already exist, skipping");
  }

  // Products
  const productCount = await prisma.product.count();
  let products: { id: string }[] = [];
  if (productCount === 0) {
    products = await Promise.all([
      prisma.product.create({
        data: {
          sku: "IPH00001",
          name: "iPhone 15 Pro 128GB",
          description: "iPhone 15 Pro con chip A17 Pro, 128GB de almacenamiento. Importado USA.",
          categoryId: categories[0].id,
          brandId: brands[0].id,
          supplierId: supplier1.id,
          costUsd: 700,
          costArs: 735000,
          priceArs: 1050000,
          profitMargin: 42.86,
          stock: 5,
          minStock: 2,
        },
      }),
      prisma.product.create({
        data: {
          sku: "IPH00002",
          name: "iPhone 14 128GB",
          description: "iPhone 14 con chip A15 Bionic, 128GB.",
          categoryId: categories[0].id,
          brandId: brands[0].id,
          supplierId: supplier1.id,
          costUsd: 550,
          costArs: 577500,
          priceArs: 780000,
          profitMargin: 35.06,
          stock: 8,
          minStock: 3,
        },
      }),
      prisma.product.create({
        data: {
          sku: "PS500001",
          name: "PlayStation 5 Standard",
          description: "PS5 con lector de disco. Versión estándar.",
          categoryId: categories[1].id,
          brandId: brands[2].id,
          supplierId: supplier2.id,
          costUsd: 380,
          costArs: 399000,
          priceArs: 580000,
          profitMargin: 45.36,
          stock: 3,
          minStock: 1,
        },
      }),
      prisma.product.create({
        data: {
          sku: "ARP00001",
          name: "AirPods Pro 2da Gen",
          description: "AirPods Pro con cancelación activa de ruido. Incluye estuche MagSafe.",
          categoryId: categories[3].id,
          brandId: brands[0].id,
          supplierId: supplier1.id,
          costUsd: 180,
          costArs: 189000,
          priceArs: 280000,
          profitMargin: 48.15,
          stock: 12,
          minStock: 3,
        },
      }),
      prisma.product.create({
        data: {
          sku: "APW00001",
          name: "Apple Watch Series 9 GPS 45mm",
          description: "Apple Watch Series 9 con GPS, caja 45mm.",
          categoryId: categories[4].id,
          brandId: brands[0].id,
          supplierId: supplier1.id,
          costUsd: 290,
          costArs: 304500,
          priceArs: 450000,
          profitMargin: 47.8,
          stock: 6,
          minStock: 2,
        },
      }),
      prisma.product.create({
        data: {
          sku: "JBL00001",
          name: "JBL Flip 6 Parlante Bluetooth",
          description: "Parlante portátil resistente al agua, 12h de batería.",
          categoryId: categories[3].id,
          brandId: brands[3].id,
          supplierId: supplier2.id,
          costUsd: 80,
          costArs: 84000,
          priceArs: 130000,
          profitMargin: 54.76,
          stock: 15,
          minStock: 5,
        },
      }),
      prisma.product.create({
        data: {
          sku: "SAM00001",
          name: "Samsung Galaxy S24 256GB",
          description: "Samsung Galaxy S24 con Snapdragon 8 Gen 3.",
          categoryId: categories[0].id,
          brandId: brands[1].id,
          supplierId: supplier2.id,
          costUsd: 620,
          costArs: 651000,
          priceArs: 920000,
          profitMargin: 41.32,
          stock: 4,
          minStock: 2,
        },
      }),
      prisma.product.create({
        data: {
          sku: "CAR00001",
          name: "Cargador USB-C 20W Apple",
          description: "Cargador original Apple 20W USB-C.",
          categoryId: categories[2].id,
          brandId: brands[0].id,
          supplierId: supplier1.id,
          costUsd: 15,
          costArs: 15750,
          priceArs: 25000,
          profitMargin: 58.73,
          stock: 30,
          minStock: 10,
        },
      }),
    ]);
    console.log(`✅ ${products.length} Products created`);
  } else {
    products = await prisma.product.findMany({ select: { id: true }, take: 8 });
    console.log(`ℹ️ Products already exist`);
  }

  // Customers
  const customerCount = await prisma.customer.count();
  let customers: { id: string }[] = [];
  if (customerCount === 0) {
    customers = await Promise.all([
      prisma.customer.create({ data: { name: "Agustín Martínez", email: "agustin.m@gmail.com", phone: "+54 11 5555-1234", dni: "35.678.901", city: "Buenos Aires" } }),
      prisma.customer.create({ data: { name: "Valentina López", email: "vale.lopez@outlook.com", phone: "+54 11 5555-5678", city: "Rosario" } }),
      prisma.customer.create({ data: { name: "Nicolás Pérez", phone: "+54 11 5555-9012", city: "Córdoba", notes: "Cliente frecuente. Siempre paga en efectivo." } }),
      prisma.customer.create({ data: { name: "Sofía Ramírez", email: "sofia.r@gmail.com", phone: "+54 11 5555-3456", city: "Buenos Aires" } }),
    ]);
    console.log(`✅ ${customers.length} Customers created`);
  } else {
    customers = await prisma.customer.findMany({ select: { id: true }, take: 4 });
    console.log(`ℹ️ Customers already exist`);
  }

  // Sample Sales
  const saleCount = await prisma.sale.count();
  if (saleCount === 0 && products.length >= 5 && customers.length >= 3) {
    await prisma.sale.create({
      data: {
        saleNumber: "VTA-000001",
        customerId: customers[0].id,
        userId: admin.id,
        subtotal: 1050000,
        discount: 0,
        total: 1050000,
        totalCost: 735000,
        profit: 315000,
        status: "COMPLETED",
        items: { create: [{ productId: products[0].id, description: "iPhone 15 Pro 128GB", quantity: 1, unitPrice: 1050000, unitCost: 735000, discount: 0, total: 1050000 }] },
        payments: { create: [{ method: "TRANSFER", amount: 1050000 }] },
      },
    });

    await prisma.sale.create({
      data: {
        saleNumber: "VTA-000002",
        customerId: customers[1].id,
        userId: admin.id,
        subtotal: 580000,
        discount: 30000,
        total: 550000,
        totalCost: 399000,
        profit: 151000,
        status: "COMPLETED",
        items: { create: [{ productId: products[2].id, description: "PlayStation 5 Standard", quantity: 1, unitPrice: 580000, unitCost: 399000, discount: 30000, total: 550000 }] },
        payments: { create: [{ method: "CASH", amount: 300000 }, { method: "MERCADO_PAGO", amount: 250000 }] },
      },
    });

    await prisma.sale.create({
      data: {
        saleNumber: "VTA-000003",
        customerId: customers[2].id,
        userId: admin.id,
        subtotal: 730000,
        discount: 0,
        total: 730000,
        totalCost: 493500,
        profit: 236500,
        status: "COMPLETED",
        items: {
          create: [
            { productId: products[3].id, description: "AirPods Pro 2da Gen", quantity: 1, unitPrice: 280000, unitCost: 189000, discount: 0, total: 280000 },
            { productId: products[4].id, description: "Apple Watch Series 9 GPS 45mm", quantity: 1, unitPrice: 450000, unitCost: 304500, discount: 0, total: 450000 },
          ],
        },
        payments: { create: [{ method: "CARD_CREDIT", amount: 730000, installments: 6 }] },
      },
    });

    await prisma.customer.update({ where: { id: customers[0].id }, data: { totalSpent: 1050000 } });
    await prisma.customer.update({ where: { id: customers[1].id }, data: { totalSpent: 550000 } });
    await prisma.customer.update({ where: { id: customers[2].id }, data: { totalSpent: 730000 } });
    console.log("✅ Sample sales created");
  }

  // Sample expenses
  const expenseCount = await prisma.expense.count();
  if (expenseCount === 0) {
    await prisma.expense.createMany({
      data: [
        { category: "RENT", description: "Alquiler local comercial", amount: 180000, userId: admin.id },
        { category: "SALARY", description: "Sueldo empleada", amount: 250000, userId: admin.id },
        { category: "UTILITIES", description: "Luz y gas", amount: 35000, userId: admin.id },
        { category: "LOGISTICS", description: "Envíos y fletes", amount: 22000, userId: admin.id },
        { category: "MARKETING", description: "Publicidad Instagram", amount: 15000, userId: admin.id },
      ],
    });
    console.log("✅ Sample expenses created");
  }

  console.log("\n✅ Seeding complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔑 Admin: admin@bizadmin.com / admin123");
  console.log("👤 Empleado: empleado@bizadmin.com / empleado123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
