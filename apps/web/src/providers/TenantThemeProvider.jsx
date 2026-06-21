'use client';
import { useEffect } from 'react';
/**
 * TenantThemeProvider
 *
 * Applies per-tenant branding to the document root via CSS custom properties.
 * Must be rendered inside a Client Component tree (uses useEffect / DOM APIs).
 *
 * Usage:
 *   <TenantThemeProvider branding={branding}>
 *     <App />
 *   </TenantThemeProvider>
 *
 * CSS variables set on :root:
 *   --color-primary     primary brand colour
 *   --color-secondary   secondary brand colour
 *   --color-accent      accent colour
 *   --font-family       body / heading font family
 *
 * A <style id="tenant-custom-css"> tag is injected when `customCss` is
 * provided and removed on unmount / when branding changes.
 */
export function TenantThemeProvider({ branding, children }) {
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', branding.primaryColor);
        root.style.setProperty('--color-secondary', branding.secondaryColor);
        root.style.setProperty('--color-accent', branding.accentColor);
        root.style.setProperty('--font-family', branding.fontFamily);
        if (branding.customCss) {
            const existing = document.getElementById('tenant-custom-css');
            const style = existing ?? document.createElement('style');
            style.id = 'tenant-custom-css';
            style.textContent = branding.customCss;
            if (!existing) {
                document.head.appendChild(style);
            }
        }
        return () => {
            // Remove the injected custom CSS when the component unmounts or branding changes
            document.getElementById('tenant-custom-css')?.remove();
        };
    }, [branding]);
    return <>{children}</>;
}
