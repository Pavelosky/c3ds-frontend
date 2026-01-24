/**
 * Modal dialog for registering a new device.
 * File: src/components/AddDeviceModal.jsx
 */

import { useState } from 'react';
import { useCreateDevice } from '../hooks/useParticipantDevices';

function AddDeviceModal({ isOpen, onClose }) {
  // Form state
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [algorithm, setAlgorithm] = useState('ECDSA_P256');
  
  // Mutation hook for creating device
  const createDevice = useCreateDevice();

  // Don't render if modal is closed
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createDevice.mutateAsync({
        name,
        device_type: deviceType,
        certificate_algorithm: algorithm,
      });
      
      // Reset form and close modal on success
      setName('');
      setDeviceType('');
      setAlgorithm('ECDSA_P256');
      onClose();
    } catch (error) {
      // Error will be shown via createDevice.error
      console.error('Failed to create device:', error);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Register New Device</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Error display */}
          {createDevice.error && (
            <div style={{ color: 'red', marginBottom: '12px' }}>
              {createDevice.error.response?.data?.name?.[0] || 
               createDevice.error.response?.data?.detail ||
               'Failed to create device'}
            </div>
          )}

          {/* Device Name */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '4px' }}>
              Device Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Living Room Sensor"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Device Type */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="deviceType" style={{ display: 'block', marginBottom: '4px' }}>
              Device Type *
            </label>
            <input
              id="deviceType"
              type="text"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              required
              placeholder="e.g., Raspberry Pi 4, ESP32"
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>

          {/* Certificate Algorithm */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="algorithm" style={{ display: 'block', marginBottom: '4px' }}>
              Certificate Algorithm
            </label>
            <select
              id="algorithm"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            >
              <option value="ECDSA_P256">ECDSA P-256 (recommended for IoT)</option>
              <option value="ECDSA_P384">ECDSA P-384 (higher security)</option>
              <option value="RSA_2048">RSA-2048 (legacy compatibility)</option>
              <option value="RSA_4096">RSA-4096 (maximum security)</option>
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={createDevice.isPending}
              style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', padding: '8px 16px' }}
            >
              {createDevice.isPending ? 'Creating...' : 'Register Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Basic styles for the modal
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
};

export default AddDeviceModal;