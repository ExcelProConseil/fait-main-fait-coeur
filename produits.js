// Réglages du site. Les produits sont gérés depuis admin.html (Supabase).
// La liste PRODUITS ci-dessous ne sert que tant que Supabase n'est pas configuré.
window.CONFIG = {
  paypal: "A-REMPLACER@exemple.fr",   // adresse e-mail de votre compte PayPal
  contact: "A-REMPLACER@exemple.fr",  // adresse qui reçoit les messages
  supabaseUrl: "https://hzcmrxhntcnchkxeqrht.supabase.co",         // Supabase > Project Settings > API > Project URL
  supabaseKey: "sb_publishable_r3O6Zi5OxsBZhKP3cldEKw_fpj7SPfV"          // clé "anon public" (publique par conception)
};
window.PRODUITS = [
  { id: "leon", nom: "Léon l'ourson", prix: 14, image: "images/leon.jpg",
    description: "Petit ourson au crochet, tout doux, fait main avec amour." },
  { id: "halloween", nom: "Suspensions d'Halloween", prix: 8, image: "images/halloween.jpg",
    description: "Suspensions décoratives au crochet pour une déco d'Halloween originale. (Prix provisoire)" },
  { id: "naissance", nom: "Cadeau de naissance", prix: null, image: "images/naissance.jpg",
    description: "Un cadeau unique et personnalisé pour accueillir bébé. Prix sur demande." }
];
