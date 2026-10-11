'use client';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock3, RotateCcw } from 'lucide-react';
import { NativeSelect } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { BagOverview, bagColor, BAG_SELECTION_COLOR } from '../../../bag-overview';
import { bagAge, installationTime } from '../../../bag-age';
import { BF_561_MAX_HOURS, getBagFilter } from '../equipment-config';
import { createDemoBags } from './demo-data';

type Bag = {id:number;side:string;compartment:number;column:number;row:number;installed_at_hours:number;installed_at:string|null;reason:string;wo:string|null;actor:string;created_at:string};
type Data = {equipment:{runhours:number;updated_at:string|null};bags:Bag[];demoBags:Bag[]};
const date=(s:string)=>new Date(s).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jakarta'});
const localDateTime=()=>{const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,16)};
type Position={side:string;compartment:number;column:number;row:number};
const keyOf=(p:Position)=>`${p.side}-${p.compartment}-${p.column}-${p.row}`;
const Field=({label,children}:{label:string;children:React.ReactNode})=><label className="field"><span>{label}</span>{children}</label>;
const Input=(props:React.InputHTMLAttributes<HTMLInputElement>)=><input className="input" {...props}/>;
export default function BagMonitor({equipmentCode='561-BF1'}:{equipmentCode?:string}){
  const config=getBagFilter(equipmentCode)!;
  const totalBags=config.compartments*136;
  const positionLabel=(p:Position)=>`${p.side==='Utara'?p.compartment:config.compartments+1-p.compartment} · ${'HGFEDCBA'[p.column-1]}${p.row}`;
const positionSearch=(p:Position)=>`${p.side==='Utara'?p.compartment:config.compartments+1-p.compartment} ${'HGFEDCBA'[p.column-1]}${p.row}`.toLowerCase();
const matchesPosition=(p:Position,query:string)=>{
  const label=positionSearch(p);
  return label.includes(query)||label.replace(' ','').includes(query.replace(/\s+/g,''))||`${p.side} ${p.compartment} ${'HGFEDCBA'[p.column-1]}${p.row}`.toLowerCase().includes(query);
};

  const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [side,setSide]=useState('Utara'),[comp,setComp]=useState(1),[position,setPosition]=useState<Position|null>(null),[selected,setSelected]=useState<Position[]>([]),[now,setNow]=useState(()=>Date.now()),[demo,setDemo]=useState(true),[search,setSearch]=useState('');
  const demoBags=useMemo(()=>createDemoBags(config),[equipmentCode]); // Generate once per page visit.
  const load=useCallback(async()=>{try{const r=await fetch(`/api/data?equipment=${encodeURIComponent(config.code)}`,{cache:'no-store'});const j=await r.json() as Data & {error?:string};if(!r.ok)throw Error(j.error);setData(j);setError('');}catch(e){setError(e instanceof Error?e.message:'Gagal memuat data');}},[equipmentCode]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{const id=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(id)},[]);
  useEffect(()=>{
    type WebTool={registerTool:(tool:Record<string,unknown>,options:{signal:AbortSignal})=>Promise<void>|void};
    const context=(document as Document & {modelContext?:WebTool}).modelContext;if(!context?.registerTool)return;
    const controller=new AbortController();
    const tool={name:'record_bag_installation',title:'Catat pemasangan bag',description:`Mencatat satu atau banyak posisi bag ${config.code} dalam satu pekerjaan (${demo?'demo':'aktual'}).`,inputSchema:{type:'object',properties:{positions:{type:'array',items:{type:'object',properties:{side:{type:'string',enum:['Utara','Selatan']},compartment:{type:'integer',minimum:1,maximum:config.perSide},column:{type:'integer',minimum:1,maximum:8},row:{type:'integer',minimum:1,maximum:17}},required:['side','compartment','column','row']}},installedAt:{type:'string',description:'Tanggal dan jam pemasangan dalam format ISO 8601'},reason:{type:'string'},wo:{type:'string'}},required:['positions','installedAt','reason'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},async execute(input:unknown){
      
      if(!input||typeof input!=='object')throw Error('Data posisi belum lengkap');
      const response=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'bags',...input,equipmentCode:config.code,dataset:demo?'demo':'actual'})});const result=await response.json() as {error?:string};if(!response.ok)throw Error(result.error||'Gagal menyimpan');await load();return {saved:true};
    }};
    try{void Promise.resolve(context.registerTool(tool,{signal:controller.signal})).catch(()=>{});}catch{}
    return ()=>controller.abort();
  },[load,demo,equipmentCode]);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();if(!selected.length){setError('Pilih minimal satu posisi bag.');return}setBusy(true);setNotice('');setError('');const form=e.currentTarget;const body=Object.fromEntries(new FormData(form).entries());try{const r=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'bags',equipmentCode:config.code,dataset:demo?'demo':'actual',positions:selected,installedAt:new Date(String(body.installedAt)).toISOString(),reason:body.reason,wo:body.wo})});const j=await r.json() as {error?:string};if(!r.ok)throw Error(j.error);setNotice(`${selected.length} posisi bag ${demo?'demo ':''}tersimpan pada ${config.code}.`);form.reset();setPosition(selected[0]);setSelected([]);setNow(Date.now());await load();}catch(err){setError(err instanceof Error?err.message:'Gagal menyimpan');}finally{setBusy(false)}}
  function toggle(p:Position){setPosition(p);setSelected(previous=>previous.some(item=>keyOf(item)===keyOf(p))?previous.filter(item=>keyOf(item)!==keyOf(p)):[...previous,p]);}
  function focusPosition(p:Position){setSide(p.side);setComp(p.compartment);setPosition(p);requestAnimationFrame(()=>document.getElementById('position-history')?.scrollIntoView({behavior:'smooth',block:'center'}));}
  const visibleBags=useMemo(()=>(demo?[...(data?.demoBags||[]),...demoBags.all]:[...(data?.bags||[])]).sort((a,b)=>Date.parse(b.installed_at||b.created_at)-Date.parse(a.installed_at||a.created_at)||b.id-a.id),[demo,demoBags,data]);
  const latest=useMemo(()=>{const map=new Map<string,Bag>();for(const b of visibleBags){const key=`${b.side}-${b.compartment}-${b.column}-${b.row}`;if(!map.has(key))map.set(key,b)}return map},[visibleBags]);
  const history=useMemo(()=>demo?[...(data?.demoBags||[]),...demoBags.changes]:(data?.bags||[]),[demo,demoBags,data]);
  const groups=useMemo(()=>{
    const map=new Map<string,{wo:string|null;reason:string;installed:string;positions:Bag[]}>();
    for(const bag of history){const identity=bag.wo?`${bag.wo}|${bag.created_at}`:`bag-${bag.id}`;
      if(!map.has(identity))map.set(identity,{wo:bag.wo,reason:bag.reason,installed:bag.installed_at||bag.created_at,positions:[]});
      map.get(identity)!.positions.push(bag);
    }
    return [...map.values()].sort((a,b)=>Date.parse(b.installed)-Date.parse(a.installed));
  },[history]);
  const positionHistory=useMemo(()=>position?visibleBags.filter(b=>keyOf(b)===keyOf(position)).sort((a,b)=>installationTime(b,data?.equipment||{runhours:0,updated_at:null})-installationTime(a,data?.equipment||{runhours:0,updated_at:null})):[],[visibleBags,position,data?.equipment]);
  const query=search.trim().toLowerCase().replace(/[·,]/g,' ').replace(/\s+/g,' ');
  const filteredGroups=groups.filter(group=>!query||[group.wo||'',group.reason,group.installed,date(group.installed),...group.positions.map(positionSearch)].some(value=>value.toLowerCase().includes(query))||group.positions.some(p=>matchesPosition(p,query)));
  const displayComp=side==='Utara'?comp:config.compartments+1-comp;
  const selectedKeys=new Set(selected.map(keyOf));
  const known=Array.from({length:136},(_,i)=>latest.has(`${side}-${comp}-${i%8+1}-${Math.floor(i/8)+1}`)).filter(Boolean).length;
  return <main className="workspace">
    <nav className="breadcrumbs" aria-label="Lokasi"><Link href="/">Dashboard</Link><span>/</span><Link href="/equipment-process">Equipment Process</Link><span>/</span><Link href="/equipment-process/bag-filter">Bag Filter</Link><span>/</span><strong>{config.code}</strong></nav>
    <div className="heading"><div><p className="eyebrow">EQUIPMENT PROCESS / BAG FILTER</p><h1>{config.code}</h1><p className="intro">Peta umur bag cloth, penggantian, dan riwayat per posisi.</p></div></div>
    {error&&<div className="feedback bad" role="alert">{error} <button onClick={load}>Coba lagi</button></div>}{notice&&<div className="feedback" role="status">{notice}</div>}
<div className="stats"><article><span>EQUIPMENT</span><strong>{config.code}</strong><small>{config.compartments} kompartemen</small></article><article><span>SKALA EQUIPMENT</span><strong>0–900 <i>hari</i></strong><small>0–21.600 jam · berjalan 24/7</small></article><article><span>POSISI TERCATAT</span><strong>{latest.size.toLocaleString('id-ID')} <i>/ {totalBags.toLocaleString('id-ID')}</i></strong><small>Bag terpasang</small></article></div>
      <BagOverview config={config} latest={latest} anchor={data?.equipment||{runhours:0,updated_at:null}} now={now} selected={selectedKeys} onSelect={(nextSide,nextComp,column,row)=>{setSide(nextSide);setComp(nextComp);toggle({side:nextSide,compartment:nextComp,column,row});requestAnimationFrame(()=>document.getElementById('position-history')?.scrollIntoView({behavior:'smooth',block:'center'}))}} onFocusCompartment={(nextSide,nextComp)=>{setSide(nextSide);setComp(nextComp);setPosition(null);document.getElementById('bag-detail')?.scrollIntoView({behavior:'smooth',block:'start'})}}/>
      <div className="bag-layout"><section id="bag-detail" className="panel map-panel"><div className="section-head"><div><p className="eyebrow">PETA BAG CLOTH</p><h2>Detail Comp. {displayComp}</h2></div><span className="pill">{config.code}</span></div><div className="map-controls"><Field label="Sisi"><NativeSelect value={side} onChange={e=>{setSide(e.target.value);setPosition(null)}} className="input"><option>Utara</option><option>Selatan</option></NativeSelect></Field><Field label="Comp."><NativeSelect value={comp} onChange={e=>{setComp(Number(e.target.value));setPosition(null)}} className="input">{Array.from({length:config.perSide},(_,i)=><option key={i} value={i+1}>{side==='Utara'?i+1:config.compartments-i}</option>)}</NativeSelect></Field></div>
      <div className="map-meta"><strong>{side} · Comp. {displayComp}</strong><span>{known} / 136 posisi memiliki data · angka dalam hari</span></div><div className="grid-wrap"><div className="bag-grid" role="group" aria-label={`Peta bag ${side} compartment ${comp}`}>
      <div className="detail-labels">{['H','G','F','E','D','C','B','A'].map(letter=><span key={letter}>{letter}</span>)}<span/></div>
      {Array.from({length:17},(_,r)=>{
        const row=side==='Utara'?17-r:r+1;
        return <Fragment key={row}>{Array.from({length:8},(_,c)=>{
          const b=latest.get(`${side}-${comp}-${c+1}-${row}`);
          const age=bagAge(b,data?.equipment||{runhours:0,updated_at:null},now);
          const picked=selectedKeys.has(`${side}-${comp}-${c+1}-${row}`);
          const letter='HGFEDCBA'[c];
          return <button key={`${row}-${c}`} type="button" className={`bag-cell ${picked?'picked':''}`} style={{background:picked?BAG_SELECTION_COLOR:bagColor(age),color:!picked&&age!==null&&age>=450*24?'#f4fbf7':'#153d39'}} onClick={()=>toggle({side,compartment:comp,column:c+1,row})} aria-pressed={picked} aria-label={`Kolom ${letter}, baris ${row}: ${age===null?'belum tercatat':`${Math.floor(age/24)} hari`}`} title={`${letter}${row} · ${age===null?'Belum tercatat':`${Math.floor(age/24).toLocaleString('id-ID')} hari (${age.toLocaleString('id-ID')} jam)`}`}>{age===null?'·':Math.floor(age/24)}</button>;
        })}<span className="detail-row-number">{row}</span></Fragment>;
      })}</div></div><div className="legend"><span><i className="unknown"/> Belum tercatat</span><span><i style={{background:bagColor(0)}}/> 0 hari</span><span><i style={{background:bagColor(450*24)}}/> 450 hari</span><span><i style={{background:bagColor(BF_561_MAX_HOURS)}}/> ≥900 hari</span></div><p className="fineprint">Pengaturan {config.code}: hijau terang pada 0 hari, bergradasi hingga hijau sangat gelap pada 900 hari; setelah itu warnanya tetap.</p></section>
      <div className="side-stack"><section className="panel"><div className="section-head"><div><p className="eyebrow">PENGGANTIAN BAG</p><h2>{selected.length} posisi dipilih</h2></div><Clock3 size={20}/></div>
        {selected.length>0?<div className="selected-list">{selected.map(p=><button type="button" key={keyOf(p)} onClick={()=>toggle(p)} title="Hapus dari pilihan">{positionLabel(p)} ×</button>)}<button type="button" onClick={()=>{setSelected([]);setPosition(null)}}>Bersihkan semua</button></div>:<p className="empty">Ketuk beberapa posisi di peta. Ketuk kembali untuk membatalkan pilihan.</p>}
        <><form onSubmit={submit} className="formgrid"><Field label="Tanggal & jam pemasangan"><Input name="installedAt" type="datetime-local" defaultValue={localDateTime()} max={localDateTime()} required/></Field><Field label="Alasan penggantian / pemasangan awal"><Input name="reason" placeholder="Contoh: bocor, sobek, pemasangan awal" required/></Field><Field label="WO Number (opsional)"><Input name="wo"/></Field><Button disabled={busy||!selected.length} className="primary">Simpan {selected.length} bag</Button></form><p className="fineprint">Satu tanggal, alasan, dan WO berlaku untuk semua posisi terpilih. Umur dihitung otomatis sejak tanggal ini.</p></></section>
      <section id="position-history" className="panel"><div className="section-head"><div><p className="eyebrow">RIWAYAT KOORDINAT</p><h2>{position?`Comp. ${position.side==='Utara'?position.compartment:config.compartments+1-position.compartment} · ${'HGFEDCBA'[position.column-1]}${position.row}`:'Pilih satu posisi'}</h2></div><RotateCcw size={19}/></div>{position?positionHistory.length?<><div className="position-summary"><strong>{bagAge(positionHistory[0],data?.equipment||{runhours:0,updated_at:null},now)?.toLocaleString('id-ID')} jam</strong><span>Umur bag yang terpasang saat ini · {positionHistory.length} catatan untuk koordinat ini</span></div><div className="coordinate-timeline">{positionHistory.map((b,i)=>{const anchor=data?.equipment||{runhours:0,updated_at:null};const started=installationTime(b,anchor);const ended=i===0?now:installationTime(positionHistory[i-1],anchor);const duration=Math.max(0,Math.floor((ended-started)/3600000));return <article key={b.id}><span className="timeline-dot"/><div><strong>{i===0?'Terpasang sekarang':'Pernah terpasang'} · {date(new Date(started).toISOString())}</strong><small>{b.wo||'Tanpa WO'} · {b.reason}</small><small>{i===0?'Umur saat ini':'Masa pakai hingga penggantian berikutnya'}: {Math.floor(duration/24).toLocaleString('id-ID')} hari ({duration.toLocaleString('id-ID')} jam){!b.installed_at?' · tanggal estimasi':''}</small><small>Dicatat {date(b.created_at)} · {b.actor}</small></div></article>})}</div></>:<p className="empty">Belum ada catatan untuk koordinat ini.</p>:<p className="empty">Ketuk posisi pada peta atau pada hasil pencarian WO untuk melihat seluruh riwayatnya.</p>}</section></div></div>
      <section className="panel history"><div className="section-head"><div><p className="eyebrow">RECORD PENGGANTIAN</p><h2>Riwayat WO</h2></div><span className="pill">{filteredGroups.length} hasil</span></div><label className="field history-search"><span>Cari WO, alasan, atau koordinat</span><Input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Contoh: WO-DEMO-${config.code}-260113 atau 18 B1`}/></label>{!filteredGroups.length?<div className="empty">{search?'Tidak ada record sesuai pencarian.':'Belum ada penggantian yang dicatat.'}</div>:<div className="move-list">{filteredGroups.map((group,i)=>{const matching=search?group.positions.filter(p=>matchesPosition(p,query)):[];const shown=(matching.length?matching:group.positions).slice(0,12);return <article key={`${group.wo||'tanpa-WO'}-${group.installed}-${i}`}><span className="move-icon receive">{group.positions.length}</span><div><strong>{group.wo||'Tanpa WO'} · {group.positions.length} bag</strong><small>{group.reason} · dipasang {date(group.installed)}</small><div className="history-coordinates">{shown.map(p=><button key={keyOf(p)} type="button" onClick={()=>focusPosition(p)} title={`Lihat riwayat ${positionLabel(p)}`}>{positionLabel(p)}</button>)}{(matching.length?matching:group.positions).length>12?<span>+{(matching.length?matching:group.positions).length-12} lainnya</span>:null}</div></div></article>})}</div>}</section>    <div className={`mode-footer ${demo?'demo-mode':''}`} role="status"><div><strong>{demo?'Mode demo':`Data aktual · ${config.code}`}</strong><span>{demo?'Contoh history dan status bag. Penggantian yang Anda input disimpan ke history demo equipment ini.':'Catatan operasional tersimpan; penggantian yang dicatat akan masuk ke riwayat.'}</span></div><button type="button" onClick={()=>{setDemo(!demo);setSelected([]);setPosition(null);setError('');setNotice('')}}>{demo?'Lihat data aktual':'Lihat demo'}</button></div>
</main>;
}
