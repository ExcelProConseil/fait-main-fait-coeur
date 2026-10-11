// Modifiez ici votre adresse PayPal et vos produits.
window.CONFIG = {
  paypal: "A-REMPLACER@exemple.fr",   // adresse e-mail de votre compte PayPal
  contact: "A-REMPLACER@exemple.fr"   // adresse qui reçoit les messages
};
window.PRODUITS = [
  { id: "leon", nom: "Léon l'ourson", prix: 14, image: "images/leon.jpg",
    description: "Petit ourson au crochet, tout doux, fait main avec amour." },
  { id: "halloween", nom: "Suspensions d'Halloween", prix: 8, image: "images/halloween.jpg",
    description: "Suspensions décoratives au crochet pour une déco d'Halloween originale. (Prix provisoire)" },
  { id: "naissance", nom: "Cadeau de naissance", prix: null, image: "images/naissance.jpg",
    description: "Un cadeau unique et personnalisé pour accueillir bébé. Prix sur demande." }
];
