'use client';
import { bagAge, type BagAgeRecord, type HourAnchor } from './bag-age';
import { BF_561_MAX_HOURS, BF_561_SETTINGS, type BagFilterConfig } from './equipment-process/bag-filter/equipment-config';

type Bag = BagAgeRecord & {side:string;compartment:number;column:number;row:number};
type Props = {
  config:BagFilterConfig;
  latest: Map<string,Bag>;
  anchor: HourAnchor;
  now: number;
  selected: Set<string>;
  onSelect: (side:string,compartment:number,column:number,row:number)=>void;
  onFocusCompartment: (side:string,compartment:number)=>void;
};
export const BAG_SELECTION_COLOR='#ed9b36';
const letters=['H','G','F','E','D','C','B','A'];
export function bagColor(age:number|null){
  if(age===null)return '#e6eae9';
  const fraction=Math.min(Math.max(age/BF_561_MAX_HOURS,0),1);
  return `hsl(${Math.round(128+fraction*20)} ${Math.round(78-fraction*22)}% ${Math.round(61-fraction*47)}%)`;
}
export function BagOverview({config,latest,anchor,now,selected,onSelect,onFocusCompartment}:Props){
  const rows=[Array.from({length:config.perSide},(_,i)=>i+1),Array.from({length:config.perSide},(_,i)=>config.compartments-i)];
  return <section className="panel overview-panel" aria-label={`Peta lengkap ${config.code}`}>
    <div className="section-head"><div><p className="eyebrow">{config.code} / {(config.compartments*136).toLocaleString('id-ID')} POSISI</p><h2>Peta seluruh kompartemen</h2></div><span className="pill">{config.compartments} kompartemen</span></div>
    <p className="overview-help">1–{config.perSide} di atas, {config.compartments}–{config.perSide+1} di bawah. Ketuk nomor kompartemen untuk detail atau ketuk beberapa posisi untuk satu penggantian.</p>
    <div className="overview-scroll" aria-label={`Peta ${config.compartments} kompartemen tanpa geser horizontal`}>
      <div className="overview-rows">
        {rows.map((sequence,band)=><div className="overview-band" key={band} style={{gridTemplateColumns:`repeat(${config.perSide},minmax(0,1fr))`}}>
          {sequence.map(display=>{
            const side=display<=config.perSide?'Utara':'Selatan';
            const compartment=display<=config.perSide?display:config.compartments+1-display;
            const orderedRows=Array.from({length:17},(_,i)=>band===0?17-i:i+1);
            return <div className="overview-compartment" key={display}>
              {band===1&&<button type="button" className="overview-title" onClick={()=>onFocusCompartment(side,compartment)} aria-label={`Buka detail kompartemen ${display}`}><span className="overview-title-full">Comp.&nbsp;</span>{display}</button>}
              <div className="overview-matrix">
                {orderedRows.map(row=><div className="overview-line" key={row}>
                  {letters.map((letter,i)=>{
                    const column=i+1;
                    const bag=latest.get(`${side}-${compartment}-${column}-${row}`);
                    const age=bagAge(bag,anchor,now);
                    const picked=selected.has(`${side}-${compartment}-${column}-${row}`);
                    return <button type="button" key={letter} style={{backgroundColor:picked?BAG_SELECTION_COLOR:bagColor(age)}} className={`overview-cell${picked?' active':''}`} title={`${display} · ${letter}${row} · ${age===null?'belum tercatat':`${Math.floor(age/24)} hari`}`} aria-label={`Kompartemen ${display}, kolom ${letter}, baris ${row}: ${age===null?'belum tercatat':`${Math.floor(age/24)} hari`}`} aria-pressed={picked} onClick={()=>onSelect(side,compartment,column,row)}/>;
                  })}
                  <span className="overview-row-number">{row}</span>
                </div>)}
              </div>
              <div className="overview-column-labels">{letters.map(letter=><span key={letter}>{letter}</span>)}<span/></div>
              {band===0&&<button type="button" className="overview-title" onClick={()=>onFocusCompartment(side,compartment)} aria-label={`Buka detail kompartemen ${display}`}><span className="overview-title-full">Comp.&nbsp;</span>{display}</button>}
            </div>;
          })}
        </div>)}
      </div>
    </div>
    <div className="legend"><span><i style={{background:BAG_SELECTION_COLOR}}/> Dipilih</span><span><i className="unknown"/> Belum tercatat</span><span><i style={{background:bagColor(0)}}/> 0 hari</span><span><i style={{background:bagColor(450*24)}}/> 450 hari</span><span><i style={{background:bagColor(BF_561_MAX_HOURS)}}/> ≥{BF_561_SETTINGS.colorScaleDays} hari</span></div>
    <p className="fineprint">Gradasi hijau terang → hijau sangat gelap selama 0–900 hari; di atas 900 hari tetap hijau sangat gelap. Umur berjalan otomatis 24 jam sehari.</p>
  </section>;
}
