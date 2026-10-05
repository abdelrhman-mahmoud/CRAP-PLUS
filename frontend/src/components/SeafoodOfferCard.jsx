import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart, Image as ImageIcon } from "lucide-react";

const T = "#0d8791", TD = "#09707a", OR = "#f4681d";

export default function SeafoodOfferCard({
  images = [],
  offerImage,
  offerCount = 1,
  onOfferChange = () => {},
  ctaLabel = "اطلب العرض الآن",
  onOrder = () => {},
}) {
  const total = images.length || 6;
  const [active, setActive] = useState(0);
  const go = (d) => setActive((a) => (a + d + total) % total);
  const current = images[active];
  const [mobilePhoto, setMobilePhoto] = useState(offerImage || current || '');
  const [mobileShowsCover, setMobileShowsCover] = useState(Boolean(offerImage));
  const thumbTrack = useRef(null);

  useEffect(() => {
    setActive(0);
    setMobilePhoto(offerImage || images[0] || '');
    setMobileShowsCover(Boolean(offerImage));
  }, [offerImage, images]);

  const scrollThumbs = direction => thumbTrack.current?.scrollBy({ left: direction * 190, behavior: 'smooth' });

  return (
    <div className="sf-card" dir="rtl">
      <style>{css}</style>

      {/* معرض الصور */}
      <div className="sf-gallery">
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

        {offerCount > 1 && <>
          <button className="sf-arrow sf-arrow-left" onClick={() => onOfferChange(1)} aria-label="العرض التالي">
            <ChevronLeft size={26} strokeWidth={3.2} />
          </button>
          <button className="sf-arrow sf-arrow-right" onClick={() => onOfferChange(-1)} aria-label="العرض السابق">
            <ChevronRight size={26} strokeWidth={3.2} />
          </button>
        </>}

        <div className="sf-strip">
          <button className="sf-mini" onClick={() => scrollThumbs(-1)} aria-label="تمرير الصور للخلف"><ChevronRight size={18} strokeWidth={3.4} /></button>
          <div className="sf-thumb-track" ref={thumbTrack}>
            {images.length ? images.map((image, idx) => (
              <button key={`${image}-${idx}`} className={"sf-thumb" + (!mobileShowsCover && idx === active ? " on" : "")} onClick={() => { setActive(idx); setMobilePhoto(image); setMobileShowsCover(false) }} aria-label={`عرض الصورة ${idx + 1}`}>
                <img src={image} alt="" />
              </button>
            )) : Array.from({ length: 3 }).map((_, idx) => <button key={idx} className="sf-thumb" type="button" aria-label={`صورة ${idx + 1}`}><ImageIcon size={26} strokeWidth={2.2} /></button>)}
          </div>
          <button className="sf-mini" onClick={() => scrollThumbs(1)} aria-label="تمرير الصور للأمام"><ChevronLeft size={18} strokeWidth={3.4} /></button>
        </div>
      </div>

      <div className={'sf-mobile-main' + (mobileShowsCover ? ' is-cover' : '')}>
        {mobilePhoto ? <img src={mobilePhoto} alt="صورة العرض"/> : <div className="sf-mobile-placeholder"><ImageIcon/><span>صورة العرض</span></div>}
        {offerCount > 1 && <>
          <button className="sf-arrow sf-arrow-left" type="button" onClick={() => onOfferChange(1)} aria-label="العرض التالي"><ChevronLeft/></button>
          <button className="sf-arrow sf-arrow-right" type="button" onClick={() => onOfferChange(-1)} aria-label="العرض السابق"><ChevronRight/></button>
        </>}
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
.sf-gallery{position:absolute;left:0;top:0;bottom:0;width:100%}
.sf-main{position:absolute;inset:0;z-index:2}
.sf-main img{width:100%;height:100%;object-fit:cover;object-position:center;display:block}
.sf-ph{position:absolute;left:0;right:0;top:0;height:76%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#8fcaca;font-weight:700;font-size:20px}
.sf-ph.offer{height:100%;color:#9fbfc2}
.sf-arrow{position:absolute;z-index:6;top:47%;transform:translateY(-50%);width:clamp(32px,4vw,46px);height:clamp(32px,4vw,46px);border-radius:50%;background:${T};color:#fff;display:grid;place-items:center;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .15s}
.sf-arrow-left{left:8px}
.sf-arrow-right{right:14px}
.sf-arrow svg{width:58%;height:58%}
.sf-arrow:hover{transform:translateY(-50%) scale(1.08)}
.sf-strip{position:absolute;z-index:6;left:2.5%;right:56%;bottom:5%;height:clamp(58px,7.5vw,82px);padding:0 clamp(7px,1.3vw,14px);display:flex;align-items:center;gap:clamp(5px,1vw,11px);background:rgba(255,255,255,.94);border-radius:48px;box-shadow:0 6px 18px rgba(13,135,145,.18)}
.sf-thumb-track{display:flex;direction:ltr;align-items:center;flex:1;min-width:0;height:100%;gap:clamp(5px,1vw,11px);overflow-x:auto;overscroll-behavior-inline:contain;scrollbar-width:none;scroll-snap-type:x mandatory}
.sf-thumb-track::-webkit-scrollbar{display:none}
.sf-mini{flex:0 0 clamp(22px,2.8vw,30px);height:clamp(22px,2.8vw,30px);border-radius:50%;background:${T};color:#fff;display:grid;place-items:center}
.sf-mini svg{width:68%;height:68%}
.sf-thumb{flex:0 0 clamp(54px,8vw,92px);min-width:0;height:76%;border-radius:clamp(8px,1.5vw,16px);background:#d9efef;color:#8fcaca;display:grid;place-items:center;overflow:hidden;border:2px solid transparent;transition:border-color .15s;scroll-snap-align:center}
.sf-thumb svg{width:44%;height:44%}
.sf-thumb img{width:100%;height:100%;object-fit:cover}
.sf-thumb.on{background:#eaf7f7;border-color:${T}}
.sf-mobile-main{display:none}

/* لوحة العرض — 49% من الكارت، حافتها الشمال نفس كيرف الصورة مزاح يمين 3.5%
   فبين الصورة واللوحة يبان خط موجي تركواز من خلفية الجاليري */
.sf-offer{position:absolute;z-index:5;right:0;top:0;bottom:0;width:55%;background:linear-gradient(160deg,#1296a1 0%,${T} 45%,#0a6e77 100%)}
.sf-offer-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}

.sf-cta{position:absolute;z-index:7;right:4%;bottom:clamp(16px,2.5vw,26px);width:30%;max-width:330px;min-height:clamp(40px,5vw,54px);padding:0 12px!important;border-radius:30px;background:${OR};color:#fff;font-size:clamp(13px,1.8vw,19px);font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 20px -6px rgba(244,104,29,.65);transition:transform .15s}
.sf-cta svg{width:clamp(17px,2.2vw,23px);height:auto;flex:none}
.sf-cta:hover{transform:translateY(-2px)}
.sf-cta:focus-visible,.sf-arrow:focus-visible,.sf-thumb:focus-visible{outline:3px solid #ffb27d;outline-offset:2px}

@media (max-width:820px){
  .sf-card{height:auto;display:flex;flex-direction:column;border-radius:26px;padding:0 0 14px}
  .sf-gallery{position:relative;left:auto;top:auto;bottom:auto;width:100%;height:auto;flex:none;background:#fff}
  .sf-gallery>.sf-main{display:none}
  .sf-strip{position:relative;left:auto;right:auto;bottom:auto;height:86px;margin:10px 12px 0;padding:0 9px;gap:8px;border-radius:20px;box-shadow:none;background:#fff}
  .sf-thumb-track{gap:8px}
  .sf-thumb{flex:0 0 calc((100% - 16px) / 3);max-width:none;height:72px;border-radius:12px}
  .sf-arrow{top:50%;width:42px;height:42px;background:rgba(255,255,255,.95);color:${TD};box-shadow:0 3px 12px rgba(0,0,0,.18)}
  .sf-arrow-left{left:14px;right:auto}
  .sf-arrow-right{right:14px}
  .sf-mobile-main{position:relative;display:block;order:-1;width:100%;height:clamp(250px,92vw,480px);overflow:hidden;background:#f7f3eb}
  .sf-mobile-main img{display:block;width:100%;height:100%;object-fit:cover;object-position:center}
  .sf-mobile-main.is-cover img{object-fit:contain}
  .sf-mobile-placeholder{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#91bec1;background:#eaf5f3}
  .sf-mobile-placeholder svg{width:54px;height:54px}
  .sf-offer{display:none}
  .sf-cta{position:relative;left:auto;right:auto;bottom:auto;width:calc(100% - 28px);max-width:none;min-height:56px;margin:12px auto 0;font-size:18px}
}
@media (max-width:480px){
  .sf-card{border-radius:19px;padding-bottom:12px}
  .sf-mobile-main{height:clamp(245px,96vw,410px)}
  .sf-strip{height:75px;margin:8px 9px 0;padding:0 6px;gap:5px;border-radius:16px}
  .sf-thumb-track{gap:6px}
  .sf-thumb{flex-basis:calc((100% - 12px) / 3);height:61px;border-radius:10px;border-width:1.5px}
  .sf-mini{flex-basis:25px;height:25px}
  .sf-arrow{width:38px;height:38px}
  .sf-arrow-left{left:10px}.sf-arrow-right{right:10px}
  .sf-cta{width:calc(100% - 20px);min-height:49px;margin-top:9px;font-size:16px}
}
@media (prefers-reduced-motion:reduce){.sf-cta,.sf-arrow{transition:none}}
`;
