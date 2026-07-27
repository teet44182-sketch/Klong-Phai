// src/pages/TripPlanner.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ฟังก์ชันสร้างหมุดวงกลมตัวเลข
const createNumberedIcon = (number, color = '#00a854') =>
  L.divIcon({
    className: 'custom-number-pin',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: ${color};
        color: #fff;
        border: 2px solid #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-family: Mitr, sans-serif;
        font-size: 0.85rem;
        box-shadow: 0 4px 10px rgba(0,0,0,0.4);
      ">
        ${number}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });

const extractCoords = (place) => {
  if (Array.isArray(place.coords) && place.coords.length === 2) {
    return [parseFloat(place.coords[0]), parseFloat(place.coords[1])];
  }
  if (place.lat && place.lng) {
    return [parseFloat(place.lat), parseFloat(place.lng)];
  }
  if (place.latitude && place.longitude) {
    return [parseFloat(place.latitude), parseFloat(place.longitude)];
  }
  return null;
};

export default function TripPlanner({ places = [], lang, selectedPlaces = [], setSelectedPlaces }) {
  const { i18n } = useTranslation();
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  // Internal state กรณีไม่ได้ส่ง selectedPlaces จาก Parent
  const [internalSelected, setInternalSelected] = useState([]);
  const activeSelected = setSelectedPlaces ? selectedPlaces : internalSelected;
  const setActiveSelected = setSelectedPlaces || setInternalSelected;

  // State สำหรับเช็คว่ากำลังลากวัตถุเข้ามาวางใน Drop Zone อยู่หรือไม่ (ใช้ทำ UI highlight)
  const [isDragOver, setIsDragOver] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const PRESET_COMBOS = [
    {
      id: 'street_food_combo',
      title: isEn ? 'Street Food Tour' : 'ทริปสตรีทฟู้ด',
      filterFn: (p) => ['street_food', 'restaurant', 'food'].includes((p.category || p.type || '').toLowerCase())
    },
    {
      id: 'chill_nature_combo',
      title: isEn ? 'Dam View & Chill' : 'ทริปชมเขื่อนรับลม',
      filterFn: (p) => ['checkin', 'travel', 'attraction'].includes((p.category || p.type || '').toLowerCase())
    }
  ];

  const handleSelectCombo = (combo) => {
    const matched = places.filter(combo.filterFn).slice(0, 5);
    setActiveSelected(matched);
  };

  const handleAddPlace = (place) => {
    const exists = activeSelected.some(p => (p.id || p.docId) === (place.id || place.docId));
    if (!exists) {
      setActiveSelected([...activeSelected, place]);
    }
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  // --- Handlers สำหรับ Drag & Drop ---
  const handleDragOver = (e) => {
    e.preventDefault(); // จำเป็นเพื่อเปิดให้อนุญาตการ drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const droppedPlace = JSON.parse(rawData);
      handleAddPlace(droppedPlace);
    } catch (err) {
      console.error("Failed to parse dragged place:", err);
    }
  };

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeSelected.length) return;
    const updated = [...activeSelected];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setActiveSelected(updated);
  };

  const handleRemove = (id) => {
    setActiveSelected(activeSelected.filter(p => (p.id || p.docId) !== id));
  };

  const handleClearAll = () => {
    setActiveSelected([]);
  };

  const handleOpenGoogleMapsRoute = () => {
    if (activeSelected.length === 0) return;

    const coordsList = activeSelected
      .map(p => extractCoords(p))
      .filter(Boolean)
      .map(c => `${c[0]},${c[1]}`);

    if (coordsList.length === 0) {
      alert(isEn ? "No valid coordinates found." : "ไม่พบพิกัดที่ถูกต้องสำหรับนำทาง");
      return;
    }

    const mapsUrl = `https://www.google.com/maps/dir/${coordsList.join('/')}`;
    window.open(mapsUrl, '_blank');
  };

  const routePolyline = activeSelected.map(p => extractCoords(p)).filter(Boolean);
  const mapCenter = routePolyline.length > 0 ? routePolyline[0] : [14.872085, 101.569337];

  // กรองรายการค้นหา
  const filteredPlaces = places.filter(place => {
    const title = isEn ? (place.title_en || place.nameEn || place.title) : (place.title || place.name);
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#1a1a1a', color: '#fff', fontFamily: 'Prompt, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 60px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.8rem', marginBottom: '8px' }}>
            {isEn ? 'Custom Trip Planner' : 'วางแผนเส้นทางท่องเที่ยว'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
            {isEn 
              ? 'Drag and drop cards, search places, or select a preset route' 
              : 'ลาก Card มาวาง ค้นหาสถานที่ หรือเลือกทริปแนะนำเพื่อเริ่มจัดเส้นทาง'}
          </p>
        </div>

        {/* Preset Combos & Clear */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            {isEn ? 'Presets:' : 'ทริปแนะนำ:'}
          </span>
          {PRESET_COMBOS.map(combo => (
            <button
              key={combo.id}
              onClick={() => handleSelectCombo(combo)}
              style={{
                background: 'rgba(0, 168, 84, 0.15)',
                border: '1px solid #00a854',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'Mitr, sans-serif'
              }}
            >
              {combo.title}
            </button>
          ))}
          {activeSelected.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'rgba(255, 77, 77, 0.15)',
                border: '1px solid #ff4d4d',
                color: '#ff4d4d',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'Mitr, sans-serif'
              }}
            >
              {isEn ? 'Clear All' : 'ล้างเส้นทาง'}
            </button>
          )}
        </div>

        {/* Search Bar Component */}
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 25px auto' }}>
          <input
            type="text"
            placeholder={isEn ? 'Search and add places...' : 'พิมพ์ค้นหาสถานที่เพื่อเพิ่มเข้าทริป...'}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              background: '#2a2a2a',
              color: '#fff',
              fontSize: '0.95rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {/* Search Dropdown Results */}
          {isDropdownOpen && searchQuery.trim() !== '' && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#252525',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              marginTop: '4px',
              maxHeight: '250px',
              overflowY: 'auto',
              zIndex: 1000,
              boxShadow: '0 8px 20px rgba(0,0,0,0.5)'
            }}>
              {filteredPlaces.length === 0 ? (
                <div style={{ padding: '12px', color: '#888', textAlign: 'center', fontSize: '0.85rem' }}>
                  {isEn ? 'No places found' : 'ไม่พบสถานที่ที่ค้นหา'}
                </div>
              ) : (
                filteredPlaces.map(place => {
                  const placeId = place.id || place.docId;
                  const isAdded = activeSelected.some(p => (p.id || p.docId) === placeId);
                  const title = isEn ? (place.title_en || place.nameEn || place.title) : (place.title || place.name);

                  return (
                    <div
                      key={placeId}
                      onClick={() => !isAdded && handleAddPlace(place)}
                      style={{
                        padding: '10px 14px',
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: isAdded ? 'default' : 'pointer',
                        background: isAdded ? 'rgba(255,255,255,0.02)' : 'transparent'
                      }}
                    >
                      <span style={{ fontSize: '0.9rem', color: isAdded ? '#888' : '#fff' }}>{title}</span>
                      <span style={{ fontSize: '0.8rem', color: isAdded ? '#888' : '#00a854' }}>
                        {isAdded ? (isEn ? 'Added' : 'เพิ่มแล้ว') : (isEn ? '+ Add' : '+ เพิ่ม')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Layout Grid: Map + Itinerary Drop Zone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Map Section */}
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <MapContainer center={mapCenter} zoom={13} style={{ height: '380px', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />

              {routePolyline.length > 1 && (
                <Polyline positions={routePolyline} color="#00a854" weight={3} dashArray="6, 6" />
              )}

              {activeSelected.map((place, idx) => {
                const coords = extractCoords(place);
                if (!coords) return null;

                const title = isEn ? (place.title_en || place.nameEn || place.title) : (place.title || place.name);

                return (
                  <Marker key={place.id || place.docId || idx} position={coords} icon={createNumberedIcon(idx + 1)}>
                    <Tooltip permanent direction="top" offset={[0, -18]}>
                      <strong>#{idx + 1} {title}</strong>
                    </Tooltip>
                    <Popup>
                      <div style={{ color: '#000', fontFamily: 'Prompt, sans-serif' }}>
                        <strong>{title}</strong>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Itinerary Control Box (พร้อมรองรับ Drag & Drop) */}
          <div 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ 
              background: isDragOver ? 'rgba(0, 168, 84, 0.12)' : 'rgba(255,255,255,0.04)', 
              padding: '20px', 
              borderRadius: '12px', 
              border: isDragOver ? '2px dashed #00a854' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontFamily: 'Mitr, sans-serif', margin: 0, color: '#00a854', fontSize: '1.1rem' }}>
                {isEn ? `Itinerary (${activeSelected.length})` : `ลำดับจุดแวะ (${activeSelected.length} สถานที่)`}
              </h3>
              
              {activeSelected.length > 0 && (
                <button
                  onClick={handleOpenGoogleMapsRoute}
                  style={{
                    background: '#4285F4',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontFamily: 'Mitr, sans-serif',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isEn ? 'Navigate on Google Maps' : 'นำทางบน Google Maps'}
                </button>
              )}
            </div>

            {activeSelected.length === 0 ? (
              <div style={{ 
                border: '2px dashed rgba(255,255,255,0.15)', 
                borderRadius: '8px', 
                padding: '30px 20px', 
                textAlign: 'center',
                background: isDragOver ? 'rgba(0, 168, 84, 0.08)' : 'transparent'
              }}>
                <p style={{ color: isDragOver ? '#00a854' : '#aaa', margin: 0, fontSize: '0.95rem', fontWeight: isDragOver ? 'bold' : 'normal' }}>
                  {isDragOver 
                    ? (isEn ? 'Release to add to trip!' : 'ปล่อยวางตรงนี้เพื่อเพิ่มลงทริป!') 
                    : (isEn ? 'Drag Card here or search above to add places.' : 'ลาก Card มาวางที่นี่ หรือ ค้นหาเพื่อเพิ่มสถานที่')}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSelected.map((place, index) => {
                  const placeId = place.id || place.docId;
                  const title = isEn ? (place.title_en || place.nameEn || place.title) : (place.title || place.name);
                  return (
                    <div
                      key={placeId || index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#00a854', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                          {index + 1}
                        </span>
                        <span style={{ fontSize: '0.9rem' }}>{title}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button disabled={index === 0} onClick={() => handleMove(index, -1)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', opacity: index === 0 ? 0.3 : 1 }}>
                          ▲
                        </button>
                        <button disabled={index === activeSelected.length - 1} onClick={() => handleMove(index, 1)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', opacity: index === activeSelected.length - 1 ? 0.3 : 1 }}>
                          ▼
                        </button>
                        <button onClick={() => handleRemove(placeId)} style={{ background: 'rgba(255,77,77,0.2)', color: '#ff4d4d', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', marginLeft: '4px' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}