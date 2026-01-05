export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "0.5rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1>Page not found</h1>
      <p>The page you tried to access does not exist.</p>
    </div>
  )
}
