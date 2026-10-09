const API="/api";
const $=s=>document.querySelector(s);
const toast=$("#toast");

document.addEventListener("DOMContentLoaded",()=>{
  setup();
  loadProducts();
  header();
});

function setup(){
  const sb=$("#searchBtn"),box=$("#searchBox"),menu=$("#menuBtn"),mn=$("#mobileNav");

  sb?.addEventListener("click",()=>{
    box?.classList.toggle("open");
    $("#searchInput")?.focus();
  });

  menu?.addEventListener("click",()=>mn?.classList.toggle("open"));

  $("#searchForm")?.addEventListener("submit",e=>{
    e.preventDefault();
    const q=$("#searchInput")?.value.trim();
    if(q) location.href="/?search="+encodeURIComponent(q);
  });

  document.querySelectorAll("[data-q]").forEach(b=>{
    b.onclick=()=>location.href="/?search="+encodeURIComponent(b.dataset.q);
  });

  $("#news")?.addEventListener("submit",e=>{
    e.preventDefault();
    show("You're on the SHOPY list.");
    e.target.reset();
  });
}

async function loadProducts(){
  const p=new URLSearchParams(location.search);
  const q=(p.get("search")||"").toLowerCase();
  const cat=(p.get("category")||"").toLowerCase();
  const sale=p.get("sale")==="true";

  try{
    const r=await fetch(API+"/products/active");
    if(!r.ok) throw new Error("Products unavailable");

    let a=await r.json();

    if(q){
      a=a.filter(x=>[
        x.name,x.brand,x.description,x.subcategory,x.style,x.gender,x.ageGroup
      ].some(v=>String(v||"").toLowerCase().includes(q)));
    }

    if(cat && cat!=="all"){
      a=a.filter(x=>
        String(x.ageGroup||"").toLowerCase()===cat ||
        String(x.category?.name||"").toLowerCase()===cat
      );
    }

    if(sale) a=a.filter(x=>x.salePrice&&x.salePrice<x.price);

    render(a.slice(0,12));
  }catch(e){
    render(fallback);
  }
}

function render(a){
  const el=$("#products");
  if(!el)return;

  if(!a.length){
    el.innerHTML="<div style='grid-column:1/-1;text-align:center;padding:60px'><p class='eyebrow'>NOTHING HERE YET</p><h2 style='font-family:var(--serif);font-weight:500'>Try another search.</h2></div>";
    return;
  }

  el.innerHTML=a.map(card).join("");
}

function card(p){
  const sale=p.salePrice&&p.salePrice<p.price;
  const img=p.imageUrl||imgFor(p);
  const price=Number(sale?p.salePrice:p.price);

  return `<article class="product">
    <div class="cardImg">
      <a href="/product.html?id=${p.id}">
        <img loading="lazy" src="${esc(img)}" alt="${esc(p.name)}"
          onerror="this.src='https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=75'">
      </a>
      <span class="badge">${esc(p.badge||(sale?"Sale":"New"))}</span>
      <button class="wish" onclick="wish(${p.id},this)" aria-label="Add ${esc(p.name)} to wishlist">♡</button>
    </div>
    <div class="info">
      <div class="brand">${esc(p.brand||"SHOPY")}</div>
      <a class="name" href="/product.html?id=${p.id}">${esc(p.name)}</a>
      <div class="price">
        ${sale
          ? `<span class="salePrice">₹${price.toLocaleString("en-IN")}</span><span class="old">₹${Number(p.price).toLocaleString("en-IN")}</span>`
          : `₹${price.toLocaleString("en-IN")}`}
      </div>
      ${p.rating?`<div class="rating">★ ${Number(p.rating).toFixed(1)}${p.reviewCount?` · ${p.reviewCount} reviews`:""}</div>`:""}
    </div>
  </article>`;
}

function imgFor(p){
  const m={
    women:"https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=700&q=80",
    men:"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80",
    teens:"https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=80",
    kids:"https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&w=700&q=80",
    babies:"https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=700&q=80"
  };
  return m[String(p.ageGroup||"").toLowerCase()]||"https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=75";
}

async function wish(id,b){
  const t=localStorage.getItem("token");

  if(!t){
    show("Login to save items.");
    setTimeout(()=>location.href="/login.html",650);
    return;
  }

  try{
    const r=await fetch(API+"/wishlist/"+id,{
      method:"POST",
      headers:{
        Authorization:"Bearer "+t,
        "Content-Type":"application/json"
      }
    });

    if(!r.ok) throw new Error("Wishlist update failed");

    b.textContent="♥";
    b.classList.add("active");
    show("Added to wishlist.");
    header();
  }catch{
    show("Couldn't update wishlist.");
  }
}

async function header(){
  const t=localStorage.getItem("token");
  if(!t)return;

  if($("#account"))$("#account").href="/profile.html";

  try{
    const r=await fetch(API+"/cart",{
      headers:{Authorization:"Bearer "+t}
    });
    const d=r.ok?await r.json():{};
    if($("#cartCount"))$("#cartCount").textContent=(d.items||[]).reduce((n,x)=>n+Number(x.quantity||0),0);
  }catch{}

  try{
    const r=await fetch(API+"/wishlist",{
      headers:{Authorization:"Bearer "+t}
    });
    const d=r.ok?await r.json():[];
    if($("#wishCount"))$("#wishCount").textContent=(Array.isArray(d)?d:d.items||[]).length;
  }catch{}
}

function show(m){
  if(!toast)return;
  toast.textContent=m;
  toast.classList.add("show");
  clearTimeout(window.st);
  window.st=setTimeout(()=>toast.classList.remove("show"),2200);
}

function esc(v){
  return String(v??"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

const fallback=[
  {id:2,name:"Classic Oversized T-Shirt",price:1299,salePrice:999,ageGroup:"MEN",rating:4.6,reviewCount:82,badge:"Bestseller"},
  {id:3,name:"Premium Linen Shirt",price:2499,salePrice:1999,ageGroup:"MEN",rating:4.7,reviewCount:46,badge:"New"},
  {id:6,name:"Floral Summer Dress",price:2999,salePrice:2399,ageGroup:"WOMEN",rating:4.8,reviewCount:91,badge:"Trending"},
  {id:11,name:"Teen Graphic Hoodie",price:2199,salePrice:1699,ageGroup:"TEENS",rating:4.5,reviewCount:37,badge:"New"},
  {id:7,name:"Premium Kids Hoodie",price:1799,salePrice:1399,ageGroup:"KIDS",rating:4.7,reviewCount:52,badge:"Popular"},
  {id:9,name:"Baby Comfort Romper",price:899,salePrice:699,ageGroup:"BABIES",rating:4.9,reviewCount:64,badge:"Soft pick"},
  {id:23,name:"Women Statement Handbag",price:3999,salePrice:3199,ageGroup:"WOMEN",rating:4.8,reviewCount:31,badge:"Edit pick"},
  {id:15,name:"Men Relaxed Fit Jeans",price:2499,salePrice:1999,ageGroup:"MEN",rating:4.6,reviewCount:44,badge:"Bestseller"}
];