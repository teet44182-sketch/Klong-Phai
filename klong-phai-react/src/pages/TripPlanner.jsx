// src/pages/TripPlanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '../context/ToastContext';

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

// ============================================================
// ✅ Parse iFrame URL
// ============================================================
const parseIframeUrl = (input) => {
  if (!input) return '';
  if (typeof input !== 'string') return '';

  if (input.includes('<iframe') || input.includes('iframe')) {
    let match = input.match(/src\s*=\s*["']([^"']+)["']/i);
    if (match) return match[1];
    match = input.match(/src\s*=\s*([^\s>]+)/i);
    if (match) return match[1];
  }

  if (input.includes('google.com/maps/embed')) return input;
  if (input.startsWith('http://') || input.startsWith('https://')) return input;
  if (input.startsWith('//')) return `https:${input}`;

  return input;
};

const extractCoordsFromUrl = (url) => {
  if (!url) return null;
  const cleanUrl = parseIframeUrl(url);

  const qMatch = cleanUrl.match(/[?&]q=([^&]+)/i);
  if (qMatch) {
    let q = decodeURIComponent(qMatch[1]).replace(/%2C/g, ',');
    const coordsMatch = q.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordsMatch) return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
  }

  const embedMatch = cleanUrl.match(/!2d([^!]+)!3d([^!]+)/i);
  if (embedMatch) return [parseFloat(embedMatch[2]), parseFloat(embedMatch[1])];

  const embedMatch2 = cleanUrl.match(/!3d([^!]+)!2d([^!]+)/i);
  if (embedMatch2) return [parseFloat(embedMatch2[1]), parseFloat(embedMatch2[2])];

  const atMatch = cleanUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/i);
  if (atMatch) return [parseFloat(atMatch[1]), parseFloat(atMatch[2])];

  const centerMatch = cleanUrl.match(/[?&]center=([^&]+)/i);
  if (centerMatch) {
    const center = decodeURIComponent(centerMatch[1]);
    const coordsMatch = center.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
    if (coordsMatch) return [parseFloat(coordsMatch[1]), parseFloat(coordsMatch[2])];
  }

  return null;
};

const getPlaceCoords = (place) => {
  if (!place) return null;
  if (Array.isArray(place.coords) && place.coords.length === 2) {
    return [parseFloat(place.coords[0]), parseFloat(place.coords[1])];
  }
  const lat = parseFloat(place.lat || place.latitude);
  const lng = parseFloat(place.lng || place.longitude);
  if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  if (place.mapUrl) return extractCoordsFromUrl(place.mapUrl);
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

const COMBO_LIST = [
  {
    id: 'nature',
    title: 'เที่ยวธรรมชาติ 1 วัน',
    titleEn: 'Nature Day Trip',
    desc: 'จุดชมวิว + วัด + ผ่อนคลาย',
    keywords: ['เขา', 'วิว', 'วัด', 'น้ำ', 'ป่า', 'checkin', 'travel']
  },
  {
    id: 'food',
    title: 'กินเที่ยวคลองไผ่',
    titleEn: 'Food & Explore',
    desc: 'ร้านอาหารเด็ด + จุดเช็คอิน',
    keywords: ['restaurant', 'food', 'อาหาร', 'travel', 'checkin']
  },
  {
    id: 'relax',
    title: 'พักผ่อนชิล ๆ',
    titleEn: 'Chill & Stay',
    desc: 'ที่พัก + คาเฟ่ / ร้านอาหาร',
    keywords: ['accommodation', 'hotel', 'ที่พัก', 'restaurant', 'food']
  }
];

export default function TripPlanner({
  places = [],
  lang,
  selectedPlaces = [],
  setSelectedPlaces,
  generateMultiStopMapUrl: propsGenerateMultiStopMapUrl,
  estimateTripTime: propsEstimateTripTime,
  onRemoveFromPlan
}) {
  const { i18n } = useTranslation();
  const { showToast } = useToast();
  const currentLang = lang || ((i18n.language || 'th').startsWith('th') ? 'th' : 'en');
  const isEn = currentLang === 'en';

  const [internalSelected, setInternalSelected] = useState([]);
  const activeSelected = setSelectedPlaces ? selectedPlaces : internalSelected;
  const setActiveSelected = setSelectedPlaces || setInternalSelected;

  const [queue, setQueue] = useState(places);
  const [queueSearchKeyword, setQueueSearchKeyword] = useState('');

  // Responsive state for mobile/tablet
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setQueue(places);
  }, [places]);

  const filteredQueue = queue.filter(place => {
    const keyword = queueSearchKeyword.trim().toLowerCase();
    if (!keyword) return true;
    const name = (place.title || place.name || '').toLowerCase();
    const nameEn = (place.title_en || place.nameEn || '').toLowerCase();
    const desc = (place.description || '').toLowerCase();
    const descEn = (place.description_en || '').toLowerCase();
    const category = (place.category || '').toLowerCase();
    return name.includes(keyword) || nameEn.includes(keyword) || desc.includes(keyword) || descEn.includes(keyword) || category.includes(keyword);
  });

  const generateGoogleMapsUrl = (placesList) => {
    if (!placesList || placesList.length === 0) return '';
    const coordsList = placesList.map(p => getPlaceCoords(p)).filter(Boolean);
    if (coordsList.length === 0) {
      showToast('ไม่พบพิกัดของสถานที่');
      return '';
    }
    if (coordsList.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coordsList[0][0]},${coordsList[0][1]}`;
    }
    const origin = `${coordsList[0][0]},${coordsList[0][1]}`;
    const destination = `${coordsList[coordsList.length - 1][0]},${coordsList[coordsList.length - 1][1]}`;
    const waypoints = coordsList.slice(1, -1).map(c => `${c[0]},${c[1]}`).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) url += `&waypoints=${waypoints}`;
    return url;
  };

  const handleAdd = (place) => {
    const targetId = place.id || place.docId;
    const placeTitle = place.title || place.name || 'สถานที่';
    const exists = activeSelected.some(p => (p.id || p.docId) === targetId);
    if (exists) {
      showToast(`"${placeTitle}" ${isEn ? 'already in trip' : 'อยู่ในทริปแล้ว'}`);
      return;
    }
    setActiveSelected(prev => [...prev, place]);
    setQueue(prev => prev.filter(p => (p.id || p.docId) !== targetId));
    showToast(`${isEn ? 'Added' : 'เพิ่ม'} "${placeTitle}" ${isEn ? 'to trip' : 'ลงทริปแล้ว'}`);
  };

  const handleRemove = (place) => {
    const targetId = place.id || place.docId;
    const placeTitle = place.title || place.name || 'สถานที่';
    if (onRemoveFromPlan) {
      onRemoveFromPlan(place);
    } else {
      setActiveSelected(prev => prev.filter(p => (p.id || p.docId) !== targetId));
    }
    setQueue(prev => {
      if (prev.some(p => (p.id || p.docId) === targetId)) return prev;
      return [...prev, place];
    });
    showToast(`${isEn ? 'Removed' : 'ลบ'} "${placeTitle}" ${isEn ? 'from trip' : 'ออกจากทริปแล้ว'}`);
  };

  const handleNavigate = () => {
    if (activeSelected.length === 0) {
      showToast('กรุณาเลือกสถานที่ก่อน');
      return;
    }
    if (typeof propsGenerateMultiStopMapUrl === 'function') {
      const url = propsGenerateMultiStopMapUrl(activeSelected);
      if (url && url !== '#') {
        window.open(url, '_blank');
        return;
      }
    }
    const url = generateGoogleMapsUrl(activeSelected);
    if (url) window.open(url, '_blank');
    else showToast('ไม่พบพิกัดของสถานที่ที่เลือก');
  };

  const applyCombo = (combo) => {
    const matched = places.filter(p => {
      const cat = String(p.category || p.type || '').toLowerCase();
      const title = String(p.title || p.name || '').toLowerCase();
      return combo.keywords.some(k => cat.includes(k) || title.includes(k));
    }).slice(0, 5);

    if (matched.length === 0) {
      showToast('ไม่พบสถานที่ที่ตรงกับ Combo นี้');
      return;
    }

    const newOnes = matched.filter(m =>
      !activeSelected.some(s => (s.id || s.docId) === (m.id || m.docId))
    );

    if (newOnes.length === 0) {
      showToast('ℹสถานที่ใน Combo นี้อยู่ในทริปครบแล้ว');
      return;
    }

    setActiveSelected(prev => [...prev, ...newOnes]);
    const newIds = newOnes.map(p => p.id || p.docId);
    setQueue(prev => prev.filter(p => !newIds.includes(p.id || p.docId)));
    showToast(`เพิ่ม Combo "${isEn ? combo.titleEn : combo.title}" (${newOnes.length} ที่)`);
  };

  // Drag & Drop
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragItemRef = useRef(null);

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    dragItemRef.current = e.currentTarget;
    setTimeout(() => {
      if (e.currentTarget) {
        e.currentTarget.style.opacity = '0.5';
        e.currentTarget.style.transform = 'scale(0.95)';
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    if (dragItemRef.current) {
      dragItemRef.current.style.opacity = '1';
      dragItemRef.current.style.transform = 'scale(1)';
    }
    dragItemRef.current = null;
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(fromIndex) || fromIndex === toIndex) return;
    const updated = [...activeSelected];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setActiveSelected(updated);
    showToast(isEn ? `Reordered: #${fromIndex+1} → #${toIndex+1}` : `เปลี่ยนลำดับ: #${fromIndex+1} → #${toIndex+1}`);
  };

  const routePolyline = activeSelected.map(p => getPlaceCoords(p)).filter(Boolean);
  const defaultCenter = [14.872085, 101.569337];
  const mapCenter = routePolyline.length > 0 ? routePolyline[0] : defaultCenter;

  const totalTimeText = typeof propsEstimateTripTime === 'function'
    ? propsEstimateTripTime(activeSelected.length)
    : (() => {
        if (activeSelected.length === 0) return isEn ? '0 min' : '0 นาที';
        const minutes = activeSelected.length * 35 + Math.max(0, activeSelected.length - 1) * 12;
        if (minutes < 60) return `~${minutes} ${isEn ? 'min' : 'นาที'}`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (m === 0) return `~${h} ${isEn ? 'hr' : 'ชม.'}`;
        return `~${h} ${isEn ? 'hr' : 'ชม.'} ${m} ${isEn ? 'min' : 'นาที'}`;
      })();

  return (
    <div style={{
      paddingTop: '80px',
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      fontFamily: 'Prompt, sans-serif',
      touchAction: 'pan-y', // ✅ อนุญาตให้เลื่อนขึ้นลง แต่ป้องกันการซูม pinch
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.8rem', marginBottom: '4px' }}>
            {isEn ? 'Trip Planner' : 'วางแผนเส้นทางท่องเที่ยว'}
          </h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem' }}>
            {isEn ? 'Drag to reorder or use buttons' : 'ลากเพื่อเปลี่ยนลำดับ หรือใช้ปุ่มเพิ่ม/ลบ'}
          </p>
        </div>

        {/* Responsive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Combo */}
            <div>
              <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.05rem', marginBottom: '12px' }}>
                {isEn ? 'Recommended Combos' : 'Combo แนะนำ'}
              </h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {COMBO_LIST.map(combo => (
                  <button
                    key={combo.id}
                    onClick={() => applyCombo(combo)}
                    style={{
                      flex: '1 0 180px',
                      textAlign: 'left',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '14px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      color: '#fff',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(0,168,84,0.15)'}
                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ fontFamily: 'Mitr, sans-serif', fontWeight: 'bold', marginBottom: 4, fontSize: '0.95rem' }}>
                      {isEn ? combo.titleEn : combo.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{combo.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected places */}
            <div style={{
              background: activeSelected.length > 0 ? 'rgba(0, 168, 84, 0.12)' : 'rgba(255,255,255,0.03)',
              padding: '16px 20px',
              borderRadius: '16px',
              border: activeSelected.length > 0 ? '2px dashed #00a854' : '2px dashed rgba(255,255,255,0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Mitr, sans-serif', margin: 0, color: '#00a854', fontSize: '1.1rem' }}>
                    {isEn ? `Selected (${activeSelected.length})` : `จุดแวะในทริป (${activeSelected.length} สถานที่)`}
                  </h3>
                  {activeSelected.length > 0 && (
                    <p style={{ margin: '4px 0 0', color: '#aaa', fontSize: '0.85rem' }}>
                      {isEn ? 'Est. time' : 'เวลาโดยประมาณ'}: <strong style={{ color: '#fff' }}>{totalTimeText}</strong>
                    </p>
                  )}
                </div>
                {activeSelected.length > 0 && (
                  <button
                    onClick={handleNavigate}
                    style={{
                      background: '#4285F4',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.85rem',
                    }}
                  >
                    {isEn ? 'Navigate' : 'นำทาง'}
                  </button>
                )}
              </div>

              {activeSelected.length === 0 ? (
                <div style={{ padding: '20px 10px', color: '#888', textAlign: 'center' }}>
                  {isEn ? 'No places selected yet' : 'ยังไม่มีสถานที่ในทริป'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px', maxHeight: '300px', overflowY: 'auto' }}>
                  {activeSelected.map((place, index) => {
                    const placeId = place.id || place.docId;
                    const title = place.title || place.name || 'ไม่มีชื่อสถานที่';
                    const isDragging = draggingIndex === index;
                    const isDragOver = dragOverIndex === index && !isDragging;

                    return (
                      <div
                        key={placeId || index}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isDragOver ? 'rgba(0, 168, 84, 0.25)' : isDragging ? 'rgba(0, 168, 84, 0.15)' : 'rgba(255,255,255,0.06)',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          cursor: 'grab',
                          userSelect: 'none',
                          transition: 'all 0.25s',
                          transform: isDragOver ? 'scale(1.02)' : isDragging ? 'scale(0.95)' : 'scale(1)',
                          opacity: isDragging ? 0.6 : 1,
                          boxShadow: isDragOver ? '0 0 20px rgba(0,168,84,0.2)' : isDragging ? '0 20px 60px rgba(0,0,0,0.5)' : 'none',
                          border: isDragOver ? '2px dashed #00a854' : '2px solid transparent',
                          zIndex: isDragging ? 100 : 1,
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'none' }}>
                          <span style={{
                            background: '#00a854',
                            color: '#fff',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            flexShrink: 0
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ fontSize: '0.9rem', textAlign: 'left' }}>{title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: '#777', fontSize: '1.2rem', cursor: 'grab' }}></span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(place); }}
                            style={{
                              background: 'rgba(255,77,77,0.2)',
                              color: '#ff4d4d',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map - ล็อกการซูม */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '340px', width: '100%' }}
                scrollWheelZoom={false}   // ✅ ไม่ซูมด้วยเมาส์
                touchZoom={false}         // ✅ ไม่ซูมด้วยสองนิ้ว
                dragging={true}           // ✅ ยังลากแผนที่ได้
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController coordsList={routePolyline} />
                {routePolyline.length > 1 && (
                  <Polyline positions={routePolyline} color="#00a854" weight={3} dashArray="6, 6" />
                )}
                {activeSelected.map((place, idx) => {
                  const coords = getPlaceCoords(place);
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
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={queueSearchKeyword}
                onChange={(e) => setQueueSearchKeyword(e.target.value)}
                placeholder={isEn ? 'Search places...' : 'ค้นหาสถานที่...'}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'Prompt, sans-serif'
                }}
              />
            </div>

            <h3 style={{ fontFamily: 'Mitr, sans-serif', color: '#00a854', fontSize: '1.1rem', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                {isEn ? 'Suggested Places' : 'สถานที่แนะนำ'}
                {queueSearchKeyword.trim() !== '' && (
                  <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '8px', fontWeight: 'normal' }}>
                    ({filteredQueue.length} {isEn ? 'results' : 'ผลลัพธ์'})
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#888', fontWeight: 'normal' }}>
                {queue.length} {isEn ? 'total' : 'ทั้งหมด'}
              </span>
            </h3>

            {filteredQueue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#777', background: '#222', borderRadius: '12px' }}>
                {queueSearchKeyword.trim() !== ''
                  ? (isEn ? `No results found for "${queueSearchKeyword}"` : `ไม่พบผลลัพธ์สำหรับ "${queueSearchKeyword}"`)
                  : (isEn ? 'All places selected!' : 'คุณเลือกครบทุกสถานที่ในคิวแล้ว!')
                }
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                {filteredQueue.map((place, index) => {
                  const placeId = place.id || place.docId;
                  const isAdded = activeSelected.some(p => (p.id || p.docId) === placeId);
                  const title = place.title || place.name || 'ไม่มีชื่อสถานที่';
                  const imgUrl = place.img || place.imageUrl || place.image;

                  return (
                    <div
                      key={placeId ? `queue-${placeId}` : `queue-idx-${index}`}
                      style={{
                        background: '#252525',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {imgUrl && <img src={imgUrl} alt={title} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>{title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>
                            {place.category || 'สถานที่ท่องเที่ยว'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => (isAdded ? handleRemove(place) : handleAdd(place))}
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
                        {isAdded ? (isEn ? 'Remove' : 'ลบออก') : (isEn ? 'Add' : 'เพิ่ม')}
                      </button>
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