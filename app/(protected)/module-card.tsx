import type { ReactNode } from 'react';
type Props={title:string;description:string;icon:ReactNode;href?:string;eyebrow?:string};
export function ModuleCard({title,description,icon,href,eyebrow}:Props){
  const content=<><span className="module-icon">{icon}</span><span className="module-copy"><span className="module-eyebrow">{eyebrow|| (href?'TERSEDIA':'RENCANA')}</span><strong>{title}</strong><span>{description}</span></span><span className="module-end">{href?'→':'Nanti'}</span></>;
  return href?<a href={href} className="module-card available">{content}</a>:<div className="module-card planned" aria-disabled="true">{content}</div>;
}
