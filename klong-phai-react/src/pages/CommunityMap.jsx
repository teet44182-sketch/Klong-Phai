import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { placesDatabase } from '../placesData';

// Fix Leaflet default icon path issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom pin icon per category
const createPinIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 26px; height: 26px;
      background: ${color};
      border: 3px solid #fff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 10px rgba(0,0,0,0.45);
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -30],
  });

const TYPE_CONFIG = {
  travel:        { color: '#00a854', label: ' สถานที่ท่องเที่ยว' },
  accommodation: { color: '#2196F3', label: ' ที่พัก' },
  restaurant:    { color: '#FF6B35', label: ' ร้านอาหาร' },
};

const icons = {
  travel:        createPinIcon('#00a854'),
  accommodation: createPinIcon('#2196F3'),
  restaurant:    createPinIcon('#FF6B35'),
};

const FILTERS = [
  { key: 'all',           label: ' ทั้งหมด' },
  { key: 'travel',        label: ' ท่องเที่ยว' },
  { key: 'accommodation', label: ' ที่พัก' },
  { key: 'restaurant',    label: ' ร้านอาหาร' },
];

// Component to track zoom level
function ZoomTracker({ onZoomChange }) {
  useMapEvents({
    zoomend: (e) => {
      onZoomChange(e.target.getZoom());
    },
  });
  return null;
}

export default function CommunityMap() {
  const [filter, setFilter] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(14);

  const placesWithCoords = placesDatabase.filter((p) => p.coords);
  const filtered =
    filter === 'all'
      ? placesWithCoords
      : placesWithCoords.filter((p) => p.type === filter);

  // Show labels only when zoom >= 16
  const showLabels = zoomLevel >= 16;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#1a1a1a' }}>
      {/*  Header  */}
      <div style={{ textAlign: 'center', padding: '32px 20px 16px' }}>
        <h2
          style={{
            fontFamily: 'Mitr, sans-serif',
            color: '#00a854',
            marginBottom: '8px',
            fontSize: '1.9rem',
          }}
        >
          แผนที่อินโฟกราฟิกชุมชนคลองไผ่
        </h2>
        <p style={{ color: '#aaa', marginBottom: '24px', fontFamily: 'Mitr, sans-serif' }}>
          แผนที่นำเที่ยวสำหรับนักเดินทาง — คลิกหมุดเพื่อดูรายละเอียด
        </p>

        {/* Filter buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '18px',
          }}
        >
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            const bgColor =
              active
                ? key === 'all'
                  ? '#555'
                  : TYPE_CONFIG[key].color
                : 'rgba(255,255,255,0.1)';
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '50px',
                  border: active ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  fontFamily: 'Mitr, sans-serif',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  background: bgColor,
                  color: '#fff',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px',
          }}
        >
          {Object.entries(TYPE_CONFIG).map(([type, { color, label }]) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#bbb',
                fontSize: '0.82rem',
                fontFamily: 'Mitr, sans-serif',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/*  Map  */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 60px' }}>
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          }}
        >
          <MapContainer
            center={[14.872085, 101.569337]}
            zoom={14}
            style={{ height: '620px', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />

            <ZoomTracker onZoomChange={setZoomLevel} />

            {filtered.map((place) => (
              <Marker
                key={place.id}
                position={place.coords}
                icon={icons[place.type] ?? icons.travel}
              >
                {/* Show permanent label only at zoom >= 16 */}
                {showLabels && (
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -30]}
                    className="leaflet-place-label"
                  >
                    <div>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                        }}
                      >
                        {/* Small point */}
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: TYPE_CONFIG[place.type]?.color ?? '#00a854',
                            display: 'inline-block',
                            flexShrink: 0,
                          }}
                        />

                        {TYPE_CONFIG[place.type]?.label}
                      </span>

                      <strong
                        style={{
                          display: 'block',
                          fontSize: '0.8rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {place.title}
                      </strong>
                    </div>
                  </Tooltip>
                )}

                <Popup maxWidth={270} minWidth={220}>
                  <div style={{ fontFamily: 'Mitr, sans-serif' }}>
                    <img
                      src={place.img}
                      alt={place.title}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />

                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: TYPE_CONFIG[place.type]?.color ?? '#00a854',
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {TYPE_CONFIG[place.type]?.label}
                    </span>

                    <strong style={{ fontSize: '0.9rem', lineHeight: 1.4, display: 'block', marginBottom: '6px' }}>
                      {place.title}
                    </strong>

                    {place.description && (
                      <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 6px' }}>
                        {place.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.75rem', color: '#777', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {place.workingHours && <span><strong>เวลาทำการ :</strong> {place.workingHours}</span>}
                      {place.phone && <span><strong>เบอร์โทรศัพท์ :</strong> {place.phone}</span>}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: '#555',
            fontFamily: 'Mitr, sans-serif',
            fontSize: '0.85rem',
            marginTop: '12px',
          }}
        >
          แสดง {filtered.length} จาก {placesWithCoords.length} สถานที่
        </p>
      </div>
    </div>
  );
}