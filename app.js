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
  return '<article class="card"><div class="pic">'+visual+'</div><div class="body"><div class="cat">'+p.c+'</div><h3>'+p.n+'</h3><div class="stars">'+stars(p.r)+' ('+p.r+')</div><div class="price">'+(p.x?'<span class="old">'+money(p.p)+'</span>':"")+money(q)+'</div><div class="stock">'+(p.s>0?"Stock : "+p.s:"Rupture de stock")+'</div><button onclick="add("'+p.id+'")" '+(p.s<=0?"disabled":"")+'>'+(p.s>0?"Ajouter au panier":"Indisponible")+'</button></div></article>';
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

function add(id){
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