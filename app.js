const WA="221761285515";
const SUPABASE_URL="https://vahlfkslvpanftvdlgqg.supabase.co";
const SUPABASE_KEY="sb_publishable_861DNYlH0UF9LwTov-tHpQ_IyylUnx7";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let P=[];
let cart=JSON.parse(localStorage.beuleupCart||"[]");
const $=x=>document.querySelector(x);
const money=n=>new Intl.NumberFormat("fr-FR").format(n)+" FCFA";
const stars=r=>"★".repeat(Math.round(r))+"☆".repeat(5-Math.round(r));

function card(p){
  let q=p.x||p.p;
  let visual=p.img?'<img src="'+p.img+'" alt="'+p.n+'">':(p.e||"🛍️");
  return '<article class="card"><div class="pic">'+visual+'</div><div class="body"><div class="cat">'+p.c+'</div><h3>'+p.n+'</h3><div class="stars">'+stars(p.r)+' ('+p.r+')</div><div class="price">'+(p.x?'<span class="old">'+money(p.p)+'</span>':"")+money(q)+'</div><div class="stock">'+(p.s>0?"Stock : "+p.s:"Rupture de stock")+'</div><button type="button" class="inspect-btn" data-inspect-id="'+p.id+'">Inspecter</button><button type="button" class="add-btn" data-product-id="'+p.id+'" '+(p.s<=0?"disabled":"")+'>'+(p.s>0?"Ajouter au panier":"Indisponible")+'</button></div></article>';
}

function inspectProduct(id){
  const p=P.find(x=>String(x.id)===String(id));
  if(!p)return;
  let m=document.getElementById("productViewer");
  if(!m){
    m=document.createElement("div");
    m.id="productViewer";
    document.body.appendChild(m);
    m.addEventListener("click",e=>{
      if(e.target===m||e.target.closest(".product-close"))m.classList.remove("show");
    });
  }
  const images=[...(p.img?[{name:"Principal",image_url:p.img}]:[]),...(p.v||[])].filter(v=>v.image_url);
  let current=0;
  const renderViewer=()=>{
    const v=images[current];
    m.innerHTML='<div class="product-modal"><button class="product-close" type="button">×</button><div class="inspect-gallery"><button type="button" class="gallery-arrow prev" aria-label="Précédent">‹</button><img id="inspectImg" src="'+v.image_url+'" alt="'+p.n+'"><button type="button" class="gallery-arrow next" aria-label="Suivant">›</button><div class="gallery-counter">'+(current+1)+' / '+images.length+'</div></div><div class="inspect-content"><div class="cat">'+p.c+'</div><h2>'+p.n+'</h2><div class="stars">'+stars(p.r)+' ('+p.r+')</div><p class="inspect-desc">'+(p.d||"Aucune description disponible.")+'</p><div class="current-color"><strong>Couleur :</strong> <span id="currentColor">'+(v.name||"Principal")+'</span></div><div class="variant-list">'+images.map((x,i)=>'<button type="button" class="variant-btn '+(i===current?"selected":"")+'" data-gallery-index="'+i+'">'+x.name+'</button>').join("")+'</div><button type="button" class="gold inspect-add" '+(p.s<=0?"disabled":"")+'>'+(p.s>0?"Ajouter au panier":"Indisponible")+'</button></div></div>';
    m.querySelector(".prev").onclick=()=>{current=(current-1+images.length)%images.length;renderViewer()};
    m.querySelector(".next").onclick=()=>{current=(current+1)%images.length;renderViewer()};
    m.querySelectorAll(".variant-btn").forEach(b=>b.onclick=()=>{current=Number(b.dataset.galleryIndex);renderViewer()});
    m.querySelector(".inspect-add")?.addEventListener("click",()=>{
      const selected=images[current];
      const variant=selected.name==="Principal"?null:selected.name;
      add(p.id,variant);
    });
  };
  m.classList.add("show");
  renderViewer();

  let touchStartX=0;
  m.ontouchstart=e=>{touchStartX=e.changedTouches[0].clientX};
  m.ontouchend=e=>{
    const dx=e.changedTouches[0].clientX-touchStartX;
    if(Math.abs(dx)>45){current=dx<0?(current+1)%images.length:(current-1+images.length)%images.length;renderViewer()}
  };
}

function openImage(src,title){
  let m=document.getElementById("imageViewer");
  if(!m){
    m=document.createElement("div");
    m.id="imageViewer";
    m.innerHTML='<button class="image-viewer-close" type="button" aria-label="Fermer">×</button><div class="image-viewer-inner"><img id="imageViewerImg" alt=""><div id="imageViewerTitle"></div></div>';
    document.body.appendChild(m);
    m.onclick=e=>{if(e.target===m||e.target.classList.contains("image-viewer-close"))m.classList.remove("show")};
    document.addEventListener("keydown",e=>{if(e.key==="Escape")m.classList.remove("show")});
  }
  document.getElementById("imageViewerImg").src=src;
  document.getElementById("imageViewerImg").alt=title;
  document.getElementById("imageViewerTitle").textContent=title;
  m.classList.add("show");
}
function render(){
  let q=$("#search").value.toLowerCase(),c=$("#category").value,z=$("#price").value;
  let f=P.filter(p=>(!q||p.n.toLowerCase().includes(q))&&(c==="all"||p.c===c)).filter(p=>{
    let n=p.x||p.p;
    if(z==="all")return true;
    if(z==="0-10000")return n<=10000;
    if(z==="10000-25000")return n>10000&&n<=25000;
    if(z==="25000-50000")return n>25000&&n<=50000;
    return n>50000;
  });
  $("#shopGrid").innerHTML=f.map(card).join("")||"<p>Aucun produit trouvé.</p>";
  $("#newGrid").innerHTML=P.filter(p=>p.new).slice(0,4).map(card).join("");
  $("#offerGrid").innerHTML=P.filter(p=>p.x).map(card).join("");
  update();
}

async function loadProducts(){
  const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
  if(error){
    console.error(error);
    alert("Impossible de charger les produits.");
    return;
  }
  P=data.map(p=>({
    id:p.id,n:p.name,c:p.category,d:p.description||"",p:p.price_fcfa,x:p.promo_price_fcfa,
    s:p.stock,r:Number(p.rating),new:p.is_new,img:p.image_url,v:Array.isArray(p.variants)?p.variants:[],e:"🛍️"
  }));
  render();
}

window.add=function(id,variant=null){
  let i=cart.find(x=>String(x.id)===String(id)&&String(x.variant||"")===String(variant||"")),p=P.find(x=>String(x.id)===String(id));
  if(!p||p.s<=0)return;
  if(i){if(i.q<p.s)i.q++}else cart.push({id,q:1,variant:variant||null});
  localStorage.beuleupCart=JSON.stringify(cart);
  update();
}

function update(){
  let total=0,n=0;
  $("#items").innerHTML=cart.map(x=>{
    let p=P.find(y=>String(y.id)===String(x.id));
    if(!p)return "";
    let v=p.x||p.p;
    total+=v*x.q;n+=x.q;
    return '<div class="cartline"><span>'+p.n+(x.variant?" — "+x.variant:"")+" × "+x.q+'</span><b>'+money(v*x.q)+'</b></div>';
  }).join("")||"<p>Votre panier est vide.</p>";
  $("#count").textContent=n;
  $("#total").textContent=money(total);
}

document.addEventListener("click",e=>{
  const inspect=e.target.closest(".inspect-btn");
  if(inspect){e.preventDefault();inspectProduct(inspect.dataset.inspectId);return;}
  const b=e.target.closest(".add-btn");
  if(!b||b.disabled)return;
  e.preventDefault();
  add(b.dataset.productId);
});
$("#search").oninput=render;
$("#category").onchange=render;
$("#price").onchange=render;
document.querySelectorAll(".cats button").forEach(b=>b.onclick=()=>{
  $("#category").value=b.dataset.cat;render();location.hash="shop";
});
$("#cart").onclick=()=>$("#drawer").classList.add("open");
$("#close").onclick=()=>$("#drawer").classList.remove("open");
$("#order").onclick=()=>{
  if(!cart.length)return alert("Votre panier est vide.");
  let lines=cart.map(x=>{
    let p=P.find(y=>String(y.id)===String(x.id));
    if(!p)return "";
    let v=p.x||p.p;
    return "• "+p.n+(x.variant?" — "+x.variant:"")+" x"+x.q+" — "+money(v*x.q);
  }).filter(Boolean).join("\n");
  let t=cart.reduce((a,x)=>{
    let p=P.find(y=>String(y.id)===String(x.id));
    return p?a+(p.x||p.p)*x.q:a;
  },0);
  open("https://wa.me/"+WA+"?text="+encodeURIComponent("Bonjour Beuleup Shop 👋\n\nJe souhaite commander :\n"+lines+"\n\nTotal : "+money(t)+"\n\nMerci de me contacter pour la livraison."),"_blank");
};
$("#lang").onclick=()=>{$("#lang").textContent=$("#lang").textContent==="EN"?"FR":"EN"};
loadProducts();
const productViewerStyle=document.createElement("style");
productViewerStyle.textContent='#productViewer{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.88);display:none;align-items:center;justify-content:center;padding:18px;overflow:auto}#productViewer.show{display:flex}.product-modal{position:relative;width:min(900px,96vw);max-height:92vh;overflow:auto;background:#111;border:1px solid #2b2b2b;border-radius:18px;display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:22px}.product-modal>img{width:100%;height:min(65vh,520px);object-fit:contain;background:#090909;border-radius:12px}.product-close{position:absolute;right:12px;top:10px;z-index:2;width:40px;height:40px;border:0;border-radius:50%;background:#222;color:#fff;font-size:28px}.inspect-content{padding:25px 10px}.inspect-desc{color:#ccc;line-height:1.6}.variant-list{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 18px}.variant-btn{background:#171717;color:#fff;border:1px solid #444;border-radius:999px;padding:9px 14px}.variant-btn.selected{border-color:#ffd86a;color:#ffd86a}.inspect-add{width:100%;margin-top:12px}@media(max-width:700px){.product-modal{grid-template-columns:1fr;padding:14px}.product-modal>img{height:45vh}.inspect-content{padding:4px}}';
document.head.appendChild(productViewerStyle);
const imageViewerStyle=document.createElement("style");
imageViewerStyle.textContent=`
.image-open{position:relative;width:100%;height:100%;padding:0;border:0;background:none;cursor:zoom-in;display:block}
.image-open img{width:100%;height:100%;object-fit:cover;display:block}
.image-open span{position:absolute;right:8px;bottom:8px;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.72);color:#fff;font-size:20px}
#imageViewer{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);display:none;align-items:center;justify-content:center;padding:30px;cursor:zoom-out}
#imageViewer.show{display:flex}
.image-viewer-inner{max-width:95vw;max-height:95vh;text-align:center}
#imageViewerImg{max-width:95vw;max-height:85vh;object-fit:contain;border-radius:12px;box-shadow:0 10px 50px rgba(0,0,0,.7)}
#imageViewerTitle{margin-top:12px;color:#fff;font-weight:700;font-size:16px}
.image-viewer-close{position:fixed;top:18px;right:22px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:32px;line-height:1;cursor:pointer}
`;
document.head.appendChild(imageViewerStyle);
