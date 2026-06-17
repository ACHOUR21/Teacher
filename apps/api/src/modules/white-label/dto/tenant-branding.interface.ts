export interface TenantBranding {
  tenantId: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  tagline: string;
  customCss: string;
  customDomain: string | null;
}

export const DEFAULT_TENANT_BRANDING: Omit<TenantBranding, 'tenantId' | 'customDomain'> = {
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4',
  fontFamily: 'Inter',
  tagline: '',
  customCss: '',
};
