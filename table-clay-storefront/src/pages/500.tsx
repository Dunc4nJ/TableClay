export default function ErrorPage() {
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
      <h1>Something went wrong</h1>
      <p>We&apos;re having trouble loading this page.</p>
    </div>
  )
}
