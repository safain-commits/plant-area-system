export type BagAgeRecord = {installed_at?:string|null; installed_at_hours:number; created_at:string};
export type HourAnchor = {runhours:number; updated_at:string|null};

export function installationTime(bag:BagAgeRecord, anchor:HourAnchor){
  if(bag.installed_at) return Date.parse(bag.installed_at);
  // Older records have only a meter reading; reconstruct their date using
  // the last equipment reading under the requested 24/7 assumption.
  const reference=anchor.updated_at?Date.parse(anchor.updated_at):NaN;
  if(Number.isFinite(reference)) return reference-(anchor.runhours-bag.installed_at_hours)*3600000;
  return Date.parse(bag.created_at);
}

export function bagAge(bag:BagAgeRecord|undefined,anchor:HourAnchor,now:number){
  if(!bag)return null;
  const installed=installationTime(bag,anchor);
  return Number.isFinite(installed)?Math.max(0,Math.floor((now-installed)/3600000)):null;
}
