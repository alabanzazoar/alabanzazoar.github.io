# PATCH AGREGAR_CANTO.html

## CAMBIO 1 — CSS: agregar estilo botón guardar (verde)
Busca esta línea:
```
#ms-preview-wrap{background:#fff;
```
ANTES de esa línea, agrega:
```css
        .bg{background:linear-gradient(135deg,#11998e,#38ef7d);color:#fff;border:none;}
        .bg:hover{opacity:.88;}
        .ms-guardando{opacity:.6;pointer-events:none;}
```

---

## CAMBIO 2 — HTML: botón "Guardar" al lado de "Ver Preview"
Busca:
```html
<button class="btn bv" id="ms-btnPrev">&#128065; Ver Preview</button>
```
Reemplaza por:
```html
<button class="btn bv" id="ms-btnPrev">&#128065; Ver Preview</button>
                <button class="btn bg" id="ms-btnGuardar">&#128190; Guardar en Airtable</button>
```

---

## CAMBIO 3 — JS: conectar botón y agregar constantes Airtable + función guardar
Busca:
```javascript
  g("ms-btnPrev").onclick   = msGenPreview;
```
Reemplaza por:
```javascript
  g("ms-btnPrev").onclick   = msGenPreview;
  g("ms-btnGuardar").onclick = msGuardarAirtable;
```

---

## CAMBIO 4 — JS: agregar función msGuardarAirtable + cargar al inicio
Busca:
```javascript
/* FIN MODO SIMPLE */
```
ANTES de esa línea, agrega todo el bloque siguiente:

```javascript
/* ── Airtable config ── */
var AT_TOKEN   = 'patmCGSfm34EhyQtf.9972142779ca58bac082393141e5d9d32ef7bee74b4216d46e4b5d35e0f7b96f';
var AT_BASE    = 'appdq30kG3hMuzDqc';
var AT_TABLE   = 'Estructuras';

/* ── Guardar estructura en Airtable ── */
function msGuardarAirtable(){
  // Leer DOM actualizado
  for(var i=0;i<msSecs.length;i++){
    var s=msSecs[i];
    var ec=g("ms-tc"+s.id); if(ec)s.tipoCustom=ec.value;
    for(var j=0;j<s.lineas.length;j++)
      for(var k=0;k<s.lineas[j].segs.length;k++){
        var xid=s.lineas[j].segs[k].id;
        var en=g("ms-snotasel"+xid); if(en)s.lineas[j].segs[k].nota=en.value;
        var et=g("ms-stxt"+xid);    if(et)s.lineas[j].segs[k].texto=et.value;
      }
  }
  var nom   = (g("ms-nC").value||"").trim().toUpperCase();
  var autor = (g("ms-autor").value||"").trim();
  var tipo  = g("ms-tC").value;
  var nb    = g("ms-nB").value;
  var bpm   = (g("ms-bpm").value||"").trim();

  if(!nom){ msToast("Escribe el nombre del canto primero.","e"); return; }
  if(msSecs.length===0){ msToast("Agrega al menos una sección primero.","e"); return; }

  var btn=g("ms-btnGuardar");
  btn.classList.add("ms-guardando");
  btn.textContent="Guardando...";
  msToast("Guardando en Airtable...","o");

  var payload={
    fields:{
      Name: nom,
      Autor: autor,
      Tipo: tipo,
      NotaBase: nb,
      BPM: bpm,
      EstructuraJSON: JSON.stringify(msSecs)
    }
  };

  // Buscar si ya existe para hacer PATCH (update) en vez de POST (crear duplicado)
  fetch("https://api.airtable.com/v0/"+AT_BASE+"/"+encodeURIComponent(AT_TABLE)
    +"?filterByFormula="+encodeURIComponent("{Name}='"+nom+"'")+"&maxRecords=1",
    { headers:{ "Authorization":"Bearer "+AT_TOKEN } })
  .then(function(r){ return r.json(); })
  .then(function(data){
    if(data.records && data.records.length>0){
      // Actualizar registro existente
      var recId=data.records[0].id;
      return fetch("https://api.airtable.com/v0/"+AT_BASE+"/"+encodeURIComponent(AT_TABLE)+"/"+recId,{
        method:"PATCH",
        headers:{ "Authorization":"Bearer "+AT_TOKEN, "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
    } else {
      // Crear nuevo registro
      return fetch("https://api.airtable.com/v0/"+AT_BASE+"/"+encodeURIComponent(AT_TABLE),{
        method:"POST",
        headers:{ "Authorization":"Bearer "+AT_TOKEN, "Content-Type":"application/json" },
        body: JSON.stringify(payload)
      });
    }
  })
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
    return r.json();
  })
  .then(function(){
    msToast("✅ Guardado en Airtable: "+nom,"o");
    btn.textContent="✅ Guardado";
    setTimeout(function(){
      btn.textContent="💾 Guardar en Airtable";
      btn.classList.remove("ms-guardando");
    },2500);
  })
  .catch(function(e){
    msToast("❌ Error: "+e.message,"e");
    btn.textContent="💾 Guardar en Airtable";
    btn.classList.remove("ms-guardando");
  });
}

/* ── Cargar estructura desde Airtable al abrir en modo editar ── */
function msCargarDesdeAirtable(){
  var raw=sessionStorage.getItem("editarCanto");
  if(!raw) return;
  var params=new URLSearchParams(window.location.search);
  if(params.get("modo")!=="editar") return;
  sessionStorage.removeItem("editarCanto");

  var d;
  try{ d=JSON.parse(raw); } catch(e){ return; }

  // Activar modo simple (los datos vienen del modo simple)
  g("btnModoSimple").click();

  // Llenar campos
  if(g("ms-nC"))   g("ms-nC").value   = d.Name     || "";
  if(g("ms-autor"))g("ms-autor").value = d.Autor    || "";
  if(g("ms-tC"))   g("ms-tC").value   = d.Tipo     || "";
  if(g("ms-nB"))   g("ms-nB").value   = d.NotaBase || "";
  if(g("ms-bpm"))  g("ms-bpm").value  = d.BPM      || "";

  if(!d.EstructuraJSON) return;
  var secsData;
  try{ secsData=JSON.parse(d.EstructuraJSON); } catch(e){ return; }

  // Limpiar secciones actuales
  msSecs=[]; msCid=0; msLcid=0;
  var c=g("ms-cs"); c.innerHTML="";

  // Recrear secciones con sus líneas y segmentos
  for(var i=0;i<secsData.length;i++){
    var sd=secsData[i];
    msCid++;
    var sec={id:msCid, tipo:sd.tipo||"OTRO", tipoCustom:sd.tipoCustom||"", lineas:[]};
    msSecs.push(sec);
    msRenderSec(sec);
    if(sec.tipo==="OTRO" && sec.tipoCustom){
      var tcEl=g("ms-tc"+sec.id);
      if(tcEl) tcEl.value=sec.tipoCustom;
    }

    for(var j=0;j<sd.lineas.length;j++){
      var ld=sd.lineas[j];
      msLcid++;
      var lid=msLcid;
      var nuevaLinea={id:lid, segs:[]};
      sec.lineas.push(nuevaLinea);

      // Renderizar la línea vacía primero
      msRenderLineaVacia(sec.id, lid);

      // Agregar segmentos
      for(var k=0;k<ld.segs.length;k++){
        var segD=ld.segs[k];
        var nuevoId=msCid*10000+j*1000+k+1;
        nuevaLinea.segs.push({id:nuevoId, nota:segD.nota||"", texto:segD.texto||""});
        msRenderSegmento(sec.id, lid, nuevaLinea.segs[k]);
      }
    }
  }
  msToast("✅ Canto cargado para editar","o");
  setTimeout(msGenPreview, 300);
}
```

---

## CAMBIO 5 — JS: agregar función msRenderLineaVacia (necesaria para cargar)
Busca:
```javascript
function msRenderLinea(sid,lid){
```
ANTES de esa función, agrega:
```javascript
function msRenderLineaVacia(sid,lid){
  var cont=g("ms-lc"+sid);
  var d=document.createElement("div");
  d.className="linea-wrap"; d.id="ms-ln"+lid;
  d.innerHTML=
    '<div class="linea-top">'
    +'<span class="ln-num">#'+(cont.children.length+1)+'</span>'
    +'<button class="ms-del-ln" id="ms-dl'+lid+'">✕</button>'
    +'</div>'
    +'<div class="seg-list" id="ms-sl'+lid+'"></div>'
    +'<button class="btn bsm" id="ms-as'+lid+'" style="margin-top:3px;font-size:11px;">+ segmento</button>';
  cont.appendChild(d);
  var s2=sid, l2=lid;
  g("ms-dl"+l2).onclick=function(){ msDelLinea(s2,l2); };
  g("ms-as"+l2).onclick=function(){ msAddSegmento(s2,l2); };
}
```

---

## CAMBIO 6 — JS: llamar msCargarDesdeAirtable al inicio
Busca:
```javascript
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){ init(); initModo(); });
}else{
  init(); initModo();
}
```
Reemplaza por:
```javascript
if(document.readyState==="loading"){
  document.addEventListener("DOMContentLoaded",function(){ init(); initModo(); msCargarDesdeAirtable(); });
}else{
  init(); initModo(); msCargarDesdeAirtable();
}
```
