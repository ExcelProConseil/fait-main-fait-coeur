// Edge Function Supabase (déployée sous le nom « swift-processor ») — FAIT MAIN FAIT CŒUR
// 1) { reference, token }  -> crée le paiement SumUp et renvoie l'adresse de la page de paiement.
// 2) webhook SumUp { event_type, id } -> vérifie auprès de SumUp, puis passe la commande en « Payée ».
// Secrets à définir dans Supabase : SUMUP_API_KEY, SUMUP_MERCHANT_CODE.
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.
// Le montant est recalculé ici à partir des prix de la base : celui du navigateur n'est jamais cru.

const SUMUP = "https://api.sumup.com/v0.1/checkouts";
const SITE = "https://faitmainfaitcoeur.fr";
const SB = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const KEY = (Deno.env.get("SUMUP_API_KEY") ?? "").trim().replace(/^["']|["']$/g, "");
const MERCHANT = (Deno.env.get("SUMUP_MERCHANT_CODE") ?? "").trim().replace(/^["']|["']$/g, "");
// diagnostic sans secret : présence, longueur et début de la clé (« sup_sk_ » est commun à toutes les clés SumUp)
console.log(`diag cle: ${KEY ? "presente" : "ABSENTE"} longueur=${KEY.length} debut=${KEY.slice(0, 7)} | code marchand: ${MERCHANT ? "present" : "ABSENT"} longueur=${MERCHANT.length}`);

const CORS = {
  "Access-Control-Allow-Origin": SITE,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const rep = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

const sb = (path: string, init: RequestInit = {}) =>
  fetch(`${SB}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SRK, Authorization: `Bearer ${SRK}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });

const normaliser = (c: unknown) => String(c ?? "").toUpperCase().replace(/\s+/g, "");

// Solde utilisable d'une carte cadeau = solde - réductions déjà réservées par d'autres commandes en cours (30 min)
async function soldeCarte(code: string, token: string) {
  if (!/^[A-Z0-9-]{4,24}$/.test(code)) return null;
  const r = await sb(`cartes_cadeaux?code=eq.${code}&actif=eq.true&select=solde`);
  const c = (await r.json())?.[0];
  if (!c) return null;
  const depuis = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const rs = await sb(
    `commandes?code_carte=eq.${code}&statut=eq.${encodeURIComponent("En attente de paiement")}&created_at=gt.${depuis}&token=neq.${token}&select=reduction`,
  );
  let reserve = 0;
  for (const x of await rs.json()) reserve += Number(x.reduction) || 0;
  const dispo = Math.round((Number(c.solde) - reserve) * 100) / 100;
  return dispo > 0 ? dispo : null;
}

async function verifier(codeBrut: string, token: string) {
  if (!/^[A-Za-z0-9]{16,64}$/.test(token)) return rep({ error: "Requête invalide" }, 400);
  const dispo = await soldeCarte(normaliser(codeBrut), token);
  if (dispo === null) return rep({ ok: false });
  return rep({ ok: true, disponible: dispo });
}

async function creer(reference: string, token: string, codeBrut?: string) {
  if (!/^FMFC-[A-Z0-9]{4,12}$/.test(reference) || !/^[A-Za-z0-9]{16,64}$/.test(token)) return rep({ error: "Requête invalide" }, 400);
  const r = await sb(`commandes?reference=eq.${reference}&token=eq.${token}&select=id,articles,mode_livraison,statut`);
  const cmd = (await r.json())?.[0];
  if (!cmd) return rep({ error: "Commande introuvable" }, 404);
  if (cmd.statut !== "En attente de paiement") return rep({ error: "Commande déjà traitée" }, 409);

  // montant recalculé côté serveur (pièce = identifiant du produit, ou « produit|variante »)
  const ids = [...new Set((cmd.articles as { id: string }[]).map((a) => String(a.id).split("|")[0]))];
  const pr = await sb(`produits?select=id,prix&id=in.(${ids.map(encodeURIComponent).join(",")})`);
  const prix: Record<string, number> = {};
  for (const p of await pr.json()) prix[String(p.id)] = Number(p.prix);
  let sous = 0;
  for (const a of cmd.articles as { id: string }[]) {
    const p = prix[String(a.id).split("|")[0]];
    if (!(p >= 0)) return rep({ error: "Article introuvable" }, 422);
    sous += p;
  }
  const livraison = String(cmd.mode_livraison).startsWith("Retrait") ? 0 : 4;
  const total = Math.round((sous + livraison) * 100) / 100;
  if (!(total > 0)) return rep({ error: "Montant invalide" }, 422);

  // carte cadeau éventuelle : la réduction est calculée ici, jamais par le navigateur
  const code = normaliser(codeBrut);
  let reduction = 0;
  if (code) {
    const dispo = await soldeCarte(code, token);
    if (dispo === null) return rep({ error: "Carte cadeau invalide ou épuisée" }, 422);
    reduction = Math.min(dispo, Math.round(sous * 100) / 100); // la carte couvre les articles, jamais les frais de port
  }
  const aPayer = Math.round((total - reduction) * 100) / 100;

  // on aligne la commande sur les vrais prix (et sur la réduction)
  const maj: Record<string, unknown> = {
    sous_total: Math.round(sous * 100) / 100,
    livraison,
    reduction,
    code_carte: reduction > 0 ? code : "",
    total: aPayer,
  };
  if (aPayer === 0) maj.statut = "Payée"; // la carte couvre tout : rien à payer par carte bancaire
  const pat = await sb(`commandes?id=eq.${cmd.id}&statut=eq.${encodeURIComponent("En attente de paiement")}`, {
    method: "PATCH",
    body: JSON.stringify(maj),
  });
  if (!pat.ok) {
    console.error("PATCH commande", pat.status, await pat.text());
    return rep({ error: "Erreur" }, 500);
  }
  if (aPayer === 0) return rep({ gratuit: true });

  const s = await fetch(SUMUP, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      checkout_reference: `${reference}_${crypto.randomUUID().slice(0, 6)}`,
      amount: aPayer,
      currency: "EUR",
      merchant_code: MERCHANT,
      description: `Commande ${reference} — Fait main Fait cœur`,
      return_url: `${SB}/functions/v1/swift-processor`,
      redirect_url: `${SITE}/merci.html`,
      hosted_checkout: { enabled: true },
    }),
  });
  const j = await s.json();
  if (!s.ok || !j.hosted_checkout_url) {
    console.error("SumUp", s.status, JSON.stringify(j));
    console.error(`diag cle: ${KEY ? "presente" : "ABSENTE"} longueur=${KEY.length} debut=${KEY.slice(0, 7)} | code marchand: ${MERCHANT ? "present" : "ABSENT"} longueur=${MERCHANT.length}`);
    return rep({ error: "Paiement indisponible" }, 502);
  }
  return rep({ url: j.hosted_checkout_url });
}

async function webhook(id: string) {
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return new Response(null, { status: 204 });
  // on ne croit jamais le message reçu : on interroge SumUp
  const s = await fetch(`${SUMUP}/${id}`, { headers: { Authorization: `Bearer ${KEY}` } });
  if (!s.ok) return new Response(null, { status: 500 });
  const c = await s.json();
  if (c.status !== "PAID" || c.merchant_code !== MERCHANT) return new Response(null, { status: 204 });
  const reference = String(c.checkout_reference || "").split("_")[0];
  if (!/^FMFC-[A-Z0-9]{4,12}$/.test(reference)) return new Response(null, { status: 204 });
  const r = await sb(`commandes?reference=eq.${reference}&select=id,total,statut`);
  const cmd = (await r.json())?.[0];
  if (cmd && cmd.statut === "En attente de paiement" && Math.abs(Number(cmd.total) - Number(c.amount)) < 0.011) {
    await sb(`commandes?id=eq.${cmd.id}`, { method: "PATCH", body: JSON.stringify({ statut: "Payée" }) });
  }
  return new Response(null, { status: 204 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return rep({ error: "Méthode non autorisée" }, 405);
  let b: Record<string, string> = {};
  try { b = await req.json(); } catch { return rep({ error: "Requête invalide" }, 400); }
  try {
    if (b.event_type) return b.event_type === "CHECKOUT_STATUS_CHANGED" ? await webhook(b.id) : new Response(null, { status: 204 });
    if (b.action === "verifier") return await verifier(b.code, b.token);
    return await creer(b.reference, b.token, b.code);
  } catch (e) {
    console.error(e);
    return rep({ error: "Erreur" }, 500);
  }
});
