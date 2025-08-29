
// ===== Accessibility helpers =====
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const state = {
  fontScale: 1.0,
  highContrast: false
};

function applyFontScale(){
  const b = Math.max(0.8, Math.min(1.6, state.fontScale));
  document.documentElement.style.fontSize = (18 * b) + "px";
  $("#font-size-display").textContent = Math.round(b*100) + "%";
}

function toggleContrast(force){
  state.highContrast = typeof force === "boolean" ? force : !state.highContrast;
  document.body.classList.toggle("high-contrast", state.highContrast);
  $("#contrast-status").textContent = state.highContrast ? "โหมดคอนทราสต์สูง: เปิด" : "โหมดคอนทราสต์สูง: ปิด";
}

// Keyboard shortcuts: Alt+= increase, Alt+- decrease, Alt+H toggle contrast
window.addEventListener("keydown", (e)=>{
  if(e.altKey && (e.key === "=" || e.key === "+")){ state.fontScale+=0.1; applyFontScale(); e.preventDefault(); }
  if(e.altKey && e.key === "-"){ state.fontScale-=0.1; applyFontScale(); e.preventDefault(); }
  if(e.altKey && (e.key.toLowerCase() === "h")){ toggleContrast(); e.preventDefault(); }
});

// ===== Web Speech (TTS) =====
function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }catch(err){
    console.warn("TTS not available:", err);
  }
}

// ===== Interactive Demo (Simulated) =====
const demo = {
  file: null,
  canvas: document.createElement("canvas"),
  ctx: null,
  announce: (msg)=>{
    const region = $("#live-region");
    region.textContent = msg;
    speak(msg);
  }
};

function setupDemo(){
  demo.ctx = demo.canvas.getContext("2d");
  $("#imageUpload").addEventListener("change", handleImage);
  $("#btn-sim-ocr").addEventListener("click", simOCR);
  $("#btn-sim-objects").addEventListener("click", simObjects);
  $("#btn-sim-face").addEventListener("click", simFace);
  $("#btn-sim-color").addEventListener("click", analyzeDominantColor);

  $("#btn-font-plus").addEventListener("click", ()=>{ state.fontScale+=0.1; applyFontScale() });
  $("#btn-font-minus").addEventListener("click", ()=>{ state.fontScale-=0.1; applyFontScale() });
  $("#btn-contrast").addEventListener("click", ()=> toggleContrast());
  applyFontScale();
  toggleContrast(false);
}

function handleImage(ev){
  const file = ev.target.files[0];
  if(!file) return;
  demo.file = file;
  const reader = new FileReader();
  reader.onload = function(){
    const img = new Image();
    img.onload = function(){
      const max = 640;
      let w = img.width, h = img.height;
      const scale = Math.min(1, max/Math.max(w,h));
      w = Math.round(w*scale); h = Math.round(h*scale);
      demo.canvas.width = w; demo.canvas.height = h;
      demo.ctx.drawImage(img, 0, 0, w, h);
      $("#upload-preview").innerHTML = "";
      $("#upload-preview").appendChild(demo.canvas);
      $("#upload-name").textContent = file.name;
      demo.announce("อัปโหลดภาพแล้ว พร้อมวิเคราะห์");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function simOCR(){
  // This is a simulated OCR result
  const sample = "จำลองการอ่าน: พบข้อความว่า “โปรดระวังขั้นบันได”";
  $("#simResult").textContent = sample;
  demo.announce(sample);
}

function simObjects(){
  const objects = ["คนเดิน", "เก้าอี้", "รถยนต์", "สุนัข", "จักรยาน", "ทางลาด", "ถังขยะ"];
  const detected = [];
  const n = 1 + Math.floor(Math.random()*3);
  for(let i=0;i<n;i++){
    detected.push(objects[Math.floor(Math.random()*objects.length)]);
  }
  const msg = "จำลองการตรวจจับวัตถุ: " + detected.join(", ");
  $("#simResult").textContent = msg;
  demo.announce(msg);
}

function simFace(){
  const msg = "จำลองจดจำใบหน้า: พบใบหน้า 1 คน (ตัวอย่าง)";
  $("#simResult").textContent = msg;
  demo.announce(msg);
}

function analyzeDominantColor(){
  if(!demo.ctx){ $("#simResult").textContent = "กรุณาอัปโหลดภาพก่อน"; return; }
  const w = demo.canvas.width, h = demo.canvas.height;
  if(!w || !h){ $("#simResult").textContent = "กรุณาอัปโหลดภาพก่อน"; return; }
  const data = demo.ctx.getImageData(0,0,w,h).data;
  let r=0,g=0,b=0,count=0;
  const step = 10*4; // sample every 10px
  for(let i=0;i<data.length;i+=step){
    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
  }
  r = Math.round(r/count); g = Math.round(g/count); b = Math.round(b/count);
  const name = nearestColorName(r,g,b);
  const msg = `วิเคราะห์สีหลัก: RGB(${r},${g},${b}) ≈ สี "${name}"`;
  $("#simResult").textContent = msg;
  demo.announce(msg);
}

function nearestColorName(r,g,b){
  const palette = {
    "ดำ":[0,0,0],"ขาว":[255,255,255],"แดง":[220,20,60],"ส้ม":[255,140,0],
    "เหลือง":[255,215,0],"เขียว":[34,139,34],"ฟ้า":[30,144,255],
    "น้ำเงิน":[25,25,112],"ม่วง":[138,43,226],"ชมพู":[255,105,180],
    "เทา":[128,128,128],"น้ำตาล":[139,69,19]
  };
  let best="ไม่ทราบ", bestD=1e9;
  for(const [name, [pr,pg,pb]] of Object.entries(palette)){
    const d = (r-pr)**2 + (g-pg)**2 + (b-pb)**2;
    if(d<bestD){ bestD=d; best=name; }
  }
  return best;
}

// ===== Contact form (no backend): announce content and open mailto
function handleContact(ev){
  ev.preventDefault();
  const name = $("#c-name").value.trim();
  const email = $("#c-email").value.trim();
  const msg = $("#c-msg").value.trim();
  const summary = `ขอบคุณ ${name || "ผู้ใช้"} ที่ติดต่อเรา เราจะตอบกลับที่ ${email || "อีเมลที่ระบุ"} โดยเร็วที่สุด`;
  $("#contact-status").textContent = summary;
  speak(summary);
  if(email){
    const mailto = `mailto:support@smartglasses.co.th?subject=${encodeURIComponent("[ติดต่อ] จากเว็บไซต์")}&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;
  }
}

document.addEventListener("DOMContentLoaded", setupDemo);
