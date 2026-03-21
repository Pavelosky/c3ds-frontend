import { CircleMarker } from 'react-leaflet';

function DotMarker({ center, color = '#00ff41', children }) {
  return (
    <CircleMarker
      center={center}
      radius={8}
      pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
    >
      {children}
    </CircleMarker>
  );
}

export default DotMarker;
