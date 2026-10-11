// Equipment configuration: 561-BF1 runs continuously for display purposes.
export const BAG_FILTERS = [
  {code:'561-BF1',perSide:12},
  {code:'562-BF1',perSide:12},
  {code:'421-BF1',perSide:15},
  {code:'422-BF2',perSide:15},
].map(item=>({...item,compartments:item.perSide*2,bagsPerCompartment:136,colorScaleDays:900,hoursPerDay:24}));
export type BagFilterConfig = typeof BAG_FILTERS[number];
export const getBagFilter=(code:string)=>BAG_FILTERS.find(item=>item.code===code.toUpperCase());
export const BF_561_SETTINGS = BAG_FILTERS[0];

export const BF_561_MAX_HOURS = BF_561_SETTINGS.colorScaleDays * BF_561_SETTINGS.hoursPerDay;
