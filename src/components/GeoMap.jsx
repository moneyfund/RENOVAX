import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crosshair, Layers2, MapPin } from 'lucide-react';
import { SAMPLE_POINTS } from '../data.js';
const COLORS={ambiental:'#ba9cfa',sismico:'#deaeff',transporte:'#91a9ff',seguridad:'#e3a1d5',actual:'#a8fdce'};
const locIcon=(type,actual=false)=>L.divIcon({className:'rvx-map-icon',html:`<div class="rvx-pin ${actual?'real-pin':''}" style="--pin:${COLORS[type]||COLORS.actual}"><span>${actual?'◆':type==='transporte'?'➤':type==='ambiental'?'◈':type==='seguridad'?'⌑':'≋'}</span></div>`,iconSize:[42,42],iconAnchor:[21,21]});
export default function GeoMap({filter='todos',currentLocation=null,cloudDevices=[],onPointSelect,selectedId}){
 const element=useRef(null),map=useRef(null),markers=useRef(null);
 const [mapLoaded,setMapLoaded]=useState(false);
 useEffect(()=>{
  if(!element.current||map.current)return;
  const m=L.map(element.current,{zoomControl:false,attributionControl:true,minZoom:5,maxZoom:18,scrollWheelZoom:false}).setView([12.53,-85.9],7);map.current=m;markers.current=L.layerGroup().addTo(m);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',subdomains:'abcd',maxZoom:19}).addTo(m);
  L.control.zoom({position:'bottomright'}).addTo(m);
  const t=setTimeout(()=>{m.invalidateSize();setMapLoaded(true)},250);
  return()=>{clearTimeout(t);m.remove();map.current=null;markers.current=null;};
 },[]);
 useEffect(()=>{
  if(!map.current||!markers.current)return;
  markers.current.clearLayers();
  const filtered=SAMPLE_POINTS.filter(p=>filter==='todos'||p.type===filter);
  filtered.forEach(p=>{const marker=L.marker([p.lat,p.lng],{icon:locIcon(p.type)}).addTo(markers.current);marker.bindTooltip(`<strong>${p.name}</strong><br/><span>DEMO · ${p.subtitle}</span>`,{direction:'top',className:'rvx-tooltip'});marker.on('click',()=>onPointSelect?.(p));});
  cloudDevices.forEach(p=>{if(!Number.isFinite(p.lat)||!Number.isFinite(p.lng))return;const marker=L.marker([p.lat,p.lng],{icon:locIcon('actual',true)}).addTo(markers.current);marker.bindTooltip(`<strong>Dispositivo conectado</strong><br/>Ubicación compartida bajo consentimiento`,{direction:'top',className:'rvx-tooltip'});marker.on('click',()=>onPointSelect?.({id:p.id,type:'actual',name:p.name||'Dispositivo conectado',subtitle:'Ubicación compartida',value:'Telemetría real',status:'Conectado'}));});
  if(currentLocation){const marker=L.marker([currentLocation.lat,currentLocation.lng],{icon:locIcon('actual',true)}).addTo(markers.current);marker.bindTooltip('Este dispositivo · ubicación local',{direction:'top',className:'rvx-tooltip'});}
 },[mapLoaded,filter,currentLocation,cloudDevices,onPointSelect]);
 useEffect(()=>{if(!map.current||!selectedId)return;const p=SAMPLE_POINTS.find(x=>x.id===selectedId);if(p)map.current.flyTo([p.lat,p.lng],10,{duration:1.1});},[selectedId]);
 const focus=()=>{if(!map.current)return;map.current.flyTo(currentLocation?[currentLocation.lat,currentLocation.lng]:[12.53,-85.9],currentLocation?12:7,{duration:1.2});};
 return <div className="geomap"><div ref={element} className="leaflet-host"/><div className="map-graticule" aria-hidden="true"/><div className="map-top-tag"><span className="map-coord-dot"/> GEOESPACIAL <span className="map-top-divider"/> NICARAGUA</div><div className="map-floating-buttons"><button title="Centrar mapa" onClick={focus}><Crosshair size={16}/></button><button title="Mapa base Carto / OSM" onClick={()=>map.current?.invalidateSize()}><Layers2 size={16}/></button></div><div className="map-bottom-left"><MapPin size={12}/> 12.53° N / 85.90° O <span>·</span> ESCALA DINÁMICA</div><div className="map-north">N <span>↑</span></div></div>
}
