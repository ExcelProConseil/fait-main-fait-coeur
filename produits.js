// Réglages du site. Les produits sont gérés depuis admin.html (Supabase).
// La liste PRODUITS ci-dessous ne sert que tant que Supabase n'est pas configuré.
window.CONFIG = {
  paypal: "FaitmainFaitcoeur@outlook.fr",   // adresse e-mail du compte PayPal
  contact: "FaitmainFaitcoeur@outlook.fr",  // adresse qui reçoit les messages
  supabaseUrl: "https://hzcmrxhntcnchkxeqrht.supabase.co",         // Supabase > Project Settings > API > Project URL
  supabaseKey: "sb_publishable_r3O6Zi5OxsBZhKP3cldEKw_fpj7SPfV"          // clé "anon public" (publique par conception)
};
// Les 6 univers (cadres de l'accueil + sections de la boutique).
// texte et image : à renseigner quand Isabelle les fournit (images/cat-xxx.jpg).
window.CATEGORIES = [
  { id: "bebes",    titre: "Bébés (naissance à 2 ans)",      texte: "", image: "images/cat-bebes.jpg" },
  { id: "enfants",  titre: "Enfants (de 3 à 12 ans)",        texte: "", image: "images/cat-enfants.jpg" },
  { id: "adultes",  titre: "Ados / Adultes",                 texte: "", image: "images/cat-adultes.jpg" },
  { id: "maison",   titre: "Maison pratique / Zéro déchet",  texte: "", image: "images/cat-maison.jpg" },
  { id: "fleurs",   titre: "Les Fleurs",                     texte: "", image: "images/cat-fleurs.jpg" },
  { id: "deco",     titre: "La décoration",                  texte: "", image: "images/cat-deco.jpg" }
];
// Utilisé seulement si Supabase est injoignable à la configuration : volontairement vide.
window.PRODUITS = [];
