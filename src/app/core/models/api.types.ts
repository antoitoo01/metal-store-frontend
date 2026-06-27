export type ClientStatus = 'ACTIVE' | 'INACTIVE';

export type QuoteStatus = 'DRAFT' | 'ISSUED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';

export type UserRole = 'ADMIN' | 'USER' | 'ORGANIZATION_OWNER' | 'SUPER_ADMIN' | 'WORKER';

export type OrganizationRole = 'OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'WORKER';

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
  tenantName?: string; // TODO: rename to organizationName when backend updates DTO
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  refreshToken?: string;
  expiresIn: number;
  email: string;
  username?: string;
  role: UserRole;
  tenantId: string;        // user's auth identity (from JWT sub or backend)
  organizationId: string;
  organizationName: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
}

export interface UserResponse {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  organizations: UserOrganization[];
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
  organizationId: string;
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
  h: number | null;
  b: number | null;
  tw: number | null;
  tf: number | null;
  r: number | null;
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
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
  organizationId: string;
  profileId: string | null;
  itemId: string | null;
  unitPrice: number;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
}

export interface InvoiceResponse {
  id: string;
  organizationId: string;
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

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface InvitationResponse {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  status: InvitationStatus;
  token: string;
  link: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateInvitationRequest {
  emails: string[];
}

// ── Suppliers ──

export type SupplierStatus = 'ACTIVE' | 'INACTIVE';

export interface CreateSupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  vatNumber?: string;
  notes?: string;
}

export interface SupplierResponse {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vatNumber: string | null;
  notes: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Purchase Orders ──

export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'RECEIVED' | 'CANCELLED';

export interface CreatePurchaseOrderRequest {
  supplierId?: string;
  supplierName?: string;
  supplierVat?: string;
  supplierAddress?: string;
  expectedDate?: string;
  notes?: string;
}

export interface PurchaseOrderResponse {
  id: string;
  organizationId: string;
  poNumber: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierVat: string | null;
  supplierAddress: string | null;
  issueDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  subtotal: number;
  vatTotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineResponse {
  id: string;
  poId: string;
  lineNumber: number;
  profileId: string | null;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
}

export interface CreatePurchaseOrderLineRequest {
  lineNumber: number;
  profileId?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

// ── Inventory Movements ──

export type MovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
export type ReferenceType = 'PURCHASE_ORDER' | 'DELIVERY_NOTE' | 'MANUAL_ADJUSTMENT' | 'SALE';

export interface InventoryMovementResponse {
  id: string;
  inventoryItemId: string;
  movementType: MovementType;
  quantity: number;
  referenceType: ReferenceType | null;
  referenceId: string | null;
  previousQuantity: number;
  newQuantity: number;
  notes: string | null;
  performedAt: string;
}

export interface AddStockRequest {
  quantity: number;
  notes?: string;
}

export interface RemoveStockRequest {
  quantity: number;
  notes?: string;
}

// ── Inbound Delivery Notes ──

export type InboundDNStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface CreateInboundDNRequest {
  supplierId?: string;
  supplierName?: string;
  supplierVat?: string;
  supplierAddress?: string;
  poId?: string;
  poNumber?: string;
  issueDate?: string;
  notes?: string;
}

export interface InboundDNResponse {
  id: string;
  organizationId: string;
  number: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierVat: string | null;
  supplierAddress: string | null;
  poId: string | null;
  poNumber: string | null;
  issueDate: string;
  status: InboundDNStatus;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InboundDNLineResponse {
  id: string;
  deliveryNoteId: string;
  lineNumber: number;
  profileId: string | null;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  notes: string | null;
}

export interface CreateInboundDNLineRequest {
  lineNumber: number;
  profileId?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  notes?: string;
}

// ── Outbound Delivery Notes ──

export type OutboundDNStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface CreateOutboundDNRequest {
  customerId?: string;
  customerName?: string;
  customerVat?: string;
  customerAddress?: string;
  issueDate?: string;
  notes?: string;
}

export interface OutboundDNResponse {
  id: string;
  organizationId: string;
  number: string;
  customerId: string | null;
  customerName: string | null;
  customerVat: string | null;
  customerAddress: string | null;
  issueDate: string;
  status: OutboundDNStatus;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutboundDNLineResponse {
  id: string;
  deliveryNoteId: string;
  lineNumber: number;
  profileId: string | null;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  notes: string | null;
}

export interface CreateOutboundDNLineRequest {
  lineNumber: number;
  profileId?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  notes?: string;
}
