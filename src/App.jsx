import { useState, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "meeting_room_reservations";
const USERS_KEY   = "meeting_room_users";

const defaultUsers = [
  { id: "u1", name: "田中 太郎", email: "tanaka@company.co.jp", password: "1234", role: "admin" },
  { id: "u2", name: "鈴木 花子", email: "suzuki@company.co.jp", password: "1234", role: "user" },
  { id: "u3", name: "佐藤 一郎", email: "sato@company.co.jp", password: "1234", role: "user" },
];

const rooms = [
  { id: "r1", name: "会議室 1", capacity: 10, color: "#00C2A8", bg: "rgba(0,194,168,0.12)" },
  { id: "r2", name: "会議室 2", capacity:  4, color: "#FF6B35", bg: "rgba(255,107,53,0.12)" },
];

const HOURS = Array.from({ length: 25 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2,"0")}:${m}`;
});

const getToday = () => new Date().toISOString().slice(0,10);
const formatDate = (d) => { const [y,m,day] = d.split("-"); return `${y}年${parseInt(m)}月${parseInt(day)}日`; };
const formatShort = (d) => { const [,m,day] = d.split("-"); return `${parseInt(m)}/${parseInt(day)}`; };
const DAY_NAMES = ["日","月","火","水","木","金","土"];
const getDayName = (d) => DAY_NAMES[new Date(d + "T00:00:00").getDay()];
const toMin = (t) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
const overlaps = (a, b) => a.date === b.date && a.roomId === b.roomId && toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime);
const addDays = (dateStr, n) => { const d = new Date(dateStr + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
const getWeekDates = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const dow = d.getDay();
  const monday = new Date(d); monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({length: 5}, (_, i) => { const day = new Date(monday); day.setDate(monday.getDate() + i); return day.toISOString().slice(0,10); });
};

const Icon = ({ name, size = 18 }) => {
  const icons = {
    calendar:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    user:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    x:            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    bell:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    logout:       <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    check:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    trash:        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
    chevronLeft:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
    chevronRight: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>,
    door:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M14 12h.01"/></svg>,
    grid:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    list:         <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  };
  return icons[name] || null;
};

function Toast({ notifications, dismiss }) {
  return (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
      {notifications.map(n => (
        <div key={n.id} style={{ background: n.type==="error" ? "#FF4444" : n.type==="warn" ? "#FF9800" : "#00C2A8", color:"#fff", padding:"12px 20px", borderRadius:12, fontSize:14, fontWeight:600, display:"flex", alignItems:"center", gap:10, boxShadow:"0 4px 20px rgba(0,0,0,0.3)", animation:"slideIn 0.3s ease", maxWidth:320 }}>
          {n.type==="success" ? <Icon name="check" size={16}/> : <Icon name="bell" size={16}/>}
          {n.message}
          <button onClick={()=>dismiss(n.id)} style={{ marginLeft:"auto", background:"none", border:"none", color:"#fff", cursor:"pointer" }}><Icon name="x" size={14}/></button>
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("tanaka@company.co.jp");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState("");
  const handleSubmit = () => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || JSON.stringify(defaultUsers));
    const user = users.find(u => u.email===email && u.password===password);
    if (user) onLogin(user);
    else setError("メールアドレスまたはパスワードが正しくありません");
  };
  return (
    <div style={{ minHeight:"100vh", background:"#0A0E1A", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif", padding:"20px 0" }}>
      <style>{`
        @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp  { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing:border-box; }
        input,select,button { font-family:inherit; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0A0E1A} ::-webkit-scrollbar-thumb{background:#1e2a40;border-radius:4px}
        .main-grid { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
        .header-pills { display:flex; gap:14px; align-items:center; }
        .nav-bar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .date-input { display:block; }
        @media (max-width: 768px) {
          .main-grid { grid-template-columns:1fr !important; }
          .header-pills { display:none !important; }
          .sidebar { order:2; }
          .date-input { display:none !important; }
          .nav-bar { gap:6px; }
        }
      `}</style>
      <div style={{ background:"#0F1525", border:"1px solid #1e2a40", borderRadius:24, padding:"40px 28px", width:"100%", maxWidth:420, margin:"0 16px", animation:"fadeUp 0.5s ease", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:64, height:64, background:"linear-gradient(135deg,#00C2A8,#00E5CC)", borderRadius:18, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 8px 24px rgba(0,194,168,0.4)" }}>
            <Icon name="door" size={30}/>
          </div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.5px" }}>会議室予約システム</div>
          <div style={{ fontSize:13, color:"#4a5568", marginTop:4 }}>Room Booking System</div>
        </div>
        {[["メールアドレス", email, setEmail, "email", "text"],["パスワード", password, setPassword, "pw", "password"]].map(([label, val, setter, key, type]) => (
          <div key={key} style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, color:"#6b7a99", fontWeight:600, letterSpacing:"0.5px", display:"block", marginBottom:8 }}>{label}</label>
            <input type={type} value={val} onChange={e=>setter(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              style={{ width:"100%", padding:"12px 16px", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, color:"#e2e8f0", fontSize:14, outline:"none", transition:"border 0.2s" }}
              onFocus={e=>e.target.style.borderColor="#00C2A8"} onBlur={e=>e.target.style.borderColor="#1e2a40"}/>
          </div>
        ))}
        {error && <div style={{ background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.3)", color:"#ff6b6b", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:16 }}>{error}</div>}
        <button onClick={handleSubmit} style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#00C2A8,#00E5CC)", border:"none", borderRadius:12, color:"#0A0E1A", fontSize:15, fontWeight:700, cursor:"pointer" }}
          onMouseOver={e=>e.target.style.opacity="0.85"} onMouseOut={e=>e.target.style.opacity="1"}>ログイン</button>
        <div style={{ marginTop:24, padding:"16px", background:"#141b2e", borderRadius:10, fontSize:12, color:"#4a5568" }}>
          <div style={{ fontWeight:600, color:"#6b7a99", marginBottom:6 }}>デモアカウント（パスワード：1234）</div>
          <div>管理者: tanaka@company.co.jp</div>
          <div>一般: suzuki@company.co.jp</div>
        </div>
      </div>
    </div>
  );
}

const labelStyle  = { fontSize:12, color:"#6b7a99", fontWeight:600, letterSpacing:"0.5px", display:"block", marginBottom:6 };
const inputStyle  = { width:"100%", padding:"11px 14px", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, color:"#e2e8f0", fontSize:14, outline:"none", transition:"border 0.2s", display:"block" };
const selectStyle = { width:"100%", padding:"11px 14px", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, color:"#e2e8f0", fontSize:14, outline:"none" };

function BookingModal({ date: initDate, roomId: initRoomId, prefillStart, onClose, onSave, reservations, currentUser }) {
  const [selectedRoomId, setSelectedRoomId] = useState(initRoomId || "r1");
  const [selectedDate, setSelectedDate] = useState(initDate);
  const room = rooms.find(r => r.id === selectedRoomId);
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState(prefillStart || "09:00");
  const [endTime, setEndTime] = useState(() => { const idx = HOURS.indexOf(prefillStart || "09:00"); return HOURS[Math.min(idx+2, HOURS.length-1)] || "10:00"; });
  const [error, setError] = useState("");
  const handleSave = () => {
    if (!title.trim()) return setError("タイトルを入力してください");
    if (toMin(startTime) >= toMin(endTime)) return setError("終了時刻は開始時刻より後にしてください");
    const newRes = { id: Date.now().toString(), roomId: selectedRoomId, date: selectedDate, startTime, endTime, title: title.trim(), attendees: attendees.trim(), notes: notes.trim(), userId: currentUser.id, userName: currentUser.name };
    if (reservations.some(r => overlaps(r, newRes))) return setError("選択した時間帯はすでに予約があります");
    onSave(newRes); onClose();
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:1000, overflowY:"auto", padding:"20px 12px" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:"#0F1525", border:"1px solid #1e2a40", borderRadius:20, padding:"24px 20px", width:"100%", maxWidth:480, animation:"fadeUp 0.25s ease", boxShadow:"0 24px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div style={{ fontSize:18, fontWeight:700, color:"#fff" }}>新規予約</div>
          <button onClick={onClose} style={{ background:"#141b2e", border:"none", borderRadius:8, padding:8, cursor:"pointer", color:"#6b7a99" }}><Icon name="x"/></button>
        </div>
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>会議室を選択</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {rooms.map(r => {
              const isSelected = selectedRoomId === r.id;
              const isBusy = reservations.some(res => res.roomId===r.id && res.date===selectedDate && toMin(res.startTime) < toMin(endTime) && toMin(startTime) < toMin(res.endTime));
              return (
                <button key={r.id} onClick={()=>{ setSelectedRoomId(r.id); setError(""); }}
                  style={{ padding:"12px 14px", borderRadius:12, cursor:"pointer", textAlign:"left", border: isSelected ? `2px solid ${r.color}` : "2px solid #1e2a40", background: isSelected ? r.bg : "#141b2e", transition:"all 0.18s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:r.color }}/>
                    <span style={{ fontSize:13, fontWeight:700, color: isSelected ? r.color : "#a0aec0" }}>{r.name}</span>
                    {isSelected && <span style={{ marginLeft:"auto", color:r.color }}><Icon name="check" size={13}/></span>}
                  </div>
                  <div style={{ fontSize:11, color:"#4a5568" }}>最大 {r.capacity} 名</div>
                  {isBusy && <div style={{ fontSize:10, color:"#FF6B35", fontWeight:600, marginTop:3 }}>⚠ この時間帯は予約あり</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>日付</label>
          <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }} onFocus={e=>e.target.style.borderColor=room.color} onBlur={e=>e.target.style.borderColor="#1e2a40"}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>会議タイトル <span style={{ color:"#FF6B35" }}>*</span></label>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：週次ミーティング" style={inputStyle} onFocus={e=>e.target.style.borderColor=room.color} onBlur={e=>e.target.style.borderColor="#1e2a40"}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>開始時刻</label>
            <select value={startTime} onChange={e=>setStartTime(e.target.value)} style={selectStyle}>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
          </div>
          <div>
            <label style={labelStyle}>終了時刻</label>
            <select value={endTime} onChange={e=>setEndTime(e.target.value)} style={selectStyle}>{HOURS.map(h => <option key={h} value={h}>{h}</option>)}</select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>参加者</label>
          <input value={attendees} onChange={e=>setAttendees(e.target.value)} placeholder="例：田中、鈴木、佐藤" style={inputStyle} onFocus={e=>e.target.style.borderColor=room.color} onBlur={e=>e.target.style.borderColor="#1e2a40"}/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>詳細・メモ</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="例：資料の準備が必要、オンライン参加者あり など" rows={3} style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor=room.color} onBlur={e=>e.target.style.borderColor="#1e2a40"}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>予約者</label>
          <div style={{ ...inputStyle, color:"#a0aec0", display:"flex", alignItems:"center", gap:8, borderColor:"#1e2a40" }}><Icon name="user" size={15}/> {currentUser.name}</div>
        </div>
        {error && <div style={{ background:"rgba(255,68,68,0.1)", border:"1px solid rgba(255,68,68,0.3)", color:"#ff6b6b", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:"12px", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, color:"#6b7a99", fontSize:14, fontWeight:600, cursor:"pointer" }}>キャンセル</button>
          <button onClick={handleSave} style={{ flex:2, padding:"12px", background:`linear-gradient(135deg,${room.color},${room.color}cc)`, border:"none", borderRadius:10, color:"#0A0E1A", fontSize:14, fontWeight:700, cursor:"pointer" }}>予約する</button>
        </div>
      </div>
    </div>
  );
}

function DayTimeline({ date, reservations, currentUser, onBook, onCancel }) {
  const SLOT_H = 48; const START_HOUR = 9; const TOTAL_SLOTS = 24;
  const getResStyle = (res) => {
    const room = rooms.find(r => r.id === res.roomId);
    const startSlot = (toMin(res.startTime) - START_HOUR * 60) / 30;
    const endSlot   = (toMin(res.endTime)   - START_HOUR * 60) / 30;
    return { top: startSlot*SLOT_H+1, height: (endSlot-startSlot)*SLOT_H-2, background: room.bg, borderLeft:`3px solid ${room.color}`, color: room.color };
  };
  return (
    <div style={{ display:"grid", gridTemplateColumns:"52px 1fr 1fr", borderRadius:16, overflow:"hidden", border:"1px solid #1e2a40" }}>
      <div style={{ background:"#141b2e", padding:"12px 6px", borderBottom:"1px solid #1e2a40" }}/>
      {rooms.map(room => (
        <div key={room.id} style={{ background:"#141b2e", padding:"12px 14px", borderBottom:"1px solid #1e2a40", borderLeft:"1px solid #1e2a40", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:room.color }}/>
          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{room.name}</span>
          <span style={{ fontSize:11, color:"#4a5568", marginLeft:"auto" }}>定員{room.capacity}名</span>
        </div>
      ))}
      <div style={{ background:"#0A0E1A" }}>
        {HOURS.map((h,i) => (
          <div key={h} style={{ height:SLOT_H, borderBottom:"1px solid #1e2a40", display:"flex", alignItems:"center", justifyContent:"flex-end", paddingRight:8, fontSize:10, color:"#4a5568", fontFamily:"monospace" }}>
            {i%2===0 ? h : ""}
          </div>
        ))}
      </div>
      {rooms.map(room => {
        const roomRes = reservations.filter(r => r.date===date && r.roomId===room.id);
        return (
          <div key={room.id} style={{ background:"#0F1525", borderLeft:"1px solid #1e2a40", position:"relative", height:SLOT_H*TOTAL_SLOTS }}>
            {HOURS.map((h,i) => (
              <div key={h} onClick={()=>onBook(room.id, h)}
                style={{ position:"absolute", top:i*SLOT_H, left:0, right:0, height:SLOT_H, borderBottom:"1px solid #1e2a4050", cursor:"pointer", transition:"background 0.15s" }}
                onMouseOver={e=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}/>
            ))}
            {roomRes.map(res => (
              <div key={res.id} style={{ position:"absolute", left:4, right:4, borderRadius:8, padding:"5px 9px", cursor:"pointer", overflow:"hidden", ...getResStyle(res) }}
                onClick={()=>{ if (res.userId===currentUser.id||currentUser.role==="admin") { if(window.confirm(`「${res.title}」の予約をキャンセルしますか？`)) onCancel(res.id); } }}>
                <div style={{ fontSize:11, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{res.title}</div>
                <div style={{ fontSize:10, opacity:0.7 }}>{res.startTime}–{res.endTime}</div>
                <div style={{ fontSize:10, opacity:0.6 }}>{res.userName}</div>
                {res.attendees && <div style={{ fontSize:10, opacity:0.6, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>👥 {res.attendees}</div>}
                {res.notes && <div style={{ fontSize:10, opacity:0.55, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>📝 {res.notes}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function WeekView({ weekDates, reservations, currentUser, onBook, onCancel }) {
  const HOUR_H = 52; const START_H = 9; const END_H = 21;
  const HOURS_NUM = END_H - START_H; const TOTAL_PX = HOUR_H * HOURS_NUM;
  const today = getToday();
  const hourLabels = Array.from({length: HOURS_NUM + 1}, (_,i) => `${String(START_H + i).padStart(2,"0")}:00`);
  const getResStyle = (res, room) => {
    const startMin = toMin(res.startTime) - START_H * 60;
    const endMin   = toMin(res.endTime)   - START_H * 60;
    return { top: (startMin / 60) * HOUR_H, height: Math.max(((endMin - startMin) / 60) * HOUR_H, 16), background: room.bg, borderLeft: `3px solid ${room.color}`, color: room.color };
  };
  const TIME_COL = 46;
  return (
    <div style={{ border:"1px solid #1e2a40", borderRadius:16, overflow:"hidden" }}>
      <div style={{ display:"grid", gridTemplateColumns:`${TIME_COL}px repeat(5,1fr)`, background:"#141b2e", borderBottom:"1px solid #1e2a40" }}>
        <div style={{ padding:"10px 4px", borderRight:"1px solid #1e2a40" }}/>
        {weekDates.map(d => {
          const isToday = d === today;
          const isWknd  = [0,6].includes(new Date(d+"T00:00:00").getDay());
          return (
            <div key={d} style={{ padding:"10px 6px", borderLeft:"1px solid #1e2a40", textAlign:"center" }}>
              <div style={{ fontSize:10, color: isWknd ? "#FF6B35" : "#6b7a99", fontWeight:600 }}>{getDayName(d)}曜</div>
              <div style={{ fontSize:13, fontWeight:700, color: isToday ? "#00C2A8" : isWknd ? "#FF6B35" : "#fff", marginTop:2 }}>
                {formatShort(d)}
                {isToday && <span style={{ display:"block", width:5, height:5, borderRadius:"50%", background:"#00C2A8", margin:"3px auto 0" }}/>}
              </div>
            </div>
          );
        })}
      </div>
      {rooms.map((room, ri) => (
        <div key={room.id} style={{ borderBottom: ri < rooms.length-1 ? "2px solid #1e2a40" : "none" }}>
          <div style={{ display:"grid", gridTemplateColumns:`${TIME_COL}px 1fr`, background:"#141b2e" }}>
            <div style={{ borderRight:"1px solid #1e2a40" }}/>
            <div style={{ padding:"5px 12px", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:room.color }}/>
              <span style={{ fontSize:12, fontWeight:700, color:room.color }}>{room.name}</span>
              <span style={{ fontSize:10, color:"#4a5568", marginLeft:4 }}>最大{room.capacity}名</span>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:`${TIME_COL}px repeat(5,1fr)`, background: ri%2===0 ? "#0F1525" : "#0C1220" }}>
            <div style={{ position:"relative", height:TOTAL_PX, borderRight:"1px solid #1e2a40", background:"#0A0E1A" }}>
              {hourLabels.map((label, hi) => (
                <div key={hi} style={{ position:"absolute", top: hi * HOUR_H - 7, right:5, fontSize:9, color:"#4a5568", fontFamily:"monospace", letterSpacing:"-0.3px", whiteSpace:"nowrap", lineHeight:1 }}>{label}</div>
              ))}
            </div>
            {weekDates.map(d => {
              const dayRes = reservations.filter(r => r.date===d && r.roomId===room.id);
              const isWknd = [0,6].includes(new Date(d+"T00:00:00").getDay());
              return (
                <div key={d} style={{ borderLeft:"1px solid #1e2a40", position:"relative", height:TOTAL_PX, background: isWknd ? "rgba(255,107,53,0.025)" : "transparent", cursor:"pointer" }}
                  onClick={()=>onBook(room.id, d, "09:00")}>
                  {hourLabels.map((_, hi) => (
                    <div key={hi} style={{ position:"absolute", top: hi * HOUR_H, left:0, right:0, borderTop: hi===0 ? "none" : "1px solid #1e2a4050", pointerEvents:"none" }}/>
                  ))}
                  {hourLabels.map((_, hi) => hi < HOURS_NUM && (
                    <div key={"h"+hi} style={{ position:"absolute", top: hi * HOUR_H + HOUR_H/2, left:0, right:0, borderTop:"1px dashed #1e2a4030", pointerEvents:"none" }}/>
                  ))}
                  {dayRes.map(res => (
                    <div key={res.id} style={{ position:"absolute", left:3, right:3, borderRadius:6, padding:"3px 6px", overflow:"hidden", zIndex:2, ...getResStyle(res, room), cursor:"pointer" }}
                      onClick={e=>{ e.stopPropagation(); if(res.userId===currentUser.id||currentUser.role==="admin"){ if(window.confirm(`「${res.title}」をキャンセルしますか？`)) onCancel(res.id); } }}>
                      <div style={{ fontSize:10, fontWeight:700, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{res.title}</div>
                      <div style={{ fontSize:9, opacity:0.75 }}>{res.startTime}–{res.endTime}</div>
                    </div>
                  ))}
                  {!isWknd && (
                    <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s", pointerEvents:"none" }}>
                      <div style={{ fontSize:10, color:room.color, background:room.bg, borderRadius:6, padding:"3px 8px" }}>＋ 予約</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MyReservations({ reservations, currentUser, onCancel }) {
  const today = getToday();
  const upcoming = reservations.filter(r => r.userId===currentUser.id && r.date>=today).sort((a,b) => a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime));
  return (
    <div style={{ marginTop:20 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#6b7a99", letterSpacing:"0.5px", marginBottom:10 }}>
        自分の予約 <span style={{ color:"#00C2A8" }}>({upcoming.length}件)</span>
      </div>
      {upcoming.length===0
        ? <div style={{ color:"#4a5568", fontSize:12, padding:"14px", background:"#141b2e", borderRadius:12, textAlign:"center" }}>予約はありません</div>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
            {upcoming.map(res => {
              const room = rooms.find(r=>r.id===res.roomId);
              return (
                <div key={res.id} style={{ background:"#141b2e", border:"1px solid #1e2a40", borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:4, height:36, borderRadius:2, background:room.color, flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{res.title}</div>
                    <div style={{ fontSize:11, color:"#6b7a99", marginTop:1 }}>{formatDate(res.date)} {res.startTime}–{res.endTime}</div>
                    <div style={{ fontSize:10, color:room.color }}>{room.name}</div>
                    {res.attendees && <div style={{ fontSize:10, color:"#4a5568", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>👥 {res.attendees}</div>}
                    {res.notes && <div style={{ fontSize:10, color:"#4a5568", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>📝 {res.notes}</div>}
                  </div>
                  <button onClick={()=>{ if(window.confirm(`「${res.title}」をキャンセルしますか？`)) onCancel(res.id); }}
                    style={{ background:"rgba(255,68,68,0.1)", border:"none", borderRadius:7, padding:"6px 8px", cursor:"pointer", color:"#ff6b6b" }}>
                    <Icon name="trash" size={13}/>
                  </button>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

export default function App() {
  const [currentUser,   setCurrentUser]   = useState(null);
  const [reservations,  setReservations]  = useState([]);
  const [selectedDate,  setSelectedDate]  = useState(getToday());
  const [viewMode,      setViewMode]      = useState("day");
  const [modal,         setModal]         = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setReservations(JSON.parse(saved));
      if (!localStorage.getItem(USERS_KEY)) localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    } catch(e) {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations)); } catch(e) {}
  }, [reservations]);

  const notify = (message, type="success") => {
    const id = Date.now();
    setNotifications(p => [...p, { id, message, type }]);
    setTimeout(() => setNotifications(p => p.filter(n=>n.id!==id)), 4000);
  };

  const addReservation = (res) => { setReservations(p=>[...p,res]); notify(`✓ ${res.title} を予約しました`); };
  const cancelReservation = (id) => {
    const res = reservations.find(r=>r.id===id);
    setReservations(p=>p.filter(r=>r.id!==id));
    if(res) notify(`${res.title} をキャンセルしました`, "warn");
  };

  const changeDate = (delta) => setSelectedDate(addDays(selectedDate, delta));
  const changeWeek = (delta) => setSelectedDate(addDays(selectedDate, delta*7));

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser}/>;

  const weekDates = getWeekDates(selectedDate);
  const todayRes  = reservations.filter(r => r.date===selectedDate);
  const isWeekend = [0,6].includes(new Date(selectedDate+"T00:00:00").getDay());
  const weekLabel = `${formatShort(weekDates[0])} 〜 ${formatShort(weekDates[4])}`;

  return (
    <div style={{ minHeight:"100vh", background:"#0A0E1A", fontFamily:"'Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif", color:"#e2e8f0" }}>
      <style>{`
        @keyframes slideIn { from{transform:translateX(40px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp  { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { box-sizing:border-box; }
        input,select,button { font-family:inherit; }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#0A0E1A} ::-webkit-scrollbar-thumb{background:#1e2a40;border-radius:4px}
        .main-grid { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
        .header-pills { display:flex; gap:14px; align-items:center; }
        .nav-bar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
        .date-input { display:block; }
        @media (max-width: 768px) {
          .main-grid { grid-template-columns:1fr !important; }
          .header-pills { display:none !important; }
          .sidebar { order:2; }
          .date-input { display:none !important; }
          .nav-bar { gap:6px; }
        }
      `}</style>

      <Toast notifications={notifications} dismiss={id=>setNotifications(p=>p.filter(n=>n.id!==id))}/>

      <div style={{ background:"#0F1525", borderBottom:"1px solid #1e2a40", padding:"0 16px", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1300, margin:"0 auto", height:60, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginRight:"auto" }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#00C2A8,#00E5CC)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Icon name="door" size={18}/>
            </div>
            <span style={{ fontSize:16, fontWeight:700, color:"#fff" }}>会議室予約</span>
          </div>
          <div className="header-pills">
            {rooms.map(room => {
              const nowStr = new Date().toTimeString().slice(0,5);
              const busy = reservations.some(r => r.roomId===room.id && r.date===getToday() && toMin(r.startTime)<=toMin(nowStr) && toMin(nowStr)<toMin(r.endTime));
              return (
                <div key={room.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background: busy ? "rgba(255,107,53,0.1)" : "rgba(0,194,168,0.1)", border:`1px solid ${busy?"rgba(255,107,53,0.3)":"rgba(0,194,168,0.3)"}`, borderRadius:20, fontSize:12, fontWeight:600 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background: busy?"#FF6B35":"#00C2A8", boxShadow:`0 0 6px ${busy?"#FF6B35":"#00C2A8"}` }}/>
                  <span style={{ color: busy?"#FF6B35":"#00C2A8" }}>{room.name}</span>
                  <span style={{ color: busy?"#FF6B35":"#00C2A8", opacity:0.7 }}>{busy?"使用中":"空き"}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 12px", background:"#141b2e", borderRadius:20, fontSize:12 }}>
            <Icon name="user" size={13}/>
            <span style={{ color:"#a0aec0" }}>{currentUser.name}</span>
            {currentUser.role==="admin" && <span style={{ color:"#00C2A8", fontSize:10, fontWeight:700 }}>ADMIN</span>}
          </div>
          <button onClick={()=>setCurrentUser(null)} style={{ background:"none", border:"none", color:"#4a5568", cursor:"pointer", padding:6, borderRadius:8 }}
            onMouseOver={e=>e.currentTarget.style.color="#e2e8f0"} onMouseOut={e=>e.currentTarget.style.color="#4a5568"}>
            <Icon name="logout"/>
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1300, margin:"0 auto", padding:"20px 16px" }}>
        <div className="main-grid">
          <div>
            <div className="nav-bar">
              <div style={{ display:"flex", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, padding:3, gap:2 }}>
                {[["day","日表示","list"],["week","週表示","grid"]].map(([mode, label, icon]) => (
                  <button key={mode} onClick={()=>setViewMode(mode)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.18s",
                      background: viewMode===mode ? "linear-gradient(135deg,#00C2A8,#00E5CC)" : "transparent",
                      color: viewMode===mode ? "#0A0E1A" : "#6b7a99" }}>
                    <Icon name={icon} size={13}/> {label}
                  </button>
                ))}
              </div>
              <button onClick={()=> viewMode==="day" ? changeDate(-1) : changeWeek(-1)}
                style={{ background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, padding:"7px 10px", cursor:"pointer", color:"#6b7a99" }}>
                <Icon name="chevronLeft"/>
              </button>
              <div style={{ flex:1, textAlign:"center", minWidth:160 }}>
                {viewMode==="day" ? (
                  <>
                    <span style={{ fontSize:16, fontWeight:700, color: isWeekend ? "#FF6B35" : "#fff" }}>{formatDate(selectedDate)}</span>
                    <span style={{ fontSize:11, color: isWeekend ? "#FF6B35" : "#6b7a99", marginLeft:6 }}>{getDayName(selectedDate)}曜日</span>
                    {selectedDate===getToday() && <span style={{ marginLeft:8, fontSize:11, background:"rgba(0,194,168,0.15)", color:"#00C2A8", borderRadius:5, padding:"1px 7px", fontWeight:600 }}>今日</span>}
                  </>
                ) : (
                  <>
                    <span style={{ fontSize:15, fontWeight:700, color:"#fff" }}>{weekLabel}</span>
                    <span style={{ marginLeft:8, fontSize:11, color:"#6b7a99" }}>週</span>
                  </>
                )}
              </div>
              <button onClick={()=> viewMode==="day" ? changeDate(1) : changeWeek(1)}
                style={{ background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, padding:"7px 10px", cursor:"pointer", color:"#6b7a99" }}>
                <Icon name="chevronRight"/>
              </button>
              <button onClick={()=>setSelectedDate(getToday())}
                style={{ padding:"7px 14px", background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, color:"#6b7a99", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                今日
              </button>
              <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}
                className="date-input"
                style={{ background:"#141b2e", border:"1px solid #1e2a40", borderRadius:10, padding:"7px 10px", color:"#6b7a99", fontSize:12, outline:"none", cursor:"pointer" }}/>
              <button onClick={()=>setModal({ roomId:"r1", date:selectedDate, startTime:"09:00" })}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px", background:"linear-gradient(135deg,#00C2A8,#00E5CC)", border:"none", borderRadius:10, color:"#0A0E1A", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                <Icon name="plus" size={15}/> 新規予約
              </button>
            </div>
            {viewMode==="day" ? (
              <>
                <DayTimeline date={selectedDate} reservations={reservations} currentUser={currentUser}
                  onBook={(roomId, startTime) => setModal({ roomId, date: selectedDate, startTime })} onCancel={cancelReservation}/>
                <div style={{ marginTop:10, fontSize:11, color:"#4a5568", textAlign:"center" }}>空きスロットをクリックで予約 ／ 予約ブロックをクリックでキャンセル</div>
              </>
            ) : (
              <>
                <WeekView weekDates={weekDates} reservations={reservations} currentUser={currentUser}
                  onBook={(roomId, date, startTime) => setModal({ roomId, date, startTime })} onCancel={cancelReservation}/>
                <div style={{ marginTop:10, fontSize:11, color:"#4a5568", textAlign:"center" }}>セルをクリックで予約 ／ 予約ブロックをクリックでキャンセル</div>
              </>
            )}
          </div>

          <div className="sidebar">
            <div style={{ background:"#0F1525", border:"1px solid #1e2a40", borderRadius:16, padding:"18px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#6b7a99", letterSpacing:"0.5px", marginBottom:12 }}>
                {viewMode==="day" ? `この日の予約（${todayRes.length}件）` : `今週の予約（${reservations.filter(r=>weekDates.includes(r.date)).length}件）`}
              </div>
              {(viewMode==="day" ? todayRes : reservations.filter(r=>weekDates.includes(r.date)))
                .sort((a,b)=>a.date.localeCompare(b.date)||a.startTime.localeCompare(b.startTime))
                .slice(0, 8)
                .map(res => {
                  const room = rooms.find(r=>r.id===res.roomId);
                  return (
                    <div key={res.id} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"7px", background:"#141b2e", borderRadius:9, marginBottom:6 }}>
                      <div style={{ width:3, height:32, borderRadius:2, background:room.color, flexShrink:0, marginTop:2 }}/>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{res.title}</div>
                        <div style={{ fontSize:10, color:"#4a5568", marginTop:1 }}>
                          {viewMode==="week" && `${formatShort(res.date)} `}{res.startTime}–{res.endTime}
                        </div>
                        <div style={{ fontSize:10, color:room.color }}>{room.name}</div>
                      </div>
                    </div>
                  );
                })}
              {(viewMode==="day" ? todayRes : reservations.filter(r=>weekDates.includes(r.date))).length===0 &&
                <div style={{ color:"#4a5568", fontSize:12, textAlign:"center", padding:"10px 0" }}>予約なし</div>}
            </div>
            <MyReservations reservations={reservations} currentUser={currentUser} onCancel={cancelReservation}/>
            <div style={{ marginTop:16, background:"#0F1525", border:"1px solid #1e2a40", borderRadius:16, padding:"14px 18px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#6b7a99", marginBottom:10 }}>会議室</div>
              {rooms.map(room => (
                <div key={room.id} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:7 }}>
                  <div style={{ width:11, height:11, borderRadius:3, background:room.color }}/>
                  <span style={{ fontSize:12, color:"#a0aec0" }}>{room.name}</span>
                  <span style={{ fontSize:11, color:"#4a5568", marginLeft:"auto" }}>最大{room.capacity}名</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <BookingModal date={modal.date} roomId={modal.roomId} prefillStart={modal.startTime}
          onClose={()=>setModal(null)} onSave={addReservation} reservations={reservations} currentUser={currentUser}/>
      )}
    </div>
  );
}
