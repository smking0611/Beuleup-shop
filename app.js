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
  return '<article class="card"><div class="pic">'+visual+'</div><div class="body"><div class="cat">'+p.c+'</div><h3>'+p.n+'</h3><div class="stars">'+stars(p.r)+' ('+p.r+')</div><div class="price">'+(p.x?'<span class="old">'+money(p.p)+'</span>':"")+money(q)+'</div><div class="stock">'+(p.s>0?"Stock : "+p.s:"Rupture de stock")+'</div><button type="button" class="add-btn" data-product-id="'+p.id+'" '+(p.s<=0?"disabled":"")+'>'+(p.s>0?"Ajouter au panier":"Indisponible")+'</button></div></article>';
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
    id:p.id,n:p.name,c:p.category,p:p.price_fcfa,x:p.promo_price_fcfa,
    s:p.stock,r:Number(p.rating),new:p.is_new,img:p.image_url,e:"🛍️"
  }));
  render();
}

window.add=function(id){
  let i=cart.find(x=>String(x.id)===String(id)),p=P.find(x=>String(x.id)===String(id));
  if(!p||p.s<=0)return;
  if(i){if(i.q<p.s)i.q++}else cart.push({id,q:1});
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
    return '<div class="cartline"><span>'+p.n+" × "+x.q+'</span><b>'+money(v*x.q)+'</b></div>';
  }).join("")||"<p>Votre panier est vide.</p>";
  $("#count").textContent=n;
  $("#total").textContent=money(total);
}

document.addEventListener("click",e=>{
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
    return "• "+p.n+" x"+x.q+" — "+money(v*x.q);
  }).filter(Boolean).join("\n");
  let t=cart.reduce((a,x)=>{
    let p=P.find(y=>String(y.id)===String(x.id));
    return p?a+(p.x||p.p)*x.q:a;
  },0);
  open("https://wa.me/"+WA+"?text="+encodeURIComponent("Bonjour Beuleup Shop 👋\n\nJe souhaite commander :\n"+lines+"\n\nTotal : "+money(t)+"\n\nMerci de me contacter pour la livraison."),"_blank");
};
$("#lang").onclick=()=>{$("#lang").textContent=$("#lang").textContent==="EN"?"FR":"EN"};
loadProducts();
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
