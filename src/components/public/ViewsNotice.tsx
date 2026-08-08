export default function ViewsNotice({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-relaxed text-muted ${className}`}
      title="View counts are managed on FreePremium and are not imported from the embed source website."
    >
      View counts are site estimates / popularity indicators —{" "}
      <span className="text-foreground/80">not</span> live stats from the embed
      host.
    </p>
  );
}
