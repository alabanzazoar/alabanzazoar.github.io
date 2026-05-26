/* ═══════════════════════════════════════════════════════
   AIRTABLE — GUARDAR Y CARGAR ESTRUCTURAS
   Pegar ANTES de la línea: /* FIN MODO SIMPLE */
═══════════════════════════════════════════════════════ */

/* ── Config Airtable ── */
var AT_TOKEN = 'patmCGSfm34EhyQtf.9972142779ca58bac082393141e5d9d32ef7bee74b4216d46e4b5d35e0f7b96f';
var AT_BASE  = 'appdq30kG3hMuzDqc';
var AT_TABLE = 'Estructuras';

/* ── Guardar / actualizar en Airtable ── */
function msGuardarAirtable(){
  // Leer DOM actualizado (mismo patrón que msGenPreview)
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
  msToast("Conectando con Airtable...","o");

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

  // Buscar si ya existe → PATCH (update), si no → POST (crear)
  fetch(
    "https://api.airtable.com/v0/"+AT_BASE+"/"+encodeURIComponent(AT_TABLE)
    +"?filterByFormula="+encodeURIComponent("{Name}='"+nom+"'")+"&maxRecords=1",
    { headers:{ "Authorization":"Bearer "+AT_TOKEN } }
  )
  .then(function(r){ return r.json(); })
  .then(function(data){
    var url="https://api.airtable.com/v0/"+AT_BASE+"/"+encodeURIComponent(AT_TABLE);
    var method="POST";
    if(data.records && data.records.length>0){
      url+="/"+data.records[0].id;
      method="PATCH";
    }
    return fetch(url,{
      method: method,
      headers:{ "Authorization":"Bearer "+AT_TOKEN, "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
  })
  .then(function(r){
    if(!r.ok) return r.text().then(function(t){ throw new Error(t); });
    return r.json();
  })
  .then(function(){
    msToast("✅ Guardado: "+nom,"o");
    btn.textContent="✅ Guardado";
    setTimeout(function(){
      btn.textContent="💾 Guardar en Airtable";
      btn.classList.remove("ms-guardando");
    },2500);
  })
  .catch(function(e){
    msToast("❌ Error al guardar: "+e.message,"e");
    btn.textContent="💾 Guardar en Airtable";
    btn.classList.remove("ms-guardando");
  });
}

/* ── Cargar estructura desde sessionStorage (viene del botón Editar del canto) ── */
function msCargarDesdeAirtable(){
  var raw=sessionStorage.getItem("editarCanto");
  if(!raw) return;
  var params=new URLSearchParams(window.location.search);
  if(params.get("modo")!=="editar") return;
  sessionStorage.removeItem("editarCanto");

  var d;
  try{ d=JSON.parse(raw); } catch(e){ return; }

  // Activar modo simple
  g("btnModoSimple").click();

  // Llenar campos de datos del canto
  if(g("ms-nC"))    g("ms-nC").value    = d.Name     || "";
  if(g("ms-autor")) g("ms-autor").value = d.Autor    || "";
  if(g("ms-tC"))    g("ms-tC").value    = d.Tipo     || "";
  if(g("ms-nB"))    g("ms-nB").value    = d.NotaBase || "";
  if(g("ms-bpm"))   g("ms-bpm").value   = d.BPM      || "";

  if(!d.EstructuraJSON){ msToast("Sin secciones guardadas.","e"); return; }

  var secsData;
  try{ secsData=JSON.parse(d.EstructuraJSON); } catch(e){ msToast("Error al leer secciones.","e"); return; }

  // Limpiar estado actual
  msSecs=[]; msCid=0; msLcid=0;
  var c=g("ms-cs"); c.innerHTML="";

  // Recrear cada sección con sus líneas y segmentos
  for(var i=0;i<secsData.length;i++){
    var sd=secsData[i];
    msCid++;
    var sec={id:msCid, tipo:sd.tipo||"OTRO", tipoCustom:sd.tipoCustom||"", lineas:[]};
    msSecs.push(sec);
    msRenderSec(sec);

    // Si es OTRO, poner el nombre custom
    if(sec.tipo==="OTRO" && sec.tipoCustom){
      var tcEl=g("ms-tc"+sec.id);
      if(tcEl){ tcEl.value=sec.tipoCustom; sec.tipoCustom=sd.tipoCustom; }
    }

    // Recrear líneas
    for(var j=0;j<(sd.lineas||[]).length;j++){
      var ld=sd.lineas[j];
      msLcid++;
      var lid=msLcid;
      var nuevaLinea={id:lid, segs:[]};
      sec.lineas.push(nuevaLinea);

      // Crear el contenedor de la línea en el DOM
      var cont=g("ms-lc"+sec.id);
      var dln=document.createElement("div");
      dln.className="linea-wrap"; dln.id="ms-ln"+lid;
      dln.innerHTML=
        '<div class="linea-top">'
        +'<span class="ln-num">#'+(cont.children.length+1)+'</span>'
        +'<button class="ms-del-ln" id="ms-dl'+lid+'">✕</button>'
        +'</div>'
        +'<div class="seg-list" id="ms-sl'+lid+'"></div>'
        +'<button class="btn bsm" id="ms-as'+lid+'" style="margin-top:3px;font-size:11px;">+ segmento</button>';
      cont.appendChild(dln);
      (function(s2,l2){
        g("ms-dl"+l2).onclick=function(){ msDelLinea(s2,l2); };
        g("ms-as"+l2).onclick=function(){ msAddSegmento(s2,l2); };
      })(sec.id, lid);

      // Recrear segmentos de esta línea
      for(var k=0;k<(ld.segs||[]).length;k++){
        var segD=ld.segs[k];
        // Generar nuevo id único para el segmento
        var nuevoSegId=(msCid*100000)+(j*1000)+k+(Date.now()%1000);
        var nuevoSeg={id:nuevoSegId, nota:segD.nota||"", texto:segD.texto||""};
        nuevaLinea.segs.push(nuevoSeg);

        // Renderizar segmento en el DOM
        var slEl=g("ms-sl"+lid);
        if(slEl){
          var ds=document.createElement("div");
          ds.className="ms-seg-item"; ds.id="ms-si"+nuevoSegId;
          ds.innerHTML=
            '<button class="ms-seg-del" id="ms-sd'+nuevoSegId+'">✕</button>'
            +'<select class="seg-nota-sel" id="ms-snotasel'+nuevoSegId+'">'+msOpN(nuevoSeg.nota)+'</select>'
            +'<input type="text" class="seg-texto-inp" id="ms-stxt'+nuevoSegId+'" placeholder="texto..." value="'+nuevoSeg.texto.replace(/"/g,'&quot;')+'">';
          slEl.appendChild(ds);
          (function(s2,l2,xid){
            g("ms-sd"+xid).onclick=function(){ msDelSegmento(s2,l2,xid); };
            g("ms-snotasel"+xid).onchange=function(){
              var sec2=msGetSec(s2);
              for(var ii=0;ii<sec2.lineas.length;ii++){
                if(sec2.lineas[ii].id===l2){
                  for(var jj=0;jj<sec2.lineas[ii].segs.length;jj++){
                    if(sec2.lineas[ii].segs[jj].id===xid){ sec2.lineas[ii].segs[jj].nota=this.value; break; }
                  }
                  break;
                }
              }
            };
            g("ms-stxt"+xid).oninput=function(){
              var sec2=msGetSec(s2);
              for(var ii=0;ii<sec2.lineas.length;ii++){
                if(sec2.lineas[ii].id===l2){
                  for(var jj=0;jj<sec2.lineas[ii].segs.length;jj++){
                    if(sec2.lineas[ii].segs[jj].id===xid){ sec2.lineas[ii].segs[jj].texto=this.value; break; }
                  }
                  break;
                }
              }
            };
          })(sec.id, lid, nuevoSegId);
        }
      }
    }
  }
  msToast("✅ Canto cargado — listo para editar","o");
  setTimeout(msGenPreview, 400);
}
