export function Flash({ error, notice }: { error?: string; notice?: string }) {
  if (error) {
    return (
      <p className="flash flash-err" role="alert">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p className="flash flash-ok" role="status">
        {notice}
      </p>
    );
  }
  return null;
}
