import type { BagFilterConfig } from '../equipment-config';
export type DemoBag = {
  id:number;side:string;compartment:number;column:number;row:number;
  installed_at_hours:number;installed_at:string;reason:string;wo:string|null;
  actor:string;created_at:string;
};

// Fixed seed and dates relative to the opening day: the same demo clusters
// recur on each visit without writing any records to the equipment database.
export function createDemoBags(config:BagFilterConfig,reference=Date.UTC(2026,9,1)){
  let seed=Number(config.code.slice(0,3))*136;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const day=24*3600000;
  const at=(days:number)=>new Date(reference-days*day).toISOString();
  const base:DemoBag[]=[];
  const changes:DemoBag[]=[];
  let id=-100000;
  for(let display=1;display<=config.compartments;display++){
    const side=display<=config.perSide?'Utara':'Selatan';
    const compartment=side==='Utara'?display:config.compartments+1-display;
    const baseAge=520+((display*71)%610);
    for(let row=1;row<=17;row++)for(let column=1;column<=8;column++){
      const installed=at(baseAge+Math.floor(random()*35));
      base.push({id:id++,side,compartment,column,row,installed_at_hours:0,installed_at:installed,reason:'Pemasangan awal (demo)',wo:null,actor:'DEMO',created_at:installed});
    }
  }
  const reasons=['Bag bocor','Bag sobek','Differential pressure tinggi','Preventive replacement'];
  for(let cluster=0;cluster<18;cluster++){
    const display=1+(cluster*7)%config.compartments;
    const side=display<=config.perSide?'Utara':'Selatan';
    const compartment=side==='Utara'?display:config.compartments+1-display;
    const days=12+cluster*21;
    const installed=at(days);
    const wo=`WO-DEMO-${config.code}-${String(260100+cluster).padStart(6,'0')}`;
    const columnStart=1+Math.floor(random()*5);
    const rowStart=1+Math.floor(random()*11);
    const width=2+Math.floor(random()*3);
    const height=3+Math.floor(random()*5);
    for(let row=rowStart;row<Math.min(18,rowStart+height);row++)for(let column=columnStart;column<Math.min(9,columnStart+width);column++){
      changes.push({id:id++,side,compartment,column,row,installed_at_hours:0,installed_at:installed,reason:reasons[cluster%reasons.length],wo,actor:'DEMO',created_at:installed});
    }
  }
  // A later WO revisits several positions, so the coordinate timeline shows
  // an initial installation and two successive replacements.
  const followUp=at(2);
  for(const previous of changes.filter(b=>b.wo===`WO-DEMO-${config.code}-260100`).slice(0,6)){
    changes.push({...previous,id:id++,installed_at:followUp,created_at:followUp,reason:'Bag bocor kembali',wo:`WO-DEMO-${config.code}-260118`});
  }
  // Replacement records come first, so the latest map reflects each cluster.
  return {all:[...changes.sort((a,b)=>Date.parse(b.installed_at)-Date.parse(a.installed_at)),...base],changes};
}
