(function(){
  var pages=[["index.html","Accueil"],["boutique.html","Boutique"],["a-propos.html","À propos"],["contact.html","Contact"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  document.querySelector("header").innerHTML='<a class="logo" href="index.html">🧶 Fait main Fait cœur</a><nav>'+
    pages.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===cur?' class="on"':'')+'>'+p[1]+'</a>'}).join("")+'</nav>';
  document.querySelector("footer").innerHTML='© '+new Date().getFullYear()+' Fait main Fait cœur — Couture et crochet · <a href="mentions.html">Mentions légales &amp; CGV</a>';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var el=document.getElementById("produits");
  if(!el)return;
  var n=+el.dataset.max||99;
  el.innerHTML=PRODUITS.slice(0,n).map(function(p){
    var action=p.prix==null
      ? '<a class="btn" href="contact.html?produit='+encodeURIComponent(p.nom)+'">Demander un prix</a>'
      : '<a class="btn" target="_blank" rel="noopener" href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business='+encodeURIComponent(CONFIG.paypal)+'&item_name='+encodeURIComponent(p.nom)+'&amount='+p.prix+'&currency_code=EUR">Payer avec PayPal</a>';
    return '<article class="card"><div class="img"><img src="'+esc(p.image)+'" alt="'+esc(p.nom)+'" onerror="this.replaceWith(document.createTextNode(\'🧸\'))"></div><div class="body"><h3>'+esc(p.nom)+'</h3><p>'+esc(p.description)+'</p><div class="prix">'+(p.prix==null?'Prix sur demande':p.prix+' €')+'</div>'+action+'</div></article>';
  }).join("");
  var f=document.getElementById("contact");
  if(f){
    var q=new URLSearchParams(location.search).get("produit");
    if(q)f.message.value="Bonjour, je souhaite un devis pour : "+q+"\n";
    f.onsubmit=function(e){e.preventDefault();
      location.href="mailto:"+CONFIG.contact+"?subject="+encodeURIComponent("Message de "+f.nom.value)+"&body="+encodeURIComponent(f.message.value+"\n\n"+f.nom.value+" ("+f.email.value+")");};
  }
})();
