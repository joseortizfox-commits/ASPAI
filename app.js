(function(){
try{

  /* ============================= DATA ============================= */

  var CATS = {
    flour: { label:'Harina', color:'#E3A83B' },
    water: { label:'Agua', color:'#6C93AC' },
    salt: { label:'Sal', color:'#9C9184' },
    leaven: { label:'Levadura / M. madre', color:'#7C8A4E' },
    fat: { label:'Grasa / Aceite', color:'#B06B3C' },
    other: { label:'Otro', color:'#8C7B6B' }
  };

  function uid(p){ return (p||'id') + '_' + Math.random().toString(36).slice(2,9); }

  function seedRecipes(){
    return [
      {
        id: uid('r'), name:'Pan de Calabaza', notes:'Masa enriquecida con pulpa de calabaza y huevo.',
        pieceWeight: 460, pieceCount: 4.28,
        ingredients:[
          {id:uid('i'), name:'Harina de fuerza', grams:1000, cat:'flour'},
          {id:uid('i'), name:'Sal', grams:20, cat:'salt'},
          {id:uid('i'), name:'Levadura fresca', grams:12.5, cat:'leaven'},
          {id:uid('i'), name:'Masa madre', grams:200, cat:'leaven'},
          {id:uid('i'), name:'Pulpa de calabaza', grams:300, cat:'other'},
          {id:uid('i'), name:'Aceite de oliva', grams:100, cat:'fat'},
          {id:uid('i'), name:'Huevo (1 ud ≈ 60 g)', grams:60, cat:'other'},
          {id:uid('i'), name:'Agua', grams:275, cat:'water'}
        ],
        schedule:[
          {id:uid('s'), dia:'Día 1', hora:'09:00', paso:'Amasado', amasado:'Espiral / 8 min vel. 2', temp:'24 °C', min:8, notas:'8\' eu V2'},
          {id:uid('s'), dia:'Día 1', hora:'09:15', paso:'Reposo en bloque', amasado:'—', temp:'—', min:60, notas:''},
          {id:uid('s'), dia:'Día 1', hora:'10:30', paso:'Formado y frío', amasado:'—', temp:'4 °C', min:0, notas:'Fermentación en nevera'},
          {id:uid('s'), dia:'Día 2', hora:'08:00', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:35, notas:''}
        ]
      },
      {
        id: uid('r'), name:'Pan Tritordeum', notes:'Con escaldado y mejorante.',
        pieceWeight: 460, pieceCount: 4.7,
        ingredients:[
          {id:uid('i'), name:'Harina Tritordeum', grams:1000, cat:'flour'},
          {id:uid('i'), name:'Sal', grams:25, cat:'salt'},
          {id:uid('i'), name:'Levadura fresca', grams:15, cat:'leaven'},
          {id:uid('i'), name:'Mejorante', grams:10, cat:'other'},
          {id:uid('i'), name:'Masa madre', grams:250, cat:'leaven'},
          {id:uid('i'), name:'Agua', grams:500, cat:'water'},
          {id:uid('i'), name:'Aceite de oliva', grams:120, cat:'fat'},
          {id:uid('i'), name:'Escaldado', grams:250, cat:'other'}
        ],
        schedule:[
          {id:uid('s'), dia:'Día 1', hora:'08:30', paso:'Escaldado', amasado:'—', temp:'—', min:3, notas:'5\'\' reposo + escaldado 3\'\''},
          {id:uid('s'), dia:'Día 1', hora:'08:45', paso:'Amasado', amasado:'Batidora', temp:'24 °C', min:8, notas:'8 min a vel. 40 (batidora)'},
          {id:uid('s'), dia:'Día 1', hora:'09:00', paso:'Reposo en bloque', amasado:'—', temp:'—', min:60, notas:''},
          {id:uid('s'), dia:'Día 2', hora:'08:00', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:38, notas:''}
        ]
      },
      {
        id: uid('r'), name:'Pan Candeal', notes:'Miga prieta, harina marrón + fuerza.',
        pieceWeight: 650, pieceCount: 2.75,
        ingredients:[
          {id:uid('i'), name:'Harina marrón MF', grams:850, cat:'flour'},
          {id:uid('i'), name:'Harina de fuerza', grams:150, cat:'flour'},
          {id:uid('i'), name:'Sal', grams:20, cat:'salt'},
          {id:uid('i'), name:'Levadura fresca', grams:20, cat:'leaven'},
          {id:uid('i'), name:'Mejorante', grams:10, cat:'other'},
          {id:uid('i'), name:'Masa madre', grams:250, cat:'leaven'},
          {id:uid('i'), name:'Agua', grams:490, cat:'water'}
        ],
        schedule:[
          {id:uid('s'), dia:'Día 1', hora:'09:00', paso:'Amasado', amasado:'Espiral', temp:'23 °C', min:7, notas:'7"'},
          {id:uid('s'), dia:'Día 1', hora:'09:10', paso:'Reposo en bloque', amasado:'—', temp:'23 °C', min:45, notas:''},
          {id:uid('s'), dia:'Día 1', hora:'10:00', paso:'Formado', amasado:'—', temp:'—', min:0, notas:''},
          {id:uid('s'), dia:'Día 2', hora:'08:00', paso:'Horneado', amasado:'—', temp:'230 °C horno', min:32, notas:''}
        ]
      }
    ];
  }

  /* ============================= STATE ============================= */

  var state = {
    tab: 'calc',
    division: 'panaderia',
    subdivision: null,
    recipes: [],
    pantry: {},
    activeId: null,
    scaleMode: 'flour',
    scaleValue: 1000,
    scaleUnits: 4,
    ready: false
  };

  var timers = {}; // rowId -> {remaining, interval}
  var audioCtx = null;

  function beep(){
    try{
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      for (var i=0;i<3;i++){
        (function(i){
          setTimeout(function(){
            var o = audioCtx.createOscillator();
            var g = audioCtx.createGain();
            o.type = 'sine'; o.frequency.value = 880;
            g.gain.value = 0.08;
            o.connect(g); g.connect(audioCtx.destination);
            o.start(); o.stop(audioCtx.currentTime + 0.18);
          }, i*260);
        })(i);
      }
    }catch(e){}
  }

  /* ============================= RECETAS AÑADIDAS (lote 2) ============================= */

  function extraRecipesV2(){
    return [
      { name:'MM', notes:'Amasado en dos fases: se mezclan primero las harinas con el agua y se deja reposar 1 hora (previa/autólisis); después se incorpora la masa madre, la sal, la levadura y el bassinage.\n\nVariantes por cada 1000 g de masa: 20 g de chía, 150 g de semillas, 150 g de pasas/nueces (p/n) o 100 g de aceitunas.',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'FC gris', grams:450, cat:'flour'},
          {name:'G.F', grams:300, cat:'flour'},
          {name:'Centeno', grams:100, cat:'flour'},
          {name:'T80', grams:150, cat:'flour'},
          {name:'Agua (previa)', grams:620, cat:'water'},
          {name:'Masa madre', grams:200, cat:'leaven'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:1, cat:'leaven'},
          {name:'Bassinage', grams:60, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'09:00', paso:'Amasado inicial (harinas + agua)', amasado:'Espiral', temp:'—', min:5, notas:''},
          {dia:'Día 1', hora:'09:05', paso:'Reposo / previa', amasado:'—', temp:'—', min:60, notas:''},
          {dia:'Día 1', hora:'10:05', paso:'Amasado final (+mm, sal, levadura, bassinage)', amasado:'Espiral', temp:'28 °C', min:12, notas:"4' / 4+8''"}
        ]
      },
      { name:'Valencia', notes:'', pieceWeight:350, pieceCount:4.8,
        ingredients:[
          {name:'H. verde FF', grams:500, cat:'flour'},
          {name:'H. marrón MF', grams:500, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:10, cat:'leaven'},
          {name:'Mejorante', grams:6, cat:'other'},
          {name:'Masa madre', grams:30, cat:'leaven'},
          {name:'Agua', grams:620, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'09:00', paso:'Amasado', amasado:'—', temp:'24 °C', min:14, notas:"7' + 7''"},
          {dia:'Día 1', hora:'09:15', paso:'Reposo en bloque', amasado:'—', temp:'—', min:30, notas:''},
          {dia:'Día 1', hora:'09:45', paso:'Preforma', amasado:'—', temp:'—', min:30, notas:''},
          {dia:'Día 1', hora:'10:15', paso:'Fermentación final', amasado:'—', temp:'26 °C', min:150, notas:''}
        ]
      },
      { name:'Centeno 60/40', notes:'', pieceWeight:660, pieceCount:2.91,
        ingredients:[
          {name:'Harina GF', grams:400, cat:'flour'},
          {name:'Centeno integral', grams:600, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Masa madre', grams:200, cat:'leaven'},
          {name:'Malta', grams:3, cat:'other'},
          {name:'Agua', grams:700, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'09:00', paso:'Amasado', amasado:'—', temp:'27 °C', min:10, notas:'10"'}
        ]
      },
      { name:'Avena (martes y jueves)', notes:'Escaldado: 500 g de harina de avena + 1.000 g de agua a 100 °C.',
        pieceWeight:0, pieceCount:3.8,
        ingredients:[
          {name:'G.F', grams:1000, cat:'flour'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Masa madre', grams:250, cat:'leaven'},
          {name:'Escaldado 1', grams:375, cat:'other'},
          {name:'Agua', grams:500, cat:'water'},
          {name:'Escaldado 2', grams:375, cat:'other'}
        ],
        schedule:[
          {dia:'Martes / Jueves', hora:'', paso:'Amasado', amasado:'—', temp:'27 °C', min:10, notas:'10"'}
        ]
      },
      { name:'Algarroba (martes y jueves)', notes:'Cifras normalizadas a partir de la tabla original (lote de 2,5 kg); revisa el papel original antes de producir a escala real.',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Algarroba', grams:40, cat:'flour'},
          {name:'Centeno integral', grams:160, cat:'flour'},
          {name:'Agua (100 °C, escaldado)', grams:400, cat:'water'},
          {name:'Harina GF', grams:1000, cat:'flour'},
          {name:'Agua', grams:672, cat:'water'},
          {name:'Masa madre', grams:260, cat:'leaven'},
          {name:'Sal', grams:24, cat:'salt'}
        ],
        schedule:[
          {dia:'Martes / Jueves', hora:'', paso:'Amasado + escaldado', amasado:'—', temp:'—', min:10, notas:'7" + escaldado 3"'}
        ]
      },
      { name:'Centeno 100x100 (martes y jueves)',
        notes:'Proceso en 3 fases: PREVIA (centeno + mm + agua, reposo), 1ª MASA (+ centeno + agua a 40 °C + previa, reposo 2h30), 2ª MASA (+ centeno + agua a 30 °C + sal + aceite + 1ª masa). Cantidades combinadas (materia prima total) para una tanda de referencia de 6 unidades; consulta la foto original para el detalle de cada fase.',
        pieceWeight:0, pieceCount:6,
        ingredients:[
          {name:'Centeno integral (total)', grams:4000, cat:'flour'},
          {name:'Masa madre', grams:62, cat:'leaven'},
          {name:'Agua (total, varias temperaturas)', grams:3320, cat:'water'},
          {name:'Sal', grams:80, cat:'salt'},
          {name:'Aceite de oliva', grams:75, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Previa (centeno + mm + agua)', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'1ª masa (+centeno + agua 40 °C + previa)', amasado:'—', temp:'30 °C', min:150, notas:'reposo 2 h 30 m'},
          {dia:'Día 1', hora:'', paso:'2ª masa (+centeno + agua 30 °C + sal + aceite)', amasado:'—', temp:'30 °C', min:70, notas:"45' + 25'"},
          {dia:'Día 2', hora:'', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:40, notas:''}
        ]
      },
      { name:'Sarraceno 100x100 (martes y jueves)', notes:'', pieceWeight:0, pieceCount:8,
        ingredients:[
          {name:'Sarraceno (harina)', grams:3000, cat:'flour'},
          {name:'Sal', grams:60, cat:'salt'},
          {name:'Levadura', grams:60, cat:'leaven'},
          {name:'Agua (45 °C)', grams:3300, cat:'water'}
        ],
        schedule:[
          {dia:'Martes / Jueves', hora:'', paso:'Amasado', amasado:'—', temp:'—', min:10, notas:''},
          {dia:'Martes / Jueves', hora:'', paso:'Fermentación', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Martes / Jueves', hora:'', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:35, notas:''}
        ]
      },
      { name:'Valencia Fría', notes:'', pieceWeight:340, pieceCount:5,
        ingredients:[
          {name:'FFFS naranja', grams:700, cat:'flour'},
          {name:'FC', grams:300, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:10, cat:'leaven'},
          {name:'Mejorante', grams:10, cat:'other'},
          {name:'Masa madre', grams:30, cat:'leaven'},
          {name:'Agua (6 °C)', grams:640, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'24 °C', min:14, notas:"7' + 7''"}
        ]
      },
      { name:'Espelta', notes:'', pieceWeight:0, pieceCount:2.94,
        ingredients:[
          {name:'H. espelta', grams:1000, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:1, cat:'leaven'},
          {name:'Masa madre', grams:200, cat:'leaven'},
          {name:'Agua', grams:720, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'26 °C', min:13, notas:"13' + 0''"}
        ]
      },
      { name:'Maíz', notes:'', pieceWeight:0, pieceCount:4.32,
        ingredients:[
          {name:'Harina GF', grams:1000, cat:'flour'},
          {name:'Maíz tostado', grams:40, cat:'other'},
          {name:'Cúrcuma', grams:2.5, cat:'other'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Masa madre', grams:250, cat:'leaven'},
          {name:'Escaldado 1', grams:375, cat:'other'},
          {name:'Agua', grams:600, cat:'water'},
          {name:'Escaldado 2', grams:375, cat:'other'},
          {name:'Aceite de oliva', grams:60, cat:'fat'},
          {name:'Pipas de girasol', grams:125, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado + escaldado', amasado:'—', temp:'28 °C', min:11, notas:'8" + escaldado 3"'}
        ]
      },
      { name:'Integral', notes:'Variante con semillas: añadir aprox. un 6,4% en peso de semillas mixtas al total de la masa.',
        pieceWeight:0, pieceCount:3,
        ingredients:[
          {name:'Integral t150', grams:1000, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Masa madre', grams:200, cat:'leaven'},
          {name:'Agua', grams:725, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'28 °C', min:14, notas:"9' + 5''"}
        ]
      },
      { name:'Trigo Duro', notes:'', pieceWeight:0, pieceCount:3.82,
        ingredients:[
          {name:'H. trigo duro', grams:1000, cat:'flour'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Masa madre', grams:250, cat:'leaven'},
          {name:'Agua (30 °C)', grams:500, cat:'water'},
          {name:'Escaldado 1', grams:375, cat:'other'},
          {name:'Escaldado 2', grams:375, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado + escaldado', amasado:'—', temp:'28 °C', min:11, notas:'8" + escaldado 3"'}
        ]
      },
      { name:'Sarraceno 60/40', notes:'En la foto original una mancha tapa una celda; se ha reconstruido una cantidad estimada de harina de sarraceno (200 g) para que el total cuadre con el 2.785 anotado a mano. Revisa el papel original si tienes dudas.',
        pieceWeight:0, pieceCount:4.22,
        ingredients:[
          {name:'Sarraceno (harina, estimado)', grams:200, cat:'flour'},
          {name:'Harina GF', grams:1000, cat:'flour'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Masa madre', grams:250, cat:'leaven'},
          {name:'Escaldado 1', grams:370, cat:'other'},
          {name:'Agua', grams:570, cat:'water'},
          {name:'Escaldado 2', grams:370, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'27 °C', min:8, notas:'8"'}
        ]
      },
      { name:'Aspai', notes:'Autólisis de 1 hora entre la harina y el agua antes de añadir el resto. El tiempo de frío varía según la cantidad de masa (aprox. 4 a 13 h a 4 °C).',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'H. Julia', grams:1000, cat:'flour'},
          {name:'Agua (17 °C)', grams:700, cat:'water'},
          {name:'Masa madre', grams:150, cat:'leaven'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:5, cat:'leaven'},
          {name:'Bassinage (6 °C)', grams:50, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'09:00', paso:'Amasado harina + agua', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Autólisis', amasado:'—', temp:'—', min:60, notas:''},
          {dia:'Día 1', hora:'', paso:'Amasado final (+mm, sal, levadura, bassinage)', amasado:'—', temp:'25 °C', min:14, notas:"9' + 5''"},
          {dia:'Día 1', hora:'', paso:'Bloque + pliegue + frío', amasado:'—', temp:'4 °C', min:40, notas:'Frío: 4-13 h según cantidad'},
          {dia:'Día 2', hora:'', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:35, notas:''}
        ]
      },
      { name:'Barra Integral', notes:'Poolish: 175 g harina + 175 g agua + 2,5 g levadura, fermentado antes de incorporar al resto.',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Harina GF', grams:250, cat:'flour'},
          {name:'Harina t150', grams:750, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:2.5, cat:'leaven'},
          {name:'Masa madre', grams:100, cat:'leaven'},
          {name:'Agua (7 °C)', grams:670, cat:'water'},
          {name:'Poolish', grams:350, cat:'leaven'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'24 °C', min:14, notas:"9' + 5''"}
        ]
      },
      { name:'Tradición', notes:'Poolish: 250 g harina + 250 g agua + 4 g levadura, fermentado antes de incorporar al resto.',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Harina FC', grams:750, cat:'flour'},
          {name:'Harina t80', grams:250, cat:'flour'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Levadura', grams:2.5, cat:'leaven'},
          {name:'Mejorante', grams:3, cat:'other'},
          {name:'Masa madre', grams:50, cat:'leaven'},
          {name:'Agua (17 °C)', grams:600, cat:'water'},
          {name:'Poolish', grams:500, cat:'leaven'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'24 °C', min:14, notas:"7' + 7''"}
        ]
      },
      { name:'Babel', notes:'Misma fórmula que Tradición, usada para tandas grandes (p.ej. 25 kg de harina → aprox. 290 unidades de ~150 g).',
        pieceWeight:150, pieceCount:0,
        ingredients:[
          {name:'Harina FC', grams:750, cat:'flour'},
          {name:'Harina t80', grams:250, cat:'flour'},
          {name:'Sal', grams:25, cat:'salt'},
          {name:'Levadura', grams:2.5, cat:'leaven'},
          {name:'Mejorante', grams:3, cat:'other'},
          {name:'Masa madre', grams:50, cat:'leaven'},
          {name:'Agua (17 °C)', grams:600, cat:'water'},
          {name:'Poolish', grams:500, cat:'leaven'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'24 °C', min:14, notas:"7' + 7''"}
        ]
      },
      { name:'Leche', notes:'Para versión hojaldrada/croissant: añadir aprox. 125 g de mantequilla adicional por kg de masa para el laminado.',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'GF', grams:250, cat:'flour'},
          {name:'FC', grams:750, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:20, cat:'leaven'},
          {name:'Mejorante', grams:10, cat:'other'},
          {name:'Azúcar', grams:40, cat:'other'},
          {name:'Mantequilla', grams:80, cat:'fat'},
          {name:'Leche fría', grams:600, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Reposo / bloque', amasado:'—', temp:'4 °C', min:0, notas:''},
          {dia:'Día 2', hora:'', paso:'Formado y horneado', amasado:'—', temp:'190 °C horno', min:18, notas:''}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  /* ============================= RECETAS AÑADIDAS (lote 3) ============================= */

  function extraRecipesV3(){
    return [
      { name:'Focaccia', notes:'',
        pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'FC', grams:500, cat:'flour'},
          {name:'MF', grams:200, cat:'flour'},
          {name:'T80', grams:300, cat:'flour'},
          {name:'Sal', grams:20, cat:'salt'},
          {name:'Levadura', grams:5, cat:'leaven'},
          {name:'Masa madre', grams:150, cat:'leaven'},
          {name:'Agua', grams:650, cat:'water'},
          {name:'Aceite de oliva', grams:80, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Fermentación en bandeja', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'220 °C horno', min:20, notas:''}
        ]
      },
      { name:'Burger', notes:'Base: tanda de referencia de 100 unidades (~107 g/pieza).',
        pieceWeight:106.8, pieceCount:100,
        ingredients:[
          {name:'FC', grams:6000, cat:'flour'},
          {name:'Sal', grams:120, cat:'salt'},
          {name:'Levadura', grams:240, cat:'leaven'},
          {name:'Mejorante', grams:60, cat:'other'},
          {name:'Azúcar', grams:600, cat:'other'},
          {name:'Mantequilla', grams:600, cat:'fat'},
          {name:'Huevo', grams:660, cat:'other'},
          {name:'Leche fría', grams:1700, cat:'water'},
          {name:'Agua fría', grams:700, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'División y formado', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Fermentación final', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'190 °C horno', min:14, notas:''}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  var RENAME_MAP_V3 = {
    'Valencia': 'Valencia Directa',
    'MM': 'Masa Madre',
    'Leche': 'Pan de Leche',
    'Avena (martes y jueves)': 'Pan de Avena',
    'Algarroba (martes y jueves)': 'Pan de Algarroba',
    'Centeno 100x100 (martes y jueves)': 'Centeno 100%',
    'Sarraceno 100x100 (martes y jueves)': 'Sarraceno 100%'
  };

  var ORDER_V3 = [
    'Valencia Directa','Valencia Fría','Pan de Calabaza','Pan Tritordeum','Masa Madre',
    'Centeno 60/40','Espelta','Integral','Sarraceno 60/40','Trigo Duro','Maíz','Aspai',
    'Barra Integral','Tradición','Burger','Pan de Leche','Pan Candeal','Pan de Avena',
    'Pan de Algarroba','Centeno 100%','Sarraceno 100%','Focaccia','Babel'
  ];

  /* ============================= RECETAS AÑADIDAS (Bizcochos, lote 1) ============================= */

  function extraRecipesBizcochos1(){
    return [
      { name:'Bizcocho de Almendra', notes:'Piezas de 175 g. Decoración: almendra en granillo por encima.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:175, pieceCount:42.58,
        ingredients:[
          {name:'Huevo', grams:1400, cat:'other'},
          {name:'Azúcar', grams:1760, cat:'other'},
          {name:'Leche', grams:1000, cat:'water'},
          {name:'Almendra molida', grams:1240, cat:'other'},
          {name:'Harina MF', grams:1000, cat:'flour'},
          {name:'Canela', grams:16, cat:'other'},
          {name:'Ácido tartárico', grams:12, cat:'other'},
          {name:'Bicarbonato', grams:24, cat:'other'},
          {name:'Aceite de girasol', grams:1000, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'180 °C horno', min:25, notas:''}
        ]
      },
      { name:'Bizcocho de Calabaza', notes:'Piezas de 175 g. Decoración: azúcar glas y raya diagonal.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:175, pieceCount:43.37,
        ingredients:[
          {name:'Huevo', grams:1000, cat:'other'},
          {name:'Azúcar', grams:1550, cat:'other'},
          {name:'Calabaza', grams:2000, cat:'other'},
          {name:'Almendra molida', grams:750, cat:'other'},
          {name:'Harina MF', grams:750, cat:'flour'},
          {name:'Impulsor', grams:40, cat:'other'},
          {name:'Mantequilla fundida', grams:1500, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'180 °C horno', min:25, notas:''}
        ]
      },
      { name:'Bizcocho Iaia', notes:'Piezas de 175 g. Decoración: chocolate, raya perpendicular.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:175, pieceCount:38.97,
        ingredients:[
          {name:'Huevo', grams:1240, cat:'other'},
          {name:'Azúcar', grams:1750, cat:'other'},
          {name:'Yogur', grams:900, cat:'water'},
          {name:'Harina', grams:1750, cat:'flour'},
          {name:'Impulsor', grams:130, cat:'other'},
          {name:'Aceite de girasol', grams:700, cat:'fat'},
          {name:'Aceite de oliva', grams:350, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'180 °C horno', min:25, notas:''}
        ]
      },
      { name:'Bizcocho de Canela', notes:'Piezas de 175 g. Sin decoración. Misma base que el Bizcocho Iaia, con canela añadida.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:175, pieceCount:39.01,
        ingredients:[
          {name:'Huevo', grams:1240, cat:'other'},
          {name:'Azúcar', grams:1750, cat:'other'},
          {name:'Yogur', grams:900, cat:'water'},
          {name:'Harina', grams:1750, cat:'flour'},
          {name:'Impulsor', grams:130, cat:'other'},
          {name:'Aceite de girasol', grams:700, cat:'fat'},
          {name:'Aceite de oliva', grams:350, cat:'fat'},
          {name:'Canela', grams:27, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'180 °C horno', min:25, notas:''}
        ]
      },
      { name:'Bizcocho de Chufa', notes:'Piezas de 175 g. Decoración: azúcar perlado.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:175, pieceCount:40.43,
        ingredients:[
          {name:'Huevo', grams:1400, cat:'other'},
          {name:'Azúcar', grams:1400, cat:'other'},
          {name:'Horchata', grams:1000, cat:'water'},
          {name:'Harina de chufa', grams:1000, cat:'flour'},
          {name:'Almendra molida', grams:1240, cat:'other'},
          {name:'Ácido tartárico', grams:12, cat:'other'},
          {name:'Bicarbonato', grams:24, cat:'other'},
          {name:'Aceite de girasol', grams:1000, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'180 °C horno', min:25, notas:''}
        ]
      },
      { name:'Magdalenas de Aceite', notes:'Piezas de 150 g. Para magdalenas clásicas y magdalenas de manzana.',
        division:'pasteleria', subdivision:'Bizcochos', pieceWeight:150, pieceCount:51.76,
        ingredients:[
          {name:'Huevo', grams:1200, cat:'other'},
          {name:'Azúcar', grams:2000, cat:'other'},
          {name:'Sal', grams:4, cat:'salt'},
          {name:'Leche', grams:1000, cat:'water'},
          {name:'Harina MF', grams:2000, cat:'flour'},
          {name:'Ácido', grams:20, cat:'other'},
          {name:'Bicarbonato', grams:40, cat:'other'},
          {name:'Aceite de oliva', grams:800, cat:'fat'},
          {name:'Aceite de girasol', grams:700, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'200 °C horno', min:18, notas:''}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  /* ============================= RECETAS AÑADIDAS (Bollería, lote 1) ============================= */

  function extraRecipesBolleria1(){
    return [
      { name:'Croissant',
        notes:'• Base: 1 kg de harina (750 g GF + 250 g Nova).\n'+
          '• "1 PAST" = pastón de 2 kg. El resto de columnas son múltiplos exactos — usa el escalador.\n'+
          '• Mantequilla de laminado: no especificada en la ficha. Usa tu proporción habitual (orientativo: 40-50% del peso de la masa).\n'+
          '• Corte: croissants de 160/170 mm, base de 10 cm.\n'+
          '• Bandeja: 12 uds/lata.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'GF', grams:750, cat:'flour'},
          {name:'Nova', grams:250, cat:'flour'},
          {name:'Azúcar', grams:125, cat:'other'},
          {name:'Sal', grams:22, cat:'salt'},
          {name:'Leche', grams:550, cat:'water'},
          {name:'Mantequilla (masa)', grams:100, cat:'fat'},
          {name:'Levadura', grams:25, cat:'leaven'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:"6' vel. 1 + 4' vel. 2", temp:'24 °C (masa tras amasar)', min:10, notas:''},
          {dia:'Día 1', hora:'', paso:'Reposo en bloque', amasado:'—', temp:'Ambiente', min:60, notas:"Entre 30' y 90' según el obrador"},
          {dia:'Día 1', hora:'', paso:'Estirar y congelar', amasado:'—', temp:'Congelador', min:0, notas:'Filmada, toda la noche'},
          {dia:'Día 2', hora:'16:00', paso:'Sacar del congelador', amasado:'—', temp:'-2 / +2 °C', min:0, notas:'Esperar a que la masa alcance esta temperatura antes de laminar'},
          {dia:'Día 2', hora:'', paso:'Incorporar la mantequilla de laminado', amasado:'—', temp:'—', min:0, notas:'Pliegue doble + pliegue simple, sin reposo entre medias'},
          {dia:'Día 2', hora:'', paso:'Reposo en congelador (tras plegar)', amasado:'—', temp:'< 10 °C', min:60, notas:''},
          {dia:'Día 2', hora:'', paso:'Atemperar', amasado:'—', temp:'+1 / +3 °C', min:0, notas:'Pasada 1 hora la masa alcanza esta temperatura; pasar a la laminadora'},
          {dia:'Día 2', hora:'', paso:'Laminar', amasado:'Laminadora', temp:'—', min:0, notas:'Ajustar ancho a 45/50 cm, girar el pastón 90°, bajar grosor 25-20-15-10-7,5-3,5-3,5-3,5 mm, enrollar con rodillo. Pastón final: 45/50 cm ancho x 130/140 cm largo'},
          {dia:'Día 2', hora:'', paso:'Doblar y cortar', amasado:'—', temp:'—', min:0, notas:'Doblar el pastón, cortar por la mitad y superponer'},
          {dia:'Día 2', hora:'', paso:'Cortar y formar', amasado:'—', temp:'—', min:0, notas:'Croissants de 160/170 mm, base 10 cm. Formar directamente o dividir en triángulos y refrigerar antes de formar (cuidado con que la masa "coja piel" en la nevera). Tiempo estimado por pastón: menos de 2 h (laminado + formado)'},
          {dia:'Día 2', hora:'', paso:'Fermentación', amasado:'—', temp:'16 °C (14 °C fines de semana)', min:1140, notas:'12 uds por lata. ~19 h entre semana; ~13 h sábados y domingos (cámara a 14 °C)'},
          {dia:'Día 3', hora:'', paso:'Horneado', amasado:'—', temp:'165 °C horno aire', min:20, notas:''}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesBolleria2(){
    return [
      { name:'Brioche',
        notes:'Base: X1 = 20 trenzas. La foto también traía una columna X2 = 40 trenzas que es exactamente el doble de cada cifra, así que no hace falta transcribirla — usa el escalador de la Calculadora.\n\n'+
          'La masa (7.200 g) se divide en pastones de 3.600 g (60x40 cm); cada pastón se lamina con mantequilla. Nota: la tabla original no deja del todo claro si "1000 g = 1 lámina" se refiere al total de la base X1 o a cada pastón por separado — aquí usé 1.000 g de mantequilla de laminado para el total de la base (escalando 1:1 con el resto, igual que en la foto X1→X2), pero conviene que lo confirmes contra tus notas.\n\n'+
          'Falta el paso de horneado (temperatura y tiempo): la foto se corta justo después de "TRENZAR". Añádelo en cuanto lo tengas a mano.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:410, pieceCount:20,
        ingredients:[
          {name:'Harina GF', grams:3000, cat:'flour'},
          {name:'Sal', grams:60, cat:'salt'},
          {name:'Azúcar', grams:360, cat:'other'},
          {name:'Levadura', grams:180, cat:'leaven'},
          {name:'Huevo', grams:1800, cat:'other'},
          {name:'Mantequilla (masa)', grams:1800, cat:'fat'},
          {name:'Mantequilla de laminado', grams:1000, cat:'fat'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado inicial (todo junto excepto mantequilla)', amasado:'—', temp:'—', min:9, notas:''},
          {dia:'Día 1', hora:'', paso:'Incorporar la mantequilla y seguir amasando', amasado:'—', temp:'—', min:14, notas:''},
          {dia:'Día 1', hora:'', paso:'Dividir en pastones', amasado:'—', temp:'—', min:0, notas:'Pastones de 3.600 g (60x40 cm) + 1 kg de mantequilla de laminado por pastón'},
          {dia:'Día 1', hora:'', paso:'Preparar la mantequilla de laminado', amasado:'—', temp:'—', min:0, notas:'A 6,5 mm de grosor'},
          {dia:'Día 1', hora:'', paso:'Laminar', amasado:'—', temp:'—', min:0, notas:'Bajar a 7 mm y pliegue doble'},
          {dia:'Día 1', hora:'', paso:'Bajar y dividir', amasado:'—', temp:'Congelador', min:0, notas:'Bajar a 10 mm, dividir en 2 masas y congelar'},
          {dia:'Día 2', hora:'', paso:'Laminar fino y rellenar', amasado:'—', temp:'—', min:0, notas:'Bajar a 1,5 mm, rellenar (ver receta "Relleno de Brioche") y enrollar'},
          {dia:'Día 2', hora:'', paso:'Cortar troncos', amasado:'—', temp:'—', min:0, notas:'5 troncos de 38 cm, cortados por la mitad'},
          {dia:'Día 2', hora:'', paso:'Trenzar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 2', hora:'', paso:'Horneado', amasado:'—', temp:'— (pendiente)', min:0, notas:'Falta este dato en la ficha original'}
        ]
      },
      { name:'Relleno de Brioche (Pasas, Nueces y Yema)',
        notes:'Relleno para 5 trenzas de Brioche.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:310, pieceCount:5,
        ingredients:[
          {name:'Pasas', grams:250, cat:'other'},
          {name:'Nueces', grams:500, cat:'other'},
          {name:'Yema cocida', grams:800, cat:'other'}
        ],
        schedule:[
          {dia:'Día 2', hora:'', paso:'Preparar el relleno', amasado:'—', temp:'—', min:0, notas:'Repartir sobre la masa laminada a 1,5 mm antes de enrollar'}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesBolleria3(){
    return [
      { name:'Quiche (Masa)',
        notes:'Amasar la primera mezcla (harina + mantequilla fría + sal) unos 3\' o hasta que tenga textura de arena (sablage), antes de añadir el líquido.\n\n'+
          'La foto tiene una corrección a mano sobre el grosor de estirado (parece decir "2,5 mm" corrigiendo un "1,5 mm" impreso) — usé 2,5 mm; confírmalo.\n\n'+
          'Rellenos (combinaciones de la ficha original, sin cantidades exactas de queso/ajo/perejil):\n'+
          '• Champiñón: 2 bandejas de champiñón por 1 ajo y perejil + queso + líquido + decoración de tomate cherry.\n'+
          '• Bacon y York + queso + líquido (sin decoración).\n'+
          '• Atún + queso + líquido + decoración de aceitunas.\n'+
          '• Chistorra + queso + líquido + decoración de nuez.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Harina Mariano', grams:3000, cat:'flour'},
          {name:'Mantequilla fría', grams:2000, cat:'fat'},
          {name:'Sal', grams:80, cat:'salt'},
          {name:'Huevos', grams:600, cat:'other'},
          {name:'Leche', grams:270, cat:'water'},
          {name:'Vinagre', grams:120, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasar la mezcla inicial', amasado:'—', temp:'—', min:3, notas:'Harina + mantequilla fría + sal, hasta textura de arena'},
          {dia:'Día 1', hora:'', paso:'Verter el líquido', amasado:'—', temp:'—', min:0, notas:'Huevos + leche'},
          {dia:'Día 1', hora:'', paso:'Verter el vinagre', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Estirar y cortar', amasado:'—', temp:'—', min:0, notas:'Bajar a 2,5 mm y cortar con disco (revisar corrección manuscrita en la ficha)'}
        ]
      },
      { name:'Quiche (Líquido de relleno)',
        notes:'Líquido base que se añade a todos los rellenos de quiche (ver notas de "Quiche (Masa)").',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Yema', grams:800, cat:'other'},
          {name:'Leche', grams:800, cat:'water'},
          {name:'Nata', grams:800, cat:'fat'},
          {name:'Sal', grams:8, cat:'salt'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar todos los ingredientes', amasado:'—', temp:'—', min:0, notas:''}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesBolleria4(){
    return [
      { name:'Cookie',
        notes:'Ficha marcada a mano como "oficial". La foto no traía tiempos ni temperatura de horneado — añádelos en cuanto los tengas.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Mantequilla', grams:140, cat:'fat'},
          {name:'Azúcar', grams:100, cat:'other'},
          {name:'Azúcar moreno', grams:70, cat:'other'},
          {name:'Huevos', grams:70, cat:'other'},
          {name:'Harina FF', grams:270, cat:'flour'},
          {name:'Sal', grams:4, cat:'salt'},
          {name:'Bicarbonato', grams:2, cat:'other'},
          {name:'Pepitas de chocolate', grams:160, cat:'other'},
          {name:'Avena', grams:80, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Horneado', amasado:'—', temp:'— (pendiente)', min:0, notas:'Falta este dato en la ficha original'}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesBolleria5(){
    return [
      { name:'Hojaldre',
        notes:'Masa base (no lleva horneado propio; se usa para discos, milhojas, etc.).\n\n'+
          'Bloque de mantequilla: mezclar mantequilla pomada 10\' a velocidad lenta, añadir la harina sfoglia y sacar 2 pastones de 2.250 g.\n'+
          'Masa: amasar 10\' a velocidad lenta, dividir en 2 pastones de 2.700 g cada uno, dar fuerza y forma rectangular.\n\n'+
          'Del pastón final salen en total 4 pastoncitos (3 discos y 1 milhoja).',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Harina MF', grams:3200, cat:'flour'},
          {name:'Agua 20°C', grams:1350, cat:'water'},
          {name:'Vinagre', grams:30, cat:'other'},
          {name:'Sal', grams:190, cat:'salt'},
          {name:'Mantequilla fría (masa)', grams:900, cat:'fat'},
          {name:'Mantequilla pomada (bloque)', grams:3200, cat:'fat'},
          {name:'Harina sfoglia (bloque)', grams:1380, cat:'flour'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Bloque de mantequilla', amasado:'Velocidad lenta', temp:'—', min:10, notas:'Añadir la harina sfoglia; sacar 2 pastones de 2.250 g'},
          {dia:'Día 1', hora:'', paso:'Amasar la masa', amasado:'Velocidad lenta', temp:'—', min:10, notas:'Harina MF + agua + vinagre + sal + mantequilla fría'},
          {dia:'Día 1', hora:'', paso:'Dividir la masa', amasado:'—', temp:'—', min:0, notas:'2 pastones de 2.700 g cada uno; dar fuerza y forma rectangular'},
          {dia:'Día 1', hora:'', paso:'Preparar el laminado', amasado:'—', temp:'—', min:0, notas:'Bajar la masa a 13 mm y la mantequilla a 8 mm'},
          {dia:'Día 1', hora:'', paso:'Encerrar la mantequilla', amasado:'—', temp:'—', min:0, notas:'Mantequilla abajo; la masa debe cubrir 2/3 (pliegue simple)'},
          {dia:'Día 1', hora:'', paso:'Reposar y pliegue doble', amasado:'—', temp:'—', min:0, notas:'Bajar a 7 mm'},
          {dia:'Día 1', hora:'', paso:'Reposar y pliegue doble', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Reposar y pliegue simple', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Dividir y bajar', amasado:'—', temp:'—', min:0, notas:'Dividir el pastón en 2 (salen 4 pastoncitos: 3 discos y 1 milhoja) y bajar a 1,5 mm'}
        ]
      },
      { name:'Ensaimada',
        notes:'',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:70, pieceCount:82.57,
        ingredients:[
          {name:'Harina FC', grams:2000, cat:'flour'},
          {name:'Harina GF', grams:1000, cat:'flour'},
          {name:'Azúcar', grams:750, cat:'other'},
          {name:'Aceite de oliva', grams:200, cat:'fat'},
          {name:'Huevo frío', grams:440, cat:'other'},
          {name:'Agua fría', grams:1160, cat:'water'},
          {name:'Sal', grams:30, cat:'salt'},
          {name:'Masa madre', grams:150, cat:'leaven'},
          {name:'Levadura', grams:50, cat:'leaven'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Amasado', amasado:'Batidora, velocidad 40', temp:'—', min:20, notas:'Todo junto'},
          {dia:'Día 1', hora:'', paso:'Pesar y dividir', amasado:'—', temp:'—', min:0, notas:'Pastones de 2.100 g; dividir a mano en piezas de 70 g por ensaimada'},
          {dia:'Día 1', hora:'', paso:'Colocar en lata', amasado:'—', temp:'—', min:0, notas:'Con aceite y film'}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesPreparaciones1(){
    return [
      { name:'Pintura (huevo)', notes:'Pintura para abrillantar antes de hornear.',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Yema', grams:400, cat:'other'},
          {name:'Agua', grams:380, cat:'water'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''}
        ]
      },
      { name:'Frangipane', notes:'Piezas de 120 g/ración, 8 unidades/lata.',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:120, pieceCount:35.25,
        ingredients:[
          {name:'Azúcar', grams:1000, cat:'other'},
          {name:'Harina de almendra', grams:1000, cat:'flour'},
          {name:'Mantequilla', grams:1000, cat:'fat'},
          {name:'Harina FFF', grams:100, cat:'flour'},
          {name:'Huevo', grams:1000, cat:'other'},
          {name:'Ron', grams:130, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Mezclar', amasado:'—', temp:'—', min:0, notas:''}
        ]
      },
      { name:'Yema Cocida', notes:'',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Yema', grams:900, cat:'other'},
          {name:'Azúcar', grams:900, cat:'other'},
          {name:'Ácido tartárico', grams:4, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Cocción en microondas (1ª tanda)', amasado:'—', temp:'—', min:6, notas:'Remover entre cada tanda'},
          {dia:'Día 1', hora:'', paso:'Cocción en microondas (2ª tanda)', amasado:'—', temp:'—', min:6, notas:''},
          {dia:'Día 1', hora:'', paso:'Cocción en microondas (3ª tanda)', amasado:'—', temp:'—', min:3, notas:''},
          {dia:'Día 1', hora:'', paso:'Cocción en microondas (4ª tanda)', amasado:'—', temp:'—', min:3, notas:''}
        ]
      },
      { name:'Crema Pastelera', notes:'La ficha original incluía además "2 UD" de pastillas de vainilla (no es un peso, así que no suma al total; ajusta la cantidad si usas vainilla en otro formato).',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Leche', grams:1600, cat:'water'},
          {name:'Nata', grams:400, cat:'fat'},
          {name:'Azúcar (líquido)', grams:200, cat:'other'},
          {name:'Azúcar (yemas)', grams:200, cat:'other'},
          {name:'Maicena', grams:180, cat:'other'},
          {name:'Yema', grams:540, cat:'other'},
          {name:'Mantequilla', grams:100, cat:'fat'},
          {name:'Pastillas de vainilla (2 ud)', grams:0, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Hervir los líquidos', amasado:'—', temp:'—', min:0, notas:'Leche + nata + azúcar (líquido)'},
          {dia:'Día 1', hora:'', paso:'Verter 1/3 sobre los sólidos', amasado:'—', temp:'—', min:0, notas:'Azúcar (yemas) + maicena + yema'},
          {dia:'Día 1', hora:'', paso:'Volver al fuego', amasado:'—', temp:'—', min:0, notas:'Mover con varilla de forma intensa'},
          {dia:'Día 1', hora:'', paso:'Verter sobre mantequilla y vainilla', amasado:'—', temp:'—', min:0, notas:''}
        ]
      },
      { name:'Gel Frambuesa', notes:'La ficha original no detalla el proceso de cocción/gelificación.',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Puré de frambuesa', grams:1000, cat:'other'},
          {name:'Azúcar', grams:195, cat:'other'},
          {name:'Maicena', grams:40, cat:'other'},
          {name:'Citrato de sodio', grams:10, cat:'other'},
          {name:'Goma gellan', grams:5, cat:'other'}
        ],
        schedule:[]
      },
      { name:'Ganache Matcha y Chocolate Blanco', notes:'El último paso de la ficha dice "verter mant y sal" — "mant" podría ser mantequilla, pero no aparece en la tabla de ingredientes; revísalo.',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Nata', grams:1000, cat:'fat'},
          {name:'Chocolate blanco', grams:1750, cat:'other'},
          {name:'Sal', grams:10, cat:'salt'},
          {name:'Matcha', grams:120, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Calentar la nata', amasado:'—', temp:'95 °C', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Verter sobre el chocolate y el matcha', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Batir', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Verter "mant" y sal', amasado:'—', temp:'—', min:0, notas:'Revisar a qué se refiere "mant" (ver notas de la receta)'}
        ]
      },
      { name:'Trufa Cocida', notes:'',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Nata', grams:1000, cat:'fat'},
          {name:'Glucosa', grams:100, cat:'other'},
          {name:'Azúcar invertido', grams:100, cat:'other'},
          {name:'Chocolate tostado', grams:1000, cat:'other'}
        ],
        schedule:[]
      },
      { name:'Crema Trufa', notes:'Se elabora a partir de la Trufa Cocida.',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Trufa cocida', grams:500, cat:'other'},
          {name:'Nata', grams:500, cat:'fat'}
        ],
        schedule:[]
      },
      { name:'Mascarpone', notes:'',
        division:'pasteleria', subdivision:'Preparaciones', pieceWeight:0, pieceCount:0,
        ingredients:[
          {name:'Mascarpone', grams:500, cat:'other'},
          {name:'Nata', grams:500, cat:'fat'},
          {name:'Azúcar glass', grams:150, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'Montar en batidora', amasado:'Varillas', temp:'—', min:0, notas:'Todo junto'}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function extraRecipesBolleria6(){
    return [
      { name:'Panettone de Naranja y Chocolate',
        notes:'Base: 1 = 20 uds (con el peso pequeño). Las columnas "2 = 40uds" y "3 = 60uds" de la ficha son exactamente el doble y el triple de cada cifra, así que no hace falta transcribirlas — usa el escalador de la Calculadora.\n\n'+
          'Referencias de la ficha: MM al 4,2 pH. Masa del 1er amasado a pH 5,2-5,4 antes de continuar. Temperatura de la masa: 26-28 °C.\n\n'+
          'Peso pequeño: 530 g (cocción 50 min, esta es la base de 20 uds). Peso grande: 1 kg (cocción 75 min). Temperatura final interior: 94 °C.\n\n'+
          'La ralladura de naranja de la ficha viene en unidades (3 uds para esta base), no en peso, así que no suma al total de gramos.',
        division:'pasteleria', subdivision:'Bollería', pieceWeight:530, pieceCount:20,
        ingredients:[
          {name:'Harina PETRA', grams:2500, cat:'flour'},
          {name:'Agua 30°C', grams:835, cat:'water'},
          {name:'Masa madre', grams:700, cat:'leaven'},
          {name:'Yemas', grams:1535, cat:'other'},
          {name:'Azúcar blanco', grams:1020, cat:'other'},
          {name:'Mantequilla', grams:2010, cat:'fat'},
          {name:'Pasta de naranja', grams:280, cat:'other'},
          {name:'Miel', grams:220, cat:'other'},
          {name:'Sal', grams:45, cat:'salt'},
          {name:'Nata', grams:100, cat:'fat'},
          {name:'Ralladura de naranja (3 uds)', grams:0, cat:'other'},
          {name:'Chocolate negro', grams:1000, cat:'other'},
          {name:'Naranja confitada', grams:1000, cat:'other'}
        ],
        schedule:[
          {dia:'Día 1', hora:'', paso:'1er amasado: harina, agua y masa madre', amasado:"3' lenta + 9' rápida", temp:'—', min:12, notas:''},
          {dia:'Día 1', hora:'', paso:'Incorporar las yemas', amasado:'—', temp:'—', min:0, notas:'En tres veces'},
          {dia:'Día 1', hora:'', paso:'Incorporar el azúcar blanco', amasado:'—', temp:'—', min:0, notas:'En tres veces'},
          {dia:'Día 1', hora:'', paso:'Incorporar la mantequilla', amasado:'—', temp:'—', min:0, notas:''},
          {dia:'Día 1', hora:'', paso:'Reposo del 1er amasado', amasado:'—', temp:'Ambiente', min:840, notas:'~14 h. Pasar la masa al cubo antes de reposar'},
          {dia:'Día 2', hora:'', paso:'Comprobar el pH', amasado:'—', temp:'—', min:0, notas:'La masa del 1er amasado debe estar a pH 5,2-5,4'},
          {dia:'Día 2', hora:'', paso:'2º amasado: incorporar la masa y la harina', amasado:'—', temp:'—', min:0, notas:'Con una parte de las yemas, añadidas en tres veces'},
          {dia:'Día 2', hora:'', paso:'Incorporar el azúcar blanco', amasado:'—', temp:'—', min:0, notas:'En tres veces'},
          {dia:'Día 2', hora:'', paso:'Añadir el resto de ingredientes', amasado:'—', temp:'—', min:0, notas:'De uno en uno; esperar a que se incorpore cada uno antes del siguiente'},
          {dia:'Día 2', hora:'', paso:'Fermentar el 2º amasado', amasado:'—', temp:'Ambiente', min:60, notas:'Pasar la masa al cubo antes de fermentar'},
          {dia:'Día 2', hora:'', paso:'Formado: engrasar mesa y porcionar', amasado:'—', temp:'—', min:0, notas:'Mesa engrasada con mantequilla; verter la masa y porcionar los panettones'},
          {dia:'Día 2', hora:'', paso:'Preformar y reposar', amasado:'—', temp:'Ambiente', min:30, notas:'Colocar en bandejas con papel'},
          {dia:'Día 2', hora:'', paso:'Formar y fermentar en fermentadora', amasado:'—', temp:'28 °C', min:60, notas:'Formar los panettone y colocar en cápsulas'},
          {dia:'Día 2', hora:'', paso:'Bajar la fermentadora', amasado:'—', temp:'14 °C', min:960, notas:'Reposo de ~16 h'},
          {dia:'Día 3', hora:'', paso:'Decorado', amasado:'—', temp:'—', min:0, notas:'Glasa de cacao, azúcar perlado y azúcar glas'},
          {dia:'Día 3', hora:'', paso:'Horneado', amasado:'—', temp:'170 °C techo / 160 °C suelo', min:50, notas:'Peso pequeño (530 g). El grande (1 kg) se hornea 75 min'},
          {dia:'Día 3', hora:'', paso:'Comprobar temperatura interior', amasado:'—', temp:'94 °C', min:0, notas:'Pinchar el centro para comprobarlo'},
          {dia:'Día 3', hora:'', paso:'Colgar boca abajo', amasado:'—', temp:'—', min:300, notas:'Mínimo 5 h'},
          {dia:'Día 3', hora:'', paso:'Comprobar antes de envasar', amasado:'—', temp:'26 °C', min:0, notas:'El centro del panettone debe estar a esta temperatura para poder envasarlo'}
        ]
      }
    ].map(function(r){
      r.id = uid('r');
      r.ingredients = r.ingredients.map(function(i){ i.id = uid('i'); return i; });
      r.schedule = r.schedule.map(function(s){ s.id = uid('s'); return s; });
      return r;
    });
  }

  function applyMigrations(){
    return storage.get('gm_seed_version').catch(function(){ return null; }).then(function(vRes){
      var version = (vRes && vRes.value) ? Number(vRes.value) : 1;

      if (version < 2){
        var existingNames = state.recipes.map(function(r){ return r.name; });
        extraRecipesV2().forEach(function(r){
          if (existingNames.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 2;
      }

      if (version < 3){
        // Renombra recetas existentes según los nuevos nombres.
        state.recipes.forEach(function(r){
          if (RENAME_MAP_V3.hasOwnProperty(r.name)) r.name = RENAME_MAP_V3[r.name];
        });
        // Añade Focaccia y Burger si aún no existen.
        var namesNow = state.recipes.map(function(r){ return r.name; });
        extraRecipesV3().forEach(function(r){
          if (namesNow.indexOf(r.name) === -1) state.recipes.push(r);
        });
        // Reordena según ORDER_V3; lo que no esté en la lista va al final,
        // manteniendo su orden relativo.
        state.recipes.sort(function(a, b){
          var ia = ORDER_V3.indexOf(a.name); if (ia === -1) ia = 999;
          var ib = ORDER_V3.indexOf(b.name); if (ib === -1) ib = 999;
          return ia - ib;
        });
        version = 3;
      }

      if (version < 4){
        // Todas las recetas que existían antes de la división Panadería/Pastelería
        // se marcan como "panadería" para no perder su ubicación.
        state.recipes.forEach(function(r){
          if (!r.division) r.division = 'panaderia';
        });
        version = 4;
      }

      if (version < 5){
        var namesNow5 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBizcochos1().forEach(function(r){
          if (namesNow5.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 5;
      }

      if (version < 6){
        var namesNow6 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria1().forEach(function(r){
          if (namesNow6.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 6;
      }

      if (version < 7){
        var namesNow7 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria2().forEach(function(r){
          if (namesNow7.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 7;
      }

      if (version < 8){
        var namesNow8 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria3().forEach(function(r){
          if (namesNow8.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 8;
      }

      if (version < 9){
        var namesNow9 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria4().forEach(function(r){
          if (namesNow9.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 9;
      }

      if (version < 10){
        var namesNow10 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria5().forEach(function(r){
          if (namesNow10.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 10;
      }

      if (version < 11){
        var namesNow11 = state.recipes.map(function(r){ return r.name; });
        extraRecipesPreparaciones1().forEach(function(r){
          if (namesNow11.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 11;
      }

      if (version < 12){
        var namesNow12 = state.recipes.map(function(r){ return r.name; });
        extraRecipesBolleria6().forEach(function(r){
          if (namesNow12.indexOf(r.name) === -1) state.recipes.push(r);
        });
        version = 12;
      }

      if (version < 13){
        var croi = state.recipes.find(function(r){ return r.name === 'Croissant'; });
        if (croi){
          croi.notes = '• Base: 1 kg de harina (750 g GF + 250 g Nova).\n'+
            '• "1 PAST" = pastón de 2 kg. El resto de columnas son múltiplos exactos — usa el escalador.\n'+
            '• Mantequilla de laminado: no especificada en la ficha. Usa tu proporción habitual (orientativo: 40-50% del peso de la masa).\n'+
            '• Corte: croissants de 160/170 mm, base de 10 cm.\n'+
            '• Bandeja: 12 uds/lata.';
        }
        version = 13;
      }

      persistRecipes();
      try{ storage.set('gm_seed_version', String(version)); }catch(e){}
    }).catch(function(){});
  }

  /* ============================= ALMACENAMIENTO (localStorage) ============================= */

  // Pequeño adaptador que imita la forma de la antigua API window.storage
  // (get/set devolviendo promesas con {key, value}) pero usando el
  // almacenamiento local del navegador (localStorage), que es síncrono
  // y guarda los datos únicamente en este navegador/dispositivo.
  var storage = {
    get: function(key){
      return new Promise(function(resolve, reject){
        try{
          var raw = window.localStorage.getItem(key);
          if (raw === null){ reject(new Error('Clave no encontrada: ' + key)); return; }
          resolve({ key: key, value: raw });
        }catch(e){ reject(e); }
      });
    },
    set: function(key, value){
      return new Promise(function(resolve, reject){
        try{
          window.localStorage.setItem(key, value);
          resolve({ key: key, value: value });
        }catch(e){ reject(e); }
      });
    }
  };

  /* ============================= PERSISTENCE ============================= */

  function loadAll(){
    Promise.all([
      storage.get('gm_recipes').catch(function(){ return null; }),
      storage.get('gm_pantry').catch(function(){ return null; })
    ]).then(function(res){
      var recipesRes = res[0], pantryRes = res[1];
      if (recipesRes && recipesRes.value){
        try{ state.recipes = JSON.parse(recipesRes.value); }catch(e){ state.recipes = seedRecipes(); }
      } else {
        state.recipes = seedRecipes();
        persistRecipes();
      }
      if (pantryRes && pantryRes.value){
        try{ state.pantry = JSON.parse(pantryRes.value); }catch(e){ state.pantry = {}; }
      }
      return applyMigrations();
    }).then(function(){
      ensureActiveInDivision();
      state.ready = true;
      render();
    }).catch(function(){
      state.recipes = seedRecipes();
      state.activeId = state.recipes[0].id;
      state.ready = true;
      render();
    });
  }

  function persistRecipes(){
    try{ storage.set('gm_recipes', JSON.stringify(state.recipes)); }catch(e){}
  }
  function persistPantry(){
    try{ storage.set('gm_pantry', JSON.stringify(state.pantry)); }catch(e){}
  }

  /* ============================= HELPERS ============================= */

  function getRecipe(id){
    for (var i=0;i<state.recipes.length;i++) if (state.recipes[i].id===id) return state.recipes[i];
    return null;
  }
  function recipeDivision(r){ return r.division || 'panaderia'; }
  function visibleRecipes(){
    return state.recipes.filter(function(r){
      if (recipeDivision(r) !== state.division) return false;
      if (state.division === 'pasteleria' && state.subdivision){
        return (r.subdivision || '') === state.subdivision;
      }
      return true;
    });
  }
  function subdivisionsInDivision(div){
    var set = {};
    state.recipes.forEach(function(r){
      if (recipeDivision(r) === div && r.subdivision) set[r.subdivision] = true;
    });
    return Object.keys(set).sort();
  }
  function ensureActiveInDivision(){
    if (state.division !== 'pasteleria') state.subdivision = null;
    else if (state.subdivision && subdivisionsInDivision('pasteleria').indexOf(state.subdivision) === -1){
      state.subdivision = null;
    }
    var vis = visibleRecipes();
    var stillVisible = vis.some(function(r){ return r.id === state.activeId; });
    if (!stillVisible) state.activeId = vis.length ? vis[0].id : null;
  }
  function totalFlour(r){
    var t=0; r.ingredients.forEach(function(ing){ if(ing.cat==='flour') t+=Number(ing.grams)||0; });
    return t;
  }
  function totalWater(r){
    var t=0; r.ingredients.forEach(function(ing){ if(ing.cat==='water') t+=Number(ing.grams)||0; });
    return t;
  }
  function totalDough(r){
    var t=0; r.ingredients.forEach(function(ing){ t+=Number(ing.grams)||0; });
    return t;
  }
  function hydration(r){
    var f = totalFlour(r);
    return f>0 ? (totalWater(r)/f*100) : 0;
  }
  function fmt(n, d){
    d = (d===undefined)?1:d;
    if (isNaN(n)) return '0';
    return Number(n).toLocaleString('es-ES', {minimumFractionDigits:0, maximumFractionDigits:d});
  }

  window.App = {};

  /* ============================= ACTIONS ============================= */

  App.setTab = function(t){ state.tab = t; render(); };
  App.selectRecipe = function(id){ state.activeId = id; render(); };
  App.setDivision = function(d){
    state.division = d;
    ensureActiveInDivision();
    render();
  };

  App.setDivision = function(d){
    state.division = d;
    state.subdivision = null;
    ensureActiveInDivision();
    render();
  };
  App.setSubdivision = function(s){
    state.subdivision = s || null;
    ensureActiveInDivision();
    render();
  };

  App.newRecipe = function(){
    var r = { id: uid('r'), name:'Nueva receta', notes:'', pieceWeight:500, pieceCount:2,
      division: state.division,
      subdivision: (state.division==='pasteleria' && state.subdivision) ? state.subdivision : undefined,
      ingredients:[{id:uid('i'), name:'Harina de fuerza', grams:1000, cat:'flour'},
                   {id:uid('i'), name:'Agua', grams:650, cat:'water'},
                   {id:uid('i'), name:'Sal', grams:20, cat:'salt'},
                   {id:uid('i'), name:'Levadura fresca', grams:10, cat:'leaven'}],
      schedule:[] };
    state.recipes.push(r);
    state.activeId = r.id;
    state.tab = 'recipes';
    persistRecipes();
    render();
  };

  App.newBlankRecipe = function(){
    var r = { id: uid('r'), name:'Receta en blanco', notes:'', pieceWeight:0, pieceCount:0,
      division: state.division,
      subdivision: (state.division==='pasteleria' && state.subdivision) ? state.subdivision : undefined,
      ingredients:[
        {id:uid('i'), name:'', grams:0, cat:'flour'},
        {id:uid('i'), name:'', grams:0, cat:'water'},
        {id:uid('i'), name:'', grams:0, cat:'salt'},
        {id:uid('i'), name:'', grams:0, cat:'leaven'},
        {id:uid('i'), name:'', grams:0, cat:'other'}
      ],
      schedule:[
        {id:uid('s'), dia:'Día 1', hora:'', paso:'', amasado:'', temp:'', min:0, notas:''},
        {id:uid('s'), dia:'Día 1', hora:'', paso:'', amasado:'', temp:'', min:0, notas:''},
        {id:uid('s'), dia:'Día 2', hora:'', paso:'', amasado:'', temp:'', min:0, notas:''}
      ] };
    state.recipes.push(r);
    state.activeId = r.id;
    state.tab = 'recipes';
    persistRecipes();
    render();
  };

  App.duplicateRecipe = function(id){
    var r = getRecipe(id); if(!r) return;
    var copy = JSON.parse(JSON.stringify(r));
    copy.id = uid('r'); copy.name = r.name + ' (copia)';
    copy.ingredients.forEach(function(i){ i.id = uid('i'); });
    copy.schedule.forEach(function(s){ s.id = uid('s'); });
    state.recipes.push(copy);
    state.activeId = copy.id;
    persistRecipes();
    render();
  };

  App.deleteRecipe = function(id){
    if (!confirm('¿Eliminar esta receta? No se puede deshacer.')) return;
    state.recipes = state.recipes.filter(function(r){ return r.id!==id; });
    if (state.activeId === id) ensureActiveInDivision();
    persistRecipes();
    render();
  };

  App.updateRecipeField = function(id, field, value){
    var r = getRecipe(id); if(!r) return;
    if (field==='pieceWeight' || field==='pieceCount') value = Number(value);
    r[field] = value;
    persistRecipes();
    render();
  };

  App.addIngredient = function(rid){
    var r = getRecipe(rid); if(!r) return;
    r.ingredients.push({id:uid('i'), name:'Nuevo ingrediente', grams:0, cat:'other'});
    persistRecipes();
    render();
  };
  App.updateIngredient = function(rid, iid, field, value){
    var r = getRecipe(rid); if(!r) return;
    var ing = r.ingredients.find(function(x){return x.id===iid;}); if(!ing) return;
    ing[field] = (field==='grams') ? Number(value) : value;
    persistRecipes();
    render();
  };
  App.deleteIngredient = function(rid, iid){
    var r = getRecipe(rid); if(!r) return;
    r.ingredients = r.ingredients.filter(function(x){return x.id!==iid;});
    persistRecipes();
    render();
  };

  App.addSchedRow = function(rid){
    var r = getRecipe(rid); if(!r) return;
    var lastDay = r.schedule.length ? r.schedule[r.schedule.length-1].dia : 'Día 1';
    r.schedule.push({id:uid('s'), dia:lastDay, hora:'', paso:'Nuevo paso', amasado:'—', temp:'—', min:0, notas:''});
    persistRecipes();
    render();
  };
  App.updateSched = function(rid, sid, field, value){
    var r = getRecipe(rid); if(!r) return;
    var s = r.schedule.find(function(x){return x.id===sid;}); if(!s) return;
    s[field] = (field==='min') ? Number(value) : value;
    persistRecipes();
    render();
  };
  App.deleteSched = function(rid, sid){
    var r = getRecipe(rid); if(!r) return;
    r.schedule = r.schedule.filter(function(x){return x.id!==sid;});
    persistRecipes();
    render();
  };

  App.startTimer = function(sid, minutes){
    if (timers[sid] && timers[sid].interval) return;
    var remaining = (timers[sid] && timers[sid].remaining!==undefined) ? timers[sid].remaining : minutes*60;
    timers[sid] = timers[sid] || {};
    timers[sid].remaining = remaining;
    timers[sid].interval = setInterval(function(){
      timers[sid].remaining -= 1;
      updateTimerDom(sid);
      if (timers[sid].remaining <= 0){
        clearInterval(timers[sid].interval);
        timers[sid].interval = null;
        timers[sid].done = true;
        beep();
        try{
          if (window.Notification && Notification.permission === 'granted'){
            new Notification('Temporizador finalizado');
          }
        }catch(e){}
        render();
      }
    }, 1000);
    updateTimerDom(sid);
  };
  App.pauseTimer = function(sid){
    if (timers[sid] && timers[sid].interval){ clearInterval(timers[sid].interval); timers[sid].interval = null; }
    updateTimerDom(sid);
  };
  App.resetTimer = function(sid, minutes){
    if (timers[sid] && timers[sid].interval) clearInterval(timers[sid].interval);
    timers[sid] = { remaining: minutes*60, interval:null, done:false };
    updateTimerDom(sid);
  };

  function mmss(sec){
    if (sec<0) sec=0;
    var m = Math.floor(sec/60), s = sec%60;
    return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;
  }
  function updateTimerDom(sid){
    var el = document.getElementById('timer_'+sid);
    if (!el) return;
    var t = timers[sid];
    el.textContent = mmss(t.remaining);
    el.className = 'gm-timer-display' + (t.remaining<=10 && t.interval ? ' alert' : '');
  }

  App.requestNotif = function(){
    try{ if (window.Notification) Notification.requestPermission(); }catch(e){}
  };

  App.setScaleMode = function(v){ state.scaleMode = v; render(); };
  App.setScaleValue = function(v){ state.scaleValue = Number(v); renderScaleResults(); };
  App.setScaleUnits = function(v){ state.scaleUnits = Number(v); renderScaleResults(); };

  App.updatePantryName = function(oldName, newName){
    if (!newName || newName===oldName) return;
    var price = state.pantry[oldName];
    delete state.pantry[oldName];
    state.pantry[newName] = price;
    persistPantry();
    render();
  };
  App.updatePantryPrice = function(name, price){
    state.pantry[name] = Number(price);
    persistPantry();
    render();
  };
  App.addPantryItem = function(){
    var name = 'Ingrediente ' + (Object.keys(state.pantry).length+1);
    state.pantry[name] = 0;
    persistPantry();
    render();
  };
  App.deletePantryItem = function(name){
    delete state.pantry[name];
    persistPantry();
    render();
  };
  App.detectIngredients = function(){
    state.recipes.forEach(function(r){
      r.ingredients.forEach(function(ing){
        if (!(ing.name in state.pantry)) state.pantry[ing.name] = 0;
      });
    });
    persistPantry();
    render();
  };

  /* ============================= SINCRONIZAR ENTRE DISPOSITIVOS ============================= */
  // localStorage guarda los datos solo en este navegador/dispositivo. Para pasarlos
  // a otro dispositivo, exporta un archivo aquí e impórtalo allí (por email, Drive,
  // AirDrop, USB...). No es sincronización automática en tiempo real, pero funciona
  // sin necesidad de ningún servidor.

  App.exportData = function(){
    var payload = {
      app: 'aspai',
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      recipes: state.recipes,
      pantry: state.pantry
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'aspai-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  };

  App.importData = function(inputEl){
    var file = inputEl.files && inputEl.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var data = JSON.parse(e.target.result);
        if (!data || !Array.isArray(data.recipes)){
          alert('Ese archivo no parece un backup válido de Aspai.');
          inputEl.value = '';
          return;
        }
        var replace = confirm(
          'Vas a importar ' + data.recipes.length + ' receta(s).\n\n' +
          'Aceptar = reemplazar todos tus datos actuales por los del archivo.\n' +
          'Cancelar = combinar (se añaden las recetas nuevas, sin borrar las que ya tienes).'
        );
        if (replace){
          state.recipes = data.recipes;
          state.pantry = data.pantry || {};
        } else {
          var existingNames = state.recipes.map(function(r){ return r.name; });
          (data.recipes || []).forEach(function(r){
            if (existingNames.indexOf(r.name) === -1) state.recipes.push(r);
          });
          Object.keys(data.pantry || {}).forEach(function(k){ state.pantry[k] = data.pantry[k]; });
        }
        state.recipes.forEach(function(r){ if (!r.division) r.division = 'panaderia'; });
        ensureActiveInDivision();
        persistRecipes();
        persistPantry();
        render();
        alert('Datos importados correctamente.');
      }catch(err){
        alert('No se pudo leer el archivo: ' + err.message);
      }
      inputEl.value = '';
    };
    reader.readAsText(file);
  };

  /* ============================= RENDER ============================= */

  function icon(name){
    var icons = {
      wheat: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24 4v40" stroke="#E3A83B" stroke-width="2" stroke-linecap="round"/><path d="M24 8c-4 0-7 3-7 3s3 3 7 3 7-3 7-3-3-3-7-3Z" fill="#E3A83B"/><path d="M24 15c-4 0-7 3-7 3s3 3 7 3 7-3 7-3-3-3-7-3Z" fill="#E3A83B" opacity="0.85"/><path d="M24 22c-4 0-7 3-7 3s3 3 7 3 7-3 7-3-3-3-7-3Z" fill="#E3A83B" opacity="0.7"/><path d="M24 29c-3.4 0-6 2.6-6 2.6s2.6 2.6 6 2.6 6-2.6 6-2.6-2.6-2.6-6-2.6Z" fill="#E3A83B" opacity="0.55"/></svg>',
      empty: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="18" stroke="#7C6C54" stroke-width="2"/><path d="M17 24h14" stroke="#7C6C54" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    return icons[name] || '';
  }

  function chip(cat){
    var c = CATS[cat] || CATS.other;
    return '<span class="gm-chip" style="background:'+c.color+'22;color:'+c.color+';border-color:'+c.color+'55;">'+
      '<span class="gm-dot" style="background:'+c.color+'"></span>'+c.label+'</span>';
  }

  function catOptions(selected){
    var out='';
    Object.keys(CATS).forEach(function(k){
      out += '<option value="'+k+'" '+(k===selected?'selected':'')+'>'+CATS[k].label+'</option>';
    });
    return out;
  }

  function divisionLabel(d){
    return d==='pasteleria' ? 'pastelería' : 'panadería';
  }

  function gauge(pct){
    var clamped = Math.max(0, Math.min(100, pct));
    var r = 46, c = 2*Math.PI*r;
    var offset = c - (clamped/100)*c;
    return '<div class="gm-gauge"><svg viewBox="0 0 110 110">'+
      '<circle cx="55" cy="55" r="'+r+'" stroke="#382B1D" stroke-width="9" fill="none"/>'+
      '<circle cx="55" cy="55" r="'+r+'" stroke="#6C93AC" stroke-width="9" fill="none" stroke-linecap="round" '+
      'stroke-dasharray="'+c+'" stroke-dashoffset="'+offset+'" transform="rotate(-90 55 55)"/>'+
      '</svg><div class="gm-gauge-label"><b>'+fmt(pct,1)+'%</b><span>Hidratación</span></div></div>';
  }

  function recipePicker(){
    var subHtml = subdivisionPicker();
    var list = visibleRecipes();
    if (!list.length) return subHtml;
    var out = subHtml + '<div class="gm-recipe-pick">';
    list.forEach(function(r){
      out += '<button class="gm-recipe-btn '+(r.id===state.activeId?'active':'')+'" onclick="App.selectRecipe(\''+r.id+'\')">'+r.name+'</button>';
    });
    out += '</div>';
    return out;
  }

  function renderCalc(){
    var r = getRecipe(state.activeId);
    if (!r){
      return '<div class="gm-card"><div class="gm-empty">'+icon('empty')+'<div>No tienes recetas de '+divisionLabel(state.division)+' todavía.</div>'+
        '<div style="margin-top:10px;"><button class="gm-primary" onclick="App.newRecipe()">Crear receta</button></div></div></div>';
    }
    var tf = totalFlour(r), td = totalDough(r), hyd = hydration(r);

    var rows = r.ingredients.map(function(ing){
      var pct = tf>0 ? (ing.grams/tf*100) : 0;
      return '<tr><td>'+ing.name+'</td><td>'+chip(ing.cat)+'</td>'+
        '<td class="gm-grams">'+fmt(ing.grams,1)+' g</td>'+
        '<td class="gm-pct">'+fmt(pct,1)+'%</td></tr>';
    }).join('');

    return ''+
      '<div class="gm-card">'+
        recipePicker()+
        '<div class="gm-gauge-wrap" style="margin-top:14px;">'+
          gauge(hyd)+
          '<div>'+
            '<h2 style="margin-bottom:2px;">'+r.name+'</h2>'+
            '<p class="gm-sub" style="margin-bottom:8px;">'+(r.notes||'Sin notas')+'</p>'+
            '<div class="gm-row" style="gap:18px;">'+
              '<div><div class="gm-mono" style="font-size:18px;color:var(--gold);">'+fmt(tf,0)+' g</div><div class="gm-sub" style="margin:0;">Harina total</div></div>'+
              '<div><div class="gm-mono" style="font-size:18px;">'+fmt(td,0)+' g</div><div class="gm-sub" style="margin:0;">Masa total</div></div>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+

      '<div class="gm-card">'+
        '<h2>Porcentaje panadero</h2>'+
        '<p class="gm-sub">Cada ingrediente como % del peso total de harina.</p>'+
        '<table class="gm-table"><thead><tr><th>Ingrediente</th><th>Tipo</th><th>Peso</th><th>%</th></tr></thead>'+
        '<tbody>'+rows+'</tbody></table>'+
      '</div>'+

      '<div class="gm-card">'+
        '<h2>Escalar receta</h2>'+
        '<p class="gm-sub">Recalcula todos los ingredientes manteniendo los porcentajes exactos.</p>'+
        '<div class="gm-row" id="scaleControls">'+
          '<div class="gm-field"><label>Escalar por</label>'+
            '<select onchange="App.setScaleMode(this.value)">'+
              '<option value="flour" '+(state.scaleMode==='flour'?'selected':'')+'>Peso de harina</option>'+
              '<option value="total" '+(state.scaleMode==='total'?'selected':'')+'>Peso total de masa</option>'+
              '<option value="units" '+(state.scaleMode==='units'?'selected':'')+'>Nº de piezas</option>'+
            '</select>'+
          '</div>'+
          (state.scaleMode==='units' ? (
            '<div class="gm-field"><label>Peso por pieza (g)</label><input type="number" value="'+r.pieceWeight+'" oninput="App.updateRecipeField(\''+r.id+'\',\'pieceWeight\',this.value)" style="width:110px;"></div>'+
            '<div class="gm-field"><label>Nº de piezas</label><input type="number" value="'+state.scaleUnits+'" oninput="App.setScaleUnits(this.value)" style="width:90px;"></div>'
          ) : (
            '<div class="gm-field"><label>'+(state.scaleMode==='flour'?'Harina objetivo (g)':'Masa total objetivo (g)')+'</label>'+
            '<input type="number" value="'+state.scaleValue+'" oninput="App.setScaleValue(this.value)" style="width:130px;"></div>'
          ))+
        '</div>'+
        '<div id="scaleResults" style="margin-top:14px;"></div>'+
      '</div>';
  }

  function renderScaleResults(){
    var host = document.getElementById('scaleResults');
    if (!host) return;
    var r = getRecipe(state.activeId);
    if (!r) return;
    var tf = totalFlour(r), td = totalDough(r);
    var factor = 1;
    if (state.scaleMode==='flour'){
      factor = tf>0 ? (state.scaleValue/tf) : 0;
    } else if (state.scaleMode==='total'){
      factor = td>0 ? (state.scaleValue/td) : 0;
    } else {
      var targetTotal = (r.pieceWeight||0) * (state.scaleUnits||0);
      factor = td>0 ? (targetTotal/td) : 0;
    }
    if (!isFinite(factor) || factor<=0){ host.innerHTML = '<p class="gm-sub">Introduce un valor válido.</p>'; return; }

    var rows = r.ingredients.map(function(ing){
      return '<tr><td>'+ing.name+'</td><td class="gm-grams">'+fmt(ing.grams,1)+' g</td>'+
        '<td class="gm-pct">→</td><td class="gm-grams" style="color:var(--gold);font-weight:600;">'+fmt(ing.grams*factor,1)+' g</td></tr>';
    }).join('');
    var newTotal = td*factor;

    host.innerHTML = '<table class="gm-table"><thead><tr><th>Ingrediente</th><th>Original</th><th></th><th>Escalado</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table>'+
      '<div class="gm-row" style="margin-top:10px;justify-content:space-between;">'+
        '<span class="gm-sub" style="margin:0;">Masa total resultante: <b class="gm-mono" style="color:var(--text);">'+fmt(newTotal,0)+' g</b></span>'+
      '</div>';
  }

  function subdivisionPicker(){
    if (state.division !== 'pasteleria') return '';
    var subs = subdivisionsInDivision('pasteleria');
    if (!subs.length) return '';
    var out = '<div class="gm-recipe-pick" style="margin-bottom:10px;">';
    out += '<button class="gm-recipe-btn '+(!state.subdivision?'active':'')+'" onclick="App.setSubdivision(null)">Todas</button>';
    subs.forEach(function(s){
      out += '<button class="gm-recipe-btn '+(state.subdivision===s?'active':'')+'" onclick="App.setSubdivision(\''+s+'\')">'+s+'</button>';
    });
    out += '</div>';
    return out;
  }

  function renderRecipes(){
    var r = getRecipe(state.activeId);
    var list = visibleRecipes();
    var out = '<div class="gm-card">'+
      '<div class="gm-row" style="justify-content:space-between;">'+
        '<h2 style="margin:0;text-transform:capitalize;">Tus recetas de '+divisionLabel(state.division)+'</h2>'+
        '<div class="gm-row" style="gap:6px;">'+
          '<button class="gm-small" onclick="App.newBlankRecipe()">+ Tabla en blanco</button>'+
          '<button class="gm-primary gm-small" onclick="App.newRecipe()">+ Nueva receta</button>'+
        '</div>'+
      '</div>'+
      (list.length ? '<div style="margin-top:12px;">'+recipePicker()+'</div>' :
        subdivisionPicker() +
        '<p class="gm-sub" style="margin-top:12px;">No hay recetas de '+divisionLabel(state.division)+
        (state.subdivision ? (' en "'+state.subdivision+'"') : '')+' todavía.</p>')+
    '</div>';

    if (!r) return out;

    var ingRows = r.ingredients.map(function(ing){
      return '<tr>'+
        '<td><input type="text" value="'+ing.name+'" onchange="App.updateIngredient(\''+r.id+'\',\''+ing.id+'\',\'name\',this.value)" style="width:100%;min-width:120px;"></td>'+
        '<td><select onchange="App.updateIngredient(\''+r.id+'\',\''+ing.id+'\',\'cat\',this.value)">'+catOptions(ing.cat)+'</select></td>'+
        '<td><input type="number" value="'+ing.grams+'" onchange="App.updateIngredient(\''+r.id+'\',\''+ing.id+'\',\'grams\',this.value)" style="width:90px;"> g</td>'+
        '<td><button class="gm-ghost" onclick="App.deleteIngredient(\''+r.id+'\',\''+ing.id+'\')">✕</button></td>'+
      '</tr>';
    }).join('');

    out += '<div class="gm-card">'+
      '<div class="gm-row" style="justify-content:space-between;">'+
        '<input type="text" class="gm-serif" value="'+r.name+'" onchange="App.updateRecipeField(\''+r.id+'\',\'name\',this.value)" '+
          'style="font-size:19px;font-weight:600;background:none;border:none;padding:2px 0;font-family:Fraunces,serif;flex:1;min-width:180px;">'+
        '<div class="gm-row" style="gap:6px;">'+
          '<button class="gm-small" onclick="App.duplicateRecipe(\''+r.id+'\')">Duplicar</button>'+
          '<button class="gm-small" onclick="App.deleteRecipe(\''+r.id+'\')" style="color:var(--danger);">Eliminar</button>'+
        '</div>'+
      '</div>'+
      '<textarea onchange="App.updateRecipeField(\''+r.id+'\',\'notes\',this.value)" placeholder="Notas de la receta..." '+
        'style="width:100%;margin-top:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:7px;color:var(--text);padding:8px;font-family:Inter,sans-serif;font-size:13px;min-height:44px;">'+(r.notes||'')+'</textarea>'+
      (state.division==='pasteleria' ?
        '<div class="gm-field" style="margin-top:10px;max-width:240px;"><label>Subcategoría (ej. Bizcochos)</label>'+
        '<input type="text" value="'+(r.subdivision||'')+'" placeholder="Sin subcategoría" '+
        'onchange="App.updateRecipeField(\''+r.id+'\',\'subdivision\',this.value)"></div>' : '')+

      '<h2 style="margin-top:18px;">Ingredientes</h2>'+
      '<table class="gm-table"><thead><tr><th>Nombre</th><th>Tipo</th><th>Peso</th><th></th></tr></thead>'+
      '<tbody>'+ingRows+'</tbody></table>'+
      '<button class="gm-small" style="margin-top:10px;" onclick="App.addIngredient(\''+r.id+'\')">+ Añadir ingrediente</button>'+
    '</div>';

    return out;
  }

  function renderSchedule(){
    var r = getRecipe(state.activeId);
    var out = '<div class="gm-card">'+recipePicker()+'</div>';
    if (!r) return out;

    var days = [];
    r.schedule.forEach(function(s){ if (days.indexOf(s.dia)===-1) days.push(s.dia); });

    var body = '';
    days.forEach(function(day){
      body += '<div class="gm-day-group"><div class="gm-day-title">'+day+'</div>';
      body += '<div class="gm-sched-head"><div>Hora</div><div>Paso</div><div>Amasado</div><div>Temp. masa</div><div>Duración</div><div class="gm-sched-cell-hide">Notas</div><div></div></div>';
      r.schedule.filter(function(s){return s.dia===day;}).forEach(function(s){
        var t = timers[s.id];
        var running = t && t.interval;
        var remaining = t ? t.remaining : (s.min||0)*60;
        body += '<div class="gm-sched-row '+((t&&t.done)?'done':'')+'">'+
          '<input type="text" value="'+s.hora+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'hora\',this.value)" style="width:100%;">'+
          '<input type="text" value="'+s.paso+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'paso\',this.value)" style="width:100%;">'+
          '<input type="text" value="'+s.amasado+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'amasado\',this.value)" style="width:100%;">'+
          '<input type="text" value="'+s.temp+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'temp\',this.value)" style="width:100%;">'+
          '<div class="gm-timer">'+
            '<input type="number" value="'+s.min+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'min\',this.value); App.resetTimer(\''+s.id+'\', Number(this.value))" style="width:44px;">'+
            '<span id="timer_'+s.id+'" class="gm-timer-display">'+mmss(remaining)+'</span>'+
            (running ?
              '<button class="gm-ghost gm-small" title="Pausar" onclick="App.pauseTimer(\''+s.id+'\')">⏸</button>' :
              '<button class="gm-ghost gm-small" title="Iniciar" onclick="App.startTimer(\''+s.id+'\', '+s.min+')">▶</button>')+
          '</div>'+
          '<div class="gm-sched-cell-hide"><input type="text" value="'+(s.notas||'')+'" onchange="App.updateSched(\''+r.id+'\',\''+s.id+'\',\'notas\',this.value)" style="width:100%;"></div>'+
          '<button class="gm-ghost" onclick="App.deleteSched(\''+r.id+'\',\''+s.id+'\')">✕</button>'+
        '</div>';
      });
      body += '</div>';
    });

    out += '<div class="gm-card">'+
      '<div class="gm-row" style="justify-content:space-between;">'+
        '<div><h2 style="margin:0;">Cronograma — '+r.name+'</h2><p class="gm-sub">Planifica amasados, reposos y horneado día a día. Los avisos suenan aunque cambies de pestaña dentro de la app.</p></div>'+
        '<button class="gm-small" onclick="App.requestNotif()">Activar avisos del navegador</button>'+
      '</div>'+
      (body || '<p class="gm-sub">Sin pasos todavía.</p>')+
      '<button class="gm-small" style="margin-top:6px;" onclick="App.addSchedRow(\''+r.id+'\')">+ Añadir paso</button>'+
    '</div>';

    return out;
  }

  function renderPantry(){
    var r = getRecipe(state.activeId);
    var names = Object.keys(state.pantry).sort();
    var rows = names.map(function(n){
      return '<div class="gm-pantry-row">'+
        '<input type="text" value="'+n+'" onchange="App.updatePantryName(\''+n.replace(/'/g,"\\'")+'\', this.value)">'+
        '<div style="display:flex;align-items:center;gap:4px;"><input type="number" step="0.01" value="'+state.pantry[n]+'" onchange="App.updatePantryPrice(\''+n.replace(/'/g,"\\'")+'\', this.value)" style="width:100%;"><span class="gm-sub" style="margin:0;">€/kg</span></div>'+
        '<span></span>'+
        '<button class="gm-ghost" onclick="App.deletePantryItem(\''+n.replace(/'/g,"\\'")+'\')">✕</button>'+
      '</div>';
    }).join('');

    var out = '<div class="gm-card">'+
      '<div class="gm-row" style="justify-content:space-between;">'+
        '<div><h2 style="margin:0;">Despensa</h2><p class="gm-sub">Precio por kilo de cada ingrediente, para calcular el coste de tus recetas.</p></div>'+
        '<div class="gm-row" style="gap:6px;">'+
          '<button class="gm-small" onclick="App.detectIngredients()">Detectar de recetas</button>'+
          '<button class="gm-small gm-primary" onclick="App.addPantryItem()">+ Añadir</button>'+
        '</div>'+
      '</div>'+
      (rows ? '<div style="margin-top:10px;">'+rows+'</div>' : '<p class="gm-sub" style="margin-top:10px;">Aún no has añadido precios.</p>')+
    '</div>';

    if (r){
      var missing = [];
      var cost = 0;
      r.ingredients.forEach(function(ing){
        var price = state.pantry[ing.name];
        if (price===undefined){ missing.push(ing.name); price = 0; }
        cost += (ing.grams/1000) * price;
      });
      var pieces = r.pieceCount || 1;
      var perPiece = pieces>0 ? cost/pieces : cost;

      var costRows = r.ingredients.map(function(ing){
        var price = state.pantry[ing.name];
        var sub = (ing.grams/1000)*(price||0);
        return '<tr><td>'+ing.name+'</td><td class="gm-grams">'+fmt(ing.grams,0)+' g</td>'+
          '<td class="gm-mono">'+(price===undefined ? '<span style="color:var(--danger);">sin precio</span>' : fmt(price,2)+' €/kg')+'</td>'+
          '<td class="gm-mono" style="color:var(--gold);">'+fmt(sub,2)+' €</td></tr>';
      }).join('');

      out += '<div class="gm-card">'+
        recipePicker()+
        '<h2 style="margin-top:10px;">Coste — '+r.name+'</h2>'+
        (missing.length ? '<div class="gm-banner warn show">Faltan precios para: '+missing.join(', ')+'.</div>' : '')+
        '<table class="gm-table"><thead><tr><th>Ingrediente</th><th>Peso</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>'+costRows+'</tbody></table>'+
        '<div class="gm-row" style="justify-content:space-between;margin-top:12px;align-items:flex-end;">'+
          '<div class="gm-field"><label>Nº de piezas de la receta</label><input type="number" value="'+pieces+'" onchange="App.updateRecipeField(\''+r.id+'\',\'pieceCount\',this.value)" style="width:100px;"></div>'+
          '<div style="text-align:right;">'+
            '<div class="gm-sub" style="margin:0;">Coste total</div><div class="gm-mono" style="font-size:18px;color:var(--gold);">'+fmt(cost,2)+' €</div>'+
            '<div class="gm-sub" style="margin:6px 0 0 0;">Coste por pieza</div><div class="gm-mono" style="font-size:15px;">'+fmt(perPiece,2)+' €</div>'+
          '</div>'+
        '</div>'+
      '</div>';
    }

    return out;
  }

  function render(){
    var app = document.getElementById('gm-app');
    if (!state.ready){
      app.innerHTML = '<div style="padding:60px 24px;text-align:center;color:var(--text-muted);">Cargando tus recetas…</div>';
      return;
    }

    var tabs = [
      {id:'calc', label:'Calculadora'},
      {id:'recipes', label:'Recetas'},
      {id:'schedule', label:'Cronograma'},
      {id:'pantry', label:'Despensa'}
    ];

    var html = '<div class="gm-header">'+
      '<div class="gm-brand">'+icon('wheat')+'<div class="gm-brand-text"><h1>Aspai</h1><p>Porcentajes · recetas · cronograma</p></div></div>'+
      '<div class="gm-row" style="gap:6px;">'+
        '<button class="gm-small" onclick="App.exportData()" title="Descargar tus recetas y precios en un archivo">⬇ Exportar</button>'+
        '<label class="gm-small" style="cursor:pointer;display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:7px;padding:9px 14px;font-weight:600;font-size:13px;" title="Cargar un archivo exportado desde otro dispositivo">'+
          '⬆ Importar<input type="file" accept="application/json" style="display:none" onchange="App.importData(this)">'+
        '</label>'+
      '</div>'+
    '</div>'+
      '<div class="gm-body" style="padding-bottom:0;padding-top:14px;">'+
        '<div class="gm-recipe-pick">'+
          '<button class="gm-recipe-btn '+(state.division==='panaderia'?'active':'')+'" onclick="App.setDivision(\'panaderia\')">🍞 Panadería</button>'+
          '<button class="gm-recipe-btn '+(state.division==='pasteleria'?'active':'')+'" onclick="App.setDivision(\'pasteleria\')">🍰 Pastelería</button>'+
        '</div>'+
      '</div>'+
      '<div class="gm-tabs">'+tabs.map(function(t){
        return '<button class="gm-tab '+(state.tab===t.id?'active':'')+'" onclick="App.setTab(\''+t.id+'\')">'+t.label+'</button>';
      }).join('')+'</div>'+
      '<div class="gm-body">';

    if (state.tab==='calc') html += renderCalc();
    else if (state.tab==='recipes') html += renderRecipes();
    else if (state.tab==='schedule') html += renderSchedule();
    else if (state.tab==='pantry') html += renderPantry();

    html += '</div>';
    app.innerHTML = html;

    if (state.tab==='calc') renderScaleResults();
  }

  loadAll();

}catch(err){
  // Si algo falla durante la carga inicial, no dejamos la página en blanco:
  // mostramos el error en pantalla y en la consola para poder depurarlo.
  console.error('Error al iniciar Aspai:', err);
  var el = document.getElementById('gm-app');
  if (el){
    el.innerHTML = '<div style="padding:40px 24px;font-family:sans-serif;color:#F3E7D3;background:#18120D;">'+
      '<h2 style="font-family:Georgia,serif;color:#E3A83B;">Aspai no ha podido cargar</h2>'+
      '<p>Ha ocurrido un error al iniciar la aplicación. Abre la consola del navegador (F12 → Console) para ver el detalle.</p>'+
      '<pre style="white-space:pre-wrap;background:#241B14;padding:12px;border-radius:8px;color:#E39C88;font-size:12px;">'+
      (err && (err.stack || err.message) || String(err)) + '</pre></div>';
  }
}

// Red de seguridad adicional: si un error posterior (fuera de la carga inicial)
// impide que la app llegue a pintarse nunca, avisamos en pantalla en vez de
// dejarla en blanco sin explicación.
window.addEventListener('error', function(e){
  var el = document.getElementById('gm-app');
  if (el && el.innerHTML.trim() === ''){
    el.innerHTML = '<div style="padding:40px 24px;font-family:sans-serif;color:#F3E7D3;background:#18120D;">'+
      '<h2 style="font-family:Georgia,serif;color:#E3A83B;">Aspai no ha podido cargar</h2>'+
      '<p>Error: '+ (e && e.message ? e.message : 'desconocido') +'</p></div>';
  }
});

})();
