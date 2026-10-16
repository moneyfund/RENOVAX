import { useEffect,useRef,useState } from 'react';
import { Activity, Camera, CameraOff, Check, Compass, Crosshair, LocateFixed, Mic2, RadioTower, ShieldCheck, Volume2, WifiOff, X } from 'lucide-react';
export function useDeviceSensors(){
 const [location,setLocation]=useState(null),[motion,setMotion]=useState(null),[gpsStatus,setGpsStatus]=useState('inactive'),[motionStatus,setMotionStatus]=useState('inactive');
 const geoWatch=useRef(null),motionHandler=useRef(null);
 const startGPS=()=>{
  if(!('geolocation'in navigator)){setGpsStatus('unsupported');return;}
  setGpsStatus('requesting');
  if(geoWatch.current!==null)return;
  geoWatch.current=navigator.geolocation.watchPosition(p=>{setLocation({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,speed:p.coords.speed,heading:p.coords.heading,timestamp:p.timestamp});setGpsStatus('active')},()=>{setGpsStatus('denied');stopGPS()}, {enableHighAccuracy:true,maximumAge:5000,timeout:18000});
 };
 const stopGPS=()=>{if(geoWatch.current!==null&&'geolocation'in navigator)navigator.geolocation.clearWatch(geoWatch.current);geoWatch.current=null;setGpsStatus(s=>s==='denied'?'denied':'inactive');};
 const startMotion=async()=>{
  if(!('DeviceMotionEvent'in window)){setMotionStatus('unsupported');return;}
  try{
   if(typeof DeviceMotionEvent.requestPermission==='function'){const permission=await DeviceMotionEvent.requestPermission();if(permission!=='granted'){setMotionStatus('denied');return;}}
   if(motionHandler.current)return;
   motionHandler.current=(event)=>{const a=event.acceleration||event.accelerationIncludingGravity; if(!a)return;const x=Number(a.x??0),y=Number(a.y??0),z=Number(a.z??0);setMotion({x,y,z,magnitude:Math.sqrt(x*x+y*y+z*z),timestamp:Date.now()});};
   window.addEventListener('devicemotion',motionHandler.current);setMotionStatus('active');
  }catch{setMotionStatus('denied');}
 };
 const stopMotion=()=>{if(motionHandler.current)window.removeEventListener('devicemotion',motionHandler.current);motionHandler.current=null;setMotionStatus('inactive')};
 useEffect(()=>()=>{if(geoWatch.current!==null&&'geolocation'in navigator)navigator.geolocation.clearWatch(geoWatch.current);if(motionHandler.current)window.removeEventListener('devicemotion',motionHandler.current)},[]);
 return {location,motion,gpsStatus,motionStatus,startGPS,stopGPS,startMotion,stopMotion};
}
export function CameraPanel(){
 const video=useRef(null),stream=useRef(null),[cameraState,setCameraState]=useState('off'),[error,setError]=useState(''),[snapshot,setSnapshot]=useState('');
 const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;if(video.current)video.current.srcObject=null;setCameraState('off');};
 const start=async()=>{setError('');if(!navigator.mediaDevices?.getUserMedia){setError('Este navegador no ofrece acceso a cámara.');return;}try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});stream.current=s;if(video.current){video.current.srcObject=s;await video.current.play().catch(()=>{});}setCameraState('on');}catch(e){setError(e.name==='NotAllowedError'?'Debes autorizar la cámara en el navegador.':'No se pudo activar la cámara.');}};
 useEffect(()=>{if(cameraState!=='on'||!video.current||!stream.current)return;video.current.srcObject=stream.current;video.current.play().catch(()=>setError('No fue posible reproducir la imagen de la cámara.'));},[cameraState]);
 const take=()=>{if(!video.current?.videoWidth)return;const canvas=document.createElement('canvas');canvas.width=video.current.videoWidth;canvas.height=video.current.videoHeight;canvas.getContext('2d').drawImage(video.current,0,0);setSnapshot(canvas.toDataURL('image/jpeg',0.82));};
 useEffect(()=>()=>{stream.current?.getTracks().forEach(t=>t.stop());},[]);
 return <div className="camera-panel"><div className="camera-frame">{cameraState==='on'?<video ref={video} autoPlay muted playsInline/>:<div className="camera-placeholder"><div className="lens-icon"><Camera size={29}/></div><strong>VIDEO INPUT / 01</strong><span>Cámara desactivada</span></div>}<span className="cam-reticle cam-tl"/><span className="cam-reticle cam-tr"/><span className="cam-reticle cam-bl"/><span className="cam-reticle cam-br"/><div className="cam-state"><span className={cameraState==='on'?'live-dot':''}/>{cameraState==='on'?'CAPTURA LOCAL':'STANDBY'}</div></div><div className="camera-controls"><button className="secondary-btn" onClick={cameraState==='on'?stop:start}>{cameraState==='on'?<CameraOff size={15}/>:<Camera size={15}/>} {cameraState==='on'?'Desactivar cámara':'Activar cámara'}</button><button className="secondary-btn" disabled={cameraState!=='on'} onClick={take}><Crosshair size={15}/> Capturar</button></div>{error&&<p className="inline-error">{error}</p>}{snapshot&&<div className="shot-result"><img src={snapshot} alt="Captura temporal de la cámara"/><div><strong>Captura local</strong><small>No se ha enviado a ningún servidor</small><a href={snapshot} download="renovax-captura.jpg">Guardar imagen</a></div><button onClick={()=>setSnapshot('')} title="Cerrar"><X size={15}/></button></div>}</div>;
}
export function SensorReadout({sensors}){
 const {location,motion,gpsStatus,motionStatus,startGPS,stopGPS,startMotion,stopMotion}=sensors;
 const [soundState,setSoundState]=useState('');
 function sound(){try{const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error();const context=new Context();const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.setValueAtTime(660,context.currentTime);osc.frequency.exponentialRampToValueAtTime(880,context.currentTime+0.24);gain.gain.setValueAtTime(0.001,context.currentTime);gain.gain.exponentialRampToValueAtTime(0.08,context.currentTime+0.06);gain.gain.exponentialRampToValueAtTime(0.001,context.currentTime+0.3);osc.connect(gain).connect(context.destination);osc.start();osc.stop(context.currentTime+0.32);osc.onended=()=>context.close();setSoundState('Prueba emitida');}catch{setSoundState('Audio no disponible');}}
 return <div className="sensor-stack"><div className="sensor-row"><div className="sensor-ident"><span className="hardware-symbol"><LocateFixed size={18}/></span><div><strong>GNSS / GPS</strong><small>{gpsStatus==='active'?'Señal obtenida':gpsStatus==='denied'?'Permiso denegado':gpsStatus==='requesting'?'Solicitando señal':gpsStatus==='unsupported'?'No compatible':'Esperando autorización'}</small></div></div><button className={'toggle '+(gpsStatus==='active'?'on':'')} aria-label="Activar o desactivar GPS" aria-pressed={gpsStatus==='active'} onClick={gpsStatus==='active'?stopGPS:startGPS}><span/></button></div>{location&&<div className="sensor-values"><span>LAT <b>{location.lat.toFixed(5)}°</b></span><span>LON <b>{location.lng.toFixed(5)}°</b></span><span>± <b>{Math.round(location.accuracy)} m</b></span></div>}
 <div className="sensor-row"><div className="sensor-ident"><span className="hardware-symbol"><Activity size={18}/></span><div><strong>ACELERÓMETRO</strong><small>{motionStatus==='active'?'Lectura en primer plano':motionStatus==='denied'?'Permiso denegado':motionStatus==='unsupported'?'No compatible':'Sensor inactivo'}</small></div></div><button className={'toggle '+(motionStatus==='active'?'on':'')} aria-label="Activar o desactivar acelerómetro" aria-pressed={motionStatus==='active'} onClick={motionStatus==='active'?stopMotion:startMotion}><span/></button></div><div className="accelerometer"><div className="accel-bars">{['x','y','z'].map(k=><div className="axis" key={k}><span>{k.toUpperCase()}</span><div><i style={{width:`${Math.min(100,Math.abs(motion?.[k]||0)*8)}%`}}/></div><b>{motion?.[k]?.toFixed(2)??'—'}</b></div>)}</div><small>m/s² · lecturas de prueba, no certificadas</small></div>
 <div className="sensor-row"><div className="sensor-ident"><span className="hardware-symbol"><Volume2 size={18}/></span><div><strong>SALIDA DE AUDIO</strong><small>{soundState||'Comprobación de altavoz'}</small></div></div><button className="icon-action" onClick={sound} title="Reproducir prueba de altavoz"><Volume2 size={17}/></button></div>
 </div>;
}
