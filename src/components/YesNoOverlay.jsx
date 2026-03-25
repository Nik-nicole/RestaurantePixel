export default function YesNoOverlay({ open, data }) {
  if (!open || !data) return null;
  return (
    <div className="overlay-backdrop">
      <div className="yesno-box">
        <div className="yesno-label">{data.label}</div>
        <div className="yesno-btns">
          <button className="btn-yes" onClick={data.onYes}>✔ SÍ</button>
          <button className="btn-no"  onClick={data.onNo}>✕ NO</button>
        </div>
      </div>
    </div>
  );
}
