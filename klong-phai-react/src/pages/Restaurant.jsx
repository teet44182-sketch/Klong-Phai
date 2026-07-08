// src/pages/Restaurant.jsx
import React from 'react';
import { placesDatabase } from '../placesData';
import Card from '../components/Card';

export default function Restaurant({ onOpenMap }) {
  // กรองเอาเฉพาะข้อมูลที่เป็นร้านอาหาร
  const restaurants = placesDatabase.filter(place => place.type === 'restaurant');

  return (
    <div style={{ paddingTop: '100px', paddingLeft: '50px', paddingRight: '50px' }}>
      <h2 style={{ fontFamily: 'Mitr', marginBottom: '25px', color: '#00a854' }}>🍴 แนะนำร้านอาหาร คลองไผ่</h2>
      <div className="results-grid">
        {restaurants.map(place => (
          <Card key={place.id} place={place} onOpenMap={onOpenMap} />
        ))}
      </div>
    </div>
  );
}