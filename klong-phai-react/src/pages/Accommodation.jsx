// src/pages/Accommodation.jsx
import React from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Accommodation({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นที่พัก
  const accommodations = placesDatabase.filter(place => place.type === 'accommodation');

  return (
    <div style={{ paddingTop: '100px', paddingLeft: '50px', paddingRight: '50px' }}>
      <h2 style={{ fontFamily: 'Mitr', marginBottom: '25px', color: '#00a854' }}>🏨 แนะนำที่พัก คลองไผ่</h2>
      <div className="results-grid">
        {accommodations.map(place => (
          <Card key={place.id} place={place} onOpenMap={onOpenMap} />
        ))}
      </div>
    </div>
  );
}