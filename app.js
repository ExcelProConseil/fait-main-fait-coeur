(function(){
  var pages=[["index.html","Accueil"],["boutique.html","Boutique"],["a-propos.html","À propos"],["contact.html","Contact"],["panier.html","Panier"]];
  var cur=location.pathname.split("/").pop()||"index.html";
  document.querySelector("header").innerHTML='<a class="logo" href="index.html">FAIT MAIN FAIT CŒUR</a><nav>'+
    pages.map(function(p){return '<a href="'+p[0]+'"'+(p[0]===cur?' class="on"':'')+'>'+p[1]+(p[0]==="panier.html"?' (<span id="nb-panier">0</span>)':'')+'</a>'}).join("")+'</nav>';
  document.querySelector("footer").innerHTML='© '+new Date().getFullYear()+' FAIT MAIN FAIT CŒUR — Confections d’articles textiles · <a href="mentions.html">Mentions légales &amp; CGV</a>';
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}


  // ----- Panier (mémorisé dans le navigateur du client) -----
  function lirePanier(){try{return (JSON.parse(localStorage.getItem("fmfc_panier"))||[]).map(function(l){l.qte=1;return l})}catch(e){return []}}
  function ecrirePanier(p){try{localStorage.setItem("fmfc_panier",JSON.stringify(p))}catch(e){}majBadge()}
  function majBadge(){var n=lirePanier().reduce(function(s,l){return s+l.qte},0),b=document.getElementById("nb-panier");if(b)b.textContent=n}
  majBadge();
  var LISTE=[];

  // Accueil : les 6 univers
  // Titres, textes et photos des 6 univers (modifiables dans l'administration)
  function fusion(rows){
    return CATEGORIES.map(function(c){
      var r=(rows||[]).filter(function(x){return x.id===c.id})[0]||{};
      return {id:c.id,titre:r.titre||c.titre,texte:r.texte||c.texte,image:r.image_url||c.image};
    });
  }
  var cf=window.CONFIG;
  var UP=(cf.supabaseUrl&&cf.supabaseUrl.indexOf("A-REMPLACER")<0)
    ? fetch(cf.supabaseUrl+"/rest/v1/univers?select=*",{headers:{apikey:cf.supabaseKey}}).then(function(r){return r.ok?r.json():[]}).catch(function(){return []})
    : Promise.resolve([]);

  // Accueil : les 6 univers
  var un=document.getElementById("univers");
  if(un){
    UP.then(function(rows){
      un.innerHTML=fusion(rows).map(function(c){
        return '<a class="card cadre" href="boutique.html#'+c.id+'"><div class="img"><img src="'+esc(c.image)+'" alt="" onerror="this.remove()"></div><div class="body"><h3>'+esc(c.titre)+'</h3>'+(c.texte?'<p>'+esc(c.texte)+'</p>':'')+'</div></a>';
      }).join("");
    });
  }

  // Boutique : produits par catégorie
  var el=document.getElementById("produits");
  function charger(){
    var c=window.CONFIG;
    if(!c.supabaseUrl||c.supabaseUrl.indexOf("A-REMPLACER")>=0)return Promise.resolve(PRODUITS);
    return fetch(c.supabaseUrl+"/rest/v1/produits?select=*&order=ordre.asc,created_at.asc",{headers:{apikey:c.supabaseKey}})
      .then(function(r){return r.ok?r.json():Promise.reject()})
      .then(function(rows){return rows.map(function(r){return {nom:r.nom,prix:r.prix,image:r.image_url||"",description:r.description||"",categorie:r.categorie||"",id:r.id,variantes:Array.isArray(r.variantes)?r.variantes:[]}})})
      .catch(function(){return null});
  }
  function carte(p){
    var vs=p.variantes||[];
    var action=p.prix==null
      ? '<a class="btn" href="contact.html?produit='+encodeURIComponent(p.nom)+'">Demander un prix</a>'
      : '<button class="btn add">Ajouter au panier</button>';
    var photo=vs.length?vs[0].image_url:p.image;
    var img=photo?'<img src="'+esc(photo)+'" alt="'+esc(p.nom)+'" onerror="this.remove()">':'';
    var vars=vs.length?'<div class="vars">'+vs.map(function(v,k){
      return '<button type="button" class="vari'+(k?'':' sel')+'" data-k="'+k+'" title="'+esc(v.nom)+'"><img src="'+esc(v.image_url)+'" alt="'+esc(v.nom)+'"><span>'+esc(v.nom)+'</span></button>';
    }).join("")+'</div>':'';
    return '<article class="card" data-i="'+LISTE.indexOf(p)+'" data-v="0"><div class="img">'+img+'</div><div class="body"><h3>'+esc(p.nom)+'</h3><p>'+esc(p.description)+'</p>'+vars+'<div class="prix">'+(p.prix==null?'Prix sur demande':String(p.prix).replace(".",",")+' €')+'</div>'+action+'</div></article>';
  }
  if(el){
    Promise.all([charger(),UP]).then(function(res){
      var liste=res[0],CATS=fusion(res[1]);
      if(!liste){el.innerHTML="<p>La boutique est momentanément indisponible, merci de revenir plus tard.</p>";return}
      LISTE=liste;
      var html=CATS.map(function(c){
        var l=liste.filter(function(p){return p.categorie===c.id});
        return '<section id="'+c.id+'"><h2>'+esc(c.titre)+'</h2>'+
          (l.length?'<div class="grid">'+l.map(carte).join("")+'</div>':'<p class="muted">De nouvelles confections arrivent bientôt.</p>')+'</section>';
      }).join("");
      var autres=liste.filter(function(p){return !CATS.some(function(c){return c.id===p.categorie})});
      if(autres.length)html+='<section id="autres"><h2>Autres confections</h2><div class="grid">'+autres.map(carte).join("")+'</div></section>';
      el.innerHTML=html;
      el.onclick=function(e){
        var vb=e.target.closest(".vari");
        if(vb){
          var art=vb.closest("article"),p=LISTE[+art.dataset.i],k=+vb.dataset.k;
          art.dataset.v=k;
          art.querySelectorAll(".vari").forEach(function(x){x.classList.toggle("sel",x===vb)});
          var im=art.querySelector(".img img");if(im)im.src=p.variantes[k].image_url;
          return;
        }
        var b=e.target.closest(".add");if(!b)return;
        var art2=b.closest("article"),p2=LISTE[+art2.dataset.i],v=(p2.variantes||[])[+art2.dataset.v];
        var cle=v?p2.id+"|"+v.nom:p2.id,nom=v?p2.nom+" – "+v.nom:p2.nom;
        var pn=lirePanier(),l=pn.filter(function(x){return x.id===cle})[0];
        if(l){b.textContent="Déjà dans votre panier (pièce unique)";setTimeout(function(){b.textContent="Ajouter au panier"},2500);return}
        pn.push({id:cle,nom:nom,prix:p2.prix,qte:1});
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
      var sous=0;pn.forEach(function(l){sous+=l.prix*l.qte});
      var port=retrait?0:4,total=sous+port;
      pe.innerHTML='<table class="tbl"><thead><tr><th>Article</th><th>Prix</th><th></th></tr></thead><tbody>'+
        pn.map(function(l,i){return '<tr><td>'+esc(l.nom)+'</td><td>'+fmt(l.prix)+'</td><td><button class="q" data-a="x" data-i="'+i+'" title="Retirer">✕</button></td></tr>'}).join("")+
        '</tbody></table>'+
        '<p><label><input type="radio" name="liv" value="mr"'+(retrait?'':' checked')+'> Livraison Mondial Relay : 4 €</label><br>'+
        '<label><input type="radio" name="liv" value="at"'+(retrait?' checked':'')+'> Retrait directement à l’atelier : gratuit</label></p>'+
        '<p>Sous-total : '+fmt(sous)+'<br>Livraison : '+fmt(port)+'<br><strong>Total : '+fmt(total)+'</strong></p>'+
        '<div class="row"><button class="btn" id="paypal">Payer par carte ou PayPal</button>'+'</div>'+
        '<p class="muted">Paiement sécurisé via Paypal : vous pouvez régler par carte bancaire (CB) sans avoir de compte PayPal.</p>';
      pe.querySelectorAll('input[name=liv]').forEach(function(r){r.onchange=function(){retrait=r.value==="at";rendrePanier()}});
      pe.querySelectorAll(".q").forEach(function(b){b.onclick=function(){
        var p=lirePanier(),i=+b.dataset.i;
        if(b.dataset.a==="p")p[i].qte++;else if(b.dataset.a==="m")p[i].qte--;else p[i].qte=0;
        ecrirePanier(p.filter(function(l){return l.qte>0}));rendrePanier()}});
      var pp=document.getElementById("paypal");
      if(pp)pp.onclick=function(){
        if(!CONFIG.paypal||CONFIG.paypal.indexOf("A-REMPLACER")>=0){alert("Le paiement en ligne n’est pas encore disponible. Merci de réessayer plus tard ou de me contacter via l’onglet Contact.");return}
        var f=document.createElement("form");f.method="post";f.action="https://www.paypal.com/cgi-bin/webscr";
        var champs={cmd:"_cart",upload:"1",business:CONFIG.paypal,currency_code:"EUR",charset:"utf-8",lc:"FR",handling_cart:port.toFixed(2),
          "return":location.origin+location.pathname.replace("panier.html","merci.html"),cancel_return:location.href};
        pn.forEach(function(l,i){champs["item_name_"+(i+1)]=l.nom;champs["amount_"+(i+1)]=l.prix.toFixed(2);champs["quantity_"+(i+1)]=l.qte});
        Object.keys(champs).forEach(function(k){var i=document.createElement("input");i.type="hidden";i.name=k;i.value=champs[k];f.appendChild(i)});
        document.body.appendChild(f);f.submit()};
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
