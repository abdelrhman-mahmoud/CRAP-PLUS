import { useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Image as ImageIcon, Anchor } from "lucide-react";

/* ===== الكيرف المشترك (بنسبة الكارت الكلية) =====
   حافة الصورة اليمين = الكيرف نفسه
   حافة اللوحة الشمال = نفس الكيرف مزاح يمين ~3.5% عشان يبان موجة تركواز بينهم */

/* حافة الصورة الرئيسية — اليمين متموّج بنفس كيرف اللوحة */
const BLOB =
  "M1 0 C 0.98556 0.025 0.91667 0.10 0.91333 0.15 C 0.90889 0.20 0.98778 0.25 0.97667 0.30 C 0.96444 0.35 0.84778 0.40 0.84111 0.45 C 0.83444 0.50 0.93222 0.55 0.93667 0.60 C 0.93222 0.65 0.86444 0.70 0.86444 0.75 C 0.86444 0.80 0.93 0.858 0.93667 0.90 C 0.93 0.942 0.91 0.983 0.90444 1 L0 1 L0 0 Z";

/* حافة اللوحة — نفس الكيرف مزاح يمين (ديسكتوب) */
const OFFER_D =
  "M0.3163 0 C 0.2974 0.025 0.2091 0.10 0.204 0.15 C 0.1989 0.20 0.3009 0.25 0.2854 0.30 C 0.27 0.35 0.1209 0.40 0.1123 0.45 C 0.1037 0.50 0.2289 0.55 0.234 0.60 C 0.2289 0.65 0.1423 0.70 0.1423 0.75 C 0.1423 0.80 0.2254 0.858 0.234 0.90 C 0.2254 0.942 0.2006 0.983 0.1937 1 L1 1 L1 0 Z";

const OFFER_M = "M0 0.12 C0.2 0.02 0.32 0.14 0.52 0.07 C0.72 0.01 0.86 0.11 1 0.05 L1 1 L0 1 Z";

const T = "#0d8791", TD = "#09707a", OR = "#f4681d";

const Drop = ({ style, size = 12 }) => (
  <svg viewBox="0 0 10 14" width={size} height={size * 1.4} className="sf-drop" style={style}>
    <path d="M5 0C5 0 0 6 0 9a5 5 0 0010 0C10 6 5 0 5 0z" fill="#cdeff1" />
  </svg>
);

export default function SeafoodOfferCard({
  images = [],
  offerImage,
  ctaLabel = "اطلب العرض الآن",
  onOrder = () => {},
}) {
  const total = images.length || 6;
  const visible = Math.min(6, total);
  const [active, setActive] = useState(0);
  const start = active < 6 ? 0 : Math.min(active - 5, total - 6);
  const go = (d) => setActive((a) => (a + d + total) % total);
  const current = images[active];

  return (
    <div className="sf-card" dir="rtl">
      <style>{css}</style>

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <radialGradient id="sf-glow" cx="50%" cy="45%" r="65%">
            <stop offset="0" stopColor="#e6f6f6" />
            <stop offset="1" stopColor="#cbe9e9" />
          </radialGradient>
          <clipPath id="sf-blob" clipPathUnits="objectBoundingBox"><path d={BLOB} /></clipPath>
          <clipPath id="sf-offer" clipPathUnits="objectBoundingBox"><path d={OFFER_D} /></clipPath>
          <clipPath id="sf-offer-m" clipPathUnits="objectBoundingBox"><path d={OFFER_M} /></clipPath>
        </defs>
      </svg>

      {/* ===== الجاليري (شمال) — الخلفية التركواز بتبان في الموجة بين الصورة واللوحة ===== */}
      <div className="sf-gallery">
        <svg className="sf-fill base" viewBox="0 0 112 100" preserveAspectRatio="none">
          <rect width="112" height="100" fill={T} />
          <path d="M50 0H112V62C104 54 101 42 93 31C85 20 71 23 61 12C57 8 53 4 50 0Z" fill={TD} />
          <path d="M0 46C4 58 14 70 28 77C34 80 38 84 42 92L0 100Z" fill={TD} opacity=".85" />
        </svg>

        <div className="sf-main">
          {current ? (
            <img src={current} alt="" />
          ) : (
            <div className="sf-ph">
              <ImageIcon size={64} strokeWidth={2.2} />
              <span>الصورة الرئيسية</span>
            </div>
          )}
        </div>

        <svg className="sf-fill deco" viewBox="0 0 112 100" preserveAspectRatio="none">
          <path d="M0 0H54C44 7 30 4 18 10C10 14 4 17 0 26Z" fill="#6fc3c9" opacity=".55" />
          <path d="M0 0H30C22 5 10 6 0 13Z" fill="#a6dde0" opacity=".55" />
          <g fill="none" strokeLinecap="round">
            <path d="M0 3C20 0 40 5 60 2S90 6 112 2" stroke="#8fd8dc" strokeWidth="2" opacity=".7" vectorEffect="non-scaling-stroke" />
            <path d="M64 3C78 6 88 12 95 22C101 32 100 44 104 58" stroke="#8fd8dc" strokeWidth="3" opacity=".6" vectorEffect="non-scaling-stroke" />
            <path d="M68 0C84 4 96 12 102 26" stroke="#fff" strokeWidth="2" opacity=".28" vectorEffect="non-scaling-stroke" />
          </g>
          <path d="M0 93C12 88 24 98 40 94S68 90 84 95S104 92 112 94V100H0Z" fill="#bfe8ea" opacity=".5" />
          <path d="M0 96C16 91 30 100 50 96S80 93 112 97V100H0Z" fill="#e6f6f6" opacity=".55" />
        </svg>
        <Drop style={{ left: "63%", top: "5%", transform: "rotate(40deg)" }} size={13} />
        <Drop style={{ left: "68%", top: "12%", transform: "rotate(80deg)" }} size={9} />
        <Drop style={{ left: "59%", top: "1%", transform: "rotate(10deg)" }} size={8} />

        <button className="sf-arrow" style={{ left: 8 }} onClick={() => go(1)} aria-label="التالي">
          <ChevronLeft size={26} strokeWidth={3.2} />
        </button>
        <button className="sf-arrow" style={{ right: 4 }} onClick={() => go(-1)} aria-label="السابق">
          <ChevronRight size={26} strokeWidth={3.2} />
        </button>

        <div className="sf-strip">
          <button className="sf-mini" onClick={() => go(-1)} aria-label="السابق">
            <ChevronRight size={18} strokeWidth={3.4} />
          </button>
          {Array.from({ length: visible }).map((_, i) => {
            const idx = start + i;
            return (
              <button key={idx} className={"sf-thumb" + (idx === active ? " on" : "")} onClick={() => setActive(idx)}>
                {images[idx] ? <img src={images[idx]} alt="" /> : <ImageIcon size={26} strokeWidth={2.2} />}
              </button>
            );
          })}
          <button className="sf-mini" onClick={() => go(1)} aria-label="التالي">
            <ChevronLeft size={18} strokeWidth={3.4} />
          </button>
        </div>
      </div>

      {/* ===== لوحة العرض (يمين) ===== */}
      <div className="sf-offer">
        {offerImage ? (
          <img className="sf-offer-img" src={offerImage} alt="" />
        ) : (
          <div className="sf-ph offer">
            <ImageIcon size={56} strokeWidth={2} />
            <span>صورة العرض</span>
          </div>
        )}

        <svg className="sf-offer-deco" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g fill="none" stroke="#fff" strokeLinecap="round" opacity=".5">
            <path d="M8 78C20 74 30 82 44 78S70 74 84 79" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            <path d="M14 87C26 83 38 90 52 86S76 83 92 88" strokeWidth="2" opacity=".7" vectorEffect="non-scaling-stroke" />
          </g>
          <g fill="#fff" opacity=".25">
            <circle cx="80" cy="30" r="4" />
            <circle cx="88" cy="40" r="2.5" />
            <circle cx="74" cy="42" r="1.8" />
          </g>
        </svg>
        <Anchor className="sf-anchor" size={54} strokeWidth={1.6} />
        <Drop style={{ left: "16%", top: "6%", transform: "rotate(30deg)" }} size={12} />
        <Drop style={{ left: "22%", top: "13%", transform: "rotate(70deg)" }} size={8} />
      </div>

      <button className="sf-cta" onClick={onOrder}>
        <span>{ctaLabel}</span>
        <ShoppingCart size={24} strokeWidth={2.4} />
      </button>
    </div>
  );
}

const css = `
.sf-card{position:relative;direction:rtl;width:100%;max-width:1100px;height:clamp(310px,38vw,440px);margin:0 auto;border-radius:clamp(20px,3vw,38px);overflow:hidden;background:#fbf9f4;box-shadow:0 20px 42px -22px rgba(13,135,145,.4);font-family:'Tajawal','Cairo','Segoe UI',Tahoma,sans-serif}
.sf-card *{box-sizing:border-box}
.sf-card button{font-family:inherit;cursor:pointer;border:0;padding:0}

/* الجاليري — 63% (اللوحة اليمين أخدت 7% زيادة منه) */
.sf-gallery{position:absolute;left:0;top:0;bottom:0;width:70%}
.sf-fill{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.sf-fill.base{z-index:1;inset:auto;left:0;top:0;width:112%;height:100%}
.sf-fill.deco{z-index:3}
.sf-drop{position:absolute;z-index:6}
.sf-main{position:absolute;inset:0;z-index:2;clip-path:url(#sf-blob)}
.sf-main img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.sf-ph{position:absolute;left:0;right:0;top:0;height:76%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#8fcaca;font-weight:700;font-size:20px}
.sf-ph.offer{height:100%;color:#9fbfc2}
.sf-arrow{position:absolute;z-index:6;top:38%;transform:translateY(-50%);width:clamp(32px,4vw,46px);height:clamp(32px,4vw,46px);border-radius:50%;background:${T};color:#fff;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .15s}
.sf-arrow svg{width:58%;height:58%}
.sf-arrow:hover{transform:translateY(-50%) scale(1.08)}
.sf-strip{position:absolute;z-index:6;left:2.5%;right:5%;bottom:5%;height:clamp(58px,7.5vw,82px);padding:0 clamp(7px,1.3vw,14px);display:flex;align-items:center;gap:clamp(5px,1vw,11px);background:rgba(255,255,255,.94);border-radius:48px;box-shadow:0 6px 18px rgba(13,135,145,.18)}
.sf-mini{flex:0 0 clamp(22px,2.8vw,30px);height:clamp(22px,2.8vw,30px);border-radius:50%;background:${T};color:#fff;display:grid;place-items:center}
.sf-mini svg{width:68%;height:68%}
.sf-thumb{flex:1;min-width:0;max-width:96px;height:76%;border-radius:clamp(8px,1.5vw,16px);background:#d9efef;color:#8fcaca;display:grid;place-items:center;overflow:hidden;border:2px solid transparent;transition:border-color .15s}
.sf-thumb svg{width:44%;height:44%}
.sf-thumb img{width:100%;height:100%;object-fit:cover}
.sf-thumb.on{background:#eaf7f7;border-color:${T}}

/* لوحة العرض — 49% من الكارت، حافتها الشمال نفس كيرف الصورة مزاح يمين 3.5%
   فبين الصورة واللوحة يبان خط موجي تركواز من خلفية الجاليري */
.sf-offer{position:absolute;z-index:5;right:0;top:0;bottom:0;width:60%;clip-path:url(#sf-offer);background:linear-gradient(160deg,#1296a1 0%,${T} 45%,#0a6e77 100%);box-shadow:-10px 0 24px rgba(5,60,66,.30)}
.sf-offer-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.sf-offer-deco{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.sf-anchor{position:absolute;z-index:2;right:4%;top:52%;color:#fff;opacity:.22;transform:rotate(12deg)}

.sf-cta{position:absolute;z-index:7;right:4%;bottom:clamp(16px,2.5vw,26px);width:30%;max-width:330px;min-height:clamp(40px,5vw,54px);padding:0 12px!important;border-radius:30px;background:${OR};color:#fff;font-size:clamp(13px,1.8vw,19px);font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 20px -6px rgba(244,104,29,.65);transition:transform .15s}
.sf-cta svg{width:clamp(17px,2.2vw,23px);height:auto;flex:none}
.sf-cta:hover{transform:translateY(-2px)}
.sf-cta:focus-visible,.sf-arrow:focus-visible,.sf-thumb:focus-visible{outline:3px solid #ffb27d;outline-offset:2px}

@media (max-width:820px){
  .sf-card{height:auto;display:flex;flex-direction:column;border-radius:26px}
  .sf-gallery{position:relative;width:100%;height:clamp(245px,48vw,330px);flex:none}
  .sf-strip{height:clamp(58px,10vw,76px);bottom:3%;left:2%;right:2%}
  .sf-thumb{height:74%}
  .sf-offer{position:relative;width:100%;height:clamp(220px,40vw,290px);margin-top:-22px;clip-path:url(#sf-offer-m);flex:none}
  .sf-anchor{top:12%}
  .sf-cta{left:50%;right:auto;transform:translateX(-50%);bottom:14px;width:min(80%,360px);max-width:none}
  .sf-cta:hover{transform:translateX(-50%) translateY(-2px)}
}
@media (max-width:480px){
  .sf-card{border-radius:19px}
  .sf-gallery{height:clamp(215px,62vw,270px)}
  .sf-strip{height:56px;left:1.5%;right:1.5%;gap:4px;padding:0 6px}
  .sf-mini{flex-basis:22px;height:22px}
  .sf-thumb{height:72%;border-radius:8px;border-width:1.5px}
  .sf-offer{height:clamp(180px,48vw,220px);margin-top:-18px}
  .sf-cta{bottom:10px;width:82%;min-height:40px;font-size:13px}
}
@media (prefers-reduced-motion:reduce){.sf-cta,.sf-arrow{transition:none}}
`;
