document.addEventListener("DOMContentLoaded",()=>{
  const header=document.querySelector(".site-header");
  const update=()=>header?.classList.toggle("scrolled",window.scrollY>8);
  update();
  window.addEventListener("scroll",update,{passive:true});
});