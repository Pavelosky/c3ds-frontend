/**
 * React Query hooks for participant device operations.
 * File: src/hooks/useParticipantDevices.js
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantDevicesAPI } from '../api/client';

/**
 * Fetches the list of devices owned by the current user.
 * Used on the participant dashboard to display all registered devices.
 */
export function useMyDevices() {
  return useQuery({
    queryKey: ['myDevices'],
    queryFn: async () => {
      const response = await participantDevicesAPI.getMyDevices();
      // Django REST Framework returns paginated results
      return response.data.results || [];
    },
  });
}

/**
 * Fetches details of a single device owned by the current user.
 * Used on device detail pages to display full device information.
 *
 * @param {string} deviceId - UUID of the device to fetch
 */
export function useMyDevice(deviceId) {
    return useQuery({
      queryKey: ['myDevices', deviceId],
      queryFn: async () => {
        const response = await participantDevicesAPI.getMyDevice(deviceId);
        return response.data;
      },
      // Only fetch if deviceId is provided
      enabled: !!deviceId,
    });
  }

/**
 * Creates a new device registration.
 * Invalidates the device list cache on success so the list refreshes.
 */
export function useCreateDevice() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (deviceData) => participantDevicesAPI.createDevice(deviceData),
      onSuccess: () => {
        // Invalidate the devices list so it refetches with the new device
        queryClient.invalidateQueries({ queryKey: ['myDevices'] });
      },
    });
  }

/**
 * Revokes a device (soft delete - sets status to REVOKED).
 * Revoked devices cannot generate new certificates or send messages.
 * Invalidates the device list cache on success.
 */
export function useRevokeDevice() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (deviceId) => participantDevicesAPI.revokeDevice(deviceId),
      onSuccess: (_, deviceId) => {
        // Invalidate both the list and the specific device
        queryClient.invalidateQueries({ queryKey: ['myDevices'] });
        queryClient.invalidateQueries({ queryKey: ['myDevices', deviceId] });
      },
    });
  }

/**
 * Generates a new X.509 certificate for a device.
 * Returns metadata (serial, expiry, download window) - not the actual certificate.
 * Certificate and private key are downloaded separately via dedicated functions.
 */
export function useGenerateCertificate() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (deviceId) => participantDevicesAPI.generateCertificate(deviceId),
      onSuccess: (_, deviceId) => {
        // Invalidate device queries to refresh certificate info
        queryClient.invalidateQueries({ queryKey: ['myDevices'] });
        queryClient.invalidateQueries({ queryKey: ['myDevices', deviceId] });
      },
    });
  }

/**
 * Downloads the device certificate as a .pem file.
 * Triggers browser download of the certificate.
 *
 * Not a hook because file downloads don't need caching.
 *
 * @param {string} deviceId - UUID of the device
 * @param {string} deviceName - Name for the downloaded file
 */
export async function downloadCertificate(deviceId, deviceName) {
    const response = await participantDevicesAPI.downloadCertificate(deviceId);
  
    // Create a blob URL and trigger browser download
    const blob = new Blob([response.data], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deviceName}_certificate.pem`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

/**
 * Downloads the device private key as a .key file.
 * Triggers browser download of the private key.
 *
 * @param {string} deviceId - UUID of the device
 * @param {string} deviceName - Name for the downloaded file
 */
export async function downloadPrivateKey(deviceId, deviceName) {
    const response = await participantDevicesAPI.downloadPrivateKey(deviceId);

    // Create a blob URL and trigger browser download
    const blob = new Blob([response.data], { type: 'application/x-pem-file' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${deviceName}_private.key`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

/**
 * Downloads the complete device code bundle (Arduino sketch + config).
 * Requires WiFi credentials which are embedded in config.h file.
 * Triggers browser download of a ZIP file.
 *
 * @param {string} deviceId - UUID of the device
 * @param {string} deviceName - Name for the downloaded file
 * @param {string} wifiSsid - WiFi network SSID (max 32 chars)
 * @param {string} wifiPassword - WiFi password (max 64 chars)
 * @throws {Error} If download fails (expired certificate, missing cert, etc.)
 */
export async function downloadCodeBundle(deviceId, deviceName, wifiSsid, wifiPassword) {
  const response = await participantDevicesAPI.downloadCodeBundle(deviceId, {
    wifi_ssid: wifiSsid,
    wifi_password: wifiPassword,
  });

  // Create a blob URL and trigger browser download
  const blob = new Blob([response.data], { type: 'application/zip' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${deviceName}_ESP8266_code.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

  