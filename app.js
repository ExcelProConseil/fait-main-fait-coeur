(function(){
  var pages=[["index.html","Accueil"],["boutique.html","Boutique"],["a-propos.html","À propos"],["contact.html","Contact"],["panier.html","Panier"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  document.querySelector("header").innerHTML='<a class="logo" href="index.html">FAIT MAIN FAIT CŒUR</a><nav>'+
    pages.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===cur?' class="on"':'')+'>'+p[1]+(p[0]==="panier.html"?' (<span id="nb-panier">0</span>)':'')+'</a>'}).join("")+'</nav>';
  document.querySelector("footer").innerHTML='© '+new Date().getFullYear()+' FAIT MAIN FAIT CŒUR — Confections d’articles textiles · <a href="mentions.html">Mentions légales &amp; CGV</a>';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}


  // ----- Panier (mémorisé dans le navigateur du client) -----
  function lirePanier(){try{return JSON.parse(localStorage.getItem("fmfc_panier"))||[]}catch(e){return []}}
  function ecrirePanier(p){try{localStorage.setItem("fmfc_panier",JSON.stringify(p))}catch(e){}majBadge()}
  function majBadge(){var n=lirePanier().reduce(function(s,l){return s+l.qte},0),b=document.getElementById("nb-panier");if(b)b.textContent=n}
  majBadge();
  var LISTE=[];

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
      .then(function(rows){return rows.map(function(r){return {nom:r.nom,prix:r.prix,image:r.image_url||"",description:r.description||"",categorie:r.categorie||"",id:r.id,poids:r.poids||0}})})
      .catch(function(){return null});
  }
  function carte(p){
    var action=p.prix==null
      ? '<a class="btn" href="contact.html?produit='+encodeURIComponent(p.nom)+'">Demander un prix</a>'
      : '<button class="btn add" data-i="'+LISTE.indexOf(p)+'">Ajouter au panier</button>';
    var img=p.image?'<img src="'+esc(p.image)+'" alt="'+esc(p.nom)+'" onerror="this.remove()">':'';
    return '<article class="card"><div class="img">'+img+'</div><div class="body"><h3>'+esc(p.nom)+'</h3><p>'+esc(p.description)+'</p><div class="prix">'+(p.prix==null?'Prix sur demande':String(p.prix).replace(".",",")+' €')+'</div>'+action+'</div></article>';
  }
  if(el){
    charger().then(function(liste){
      if(!liste){el.innerHTML="<p>La boutique est momentanément indisponible, merci de revenir plus tard.</p>";return}
      LISTE=liste;
      var html=CATEGORIES.map(function(c){
        var l=liste.filter(function(p){return p.categorie===c.id});
        return '<section id="'+c.id+'"><h2>'+esc(c.titre)+'</h2>'+
          (l.length?'<div class="grid">'+l.map(carte).join("")+'</div>':'<p class="muted">De nouvelles confections arrivent bientôt.</p>')+'</section>';
      }).join("");
      var autres=liste.filter(function(p){return !CATEGORIES.some(function(c){return c.id===p.categorie})});
      if(autres.length)html+='<section id="autres"><h2>Autres confections</h2><div class="grid">'+autres.map(carte).join("")+'</div></section>';
      el.innerHTML=html;
      el.onclick=function(e){var b=e.target.closest(".add");if(!b)return;
        var p=LISTE[+b.dataset.i],pn=lirePanier(),l=pn.filter(function(x){return x.id===p.id})[0];
        if(l)l.qte++;else pn.push({id:p.id,nom:p.nom,prix:p.prix,poids:p.poids||0,qte:1});
        ecrirePanier(pn);b.textContent="Ajouté ✔";setTimeout(function(){b.textContent="Ajouter au panier"},1500)};
      if(location.hash){var t=document.getElementById(location.hash.slice(1));if(t)t.scrollIntoView()}
    });
  }

  // Page panier
  var pe=document.getElementById("panier");
  if(pe){
    var retrait=false;
    var fmt=function(n){return n.toFixed(2).replace(".",",")+" €"};
    var rendrePanier=function(){
      var pn=lirePanier();
      if(!pn.length){pe.innerHTML='<p>Votre panier est vide.</p><a class="btn" href="boutique.html">Voir la boutique</a>';return}
      var sous=0,poids=0;pn.forEach(function(l){sous+=l.prix*l.qte;poids+=(l.poids||0)*l.qte});
      var trop=!retrait&&poids>1000,port=retrait?0:(poids<=500?2:4),total=sous+(trop?0:port);
      pe.innerHTML='<table class="tbl"><thead><tr><th>Article</th><th>Prix</th><th>Qté</th><th></th></tr></thead><tbody>'+
        pn.map(function(l,i){return '<tr><td>'+esc(l.nom)+'</td><td>'+fmt(l.prix)+'</td><td><button class="q" data-a="m" data-i="'+i+'">−</button> '+l.qte+' <button class="q" data-a="p" data-i="'+i+'">+</button></td><td><button class="q" data-a="x" data-i="'+i+'" title="Retirer">✕</button></td></tr>'}).join("")+
        '</tbody></table>'+
        '<p><label><input type="radio" name="liv" value="mr"'+(retrait?'':' checked')+'> Livraison Mondial Relay (jusqu’à 500 g : 2 € / 500 g à 1 kg : 4 €)</label><br>'+
        '<label><input type="radio" name="liv" value="at"'+(retrait?' checked':'')+'> Retrait à l’atelier (gratuit)</label></p>'+
        '<p>Sous-total : '+fmt(sous)+'<br>Livraison : '+(trop?'à calculer (plus d’1 kg)':fmt(port))+'<br><strong>Total : '+fmt(total)+(trop?' + livraison':'')+'</strong></p>'+
        (trop?'<p class="muted">Au-delà d’1 kg, contactez-moi pour les frais de livraison : choisissez le règlement par chèque ci-dessous ou écrivez-moi via l’onglet Contact.</p>':'')+
        '<div class="row">'+(trop?'':'<button class="btn" id="paypal">Payer par carte ou PayPal</button>')+'<button class="btn alt" id="cheque">Commander et payer par chèque</button></div>'+
        '<p class="muted">Paiement sécurisé par Paypal : vous pouvez régler par carte bancaire sans avoir de compte PayPal.</p>';
      pe.querySelectorAll('input[name=liv]').forEach(function(r){r.onchange=function(){retrait=r.value==="at";rendrePanier()}});
      pe.querySelectorAll(".q").forEach(function(b){b.onclick=function(){
        var p=lirePanier(),i=+b.dataset.i;
        if(b.dataset.a==="p")p[i].qte++;else if(b.dataset.a==="m")p[i].qte--;else p[i].qte=0;
        ecrirePanier(p.filter(function(l){return l.qte>0}));rendrePanier()}});
      var pp=document.getElementById("paypal");
      if(pp)pp.onclick=function(){
        if(!CONFIG.paypal||CONFIG.paypal.indexOf("A-REMPLACER")>=0){alert("Le paiement en ligne n’est pas encore activé. Merci de choisir le paiement par chèque.");return}
        var f=document.createElement("form");f.method="post";f.action="https://www.paypal.com/cgi-bin/webscr";
        var champs={cmd:"_cart",upload:"1",business:CONFIG.paypal,currency_code:"EUR",charset:"utf-8",lc:"FR",handling_cart:port.toFixed(2),
          "return":location.origin+location.pathname.replace("panier.html","merci.html"),cancel_return:location.href};
        pn.forEach(function(l,i){champs["item_name_"+(i+1)]=l.nom;champs["amount_"+(i+1)]=l.prix.toFixed(2);champs["quantity_"+(i+1)]=l.qte});
        Object.keys(champs).forEach(function(k){var i=document.createElement("input");i.type="hidden";i.name=k;i.value=champs[k];f.appendChild(i)});
        document.body.appendChild(f);f.submit()};
      document.getElementById("cheque").onclick=function(){
        var lignes=pn.map(function(l){return "- "+l.qte+" x "+l.nom+" ("+fmt(l.prix)+")"}).join("\n");
        location.href="mailto:"+CONFIG.contact+"?subject="+encodeURIComponent("Commande (règlement par chèque)")+"&body="+encodeURIComponent("Bonjour,\nJe souhaite commander :\n"+lignes+"\n\nSous-total : "+fmt(sous)+"\nLivraison : "+(retrait?"retrait à l’atelier":trop?"à calculer":fmt(port))+"\n\nMon nom et mon adresse (ou point Mondial Relay) :\n")}
    };
    rendrePanier();
  }

  var f=document.getElementById("contact");
  if(f){
    var q=new URLSearchParams(location.search).get("produit");
    if(q)f.message.value="Bonjour, je souhaite un devis pour : "+q+"\n";
    f.onsubmit=function(e){e.preventDefault();
      location.href="mailto:"+CONFIG.contact+"?subject="+encodeURIComponent("Message de "+f.nom.value)+"&body="+encodeURIComponent(f.message.value+"\n\n"+f.nom.value+" ("+f.email.value+")");};
  }
})();
