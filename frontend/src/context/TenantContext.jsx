/**
 * TenantContext — Provides tenant branding data across the application
 *
 * Manages logo, tagline, theme color, and company email for the current workspace.
 * Applies dynamic CSS variables for real-time theme customization.
 */

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useWorkspace } from './WorkspaceContext';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// ─── Helper: convert hex to HSL-based Tailwind-like shades ────────────────────
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
};

const applyThemeToDOM = (hex) => {
  const root = document.documentElement;
  const rgb = hexToRgb(hex);
  if (!rgb) return;

  root.style.setProperty('--primary-color', hex);
  root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
};

export const TenantProvider = ({ children }) => {
  const { currentWorkspace } = useWorkspace();

  const [tenant, setTenant] = useState({
    tenantName: '',
    logo: '',
    tagline: '',
    themeColor: '#7c3aed',
    companyEmail: '',
    inviteCode: '',
    role: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch tenant settings when workspace changes
  const fetchTenantSettings = useCallback(async () => {
    if (!currentWorkspace?._id) return;

    try {
      setLoading(true);
      const { data } = await axios.get('/api/tenant/settings', {
        headers: { 'x-workspace-id': currentWorkspace._id }
      });

      const tenantData = {
        tenantName: data.name || '',
        logo: data.logo || '',
        tagline: data.tagline || '',
        themeColor: data.themeColor || '#7c3aed',
        companyEmail: data.companyEmail || '',
        inviteCode: data.inviteCode || '',
        role: data.role || ''
      };

      setTenant(tenantData);
      applyThemeToDOM(tenantData.themeColor);

      // Persist to localStorage for flash-free reload
      localStorage.setItem('tenantBranding', JSON.stringify(tenantData));
    } catch (error) {
      console.error('Failed to fetch tenant settings:', error);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    if (currentWorkspace?._id) {
      fetchTenantSettings();
    }
  }, [currentWorkspace?._id, fetchTenantSettings]);

  // On initial mount, restore cached branding to avoid flash
  useEffect(() => {
    const cached = localStorage.getItem('tenantBranding');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setTenant(parsed);
        applyThemeToDOM(parsed.themeColor);
      } catch { /* ignore */ }
    }
  }, []);

  // Update tenant settings (admin only)
  const updateTenantSettings = async (updates) => {
    if (!currentWorkspace?._id) return;

    const { data } = await axios.put('/api/tenant/settings', updates, {
      headers: { 'x-workspace-id': currentWorkspace._id }
    });

    const updatedTenant = {
      tenantName: data.name || '',
      logo: data.logo || '',
      tagline: data.tagline || '',
      themeColor: data.themeColor || '#7c3aed',
      companyEmail: data.companyEmail || '',
      inviteCode: data.inviteCode || '',
      role: tenant.role
    };

    setTenant(updatedTenant);
    applyThemeToDOM(updatedTenant.themeColor);
    localStorage.setItem('tenantBranding', JSON.stringify(updatedTenant));

    return data;
  };

  const value = {
    ...tenant,
    loading,
    fetchTenantSettings,
    updateTenantSettings,
    isAdmin: tenant.role === 'admin'
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantContext;
