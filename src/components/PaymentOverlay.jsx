import { useState, useEffect } from 'react';

function PhoneNotification({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="phone-notif slide-in">
      <div className="phone-header">
        <span>📱</span>
        <span className="phone-from">Restaurante Pixel</span>
      </div>
      <div className="phone-msg" style={{ whiteSpace: 'pre-line' }}>{message}</div>
      <div className="phone-time">{new Date().toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })}</div>
    </div>
  );
}

export default function PaymentOverlay({ open, total, onCard, onCash, onClose }) {
  const [mode,       setMode]       = useState('choose'); // choose | cash
  const [cashInput,  setCashInput]  = useState('');
  const [cashError,  setCashError]  = useState('');
  const [notifMsg,   setNotifMsg]   = useState(null);
  const [notifDone,  setNotifDone]  = useState(null);

  useEffect(() => { if (open) { setMode('choose'); setCashInput(''); setCashError(''); } }, [open]);

  if (!open && !notifMsg) return null;

  const handleCard = () => {
    onClose();
    setNotifMsg(`✅ Pago aprobado\n$${total.toLocaleString('es-CO')} COP\nRestaurante Pixel\n¡Gracias por su visita!`);
    setNotifDone(() => () => onCard());
  };

  const handleCash = () => {
    const paid   = parseInt(cashInput.replace(/\D/g, ''), 10) || 0;
    const change = paid - total;
    if (change < 0) { setCashError('⚠ Monto insuficiente'); return; }
    onClose();
    setNotifMsg(`🧾 Factura emitida\nPagó: $${paid.toLocaleString('es-CO')}\nCambio: $${change.toLocaleString('es-CO')}\n¡Gracias!`);
    setNotifDone(() => () => onCash(paid));
  };

  return (
    <>
      {open && (
        <div className="overlay-backdrop">
          <div className="payment-box">
            {mode === 'choose' ? (
              <>
                <h3>💳 MÉTODO DE PAGO</h3>
                <div className="pay-total">Total: ${total.toLocaleString('es-CO')}</div>
                <div className="pay-btns">
                  <button className="btn-card" onClick={handleCard}>💳 TARJETA</button>
                  <button className="btn-cash" onClick={() => setMode('cash')}>💵 EFECTIVO</button>
                </div>
              </>
            ) : (
              <>
                <h3>💵 PAGO EN EFECTIVO</h3>
                <input
                  className="cash-input"
                  type="number"
                  placeholder="¿Cuánto paga?"
                  value={cashInput}
                  onChange={e => { setCashInput(e.target.value); setCashError(''); }}
                  autoFocus
                />
                {cashError && <div className="cash-error">{cashError}</div>}
                <div className="pay-btns">
                  <button className="btn-confirm" onClick={handleCash}>✔ PAGAR</button>
                  <button className="btn-secondary" onClick={() => setMode('choose')}>← VOLVER</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {notifMsg && (
        <PhoneNotification
          message={notifMsg}
          onDone={() => { const cb = notifDone; setNotifMsg(null); setNotifDone(null); if (cb) cb(); }}
        />
      )}
    </>
  );
}
