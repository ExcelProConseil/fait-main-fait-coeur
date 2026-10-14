(function(){
  var pages=[["index.html","Accueil"],["boutique.html","Boutique"],["a-propos.html","À propos"],["contact.html","Contact"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  document.querySelector("header").innerHTML='<a class="logo" href="index.html">FAIT MAIN FAIT CŒUR</a><nav>'+
    pages.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===cur?' class="on"':'')+'>'+p[1]+'</a>'}).join("")+'</nav>';
  document.querySelector("footer").innerHTML='© '+new Date().getFullYear()+' FAIT MAIN FAIT CŒUR — Confections d’articles textiles · <a href="mentions.html">Mentions légales &amp; CGV</a>';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

  // Accueil : les 6 univers
  var un=document.getElementById("univers");
  if(un){
    un.innerHTML=CATEGORIES.map(function(c){
      return '<a class="card cadre" href="boutique.html#'+c.id+'"><div class="img"><img src="'+esc(c.image)+'" alt="" onerror="this.remove()"></div><div class="body"><h3>'+esc(c.titre)+'</h3>'+(c.texte?'<p>'+esc(c.texte)+'</p>':'')+'</div></a>';
    }).join("");
  }

  // Boutique : produits par catégorie
  var el=document.getElementById("produits");
  function charger(){
    var c=window.CONFIG;
    if(!c.supabaseUrl||c.supabaseUrl.indexOf("A-REMPLACER")>=0)return Promise.resolve(PRODUITS);
    return fetch(c.supabaseUrl+"/rest/v1/produits?select=*&order=ordre.asc,created_at.asc",{headers:{apikey:c.supabaseKey}})
      .then(function(r){return r.ok?r.json():Promise.reject()})
      .then(function(rows){return rows.map(function(r){return {nom:r.nom,prix:r.prix,image:r.image_url||"",description:r.description||"",categorie:r.categorie||""}})})
      .catch(function(){return null});
  }
  function carte(p){
    var action=p.prix==null
      ? '<a class="btn" href="contact.html?produit='+encodeURIComponent(p.nom)+'">Demander un prix</a>'
      : '<a class="btn" target="_blank" rel="noopener" href="https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business='+encodeURIComponent(CONFIG.paypal)+'&item_name='+encodeURIComponent(p.nom)+'&amount='+p.prix+'&currency_code=EUR">Payer avec PayPal</a>';
    var img=p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.nom)+'" onerror="this.remove()">':'';
    return '<article class="card"><div class="img">'+img+'</div><div class="body"><h3>'+esc(p.nom)+'</h3><p>'+esc(p.description)+'</p><div class="prix">'+(p.prix==null?'Prix sur demande':String(p.prix).replace(".",",")+' €')+'</div>'+action+'</div></article>';
  }
  if(el){
    charger().then(function(liste){
      if(!liste){el.innerHTML="<p>La boutique est momentanément indisponible, merci de revenir plus tard.</p>";return}
      var html=CATEGORIES.map(function(c){
        var l=liste.filter(function(p){return p.categorie===c.id});
        return '<section id="'+c.id+'"><h2>'+esc(c.titre)+'</h2>'+
          (l.length?'<div class="grid">'+l.map(carte).join("")+'</div>':'<p class="muted">De nouvelles confections arrivent bientôt.</p>')+'</section>';
      }).join("");
      var autres=liste.filter(function(p){return !CATEGORIES.some(function(c){return c.id===p.categorie})});
      if(autres.length)html+='<section id="autres"><h2>Autres confections</h2><div class="grid">'+autres.map(carte).join("")+'</div></section>';
      el.innerHTML=html;
      if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}
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
