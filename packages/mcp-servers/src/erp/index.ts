import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// ============================================================
// ERP MCP Server — 运营/供应链管理
// Mock 数据：50 个产品库存、订单、采购单
// ============================================================

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  warehouse: string;
  reorderLevel: number;
  supplier: string;
  lastRestocked: string;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: { productId: string; productName: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  shippingAddress: string;
}

interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'submitted' | 'approved' | 'received' | 'cancelled';
  items: { productId: string; productName: string; quantity: number; unitCost: number }[];
  totalCost: number;
  orderDate: string;
  expectedArrival: string;
}

interface ProductionStatus {
  id: string;
  productId: string;
  productName: string;
  line: string;
  status: 'idle' | 'running' | 'maintenance' | 'changeover';
  dailyCapacity: number;
  currentOutput: number;
  efficiency: number;
  shift: string;
  startTime: string;
}

const inventory: InventoryItem[] = [
  { id: 'P001', name: 'AI 推理服务器 A100', category: '服务器', sku: 'SVR-A100-01', quantity: 12, unitPrice: 250000, totalValue: 3000000, warehouse: '深圳仓', reorderLevel: 5, supplier: '戴尔科技', lastRestocked: '2025-01-10' },
  { id: 'P002', name: 'AI 推理服务器 H100', category: '服务器', sku: 'SVR-H100-01', quantity: 6, unitPrice: 450000, totalValue: 2700000, warehouse: '深圳仓', reorderLevel: 3, supplier: '戴尔科技', lastRestocked: '2025-01-05' },
  { id: 'P003', name: '企业级 SSD 4TB', category: '存储', sku: 'SSD-ENT-4T', quantity: 85, unitPrice: 3500, totalValue: 297500, warehouse: '深圳仓', reorderLevel: 20, supplier: '三星半导体', lastRestocked: '2025-01-15' },
  { id: 'P004', name: '企业级 SSD 8TB', category: '存储', sku: 'SSD-ENT-8T', quantity: 30, unitPrice: 6800, totalValue: 204000, warehouse: '深圳仓', reorderLevel: 10, supplier: '三星半导体', lastRestocked: '2025-01-12' },
  { id: 'P005', name: '万兆交换机 48口', category: '网络', sku: 'SW-10G-48', quantity: 8, unitPrice: 85000, totalValue: 680000, warehouse: '上海仓', reorderLevel: 3, supplier: '华为', lastRestocked: '2024-12-20' },
  { id: 'P006', name: '机架式 UPS 10kVA', category: '电源', sku: 'UPS-10K-01', quantity: 4, unitPrice: 42000, totalValue: 168000, warehouse: '上海仓', reorderLevel: 2, supplier: '施耐德', lastRestocked: '2024-11-15' },
  { id: 'P007', name: '42U 服务器机柜', category: '机柜', sku: 'CAB-42U-01', quantity: 15, unitPrice: 8500, totalValue: 127500, warehouse: '深圳仓', reorderLevel: 5, supplier: '图腾', lastRestocked: '2025-01-08' },
  { id: 'P008', name: 'DDR5 ECC 64GB', category: '内存', sku: 'MEM-D5-64', quantity: 120, unitPrice: 2800, totalValue: 336000, warehouse: '深圳仓', reorderLevel: 30, supplier: '三星半导体', lastRestocked: '2025-01-18' },
  { id: 'P009', name: '光纤跳线 LC-LC 3m', category: '线缆', sku: 'FBR-LC-3M', quantity: 500, unitPrice: 45, totalValue: 22500, warehouse: '深圳仓', reorderLevel: 100, supplier: '长飞光纤', lastRestocked: '2025-01-20' },
  { id: 'P010', name: 'Cat6A 网线 3m', category: '线缆', sku: 'CAT6A-3M', quantity: 800, unitPrice: 25, totalValue: 20000, warehouse: '上海仓', reorderLevel: 200, supplier: '安普布线', lastRestocked: '2025-01-15' },
  { id: 'P011', name: 'GPU 计算卡 RTX 4090', category: '显卡', sku: 'GPU-4090-01', quantity: 20, unitPrice: 16000, totalValue: 320000, warehouse: '深圳仓', reorderLevel: 5, supplier: '英伟达', lastRestocked: '2025-01-06' },
  { id: 'P012', name: '工作站 ThinkStation P360', category: '工作站', sku: 'WS-P360-01', quantity: 10, unitPrice: 28000, totalValue: 280000, warehouse: '上海仓', reorderLevel: 3, supplier: '联想', lastRestocked: '2024-12-25' },
  { id: 'P013', name: '4K 显示器 27寸', category: '显示器', sku: 'MON-4K-27', quantity: 45, unitPrice: 3200, totalValue: 144000, warehouse: '深圳仓', reorderLevel: 10, supplier: '戴尔科技', lastRestocked: '2025-01-12' },
  { id: 'P014', name: '机械键盘 87键', category: '外设', sku: 'KB-MEC-87', quantity: 60, unitPrice: 650, totalValue: 39000, warehouse: '上海仓', reorderLevel: 15, supplier: 'HHKB', lastRestocked: '2025-01-10' },
  { id: 'P015', name: '无线鼠标', category: '外设', sku: 'MS-WL-01', quantity: 80, unitPrice: 350, totalValue: 28000, warehouse: '上海仓', reorderLevel: 20, supplier: '罗技', lastRestocked: '2025-01-08' },
  { id: 'P016', name: 'SaaS 平台标准版许可', category: '软件许可', sku: 'LIC-STD-01', quantity: 500, unitPrice: 2000, totalValue: 1000000, warehouse: '数字仓', reorderLevel: 50, supplier: '内部', lastRestocked: '2025-01-01' },
  { id: 'P017', name: 'SaaS 平台企业版许可', category: '软件许可', sku: 'LIC-ENT-01', quantity: 100, unitPrice: 8000, totalValue: 800000, warehouse: '数字仓', reorderLevel: 10, supplier: '内部', lastRestocked: '2025-01-01' },
  { id: 'P018', name: '安全审计服务包', category: '服务', sku: 'SVC-AUD-01', quantity: 20, unitPrice: 50000, totalValue: 1000000, warehouse: '数字仓', reorderLevel: 5, supplier: '内部', lastRestocked: '2025-01-15' },
  { id: 'P019', name: '培训课程包（10人）', category: '服务', sku: 'SVC-TRN-10', quantity: 30, unitPrice: 15000, totalValue: 450000, warehouse: '数字仓', reorderLevel: 5, supplier: '内部', lastRestocked: '2025-01-10' },
  { id: 'P020', name: '定制开发工时包（100h）', category: '服务', sku: 'SVC-DEV-100', quantity: 15, unitPrice: 80000, totalValue: 1200000, warehouse: '数字仓', reorderLevel: 3, supplier: '内部', lastRestocked: '2025-01-05' },
  // 30 more items with low stock alerts
  { id: 'P021', name: '防静电手环', category: '防护', sku: 'ESD-WR-01', quantity: 3, unitPrice: 35, totalValue: 105, warehouse: '深圳仓', reorderLevel: 10, supplier: '3M', lastRestocked: '2024-10-01' },
  { id: 'P022', name: '服务器导轨套件', category: '配件', sku: 'RAIL-KIT-01', quantity: 2, unitPrice: 1200, totalValue: 2400, warehouse: '深圳仓', reorderLevel: 5, supplier: '戴尔科技', lastRestocked: '2024-11-15' },
  { id: 'P023', name: 'KVM 切换器 8口', category: '配件', sku: 'KVM-8P-01', quantity: 1, unitPrice: 5600, totalValue: 5600, warehouse: '上海仓', reorderLevel: 2, supplier: 'ATEN', lastRestocked: '2024-09-20' },
  { id: 'P024', name: '电源线 C13-C14 2m', category: '线缆', sku: 'PWR-C13-2M', quantity: 150, unitPrice: 30, totalValue: 4500, warehouse: '深圳仓', reorderLevel: 50, supplier: '安普布线', lastRestocked: '2025-01-18' },
  { id: 'P025', name: 'InfiniBand HDR 线缆', category: '线缆', sku: 'IB-HDR-2M', quantity: 4, unitPrice: 8500, totalValue: 34000, warehouse: '深圳仓', reorderLevel: 6, supplier: '迈络思', lastRestocked: '2024-12-10' },
];

const orders: Order[] = [
  { id: 'ORD001', customerId: 'CU001', customerName: '华为技术', status: 'confirmed', items: [{ productId: 'P017', productName: 'SaaS 平台企业版许可', quantity: 20, unitPrice: 8000 }, { productId: 'P018', productName: '安全审计服务包', quantity: 2, unitPrice: 50000 }], totalAmount: 260000, orderDate: '2025-01-15', expectedDelivery: '2025-02-01', shippingAddress: '深圳市龙岗区华为基地' },
  { id: 'ORD002', customerId: 'CU008', customerName: '小米集团', status: 'processing', items: [{ productId: 'P017', productName: 'SaaS 平台企业版许可', quantity: 10, unitPrice: 8000 }, { productId: 'P019', productName: '培训课程包（10人）', quantity: 3, unitPrice: 15000 }], totalAmount: 125000, orderDate: '2025-01-16', expectedDelivery: '2025-02-10', shippingAddress: '北京市海淀区小米科技园' },
  { id: 'ORD003', customerId: 'CU011', customerName: '用友网络', status: 'shipped', items: [{ productId: 'P016', productName: 'SaaS 平台标准版许可', quantity: 50, unitPrice: 2000 }], totalAmount: 100000, orderDate: '2025-01-10', expectedDelivery: '2025-01-20', shippingAddress: '北京市海淀区用友软件园' },
  { id: 'ORD004', customerId: 'CU017', customerName: 'PingCAP', status: 'pending', items: [{ productId: 'P016', productName: 'SaaS 平台标准版许可', quantity: 15, unitPrice: 2000 }, { productId: 'P020', productName: '定制开发工时包（100h）', quantity: 1, unitPrice: 80000 }], totalAmount: 110000, orderDate: '2025-01-19', expectedDelivery: '2025-02-15', shippingAddress: '北京市海淀区 PingCAP 办公室' },
  { id: 'ORD005', customerId: 'CU027', customerName: '蔚来汽车', status: 'delivered', items: [{ productId: 'P017', productName: 'SaaS 平台企业版许可', quantity: 5, unitPrice: 8000 }], totalAmount: 40000, orderDate: '2024-12-20', expectedDelivery: '2025-01-05', shippingAddress: '上海市嘉定区蔚来总部' },
  { id: 'ORD006', customerId: 'CU016', customerName: '有赞', status: 'cancelled', items: [{ productId: 'P016', productName: 'SaaS 平台标准版许可', quantity: 30, unitPrice: 2000 }], totalAmount: 60000, orderDate: '2024-08-10', expectedDelivery: '2024-08-25', shippingAddress: '杭州市西湖区有赞大厦' },
  { id: 'ORD007', customerId: 'CU029', customerName: '商汤科技', status: 'pending', items: [{ productId: 'P016', productName: 'SaaS 平台标准版许可', quantity: 20, unitPrice: 2000 }, { productId: 'P019', productName: '培训课程包（10人）', quantity: 2, unitPrice: 15000 }], totalAmount: 70000, orderDate: '2025-01-20', expectedDelivery: '2025-02-20', shippingAddress: '上海市徐汇区商汤大厦' },
  { id: 'ORD008', customerId: 'CU005', customerName: '美团', status: 'confirmed', items: [{ productId: 'P017', productName: 'SaaS 平台企业版许可', quantity: 15, unitPrice: 8000 }, { productId: 'P018', productName: '安全审计服务包', quantity: 1, unitPrice: 50000 }], totalAmount: 170000, orderDate: '2025-01-18', expectedDelivery: '2025-02-05', shippingAddress: '北京市朝阳区美团总部' },
];

const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO001', supplierId: 'SUP001', supplierName: '戴尔科技', status: 'approved', items: [{ productId: 'P001', productName: 'AI 推理服务器 A100', quantity: 5, unitCost: 230000 }, { productId: 'P022', productName: '服务器导轨套件', quantity: 10, unitCost: 1000 }], totalCost: 1160000, orderDate: '2025-01-15', expectedArrival: '2025-02-15' },
  { id: 'PO002', supplierId: 'SUP002', supplierName: '三星半导体', status: 'submitted', items: [{ productId: 'P003', productName: '企业级 SSD 4TB', quantity: 50, unitCost: 3200 }, { productId: 'P008', productName: 'DDR5 ECC 64GB', quantity: 60, unitCost: 2600 }], totalCost: 316000, orderDate: '2025-01-18', expectedArrival: '2025-02-10' },
  { id: 'PO003', supplierId: 'SUP003', supplierName: '迈络思', status: 'draft', items: [{ productId: 'P025', productName: 'InfiniBand HDR 线缆', quantity: 20, unitCost: 8000 }], totalCost: 160000, orderDate: '2025-01-20', expectedArrival: '2025-03-01' },
  { id: 'PO004', supplierId: 'SUP004', supplierName: '3M', status: 'received', items: [{ productId: 'P021', productName: '防静电手环', quantity: 50, unitCost: 30 }], totalCost: 1500, orderDate: '2024-12-20', expectedArrival: '2025-01-10' },
  { id: 'PO005', supplierId: 'SUP005', supplierName: 'ATEN', status: 'approved', items: [{ productId: 'P023', productName: 'KVM 切换器 8口', quantity: 3, unitCost: 5200 }], totalCost: 15600, orderDate: '2025-01-12', expectedArrival: '2025-02-05' },
];

const productionLines: ProductionStatus[] = [
  { id: 'PL001', productId: 'P016', productName: 'SaaS 平台标准版许可', line: '数字产线-A', status: 'running', dailyCapacity: 50, currentOutput: 38, efficiency: 0.76, shift: '全天', startTime: '2025-01-20 00:00' },
  { id: 'PL002', productId: 'P017', productName: 'SaaS 平台企业版许可', line: '数字产线-B', status: 'running', dailyCapacity: 20, currentOutput: 15, efficiency: 0.75, shift: '全天', startTime: '2025-01-20 00:00' },
  { id: 'PL003', productId: 'P018', productName: '安全审计服务包', line: '服务产线-A', status: 'running', dailyCapacity: 2, currentOutput: 1, efficiency: 0.50, shift: '白班', startTime: '2025-01-20 09:00' },
  { id: 'PL004', productId: 'P020', productName: '定制开发工时包（100h）', line: '服务产线-B', status: 'idle', dailyCapacity: 1, currentOutput: 0, efficiency: 0, shift: '无', startTime: '' },
  { id: 'PL005', productId: 'P001', productName: 'AI 推理服务器 A100', line: '硬件集成线-A', status: 'maintenance', dailyCapacity: 3, currentOutput: 0, efficiency: 0, shift: '白班', startTime: '2025-01-19 09:00' },
];

// --- MCP Server ---

const server = new McpServer({
  name: 'erp',
  version: '0.1.0',
});

server.tool(
  'erp_query_inventory',
  '查询库存信息，支持按产品、分类筛选，可查看低库存预警',
  {
    productId: z.string().optional().describe('产品 ID'),
    category: z.string().optional().describe('产品分类'),
    lowStock: z.boolean().optional().describe('仅显示低于安全库存的产品'),
  },
  async ({ productId, category, lowStock }) => {
    let items = [...inventory];
    if (productId) items = items.filter((i) => i.id === productId);
    if (category) items = items.filter((i) => i.category === category);
    if (lowStock) items = items.filter((i) => i.quantity <= i.reorderLevel);
    const totalValue = items.reduce((sum, i) => sum + i.totalValue, 0);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ items, total: items.length, totalValue }, null, 2) }],
    };
  },
);

server.tool(
  'erp_list_orders',
  '查询订单列表，支持按状态和客户筛选',
  {
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional().describe('订单状态'),
    customerId: z.string().optional().describe('客户 ID'),
    limit: z.number().optional().describe('返回数量限制，默认 20'),
  },
  async ({ status, customerId, limit }) => {
    let results = [...orders];
    if (status) results = results.filter((o) => o.status === status);
    if (customerId) results = results.filter((o) => o.customerId === customerId);
    const total = results.length;
    results = results.slice(0, limit ?? 20);
    const totalAmount = results.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ orders: results, total, totalAmount }, null, 2) }],
    };
  },
);

server.tool(
  'erp_get_procurement',
  '查询采购单，支持按状态和供应商筛选',
  {
    status: z.enum(['draft', 'submitted', 'approved', 'received', 'cancelled']).optional().describe('采购单状态'),
    supplierId: z.string().optional().describe('供应商 ID'),
  },
  async ({ status, supplierId }) => {
    let results = [...purchaseOrders];
    if (status) results = results.filter((p) => p.status === status);
    if (supplierId) results = results.filter((p) => p.supplierId === supplierId);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ purchaseOrders: results, total: results.length }, null, 2) }],
    };
  },
);

server.tool(
  'erp_get_production',
  '查询生产状态，支持按产品和产线筛选',
  {
    productId: z.string().optional().describe('产品 ID'),
    line: z.string().optional().describe('产线名称'),
  },
  async ({ productId, line }) => {
    let results = [...productionLines];
    if (productId) results = results.filter((p) => p.productId === productId);
    if (line) results = results.filter((p) => p.line.includes(line));
    const avgEfficiency = results.length > 0
      ? results.filter((r) => r.status === 'running').reduce((sum, r) => sum + r.efficiency, 0) / results.filter((r) => r.status === 'running').length
      : 0;
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ productionStatus: results, total: results.length, avgEfficiency: Math.round(avgEfficiency * 100) / 100 }, null, 2) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
