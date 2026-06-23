const widths = ['40%', '30%', '50%', '25%', '35%'];

export default function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-gray-200 rounded animate-pulse"
              style={{ width: widths[c % widths.length] }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
