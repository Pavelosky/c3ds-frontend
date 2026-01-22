/**
 * Participant Dashboard - displays user's devices with management actions.
 * File: src/pages/ParticipantDashboard.jsx
 */

import { 
    useMyDevices, 
    useGenerateCertificate,
    useRevokeDevice,
    downloadCertificate,
    downloadPrivateKey 
  } from '../hooks/useParticipantDevices';

function ParticipantDashboard() {
  const { data: devices, isLoading, error } = useMyDevices();
  const generateCertMutation = useGenerateCertificate();
  const revokeMutation = useRevokeDevice();

  // Handler for generating a certificate
  const handleGenerateCert = (deviceId) => {
    generateCertMutation.mutate(deviceId);
  };

  // Handler for revoking a device
  const handleRevoke = (deviceId) => {
    if (window.confirm('Are you sure you want to revoke this device?')) {
      revokeMutation.mutate(deviceId);
    }
  };

  // Handler for downloading certificate
  const handleDownloadCert = async (deviceId, deviceName) => {
    try {
      await downloadCertificate(deviceId, deviceName);
    } catch (err) {
      alert('Failed to download certificate: ' + err.message);
    }
  };

  // Handler for downloading private key
  const handleDownloadKey = async (deviceId, deviceName) => {
    try {
      await downloadPrivateKey(deviceId, deviceName);
    } catch (err) {
      alert('Failed to download private key: ' + err.message);
    }
  };

  if (isLoading) {
    return <div>Loading your devices...</div>;
  }

  if (error) {
    return <div>Error loading devices: {error.message}</div>;
  }

  return (
    <div>
      <h1>My Devices</h1>
      <p>You have {devices?.length || 0} device(s)</p>
      
      {devices?.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {devices.map((device) => (
            <li key={device.id} style={{ 
              border: '1px solid #ccc', 
              padding: '16px', 
              marginBottom: '12px',
              borderRadius: '4px'
            }}>
              <div>
                <strong>{device.name}</strong> - {device.device_type}
              </div>
              <div>Status: {device.status}</div>
              
              <div style={{ marginTop: '12px' }}>
                {/* Only show actions for non-revoked devices */}
                {device.status !== 'REVOKED' && (
                  <>
                    <button 
                      onClick={() => handleGenerateCert(device.id)}
                      disabled={generateCertMutation.isPending}
                    >
                      Generate Certificate
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadCert(device.id, device.name)}
                      style={{ marginLeft: '8px' }}
                    >
                      Download Cert
                    </button>
                    
                    <button 
                      onClick={() => handleDownloadKey(device.id, device.name)}
                      style={{ marginLeft: '8px' }}
                    >
                      Download Key
                    </button>
                    
                    <button 
                      onClick={() => handleRevoke(device.id)}
                      disabled={revokeMutation.isPending}
                      style={{ marginLeft: '8px', color: 'red' }}
                    >
                      Revoke
                    </button>
                  </>
                )}
                
                {device.status === 'REVOKED' && (
                  <span style={{ color: 'gray' }}>Device revoked</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices registered yet.</p>
      )}
    </div>
  );
}

export default ParticipantDashboard;
