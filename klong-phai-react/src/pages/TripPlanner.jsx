// src/pages/TripPlanner.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SwipeCard from '../components/SwipeCard';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const createNumberedIcon = (number, color = '#00a854') =>
  L.divIcon({
    className: 'custom-number-pin',
    html: `
      <div style="
        width: 30px; height: 30px; background: ${color}; color: #fff;
        border: 2px solid #fff; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; font-weight: bold;
        font-family: Mitr, sans-serif; font-size: 0.85rem;
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
  if (!place) return null;
  if (Array.isArray(place.coords) && place.coords.length === 2) {
    const lat = parseFloat(place.coords[0]);
    const lng = parseFloat(place.coords[1]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (place.lat !== undefined && place.lng !== undefined) {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  if (place.mapUrl) {
    const match = place.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || place.mapUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return [parseFloat(match[1]), parseFloat(match[2])];
  }
  return null;
};

const getPlaceQueryString = (place) => {
  const coords = extractCoords(place);
  if (coords) return `${coords[0]},${coords[1]}`;
  const title = place.title || place.title_en || place.name || place.nameEn || '';
  return title ? encodeURIComponent(title) : '';
};

export default function TripPlanner({ places = [], lang, selectedPlaces = [], setSelectedPlaces }) {
  const { i18n } = useTranslation();
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [internalSelected, setInternalSelected] = useState([]);
  const activeSelected = setSelectedPlaces ? selectedPlaces : internalSelected;
  const setActiveSelected = setSelectedPlaces || setInternalSelected;

  // คิวสถานที่สำหรับ Tinder Swipe (ถ้าโดนปัดซ้าย จะลบตัวเองออกจากคิวรายการนี้)
  const [swipeQueue, setSwipeQueue] = useState(places);

  // --- 🟢 ปัดขวา = เพิ่มเข้าทริป ---
  const handleSwipeRight = (place) => {
    const exists = activeSelected.some(p => (p.id || p.docId) === (place.id || place.docId));
    if (!exists) {
      setActiveSelected([...activeSelected, place]);
    }
  };

  // --- 🔴 ปัดซ้าย = ลบออกจากทริป + ลบออกจากคิวเลือก ---
  const handleSwipeLeft = (place) => {
    const targetId = place.id || place.docId;
    // 1. ลบออกจากทริปที่เลือกไว้ (ถ้ามี)
    setActiveSelected(activeSelected.filter(p => (p.id || p.docId) !== targetId));
    // 2. ลบออกจากคิว Tinder
    setSwipeQueue(swipeQueue.filter(p => (p.id || p.docId) !== targetId));
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

  // 🚀 กดกล่อง Drop Zone / ปุ่ม เพื่อเปิด Google Maps นำทาง
  const handleOpenGoogleMapsRoute = () => {
    if (activeSelected.length === 0) return;

    const items = activeSelected.map(p => getPlaceQueryString(p)).filter(Boolean);
    if (items.length === 0) return;

    let mapsUrl = '';
    if (items.length === 1) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${items[0]}`;
    } else {
      const origin = items[0];
      const destination = items[items.length - 1];
      const waypoints = items.slice(1, -1).join('|');
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${
        waypoints ? `&waypoints=${waypoints}` : ''
      }`;
    }
    window.open(mapsUrl, '_blank');
  };

  const routePolyline = activeSelected.map(p => extractCoords(p)).filter(Boolean);
  const mapCenter = routePolyline.length > 0 ? routePolyline[0] : [14.872085, 101.569337];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#1a1a1a', color: '#fff', fontFamily: 'Prompt, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 60px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.8rem', marginBottom: '8px' }}>
            {isEn ? 'Trip Planner' : 'วางแผนเส้นทางท่องเที่ยว'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
            📱 มือถือ: ปัดขวา = เพิ่มเข้าทริป | ปัดซ้าย = ข้าม/ลบออกจากคิว
            <br />
            💻 คอม: คลิกปุ่มเพิ่ม/ลบได้ทันที
          </p>
        </div>

        {/* 📍 Drop Zone Box (พอกดแล้วไปหน้า Google Maps Plan) */}
        <div 
          onClick={handleOpenGoogleMapsRoute}
          style={{ 
            background: activeSelected.length > 0 ? 'rgba(0, 168, 84, 0.12)' : 'rgba(255,255,255,0.03)', 
            padding: '20px', 
            borderRadius: '16px', 
            border: activeSelected.length > 0 ? '2px dashed #00a854' : '2px dashed rgba(255,255,255,0.2)',
            cursor: activeSelected.length > 0 ? 'pointer' : 'default',
            marginBottom: '24px',
            transition: 'all 0.2s ease',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontFamily: 'Mitr, sans-serif', margin: 0, color: '#00a854', fontSize: '1.1rem' }}>
              {isEn ? `Selected Places (${activeSelected.length})` : `จุดแวะในทริป (${activeSelected.length} สถานที่)`}
            </h3>
            
            {activeSelected.length > 0 && (
              <span style={{
                background: '#4285F4',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(66, 133, 244, 0.3)'
              }}>
                🚀 กดตรงนี้เพื่อนำทางบน Google Maps
              </span>
            )}
          </div>

          {/* รายการสถานที่ที่ถูกเพิ่มแล้ว */}
          {activeSelected.length === 0 ? (
            <div style={{ padding: '30px 10px', color: '#888' }}>
              ยังไม่มีสถานที่ในทริป (ปัดขวาจากคิวด้านล่างเพื่อเพิ่ม)
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              {activeSelected.map((place, index) => {
                const placeId = place.id || place.docId;
                const title = place.title || place.name;
                return (
                  <div
                    key={placeId || index}
                    onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้เปิด Map เวลาคลิกปุ่มย่อย
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '10px 14px',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: '#00a854', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                        {index + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem' }}>{title}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button disabled={index === 0} onClick={() => handleMove(index, -1)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>▲</button>
                      <button disabled={index === activeSelected.length - 1} onClick={() => handleMove(index, 1)} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>▼</button>
                      <button onClick={() => handleRemove(placeId)} style={{ background: 'rgba(255,77,77,0.2)', color: '#ff4d4d', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', marginLeft: '4px' }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Map View */}
        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <MapContainer center={mapCenter} zoom={13} style={{ height: '280px', width: '100%' }}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            {routePolyline.length > 1 && <Polyline positions={routePolyline} color="#00a854" weight={3} dashArray="6, 6" />}
            {activeSelected.map((place, idx) => {
              const coords = extractCoords(place);
              if (!coords) return null;
              return (
                <Marker key={place.id || place.docId || idx} position={coords} icon={createNumberedIcon(idx + 1)}>
                  <Tooltip permanent direction="top" offset={[0, -18]}><strong>#{idx + 1} {place.title || place.name}</strong></Tooltip>
                  <Popup><div><strong>{place.title || place.name}</strong></div></Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* 🎴 Swipe Queue Section (Tinder Style) */}
        <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.1rem', marginBottom: '12px' }}>
          คิวสถานที่แนะนำ ({swipeQueue.length})
        </h3>

        {swipeQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#777', background: '#222', borderRadius: '12px' }}>
            🎉 คุณปัดเลือกครบทุกสถานที่ในคิวแล้ว!
          </div>
        ) : (
          <div>
            {swipeQueue.map((place) => {
              const placeId = place.id || place.docId;
              const isAdded = activeSelected.some(p => (p.id || p.docId) === placeId);
              return (
                <SwipeCard
                  key={placeId}
                  place={place}
                  isAdded={isAdded}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}