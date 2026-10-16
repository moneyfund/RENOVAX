export const MODULES = [
  {id:'ambiental',short:'AMBIENTAL',title:'Ríos y laderas',description:'Observación ambiental y registro de señales de riesgo',status:'En desarrollo',metric:'02',unit:'puntos de muestra',color:'#b599f9',serial:'RVX-ENV',icon:'waves'},
  {id:'sismico',short:'SÍSMICO',title:'Actividad sísmica',description:'Lectura local de aceleración; no es alerta sísmica oficial',status:'Experimental',metric:'3 ejes',unit:'acelerómetro',color:'#e3a5fe',serial:'RVX-SEI',icon:'activity'},
  {id:'transporte',short:'MOVILIDAD',title:'Transporte y GPS',description:'Posición en primer plano de unidades autorizadas',status:'En desarrollo',metric:'02',unit:'rutas de muestra',color:'#8f9ffc',serial:'RVX-GPS',icon:'navigation'},
  {id:'seguridad',short:'SEGURIDAD',title:'Vigilancia local',description:'Cámara bajo permiso y registro manual de incidentes',status:'Experimental',metric:'Cámara',unit:'bajo permiso',color:'#ce8dce',serial:'RVX-SEC',icon:'shield'},
];
export const SAMPLE_POINTS = [
  {id:'env-01',type:'ambiental',name:'Cuenca Río Grande',subtitle:'Matagalpa · estación conceptual',lat:12.9271,lng:-85.9165,status:'Muestra',value:'Observación visual',symbol:'◈'},
  {id:'env-02',type:'ambiental',name:'Ladera El Tuma',subtitle:'Matagalpa · estación conceptual',lat:13.0340,lng:-85.7477,status:'Muestra',value:'Inclinación / terreno',symbol:'◈'},
  {id:'sei-01',type:'sismico',name:'Nodo de vibración',subtitle:'Estelí · ubicación ilustrativa',lat:13.0919,lng:-86.3538,status:'Muestra',value:'Acelerómetro',symbol:'≋'},
  {id:'gps-01',type:'transporte',name:'Ruta urbana 01',subtitle:'Managua · marcador demostrativo',lat:12.1355,lng:-86.2512,status:'Muestra',value:'Posición no real',symbol:'➤'},
  {id:'gps-02',type:'transporte',name:'Ruta urbana 02',subtitle:'León · marcador demostrativo',lat:12.4379,lng:-86.8780,status:'Muestra',value:'Posición no real',symbol:'➤'},
  {id:'sec-01',type:'seguridad',name:'Punto de seguridad',subtitle:'Granada · estación conceptual',lat:11.9309,lng:-85.9560,status:'Muestra',value:'Cámara local',symbol:'⌑'},
];
export const SAMPLE_EVENTS = [
  {id:'e1',time:'—',kind:'ambiental',level:'INFO',title:'Cuenca Río Grande',detail:'Punto conceptual disponible para instrumentación'},
  {id:'e2',time:'—',kind:'sismico',level:'LAB',title:'Monitoreo de movimiento',detail:'Requiere calibración y validación instrumental'},
  {id:'e3',time:'—',kind:'transporte',level:'GPS',title:'Seguimiento de unidades',detail:'Habilitar ubicación desde un dispositivo autorizado'},
];
export const TITLES={resumen:'Centro de operaciones',ambiental:'Monitoreo ambiental',sismico:'Actividad y movimiento',transporte:'Movilidad y ubicación',seguridad:'Seguridad y observación',dispositivos:'Laboratorio de sensores',configuracion:'Sistema y conectividad'};
