(function(){
  var pages=[["index.html","Accueil"],["boutique.html","Boutique"],["a-propos.html","À propos"],["contact.html","Contact"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  document.querySelector("header").innerHTML='<a class="logo" href="index.html">🧶 Fait main Fait cœur</a><nav>'+
    pages.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===cur?' class="on"':'')+'>'+p[1]+'</a>'}).join("")+'</nav>';
  document.querySelector("footer").innerHTML='© '+new Date().getFullYear()+' Fait main Fait cœur — Couture et crochet · <a href="mentions.html">Mentions légales &amp; CGV</a>';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var el=document.getElementById("produits");
  function charger(){
    var c=window.CONFIG;
    if(!c.supabaseUrl||c.supabaseUrl.indexOf("A-REMPLACER")>=0)return Promise.resolve(PRODUITS);
    return fetch(c.supabaseUrl+"/rest/v1/produits?select=*&order=ordre.asc,created_at.asc",{headers:{apikey:c.supabaseKey}})
      .then(function(r){return r.ok?r.json():Promise.reject()})
      .then(function(rows){return rows.map(function(r){return {nom:r.nom,prix:r.prix,image:r.image_url||"",description:r.description||""}})})
      .catch(function(){return null});
  }
  if(el){
    var n=+el.dataset.max||99;
    charger().then(function(liste){
      if(!liste){el.innerHTML="<p>La boutique est momentanément indisponible, merci de revenir plus tard.</p>";return}
      if(!liste.length){el.innerHTML="<p>Aucun produit pour le moment.</p>";return}
      el.innerHTML=liste.slice(0,n).map(function(p){
        var action=p.prix==null
          ? '<a class="btn" href="contact.html?produit='+encodeURIComponent(p.nom)+'">Demander un prix</a>'
          : '<a class="btn" target="_blank" rel="noopener" href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business='+encodeURIComponent(CONFIG.paypal)+'&item_name='+encodeURIComponent(p.nom)+'&amount='+p.prix+'&currency_code=EUR">Payer avec PayPal</a>';
        var img=p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.nom)+'" onerror="this.replaceWith(document.createTextNode(\'🧸\'))">':'🧸';
        return '<article class="card"><div class="img">'+img+'</div><div class="body"><h3>'+esc(p.nom)+'</h3><p>'+esc(p.description)+'</p><div class="prix">'+(p.prix==null?'Prix sur demande':String(p.prix).replace(".",",")+' €')+'</div>'+action+'</div></article>';
      }).join("");
    });
  }
  var f=document.getElementById("contact");
  if(f){
    var q=new URLSearchParams(location.search).get("produit");
    if(q)f.message.value="Bonjour, je souhaite un devis pour : "+q+"\n";
    f.onsubmit=function(e){e.preventDefault();
      location.href="mailto:"+CONFIG.contact+"?subject="+encodeURIComponent("Message de "+f.nom.value)+"&body="+encodeURIComponent(f.message.value+"\n\n"+f.nom.value+" ("+f.email.value+")");};
  }
})();
