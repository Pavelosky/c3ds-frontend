import { useDevices } from '../hooks/useDevices';

function PublicDashboard() {
  const { data: devices, isLoading, error } = useDevices();

  if (isLoading) {
    return <div>Loading devices...</div>;
  }

  if (error) {
    return <div>Error loading devices: {error.message}</div>;
  }

  return (
    <div>
      <h1>Public Dashboard</h1>
      <p>You have {devices?.length || 0} device(s)</p>
      
      {devices?.length > 0 ? (
        <ul>
          {devices.map((device) => (
            <li key={device.id}>
              {device.name} - Status: {device.status}
            </li>
          ))}
        </ul>
      ) : (
        <p>No devices found.</p>
      )}
    </div>
  );
}

export default PublicDashboard;