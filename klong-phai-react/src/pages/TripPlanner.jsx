// src/pages/TripPlanner.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
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

// 📌 สกัดพิกัดจากลิงก์หรือฟิลด์พิกัดโดยตรง (ไม่สนใจชื่อสถานที่)
const extractCoords = (place) => {
  if (!place) return null;

  // 1. ตรวจสอบจากฟิลด์ coords อาเรย์ [lat, lng]
  if (Array.isArray(place.coords) && place.coords.length === 2) {
    const p1 = parseFloat(place.coords[0]);
    const p2 = parseFloat(place.coords[1]);
    if (!isNaN(p1) && !isNaN(p2)) {
      if (p1 >= 5 && p1 <= 21) return [p1, p2];
      if (p2 >= 5 && p2 <= 21) return [p2, p1];
    }
  }

  // 2. ตรวจสอบจากฟิลด์ lat / lng เดี่ยวๆ
  const latVal = place.lat ?? place.latitude;
  const lngVal = place.lng ?? place.longitude;
  if (latVal !== undefined && lngVal !== undefined) {
    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  // 3. แกะพิกัดจากลิงก์ Google Maps โดยตรง (mapUrl, googleMap, map_url, map)
  const rawUrl = place.mapUrl || place.googleMap || place.map_url || place.map || '';
  if (typeof rawUrl === 'string' && rawUrl.trim() !== '') {
    try {
      const decodedUrl = decodeURIComponent(rawUrl);
      
      // ค้นหาแพทเทิร์น !3d และ !2d ในลิงก์ Google Maps
      const latMatch = decodedUrl.match(/!3d(-?\d+\.\d+)/);
      const lngMatch = decodedUrl.match(/!2d(-?\d+\.\d+)/);

      if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      }

      // ค้นหาแพทเทิร์น @lat,lng ในลิงก์
      const atMatch = decodedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (atMatch) {
        const lat = parseFloat(atMatch[1]);
        const lng = parseFloat(atMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
      }
    } catch (e) {
      console.error("Error parsing mapUrl:", e);
    }
  }

  return null;
};

function MapController({ coordsList }) {
  const map = useMap();

  useEffect(() => {
    if (coordsList && coordsList.length > 0) {
      if (coordsList.length === 1) {
        map.setView(coordsList[0], 15, { animate: true });
      } else {
        const bounds = L.latLngBounds(coordsList);
        map.fitBounds(bounds, { padding: [40, 40], animate: true });
      }
    }
  }, [coordsList, map]);

  return null;
}

export default function TripPlanner({ places = [], lang, selectedPlaces = [], setSelectedPlaces, generateMultiStopMapUrl }) {
  const { i18n } = useTranslation();
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [internalSelected, setInternalSelected] = useState([]);
  const activeSelected = setSelectedPlaces ? selectedPlaces : internalSelected;
  const setActiveSelected = setSelectedPlaces || setInternalSelected;

  const [swipeQueue, setSwipeQueue] = useState(places);

  useEffect(() => {
    setSwipeQueue(places);
  }, [places]);

  const handleSwipeRight = (place) => {
    const targetId = place.id || place.docId;
    const exists = activeSelected.some(p => (p.id || p.docId) === targetId);
    if (!exists) {
      setActiveSelected(prev => [...prev, place]);
    }
  };

  const handleSwipeLeft = (place) => {
    const targetId = place.id || place.docId;
    setActiveSelected(prev => prev.filter(p => (p.id || p.docId) !== targetId));
    setSwipeQueue(prev => prev.filter(p => (p.id || p.docId) !== targetId));
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
    setActiveSelected(prev => prev.filter(p => (p.id || p.docId) !== id));
  };

  // 🚀 เปิด Google Maps โดยใช้พิกัดที่แกะได้จากลิงก์ล้วนๆ
  const handleOpenGoogleMapsRoute = () => {
    if (activeSelected.length === 0) return;

    if (typeof generateMultiStopMapUrl === 'function') {
      const url = generateMultiStopMapUrl(activeSelected);
      if (url && url !== '#') {
        window.open(url, '_blank');
        return;
      }
    }

    const items = activeSelected.map(p => {
      const coords = extractCoords(p);
      if (coords) return `${coords[0]},${coords[1]}`;
      return null;
    }).filter(Boolean);

    if (items.length === 0) {
      alert("ไม่พบพิกัดจากลิงก์ของสถานที่ที่เลือก");
      return;
    }

    let mapsUrl = '';
    if (items.length === 1) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${items[0]}`;
    } else {
      const origin = items[0];
      const destination = items[items.length - 1];
      const waypoints = items.slice(1, -1).join('|');
      mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
    }

    window.open(mapsUrl, '_blank');
  };

  const routePolyline = activeSelected.map(p => extractCoords(p)).filter(Boolean);
  const defaultCenter = [14.872085, 101.569337];
  const mapCenter = routePolyline.length > 0 ? routePolyline[0] : defaultCenter;

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#1a1a1a', color: '#fff', fontFamily: 'Prompt, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px 60px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.8rem', marginBottom: '8px' }}>
            {isEn ? 'Trip Planner' : 'วางแผนเส้นทางท่องเที่ยว'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
            มือถือ: ปัดขวา = เพิ่มเข้าทริป | ปัดซ้าย = ข้าม/ลบออกจากคิว
            <br />
            คอม: คลิกปุ่มเพิ่ม/ลบได้ทันที
          </p>
        </div>

        {/* Drop Zone Box */}
        <div 
          onClick={handleOpenGoogleMapsRoute}
          style={{ 
            background: activeSelected.length > 0 ? 'rgba(0, 168, 84, 0.12)' : 'rgba(255,255,255,0.03)', 
            padding: '20px', 
            borderRadius: '16px', 
            border: activeSelected.length > 0 ? '2px dashed #00a854' : '2px dashed rgba(255,255,255,0.2)',
            cursor: activeSelected.length > 0 ? 'pointer' : 'default',
            marginBottom: '24px',
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
                เปิดเส้นทาง
              </span>
            )}
          </div>

          {activeSelected.length === 0 ? (
            <div style={{ padding: '30px 10px', color: '#888' }}>
              ยังไม่มีสถานที่ในทริป
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              {activeSelected.map((place, index) => {
                const placeId = place.id || place.docId;
                const title = place.title || place.name || 'ไม่มีชื่อสถานที่';

                return (
                  <div
                    key={placeId || index}
                    onClick={(e) => e.stopPropagation()}
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
          <MapContainer center={mapCenter} zoom={13} style={{ height: '320px', width: '100%' }}>
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            
            <MapController coordsList={routePolyline} />

            {routePolyline.length > 1 && (
              <Polyline positions={routePolyline} color="#00a854" weight={3} dashArray="6, 6" />
            )}

            {activeSelected.map((place, idx) => {
              const coords = extractCoords(place);
              if (!coords) return null;
              const placeTitle = place.title || place.name || 'สถานที่';
              return (
                <Marker key={place.id || place.docId || idx} position={coords} icon={createNumberedIcon(idx + 1)}>
                  <Tooltip permanent direction="top" offset={[0, -18]}>
                    <strong>#{idx + 1} {placeTitle}</strong>
                  </Tooltip>
                  <Popup>
                    <div style={{ color: '#000' }}>
                      <strong>#{idx + 1} {placeTitle}</strong>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Queue List */}
        <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.1rem', marginBottom: '12px' }}>
          คิวสถานที่แนะนำ ({swipeQueue.length})
        </h3>

        {swipeQueue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#777', background: '#222', borderRadius: '12px' }}>
            🎉 คุณปัดเลือกครบทุกสถานที่ในคิวแล้ว!
          </div>
        ) : (
          <div>
            {swipeQueue.map((place, index) => {
              const placeId = place.id || place.docId;
              const isAdded = activeSelected.some(p => (p.id || p.docId) === placeId);
              const title = place.title || place.name || 'ไม่มีชื่อสถานที่';
              const imgUrl = place.img || place.imageUrl || place.image;

              return (
                <SwipeCard
                  key={placeId ? `queue-${placeId}` : `queue-idx-${index}`}
                  isAdded={isAdded}
                  onSwipeRight={() => handleSwipeRight(place)}
                  onSwipeLeft={() => handleSwipeLeft(place)}
                >
                  <div style={{
                    background: '#252525',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {imgUrl && (
                        <img 
                          src={imgUrl} 
                          alt={title} 
                          style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>
                          {place.category || 'สถานที่ท่องเที่ยว'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (isAdded) {
                          handleRemove(placeId);
                        } else {
                          handleSwipeRight(place);
                        }
                      }}
                      style={{
                        background: isAdded ? '#ff4d4d' : '#00a854',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '20px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {isAdded ? 'ลบออก' : '+ เพิ่ม'}
                    </button>
                  </div>
                </SwipeCard>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}