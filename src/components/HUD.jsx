export default function HUD({ hint }) {
  return (
    <>
      <div className="hud">🍽 PIXEL RESTAURANT RPG</div>
      <div className="controls-hint" dangerouslySetInnerHTML={{ __html: hint.replace('   ', '<br/>') }} />
    </>
  );
}
