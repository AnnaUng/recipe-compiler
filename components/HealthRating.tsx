export default function HealthRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Health rating: ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-sm ${
            star <= rating ? "text-green-500" : "text-zinc-300 dark:text-zinc-600"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}