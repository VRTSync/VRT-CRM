export default function TokenSwatch({ token, label = token }) {
  return (
    <div className="sw">
      <div
        className="chipcolor"
        style={{ background: `var(${token})` }}
        aria-hidden="true"
      />
      <div className="swl">
        <div className="swn">{label}</div>
        <div className="swv">{token}</div>
      </div>
    </div>
  );
}