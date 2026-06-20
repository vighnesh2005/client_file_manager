import { getSlaColor, getSlaLabel } from '@/lib/utils';

export default function SlaBadge({ slaStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSlaColor(slaStatus)}`}>
      {getSlaLabel(slaStatus)}
    </span>
  );
}
