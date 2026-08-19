export default function TokenSwatch({ token, label = token }) {
  return (
    <div className="token-swatch">
      <div
        className="token-swatch-color"
        style={{ backgroundColor: `var(${token})` }}
        aria-hidden="true"
      />
      <div className="token-swatch-label">
        <strong>{label}</strong>
        <code>{token}</code>
      </div>
    </div>
  );
}