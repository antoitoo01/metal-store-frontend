export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type QuoteStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export type UserRole = 'ADMIN' | 'USER';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  error?: string;
  message?: string;
  path?: string;
  errors?: { field: string; message: string }[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  tenantName?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  refreshToken?: string;
  expiresIn: number;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  notes?: string;
}

export interface ClientResponse {
  id: string;
  tenantId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
  notes: string | null;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogFamily {
  id: string;
  code: string;
  name: string;
  standard: string;
  shapeType: string;
}

export interface CatalogProfile {
  id: string;
  family: CatalogFamily;
  designation: string;
  weightKgM: number | null;
  areaCm2: number | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface CatalogItem {
  id: string;
  typeId: string | null;
  itemType: string;
  sku: string | null;
  designation: string;
  dimensions: string | null;
  weightKgM: number | null;
  material: string | null;
  estimatedPriceKg: number;
  metadata: string | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TypeResponse {
  id: string;
  tenantId: string;
  name: string;
}

export interface CreateTypeRequest {
  name: string;
}

export interface CreateInventoryItemRequest {
  profileId?: string;
  itemId?: string;
  quantity: number;
  location?: string;
  costPriceEur?: number;
  supplier?: string;
  notes?: string;
}

export interface InventoryItemResponse {
  id: string;
  tenantId: string;
  profileId: string | null;
  itemId: string | null;
  quantity: number;
  location: string | null;
  costPriceEur: number | null;
  supplier: string | null;
  receivedAt: string;
  notes: string | null;
}

export interface CreateQuoteRequest {
  clientId?: string;
  customerName?: string;
  customerVat?: string;
  customerAddress?: string;
  validUntil?: string;
  notes?: string;
}

export interface CreateQuoteLineRequest {
  lineNumber: number;
  profileId?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface QuoteResponse {
  id: string;
  tenantId: string;
  quoteNumber: string;
  clientId: string | null;
  customerName: string | null;
  customerVat: string | null;
  customerAddress: string | null;
  issueDate: string;
  validUntil: string | null;
  status: QuoteStatus;
  subtotal: number;
  vatTotal: number;
  total: number;
  notes: string | null;
}

export interface QuoteLineResponse {
  id: string;
  quoteId: string;
  lineNumber: number;
  profileId: string | null;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
}

export interface UpsertPriceRequest {
  profileId?: string;
  itemId?: string;
  unitPrice: number;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}

export interface PriceResponse {
  id: string;
  tenantId: string;
  profileId: string | null;
  itemId: string | null;
  unitPrice: number;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
}

export interface InvoiceResponse {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  customerName: string | null;
  customerVat: string | null;
  customerAddress: string | null;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  subtotal: number;
  vatTotal: number;
  total: number;
  notes: string | null;
}

export interface InvoiceLineResponse {
  id: string;
  invoiceId: string;
  lineNumber: number;
  profileId: string | null;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
}

export interface CreateInvoiceLineRequest {
  lineNumber: number;
  profileId?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}
