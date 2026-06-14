import { ClientResponse, QuoteResponse, InvoiceResponse, QuoteLineResponse, InvoiceLineResponse, CatalogProfile, CatalogFamily, CatalogItem, InventoryItemResponse, PriceResponse, TypeResponse } from '../../core/models/api.types';

export function mockClient(overrides?: Partial<ClientResponse>): ClientResponse {
  return { id: crypto.randomUUID(), organizationId: '', name: 'Test Client', email: 'test@test.com', phone: null, address: null, vatNumber: 'B12345678', notes: null, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00', ...overrides };
}

export function mockQuote(overrides?: Partial<QuoteResponse>): QuoteResponse {
  return { id: crypto.randomUUID(), organizationId: '', quoteNumber: 'PRES-2026-001', clientId: null, customerName: 'Test Client', customerVat: null, customerAddress: null, issueDate: '2026-06-01', validUntil: null, status: 'DRAFT', subtotal: 100, vatTotal: 21, total: 121, notes: null, ...overrides };
}

export function mockQuoteLine(overrides?: Partial<QuoteLineResponse>): QuoteLineResponse {
  return { id: crypto.randomUUID(), quoteId: '', lineNumber: 1, description: 'Test line', quantity: 2, unitPrice: 50, vatRate: 21, totalPrice: 121, profileId: null, itemId: null, ...overrides };
}

export function mockInvoice(overrides?: Partial<InvoiceResponse>): InvoiceResponse {
  return { id: crypto.randomUUID(), organizationId: '', invoiceNumber: 'FAC-2026-001', customerName: 'Test Client', customerVat: null, customerAddress: null, issueDate: '2026-06-01', dueDate: null, status: 'DRAFT', subtotal: 100, vatTotal: 21, total: 121, notes: null, ...overrides };
}

export function mockInvoiceLine(overrides?: Partial<InvoiceLineResponse>): InvoiceLineResponse {
  return { id: crypto.randomUUID(), invoiceId: '', lineNumber: 1, description: 'Test line', quantity: 2, unitPrice: 50, vatRate: 21, totalPrice: 121, profileId: null, itemId: null, ...overrides };
}

export function mockCatalogFamily(overrides?: Partial<CatalogFamily>): CatalogFamily {
  return { id: crypto.randomUUID(), code: 'IPE', name: 'I-Profile (IPE)', standard: 'EUR', shapeType: 'I', ...overrides };
}

export function mockCatalogProfile(overrides?: Partial<CatalogProfile>): CatalogProfile {
  return { id: crypto.randomUUID(), family: mockCatalogFamily(), designation: 'IPE 200', weightKgM: 18.4, areaCm2: 23.4, imagePath: null, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00', ...overrides };
}

export function mockCatalogItem(overrides?: Partial<CatalogItem>): CatalogItem {
  return { id: crypto.randomUUID(), typeId: null, itemType: 'PLATE', sku: 'PL-001', designation: 'PL 10x1000', dimensions: '10x1000', weightKgM: 78.5, material: 'S235JR', estimatedPriceKg: 1.5, metadata: null, imagePath: null, createdAt: '2026-01-01T00:00:00', updatedAt: '2026-01-01T00:00:00', ...overrides };
}

export function mockInventoryItem(overrides?: Partial<InventoryItemResponse>): InventoryItemResponse {
  return { id: crypto.randomUUID(), organizationId: '', profileId: null, itemId: null, quantity: 10, location: 'Warehouse A', costPriceEur: 150, supplier: 'SteelCo', receivedAt: '2026-01-15T00:00:00', notes: null, ...overrides };
}

export function mockPrice(overrides?: Partial<PriceResponse>): PriceResponse {
  return { id: crypto.randomUUID(), organizationId: '', profileId: null, itemId: null, unitPrice: 2.5, validFrom: null, validTo: null, notes: null, ...overrides };
}

export function mockType(overrides?: Partial<TypeResponse>): TypeResponse {
  return { id: crypto.randomUUID(), organizationId: '', name: 'PLATE', ...overrides };
}

export function mockPage<T>(content: T[], totalElements = content.length) {
  return { content, totalElements, totalPages: 1, size: 20, number: 0, first: true, last: true, empty: content.length === 0 };
}
