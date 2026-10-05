import { useEffect, useMemo, useState } from 'react'
import { Anchor, ArrowLeft, ArrowUp, BadgePercent, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Expand, Fish, Menu, MessageCircle, Phone, Plus, Save, Search, Settings, ShieldCheck, ShoppingBag, ShoppingCart, Trash2, Utensils, X, Leaf, Star, Heart, Upload, ImageOff } from 'lucide-react'
import { API_BASE, getSiteData, adminRequest, cacheSiteData, uploadAdminImage } from './api'
import { seedData } from './data'
import { ui, categoryName, itemName, itemDescription } from './i18n'
import SeafoodOfferCard from './components/SeafoodOfferCard'

const normalize = (n) => String(n || '').replace(/\s/g, '')

function Brand({ small = false }) { return <a className={`brand ${small?'brand-small':''}`} href="/"><img src="/images/logo.png" alt="Crab Plus"/></a> }
function SocialLogo({ name }) { return <img className={`social-logo social-${name}`} src={`/images/social/${name}.svg`} alt="" aria-hidden="true"/> }
function offerPhotos(offer) { return [...new Set([offer?.image || offer?.image_url, ...(Array.isArray(offer?.images) ? offer.images : [])].filter(url => typeof url === 'string' && url.trim()))] }

function PublicSite({ data, language, setLanguage }) {
  const [selected, setSelected] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState({})
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [detailItem, setDetailItem] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [activeOfferIndex, setActiveOfferIndex] = useState(0)
  const text = ui[language] || ui.ar
  const { categories = [], items = [], offers = [], settings = seedData.settings } = data
  const orderedCategories = [...categories].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  const orderedItems = [...items].filter(item=>item.available!==false).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
  const activeCategory = orderedCategories.find(category=>category.name===selected) || null
  const categoryItems = activeCategory ? orderedItems.filter(item=>item.category===activeCategory.name) : []
  const featureItems = orderedItems.filter(item=>item.featured).slice(0,4)
  const phoneDigits = String(settings.whatsapp || settings.phone || '').replace(/\D/g,'')
  const whatsappNumber = phoneDigits.startsWith('0') ? `966${phoneDigits.slice(1)}` : phoneDigits
  const whatsapp = `https://wa.me/${whatsappNumber}`
  const cartRows = Object.entries(cart).map(([id,quantity])=>({item:items.find(item=>String(item.id)===id),quantity})).filter(row=>row.item&&row.quantity>0)
  const cartCount = cartRows.reduce((total,row)=>total+row.quantity,0)
  const cartTotal = cartRows.reduce((total,row)=>total+row.item.price*row.quantity,0)
  const orderMessage = language==='en'
    ? `New order from Crab Plus:\n${cartRows.map(({item,quantity})=>`${quantity} × ${itemName(item,language)} = ${item.price*quantity} ${text.currency}`).join('\n')}\nTotal: ${cartTotal} ${text.currency}`
    : `طلب جديد من كراب بلس:\n${cartRows.map(({item,quantity})=>`${quantity} × ${itemName(item,language)} = ${item.price*quantity} ${text.currency}`).join('\n')}\nالإجمالي: ${cartTotal} ${text.currency}`
  const orderLink = cartRows.length ? `${whatsapp}?text=${encodeURIComponent(orderMessage)}` : '#'
  const address = language==='en' ? (settings.address_en || 'Sari Street, Stars Avenue Mall, Jeddah') : (settings.address || 'جدة، شارع صاري، مجمع ستارز أفينيو')
  const mapLink = settings.location_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const featureIcons = { appetizers:'🍤', main:'🍝', seafood:'🦀', sides:'🍟', soups:'🍲', special:'🐟', kids:'🧒', drinks:'🥤', sauces:'🥫' }
  const addToCart = (item) => setCart(current=>({...current,[String(item.id)]:(current[String(item.id)]||0)+1}))
  const changeCart = (id,amount) => setCart(current=>{
    const next={...current},quantity=(next[String(id)]||0)+amount
    if(quantity>0)next[String(id)]=quantity
    else delete next[String(id)]
    return next
  })
  const dishImages = (item,index) => {
    const images=Array.isArray(item?.images)?item.images.filter(image=>typeof image==='string'&&image.trim()):[]
    return images.length?images:item?.image?[item.image]:[]
  }
  const dishImage = (item,index) => dishImages(item,index)[0] || ''
  const showDetails = item => { setDetailItem(item);setActivePhoto(0) }
  const shiftPhoto = amount => setActivePhoto(current=>(current+amount+detailPhotos.length)%detailPhotos.length)
  const selectedOffer = offers[activeOfferIndex] || offers[0] || null
  const selectOffer = index => setActiveOfferIndex(index)
  const cycleOffers = direction => setActiveOfferIndex(index=>(index+direction+offers.length)%offers.length)
  const galleryOfferImages = Array.isArray(selectedOffer?.images)?selectedOffer.images:[]
  const orderSelectedOffer = () => { if(!selectedOffer){navigateTo('menu');return} const message=language==='en'?`I would like to order the offer: ${selectedOffer.title_en||selectedOffer.title}${selectedOffer.price!=null?` · ${selectedOffer.price} ${text.currency}`:''}`:`أرغب في طلب عرض: ${selectedOffer.title}${selectedOffer.price!=null?` · ${selectedOffer.price} ${text.currency}`:''}`;window.open(`${whatsapp}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer') }
  const renderDish = (item,index,compact=false) => {
    const description=itemDescription(item,language)
    return <article className="card" key={item.id}>
      <button className={`im image-trigger ${dishImage(item,index)?'':'no-photo'}`} type="button" onClick={()=>showDetails(item)} aria-label={language==='en'?`View photos and details for ${itemName(item,language)}`:`عرض صور وتفاصيل ${itemName(item,language)}`}>{dishImage(item,index)?<><img loading="lazy" src={dishImage(item,index)} alt={itemName(item,language)}/><span className="image-zoom"><Expand/></span></>:<span className="no-photo-label"><ImageOff/><small>{language==='en'?'Photo coming soon':'الصورة قريبًا'}</small></span>}</button>
      <div className="cn"><div><h3>{itemName(item,language)}</h3>{!compact&&description&&<small>{description}</small>}{!compact&&item.calories!=null&&<small className="calories">{item.calories} {text.calories}</small>}<div className="pr">{item.price} {text.currency}</div></div><button className="cb" type="button" onClick={()=>addToCart(item)} aria-label={language==='en'?`Add ${itemName(item,language)} to cart`:`أضف ${itemName(item,language)} إلى السلة`}><ShoppingCart/></button></div>
    </article>
  }
  const detailPhotos=detailItem?dishImages(detailItem,items.indexOf(detailItem)):[]
  const detailDescription=detailItem?(language==='en'?(detailItem.long_description_en||detailItem.long_description||itemDescription(detailItem,language)):(detailItem.long_description||detailItem.long_description_en||itemDescription(detailItem,language))):''

  useEffect(()=>{
    const updateHeader=()=>{
      setScrolled(window.scrollY>10)
      let current='home'
      for(const section of ['home','menu','offers','about','contact']){
        const element=document.getElementById(section)
        if(element&&element.getBoundingClientRect().top<150)current=section
      }
      setActiveSection(previous=>previous===current?previous:current)
    }
    updateHeader()
    window.addEventListener('scroll',updateHeader,{passive:true})
    return ()=>window.removeEventListener('scroll',updateHeader)
  },[])
  useEffect(()=>{
    const reveal=document.querySelectorAll('.public-site .rv')
    if(!('IntersectionObserver' in window)){reveal.forEach(element=>element.classList.add('in'));return}
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.isIntersecting&&entry.target.classList.add('in')),{threshold:.08})
    reveal.forEach(element=>observer.observe(element))
    return ()=>observer.disconnect()
  },[])
  useEffect(()=>{
    const closeOnEscape=event=>{if(event.key==='Escape'){setCartOpen(false);setDetailItem(null)}}
    window.addEventListener('keydown',closeOnEscape)
    return ()=>window.removeEventListener('keydown',closeOnEscape)
  },[])
  const navigateTo=(id)=>{
    setMobileMenu(false)
    document.getElementById(id)?.scrollIntoView({behavior:'smooth'})
  }

  return <div className="public-site" dir={language==='en'?'ltr':'rtl'} lang={language}>
    <header id="H" className={scrolled?'sc':''}>
      <div className="w hi">
        <div className="soc">
          {settings.instagram?<a className="s" href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialLogo name="instagram"/></a>:<span className="s" aria-label="Instagram"><SocialLogo name="instagram"/></span>}
          {settings.tiktok?<a className="s" href={settings.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><SocialLogo name="tiktok"/></a>:<span className="s" aria-label="TikTok"><SocialLogo name="tiktok"/></span>}
          {settings.snapchat?<a className="s" href={settings.snapchat} target="_blank" rel="noreferrer" aria-label="Snapchat"><SocialLogo name="snapchat"/></a>:<span className="s" aria-label="Snapchat"><SocialLogo name="snapchat"/></span>}
          <a className="wa" href={whatsapp} target="_blank" rel="noreferrer"><SocialLogo name="whatsapp"/>{text.whatsapp}</a>
        </div>
        <a className="logo" href="#home" aria-label="Crab Plus"><img src="/images/logo.png" alt="Crab Plus"/></a>
        <nav id="nv" className={mobileMenu?'open':''} aria-label="Main navigation">
          {['home','menu','offers','about','contact'].map(section=><a key={section} className={activeSection===section?'on':''} href={`#${section}`} onClick={()=>setMobileMenu(false)}>{text[section]}</a>)}
        </nav>
        <div className="ic">
          <button className="ib" type="button" aria-label={language==='en'?'Go to menu':'اذهب إلى المنيو'} onClick={()=>navigateTo('menu')}><Search/></button>
          <button className="ib" type="button" aria-label={language==='en'?'Open cart':'افتح السلة'} onClick={()=>setCartOpen(true)}><ShoppingCart/><span className="bd" id="bd">{cartCount}</span></button>
          <button className="ib lang" type="button" aria-label={text.direction} onClick={()=>setLanguage(language==='ar'?'en':'ar')}>{language==='ar'?'EN':'ع'}</button>
        </div>
        <button className={`bg ${mobileMenu?'open':''}`} type="button" aria-label={mobileMenu?'Close menu':'Open menu'} onClick={()=>setMobileMenu(value=>!value)}>{mobileMenu?<X/>:<Menu/>}</button>
      </div>
    </header>
    <section className="hero" id="home">
      <img className="hero-image" src="/images/image1.png" alt={language==='en'?'Crab Plus seafood selection':'تشكيلة كراب بلس من المأكولات البحرية'}/>
      <div className="w"><div className="ht"><h1>{text.heroLine1} <b>{text.heroLine2}</b></h1><p>{text.tagline}</p><a className="cta" href="#menu" onClick={()=>setMobileMenu(false)}><ArrowLeft/>{text.browse}</a></div></div>
      <div className="fs w"><div><Heart/>{text.greatAtmosphere}</div><div><Star/>{text.distinctFlavors}</div><div><Leaf/>{text.freshIngredients}</div></div>
    </section>
    <div className="wv" aria-hidden="true"/>
    <section className="sec">
      <div className="w rv"><h2 className="st"><i>≋</i>{text.featured}<i>≋</i></h2><div className="g4" id="feat">{featureItems.map((item,index)=>renderDish(item,index,true))}</div></div>
    </section>
    <section className="sec offers-section" id="offers">
      <div className="w rv">
        <h2 className="st"><i>≋</i>{text.offerTitle}<i>≋</i></h2>
        {offers.length>1&&<div className="offer-tabs" role="tablist" aria-label={text.offerTitle}>{offers.map((offer,index)=><button key={offer.id||index} type="button" role="tab" aria-selected={activeOfferIndex===index} className={activeOfferIndex===index?'active':''} onClick={()=>selectOffer(index)}><span>{language==='en'?(offer.title_en||offer.title):(offer.title||text.offerTitle)}</span>{offer.price!=null&&<small>{offer.price} {text.currency}</small>}</button>)}</div>}
        <SeafoodOfferCard images={galleryOfferImages} offerImage={selectedOffer?.image||selectedOffer?.image_url||''} offerCount={offers.length} onOfferChange={cycleOffers} ctaLabel={language==='en'?'Order this offer':'اطلب العرض الآن'} onOrder={orderSelectedOffer}/>
      </div>
    </section>
    <section className="sec" id="menu">
      <div className="w rv"><h2 className="st"><i>≋</i>{text.menuTitle} 🦀<i>≋</i></h2>
        <div className="fl" id="fl">{orderedCategories.map(category=><button key={category.id} type="button" className={selected===category.name?'on':''} onClick={()=>setSelected(current=>current===category.name?null:category.name)}><span className="e">{featureIcons[category.id]||'🍽'}</span>{categoryName(category,language)}</button>)}</div>
        {activeCategory ? (categoryItems.length?<div className="g4" id="grid">{categoryItems.map((item,index)=>renderDish(item,items.indexOf(item)))}</div>:<div className="em">{text.empty}</div>) : <div className="em menu-hint">{text.chooseCategory}</div>}
      </div>
    </section>
    <section className="sec" id="about">
      <div className="w rv ab"><div><h2>{text.storyTitle} {text.storyLine}</h2><p>{text.storyText}</p><a className="cta" href="#contact"><ArrowLeft/>{text.readMore}</a></div></div>
    </section>
    <section className="sec" id="contact">
      <div className="w rv"><h2 className="st"><i>≋</i>{text.contactTitle}<i>≋</i></h2><div className="ct">
        <div className="ci">
          <a href={`tel:${settings.phone}`}><span className="o"><Phone/></span><p><b>{text.call}</b><span dir="ltr">{settings.phone}</span></p></a>
          <a href={whatsapp} target="_blank" rel="noreferrer"><span className="o"><MessageCircle/></span><p><b>{text.whatsapp}</b><span>{text.quickReply}</span></p></a>
          <div><span className="o"><Clock3/></span><p><b>{text.hours}</b><span>{language==='en'?(settings.opening_hours_en||'Daily, 12 PM – 12 AM'):(settings.opening_hours||'يوميًا من 12 ظهرًا حتى 12 صباحًا')}</span></p></div>
          <a href={mapLink} target="_blank" rel="noreferrer"><span className="o location-logo"><img src="/images/logo.png" alt=""/></span><p><b>{text.visit}</b><span>{address}</span></p></a>
        </div>
        <div className="map-pair"><div className="mp"><iframe title={language==='en'?'Crab Plus location map':'خريطة موقع كراب بلس'} src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade"/><div className="tag"><img src="/images/logo.png" alt=""/><span><b>{language==='en'?'Crab Plus':'كراب بلس'}</b><br/><small>{address}</small></span><a href={mapLink} target="_blank" rel="noreferrer">{text.openMap}</a></div></div></div>
      </div></div>
    </section>
    <div className="wv f" aria-hidden="true"/>
    <footer><a href="#home"><img src="/images/logo.png" alt="Crab Plus"/></a><div className="fn"><a href="#home">{text.home}</a><a href="#menu">{text.menu}</a><a href="#offers">{text.offers}</a><a href="#about">{text.about}</a><a href="#contact">{text.contact}</a><a href="/admin">{text.admin}</a></div><div className="fso">
      {settings.instagram&&<a href={settings.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialLogo name="instagram"/></a>}{settings.tiktok&&<a href={settings.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok"><SocialLogo name="tiktok"/></a>}{settings.snapchat&&<a href={settings.snapchat} target="_blank" rel="noreferrer" aria-label="Snapchat"><SocialLogo name="snapchat"/></a>}{settings.facebook&&<a href={settings.facebook} target="_blank" rel="noreferrer" aria-label="Facebook"><SocialLogo name="facebook"/></a>}{settings.whatsapp&&<a href={whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp"><SocialLogo name="whatsapp"/></a>}
    </div><small>© {new Date().getFullYear()} Crab Plus. {language==='en'?'All rights reserved.':'جميع الحقوق محفوظة.'}</small></footer>
    {detailItem&&<div className="product-lightbox" onMouseDown={event=>event.target===event.currentTarget&&setDetailItem(null)}>
      <article className="product-lightbox-card" role="dialog" aria-modal="true" aria-label={itemName(detailItem,language)} dir={language==='en'?'ltr':'rtl'}>
        <button className="product-lightbox-close" type="button" onClick={()=>setDetailItem(null)} aria-label={language==='en'?'Close':'إغلاق'}><X/></button>
        <div className="product-gallery">
          <div className="product-photo-stage">
            {detailPhotos.length?<img src={detailPhotos[activePhoto]} alt={itemName(detailItem,language)}/>:<div className="no-photo-label detail-no-photo"><ImageOff/><small>{language==='en'?'No photos added yet':'لم تُضف صور لهذا الصنف بعد'}</small></div>}
            {detailPhotos.length>1&&<><button className="product-photo-nav previous" type="button" onClick={()=>shiftPhoto(-1)} aria-label={language==='en'?'Previous photo':'الصورة السابقة'}>{language==='en'?<ChevronLeft/>:<ChevronRight/>}</button><button className="product-photo-nav next" type="button" onClick={()=>shiftPhoto(1)} aria-label={language==='en'?'Next photo':'الصورة التالية'}>{language==='en'?<ChevronRight/>:<ChevronLeft/>}</button><span className="product-photo-count">{activePhoto+1} / {detailPhotos.length}</span></>}
          </div>
          {detailPhotos.length>1&&<div className="product-thumbnails">{detailPhotos.map((src,index)=><button key={`${src}-${index}`} className={index===activePhoto?'active':''} type="button" onClick={()=>setActivePhoto(index)} aria-label={language==='en'?`Show photo ${index+1}`:`اعرض الصورة ${index+1}`}><img src={src} alt=""/></button>)}</div>}
        </div>
        <div className="product-lightbox-copy"><span className="product-category">{categoryName(orderedCategories.find(category=>category.name===detailItem.category)||{name:detailItem.category},language)}</span><h2>{itemName(detailItem,language)}</h2><div className="product-modal-meta"><b>{detailItem.price} {text.currency}</b>{detailItem.calories!=null&&<span>{detailItem.calories} {text.calories}</span>}</div><p>{detailDescription|| (language==='en'?'Freshly prepared with care.':'يُحضّر طازجًا بعناية.')}</p><button className="cta" type="button" onClick={()=>{addToCart(detailItem);setDetailItem(null)}}><ShoppingCart/>{language==='en'?'Add to cart':'أضف إلى السلة'}</button></div>
      </article>
    </div>}
    <div className={`ov ${cartOpen?'on':''}`} id="ov" onClick={()=>setCartOpen(false)} aria-hidden={!cartOpen}/>
    <aside className={`dr ${cartOpen?'on':''}`} id="dr" aria-label={language==='en'?'Shopping cart':'سلة المشتريات'} aria-hidden={!cartOpen}>
      <div className="dh"><span>{language==='en'?'Your cart':'سلتك'}</span><button type="button" aria-label={language==='en'?'Close':'إغلاق'} onClick={()=>setCartOpen(false)}><X/></button></div>
      <div id="ci">{cartRows.length?cartRows.map(({item,quantity})=><div className="li" key={item.id}>{dishImage(item,items.indexOf(item))?<img src={dishImage(item,items.indexOf(item))} alt=""/>:<span className="cart-no-photo"><ImageOff/></span>}<div><b>{itemName(item,language)}</b><span className="pr">{item.price*quantity} {text.currency}</span><div className="q"><button type="button" onClick={()=>changeCart(item.id,1)} aria-label="+">+</button><b>{quantity}</b><button type="button" onClick={()=>changeCart(item.id,-1)} aria-label="−">−</button></div></div><button className="q rm" type="button" onClick={()=>changeCart(item.id,-quantity)} aria-label={language==='en'?'Remove':'حذف'}><Trash2/></button></div>):<div className="em">{language==='en'?'Your cart is empty. Add your favorite dishes from the menu.':'السلة فارغة. أضف أطباقك المفضلة من المنيو.'}</div>}</div>
      <div className="df"><div className="tt"><span>{language==='en'?'Total':'الإجمالي'}</span><span id="tot">{cartTotal} {text.currency}</span></div><a className="cta" id="ord" href={orderLink} target="_blank" rel="noreferrer" aria-disabled={!cartRows.length} onClick={event=>{if(!cartRows.length)event.preventDefault()}}>{language==='en'?'Send order via WhatsApp':'إرسال الطلب عبر واتساب'}</a></div>
    </aside>
  </div>
}

function Admin({ data, setData }) {
  const [token, setToken] = useState(sessionStorage.getItem('cp-admin-token') || '')
  const [password,setPassword] = useState('')
  const [tab,setTab] = useState('items')
  const [notice,setNotice] = useState('')
  const [busy,setBusy] = useState(false)
  const [editing,setEditing] = useState(null)
  const [draft,setDraft] = useState(null)
  const [uploadingImage,setUploadingImage] = useState(null)
  const [uploadingOffer,setUploadingOffer] = useState(null)
  const [localMode,setLocalMode] = useState(false)
  const save = async (next) => { setData(next); cacheSiteData(next); try { if(!localMode){ await adminRequest('/admin/data', token, {method:'PUT',body:JSON.stringify(next)}) } setNotice('تم حفظ التغييرات بنجاح') } catch(err) { setNotice(err.message) } setTimeout(()=>setNotice(''),3500) }
  const login = async e => { e.preventDefault(); setBusy(true); try { const r=await fetch(`${API_BASE}/api/admin/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}); if(!r.ok) throw new Error('كلمة المرور غير صحيحة أو الخادم غير متصل'); const d=await r.json(); sessionStorage.setItem('cp-admin-token',d.token);setToken(d.token);setLocalMode(false) } catch(err) { setNotice(err.message); } finally {setBusy(false)} }
  const beginItem = item => {
    const images=Array.isArray(item?.images)&&item.images.length?item.images:(item?.image?[item.image]:[])
    setEditing(item?.id || 'new')
    setDraft(item ? {...item,images} : {id:`item-${Date.now()}`,name:'',name_en:'',category:data.categories[0]?.name || '',price:0,calories:null,description:'',description_en:'',long_description:'',long_description_en:'',image:'',images:[],available:true,featured:false,sort_order:data.items.length+1})
  }
  const saveItem = async e => {
    e.preventDefault()
    const images=(draft.images||[]).map(image=>image.trim()).filter(Boolean)
    const savedDraft={...draft,images,image:images[0]||''}
    const items=editing==='new'?[...data.items,savedDraft]:data.items.map(x=>x.id===editing?savedDraft:x)
    await save({...data,items})
    setEditing(null)
  }
  const closeItemEditor = () => { setEditing(null); adminRequest('/admin/images/prune',token,{method:'POST'}).catch(()=>{}) }
  const navigateTab = nextTab => { if(tab==='offers'&&nextTab!=='offers')adminRequest('/admin/images/prune',token,{method:'POST'}).catch(()=>{});setTab(nextTab) }
  const setDraftImage = (index,value) => setDraft(current=>({...current,images:current.images.map((image,i)=>i===index?value:image)}))
  const uploadDraftImage = async (index,file) => {
    if(!file)return
    setUploadingImage(index)
    try { const result=await uploadAdminImage(file,token);setDraftImage(index,result.url);setNotice('تم رفع الصورة بنجاح') }
    catch(error) { setNotice(error.message) }
    finally { setUploadingImage(null) }
  }
  const uploadOfferCover = async (index,file) => {
    if(!file)return
    setUploadingOffer(index)
    try {
      const uploaded=await uploadAdminImage(file,token)
      const offers=data.offers.map((offer,i)=>i===index?{...offer,image:uploaded.url,image_url:undefined}:offer)
      await save({...data,offers})
    } catch(error) { setNotice(error.message) }
    finally { setUploadingOffer(null) }
  }
  const uploadOfferImages = async (index,files) => {
    if(!files?.length)return
    setUploadingOffer(index)
    try {
      const uploaded=await Promise.all([...files].map(file=>uploadAdminImage(file,token)))
      const offers=data.offers.map((offer,i)=>i===index?{...offer,images:[...(offer.images||[]),...uploaded.map(image=>image.url)],image:offer.image||offer.image_url||'',image_url:undefined}:offer)
      await save({...data,offers})
    } catch(error) { setNotice(error.message) }
    finally { setUploadingOffer(null) }
  }
  const removeDraftImage = index => setDraft(current=>({...current,images:current.images.filter((_,i)=>i!==index)}))
  const moveDraftImage = (index,delta) => setDraft(current=>{
    const images=[...current.images],target=index+delta
    if(target<0||target>=images.length)return current
    ;[images[index],images[target]]=[images[target],images[index]]
    return {...current,images}
  })
  const delItem = async item => { if(!window.confirm(`حذف ${item.name}؟`)) return; await save({...data,items:data.items.filter(x=>x.id!==item.id)}) }
  const shift = async (i,dir) => { const items=[...data.items].sort((a,b)=>a.sort_order-b.sort_order);const j=i+dir;if(j<0||j>=items.length)return;[items[i],items[j]]=[items[j],items[i]];await save({...data,items:items.map((x,n)=>({...x,sort_order:n+1}))}) }
  if(!token) return <div className="admin-login"><a className="back-home" href="/">← العودة للموقع</a><div className="login-card"><Brand/><ShieldCheck size={28} className="login-icon"/><h1>لوحة الإدارة</h1><p>سجل دخولك لتعديل المنيو ومعلومات المطعم.</p><form onSubmit={login}><label>كلمة مرور الإدارة<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoFocus required placeholder="أدخل كلمة المرور"/></label><button className="button teal-button" disabled={busy}>{busy?'جاري الدخول...':'دخول لوحة الإدارة'} <ArrowLeft size={16}/></button></form>{notice&&<div className="notice error">{notice}</div>}<small className="login-hint">تحتاج تعيين ADMIN_PASSWORD و ADMIN_SECRET في إعدادات النشر.</small></div></div>
  return <div className="admin-shell"><header className="admin-top"><Brand small/><span className="admin-label"><ShieldCheck size={17}/> لوحة إدارة كراب بلس</span><a href="/" className="back-home">عرض الموقع <ArrowLeft size={16}/></a></header><div className="admin-layout"><aside className="admin-sidebar"><span className="admin-greeting">أهلاً بك في الإدارة</span><button className={tab==='items'?'selected':''} onClick={()=>navigateTab('items')}><Utensils/> إدارة الأصناف</button><button className={tab==='featured'?'selected':''} onClick={()=>navigateTab('featured')}><Star/> الأطباق المميزة</button><button className={tab==='categories'?'selected':''} onClick={()=>navigateTab('categories')}><Menu/> الأقسام والترتيب</button><button className={tab==='offers'?'selected':''} onClick={()=>navigateTab('offers')}><BadgePercent/> العروض الخاصة</button><button className={tab==='settings'?'selected':''} onClick={()=>navigateTab('settings')}><Settings/> بيانات التواصل</button><div className="sidebar-bottom"><span className="live-dot"/> الموقع جاهز للتعديل</div></aside><main className="admin-content"><div className="admin-page-head"><div><span className="kicker">مساحة التحكم</span><h1>{tab==='items'?'إدارة المنيو':tab==='featured'?'الأطباق المميزة':tab==='categories'?'الأقسام والترتيب':tab==='offers'?'العروض الخاصة':'بيانات التواصل'}</h1><p>{tab==='items'?'أضف الأصناف أو عدلها ورتب ظهورها في المنيو.':tab==='featured'?'اختر الأطباق التي تظهر في قسم الأطباق المميزة وأضف صورها.':tab==='categories'?'أضف الأقسام ورتب ظهورها في قائمة الطعام.':tab==='offers'?'حدّث العروض التي تظهر لزوار الموقع.':'أرقام التواصل والعنوان وحسابات التواصل الاجتماعي.'}</p></div>{tab==='items'&&<button className="button orange" onClick={()=>beginItem(null)}><Plus size={17}/> إضافة صنف</button>}</div>{notice&&<div className="notice"><Check size={17}/>{notice}</div>}
      {tab==='items'&&<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>الصنف</th><th>القسم</th><th>السعر</th><th>السعرات</th><th>الظهور</th><th>ترتيب</th><th></th></tr></thead><tbody>{[...data.items].sort((a,b)=>a.sort_order-b.sort_order).map((item,i)=><tr key={item.id}><td><div className="table-item">{(item.images?.[0]||item.image)?<img src={item.images?.[0]||item.image} alt=""/>:<span className="table-no-photo"><ImageOff/></span>}<b>{item.name}</b></div></td><td>{item.category}</td><td>{item.price} ر.س</td><td>{item.calories||'—'}</td><td><button className={item.available===false?'visibility off':'visibility'} onClick={()=>save({...data,items:data.items.map(x=>x.id===item.id?{...x,available:x.available===false}:x)})}>{item.available===false?'مخفي':'ظاهر'}</button></td><td><div className="reorder"><button onClick={()=>shift(i,-1)} aria-label="للأعلى"><ArrowUp/></button><button onClick={()=>shift(i,1)} aria-label="للأسفل"><ArrowUp className="down"/></button></div></td><td><div className="row-actions"><button onClick={()=>beginItem(item)} aria-label="تعديل"><Settings/></button><button className="delete" onClick={()=>delItem(item)} aria-label="حذف"><Trash2/></button></div></td></tr>)}</tbody></table></div>}
      {tab==='featured'&&<div className="admin-form-card featured-manager"><div className="featured-manager-head"><div><h2>اختيار الأطباق المميزة</h2><p>اختر حتى 4 أطباق. اضغط «تعديل الصور» لإضافة أو تغيير صور الطبق.</p></div><span className="featured-count">{data.items.filter(item=>item.featured).length} / 4</span></div><div className="featured-admin-grid">{[...data.items].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(item=><article className={`featured-admin-card ${item.featured?'is-featured':''}`} key={item.id}><div className="featured-admin-image">{(item.images?.[0]||item.image)?<img src={item.images?.[0]||item.image} alt=""/>:<ImageOff/>}{item.featured&&<span><Star size={13} fill="currentColor"/> مميز</span>}</div><div className="featured-admin-copy"><b>{item.name}</b><small>{item.category} · {item.price} ر.س</small><div><label className="featured-toggle"><input type="checkbox" checked={!!item.featured} onChange={e=>{const checked=e.target.checked;if(checked&&data.items.filter(x=>x.featured).length>=4){setNotice('يمكن اختيار 4 أطباق مميزة فقط. أزل طبقًا أولًا لإضافة غيره.');return}save({...data,items:data.items.map(x=>x.id===item.id?{...x,featured:checked}:x)})}}/><span>{item.featured?'يظهر في الموقع':'إضافة للمميزة'}</span></label><button className="button outline featured-edit" onClick={()=>beginItem(item)}><Settings size={14}/> تعديل الصور</button></div></div></article>)}</div><small className="featured-order-note">ترتيب ظهورها يتبع ترتيب الأصناف في «إدارة الأصناف».</small></div>}
      {tab==='categories'&&<CategoryManager categories={data.categories} items={data.items} onSave={(categories,items=data.items)=>save({...data,categories,items})}/>}
      {tab==='offers'&&<div className="admin-form-card"><h2>العروض الحالية</h2>{data.offers.map((offer,i)=><div className="offer-row" key={offer.id||i}><div className="offer-admin-photos">{offerPhotos(offer).map((image,n)=><img className="offer-admin-image" src={image} alt={`صورة ${n+1} للعرض`} key={`${image}-${n}`}/>)}</div><div><b>{offer.title}</b>{offer.title_en&&<small dir="ltr">{offer.title_en}</small>}<p>{offer.description}</p>{offer.description_en&&<small dir="ltr">{offer.description_en}</small>}</div><div className="offer-admin-actions"><label className="image-upload offer-image-upload"><Upload size={14}/>{uploadingOffer===i?'جاري الرفع...':'تغيير صورة العرض الثابتة'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingOffer!==null} onChange={e=>{const file=e.target.files?.[0];e.target.value='';uploadOfferCover(i,file)}}/></label><label className="image-upload offer-image-upload"><Plus size={14}/>{uploadingOffer===i?'جاري الرفع...':'إضافة صور الأصناف'}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingOffer!==null} onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';uploadOfferImages(i,files)}}/></label></div><button className="delete" onClick={()=>save({...data,offers:data.offers.filter((_,n)=>n!==i)})} aria-label="حذف العرض"><Trash2/></button></div>)}<OfferForm token={token} onAdd={offer=>save({...data,offers:[...data.offers,{...offer,id:`offer-${Date.now()}`}]})}/></div>}
      {tab==='settings'&&<SettingsForm settings={data.settings} onSave={settings=>save({...data,settings})}/>}
      </main></div>
      {editing&&<div className="modal-backdrop" onClick={closeItemEditor}><form className="item-modal" onSubmit={saveItem} onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="kicker">تفاصيل المنيو</span><h2>{editing==='new'?'إضافة صنف جديد':'تعديل الصنف'}</h2></div><button type="button" className="icon-btn" onClick={closeItemEditor}><X/></button></div><div className="modal-fields"><label>اسم الصنف بالعربي<input required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>اسم الصنف بالإنجليزي<input value={draft.name_en||''} dir="ltr" onChange={e=>setDraft({...draft,name_en:e.target.value})}/></label><label>القسم<select value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value})}>{data.categories.map(c=><option key={c.id}>{c.name}</option>)}</select></label><label>السعر (ر.س)<input type="number" min="0" required value={draft.price} onChange={e=>setDraft({...draft,price:Number(e.target.value)})}/></label><label>السعرات الحرارية<input type="number" min="0" value={draft.calories||''} placeholder="اختياري" onChange={e=>setDraft({...draft,calories:e.target.value?Number(e.target.value):null})}/></label><label>وصف بالعربي<input value={draft.description||''} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder="مكونات أو تفاصيل الطبق"/></label><label>وصف بالإنجليزي<input dir="ltr" value={draft.description_en||''} onChange={e=>setDraft({...draft,description_en:e.target.value})}/></label><label className="span-two">وصف تفصيلي بالعربي<textarea rows="4" value={draft.long_description||''} onChange={e=>setDraft({...draft,long_description:e.target.value})}/></label><label className="span-two">Detailed description in English<textarea dir="ltr" rows="4" value={draft.long_description_en||''} onChange={e=>setDraft({...draft,long_description_en:e.target.value})}/></label><div className="span-two admin-images-field"><div className="admin-images-heading"><b>صور الصنف</b><button type="button" className="button outline" onClick={()=>setDraft(current=>({...current,images:[...current.images,'']}))}><Plus size={15}/> إضافة صورة</button></div>{draft.images.map((image,index)=><div className="admin-image-row" key={index}>{image?<img src={image} alt=""/>:<span className="admin-no-photo"><ImageOff/></span>}<div className="image-source"><input type="text" inputMode="url" dir="ltr" value={image} onChange={e=>setDraftImage(index,e.target.value)} placeholder="رابط صورة (اختياري)"/><label className="image-upload"><Upload size={15}/>{uploadingImage===index?'جاري الرفع...':'رفع من الجهاز'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploadingImage!==null} onChange={e=>{const file=e.target.files?.[0];e.target.value='';uploadDraftImage(index,file)}}/></label></div><div className="reorder"><button type="button" onClick={()=>moveDraftImage(index,-1)} aria-label="تحريك الصورة للأعلى"><ArrowUp/></button><button type="button" onClick={()=>moveDraftImage(index,1)} aria-label="تحريك الصورة للأسفل"><ArrowUp className="down"/></button></div><button type="button" className="delete" onClick={()=>removeDraftImage(index)} aria-label="حذف الصورة"><Trash2/></button></div>)}<small className="image-help">ارفع صورة من جهازك أو أضف رابطًا. الحد الأقصى 4 ميجابايت للصورة.</small></div><div className="check-row"><label><input type="checkbox" checked={draft.available!==false} onChange={e=>setDraft({...draft,available:e.target.checked})}/> متاح في المنيو</label><label><input type="checkbox" checked={!!draft.featured} onChange={e=>setDraft({...draft,featured:e.target.checked})}/> طبق مميز</label></div></div><div className="modal-actions"><button type="button" className="button outline" onClick={closeItemEditor}>إلغاء</button><button className="button teal-button" disabled={uploadingImage!==null}><Save size={17}/> حفظ الصنف</button></div></form></div>}
    <button className="logout" onClick={()=>{adminRequest('/admin/images/prune',token,{method:'POST'}).catch(()=>{});sessionStorage.removeItem('cp-admin-token');setToken('')}}>تسجيل الخروج</button></div>
}

function CategoryManager({categories,items,onSave}) {
  const [rows,setRows]=useState(categories)
  const [name,setName]=useState('')
  const [nameEn,setNameEn]=useState('')
  useEffect(()=>setRows(categories),[categories])
  const move=(index,delta)=>{
    const next=[...rows],target=index+delta
    if(target<0||target>=next.length)return
    ;[next[index],next[target]]=[next[target],next[index]]
    setRows(next.map((c,i)=>({...c,sort_order:i+1})))
  }
  const remove=id=>{
    if(!window.confirm('حذف هذا القسم؟ ستنتقل أصنافه إلى أول قسم متبقٍ.'))return
    const next=rows.filter(c=>c.id!==id)
    if(!next.length)return
    const removed=rows.find(c=>c.id===id)
    const moved=items.map(item=>item.category===removed.name?{...item,category:next[0].name}:item)
    onSave(next.map((c,i)=>({...c,sort_order:i+1})),moved)
  }
  const saveRows=()=>{
    const nameMap=new Map(categories.map(old=>[old.name,rows.find(row=>row.id===old.id)?.name||old.name]))
    const moved=items.map(item=>({...item,category:nameMap.get(item.category)||item.category}))
    onSave(rows.map((c,i)=>({...c,sort_order:i+1})),moved)
  }
  return <div className="admin-form-card category-manager">
    <h2>أقسام المنيو</h2><p className="form-note">غيّر اسمي القسم بالعربي والإنجليزي، واستخدم الأسهم لضبط ترتيبه.</p>
    {rows.map((category,i)=><div className="category-row" key={category.id}>
      <span className="category-order">{String(i+1).padStart(2,'0')}</span>
      <div className="category-name-fields">
        <input aria-label="اسم القسم بالعربي" value={category.name} onChange={e=>setRows(rows.map(c=>c.id===category.id?{...c,name:e.target.value}:c))}/>
        <input aria-label="Category name in English" dir="ltr" value={category.name_en||''} placeholder="English name" onChange={e=>setRows(rows.map(c=>c.id===category.id?{...c,name_en:e.target.value}:c))}/>
      </div>
      <div className="reorder"><button onClick={()=>move(i,-1)} aria-label="للأعلى"><ArrowUp/></button><button onClick={()=>move(i,1)} aria-label="للأسفل"><ArrowUp className="down"/></button></div>
      <button className="delete category-delete" onClick={()=>remove(category.id)} aria-label="حذف القسم"><Trash2/></button>
    </div>)}
    <form className="category-add" onSubmit={e=>{e.preventDefault();if(!name.trim())return;setRows([...rows,{id:`category-${Date.now()}`,name:name.trim(),name_en:nameEn.trim(),sort_order:rows.length+1}]);setName('');setNameEn('')}}>
      <div className="category-name-fields"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="اسم القسم بالعربي"/><input dir="ltr" value={nameEn} onChange={e=>setNameEn(e.target.value)} placeholder="Category name"/></div>
      <button className="button outline"><Plus size={16}/> إضافة قسم</button>
    </form>
    <button className="button teal-button save-categories" onClick={saveRows}><Save size={17}/> حفظ الأقسام والترتيب</button>
  </div>
}

function OfferForm({onAdd,token}) {
  const [form,setForm]=useState({title:'',title_en:'',description:'',description_en:'',price:'',image:'',images:[]})
  const [uploading,setUploading]=useState(false)
  const [uploadError,setUploadError]=useState('')
  const uploadCover=async file=>{
    if(!file)return
    setUploading(true);setUploadError('')
    try { const uploaded=await uploadAdminImage(file,token);setForm(current=>({...current,image:uploaded.url})) }
    catch(error) { setUploadError(error.message) }
    finally { setUploading(false) }
  }
  const uploadImages=async files=>{
    if(!files?.length)return
    setUploading(true);setUploadError('')
    try {
      const uploaded=await Promise.all([...files].map(file=>uploadAdminImage(file,token)))
      setForm(current=>({...current,images:[...current.images,...uploaded.map(result=>result.url)]}))
    } catch(error) { setUploadError(error.message) }
    finally { setUploading(false) }
  }
  const removeImage=index=>setForm(current=>({...current,images:current.images.filter((_,i)=>i!==index)}))
  const submit=event=>{event.preventDefault();const images=form.images.filter(Boolean);onAdd({...form,price:form.price?Number(form.price):null,image:form.image||'',images});setForm({title:'',title_en:'',description:'',description_en:'',price:'',image:'',images:[]})}
  return <form className="offer-form" onSubmit={submit}>
    <h3>إضافة عرض</h3>
    <label>عنوان العرض بالعربي<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
    <label>Offer title<input dir="ltr" value={form.title_en} onChange={e=>setForm({...form,title_en:e.target.value})}/></label>
    <label>وصف العرض<input required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
    <label>Offer description<input dir="ltr" value={form.description_en} onChange={e=>setForm({...form,description_en:e.target.value})}/></label>
    <label>السعر (اختياري)<input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
    <div className="span-two image-field"><span>صورة العرض الثابتة (يمين)</span><small className="offer-image-help">تظهر ثابتة في الجهة اليمنى، بينما تتغير صور الأصناف في المعرض على اليسار.</small><div className="image-source"><input type="text" inputMode="url" dir="ltr" value={form.image} onChange={e=>setForm({...form,image:e.target.value})} placeholder="رابط اختياري للصورة"/><label className="image-upload"><Upload size={16}/>{uploading?'جاري الرفع...':'رفع صورة من الجهاز'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={e=>{const file=e.target.files?.[0];e.target.value='';uploadCover(file)}}/></label></div>{form.image&&<div className="offer-cover-preview"><img src={form.image} alt="معاينة الصورة الرئيسية للعرض"/><button type="button" onClick={()=>setForm(current=>({...current,image:''}))}>إزالة</button></div>}</div>
    <div className="span-two image-field"><span>صور الأصناف للمعرض (يمكن اختيار أكثر من صورة)</span><small className="offer-image-help">تظهر الصورة المختارة كبيرةً يسارًا، وباقي الصور كصور صغيرة أسفلها.</small><label className="image-upload offer-multiple-upload"><Upload size={16}/>{uploading?'جاري رفع الصور...':'اختيار صور الأصناف'}<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';uploadImages(files)}}/></label>{form.images.length>0&&<div className="offer-draft-photos">{form.images.map((image,index)=><div key={`${image}-${index}`}><img src={image} alt={`صورة الصنف ${index+1}`}/><button type="button" onClick={()=>removeImage(index)} aria-label="إزالة الصورة"><X size={14}/></button></div>)}</div>}</div>
    {uploadError&&<small className="upload-error span-two">{uploadError}</small>}
    <button className="button orange" disabled={uploading}><Plus size={16}/> إضافة العرض</button>
  </form>
}

function SettingsForm({settings,onSave}) {
  const [form,setForm]=useState(settings)
  return <form className="settings-form" onSubmit={e=>{e.preventDefault();onSave(form)}}>
    <div className="admin-form-card"><h2>التواصل والزيارة</h2><div className="settings-grid">
      <label>رقم الاتصال<input dir="ltr" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label>رقم واتساب<input dir="ltr" value={form.whatsapp||''} onChange={e=>setForm({...form,whatsapp:e.target.value})}/></label>
      <label>العنوان<input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
      <label>Address in English<input dir="ltr" value={form.address_en||''} onChange={e=>setForm({...form,address_en:e.target.value})}/></label>
      <label className="span-two">رابط خرائط جوجل<input dir="ltr" value={form.location_url||''} onChange={e=>setForm({...form,location_url:e.target.value})}/></label>
      <label>مواعيد العمل<input value={form.opening_hours||''} onChange={e=>setForm({...form,opening_hours:e.target.value})}/></label>
      <label>Opening hours in English<input dir="ltr" value={form.opening_hours_en||''} onChange={e=>setForm({...form,opening_hours_en:e.target.value})}/></label>
    </div></div>
    <div className="admin-form-card"><h2>حسابات التواصل الاجتماعي</h2><p className="form-note">أضف روابط الحسابات، وستظهر أيقوناتها تلقائيًا في شريط الموقع والتذييل.</p><div className="settings-grid">
      <label>Instagram<input dir="ltr" type="url" placeholder="https://www.instagram.com/..." value={form.instagram||''} onChange={e=>setForm({...form,instagram:e.target.value})}/></label>
      <label>TikTok<input dir="ltr" type="url" placeholder="https://www.tiktok.com/@..." value={form.tiktok||''} onChange={e=>setForm({...form,tiktok:e.target.value})}/></label>
      <label>Snapchat<input dir="ltr" type="url" placeholder="https://www.snapchat.com/add/..." value={form.snapchat||''} onChange={e=>setForm({...form,snapchat:e.target.value})}/></label>
      <label>Facebook<input dir="ltr" value={form.facebook||''} onChange={e=>setForm({...form,facebook:e.target.value})}/></label>
    </div></div>
    <button className="button teal-button"><Save size={17}/> حفظ بيانات التواصل</button>
  </form>
}

export default function App() { const [data,setData]=useState(seedData);const [language,setLanguage]=useState(()=>localStorage.getItem('crab-plus-language')||'ar');const isAdmin=location.pathname.startsWith('/admin');useEffect(()=>{getSiteData().then(setData).catch(()=>{})},[]);useEffect(()=>{document.documentElement.lang=isAdmin?'ar':language;document.documentElement.dir=isAdmin||language==='ar'?'rtl':'ltr';localStorage.setItem('crab-plus-language',language)},[language,isAdmin]);return isAdmin?<Admin data={data} setData={setData}/>:<PublicSite data={data} language={language} setLanguage={setLanguage}/> }
