# AGENTS.md — Kapo Mobile (Expo / React Native)

> Application mobile **voyageur** de Kapo, plateforme de réservation de logements
> au Cameroun. Compagnon du site web Next.js
> (`/Users/elshaseries/Projects/NextJs/Kapo`) dont elle **réutilise le backend** :
> Firebase (Auth + Firestore) et les API HTTP du site. Interface en **français**,
> code en **JavaScript** (pas de TypeScript).

Docs Expo versionnées : https://docs.expo.dev/versions/v56.0.0/

## Stack

| Domaine | Choix |
|--------|-------|
| Framework | **Expo SDK 56** (React Native 0.85, React 19) |
| Navigation | **expo-router** (file-based, `app/`) |
| Auth / BDD | **Firebase JS SDK v12** (`firebase/auth` + `getReactNativePersistence(AsyncStorage)`, Firestore) |
| API serveur | Site Next.js déployé — `EXPO_PUBLIC_API_BASE_URL` (test : `https://kapo.elshaseries.com`) |
| Paiement | API du site : PayUnit (Mobile Money), Stripe, PayPal — checkout en **WebView interceptée** |
| Polices | Poppins (corps) + Montserrat (titres) via `@expo-google-fonts` |
| Icônes | `@expo/vector-icons` Feather (équivalent `react-icons/fi` du web) |
| Images | `expo-image` |

Alias d'import : `@/*` → `src/*` (`jsconfig.json`).

## Architecture (liens avec le projet web)

- `src/lib/constants.js`, `src/lib/data/*`, `src/lib/authErrors.js` : **copies
  quasi verbatim** du web (collections, statuts, lectures Firestore par uid).
  En cas d'évolution côté web, recopier/synchroniser.
- `src/lib/utils.js` : copie sans `cn()`. **`computePricing` doit rester
  identique au web/serveur** (source unique du calcul de prix).
- `src/lib/firebase/client.js` : adapté — `initializeAuth` + persistance
  AsyncStorage (try/catch pour le fast refresh).
- `src/lib/api.js` : adapté — mêmes fonctions que le web, URLs préfixées par
  `API_BASE_URL`, Bearer = `auth.currentUser.getIdToken()`.
- `src/context/AuthContext.jsx` : adapté — sans les cookies `kapoAuth`/`kapoRole`
  (spécifiques au middleware Next).
- `src/components/property/RangeCalendar.jsx` : port RN du calendrier web
  (même logique métier : nuits indisponibles, min/max, `hasBlockedNight`).

## Flux paiement (point sensible)

Les URLs de retour des paiements sont fixées **côté serveur** sur le domaine web
(`/voyageur/reservation/{propertyId}?provider=…&reservationId=…`). L'app ouvre le
checkout dans une **WebView** (`app/reservation/paiement.js`) et **intercepte**
cette navigation (`onShouldStartLoadWithRequest` + `onNavigationStateChange`)
pour extraire `session_id` / `token` / `cancelled` puis confirmer **nativement**
via `GET /api/payments/{payunit/confirm|stripe/confirm|paypal/capture}`.
Idempotent (flag `handled` + 409 « déjà payée » traité comme succès). Si les clés
fournisseur sont absentes côté serveur → `simulated: true` → confirmation directe
sans WebView.

## Écrans (app/)

- `(tabs)/` : Accueil (hero + recherche + sections), Recherche (filtres
  ville/type/voyageurs), Favoris, Réservations, Profil — les 3 derniers gardés
  par `RequireAuth`.
- `logement/[id]` : galerie, faits clés, équipements, avis, calendrier +
  réservation.
- `reservation/[propertyId]` (tunnel) + `reservation/paiement` (WebView).
- `(auth)/` : connexion / inscription / mot-de-passe-oublié (modaux, param `next`).
- `notifications`, `avis/[propertyId]`, `compte/{modifier,mot-de-passe}`.

## Démarrage

```bash
npm install
cp .env.example .env   # renseigner les EXPO_PUBLIC_* (mêmes valeurs que le web)
npx expo start         # i = simulateur iOS, ou Expo Go sur device
```

Tout tourne dans **Expo Go** (pas de dev build nécessaire).

## Conventions

- JavaScript pur, textes UI en **français**, montants via `formatPrice()` (F CFA).
- Charte : tokens dans `src/theme/` (primary `#F26178`, secondary `#F18A00`,
  navy `#002b5e`, radius 10) — ne pas coder de couleurs en dur dans les écrans.
- Pas de state manager : Context (`AuthContext`) + hooks (`useFetch`,
  `useAvailability`, `useUnreadNotifications`).
- Écritures sensibles (réservations, paiements, signalements, e-mails) : toujours
  via `src/lib/api.js` (API du site) — jamais en Firestore direct.
- Lectures et écritures simples (favoris, avis, profil, notifications) : Firestore
  direct via `src/lib/data/*` (mêmes règles de sécurité que le web).

## Pièges connus

- **Ne pas utiliser `StyleSheet.absoluteFillObject`** pour remplir un parent
  (images de fond, voiles/overlays) : sous cette version (Expo 56 / RN 0.85,
  Nouvelle Architecture), l'élément ne se rend pas. Utiliser
  `{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }`.
- Les images stockées en base peuvent être des **chemins relatifs au site web**
  (ex. villes `/img/banniere/4.jpg`) : toujours passer par
  `resolveImageUrl()` (`src/lib/config.js`).
- Feather n'a pas d'icônes pleines : pour les états « actif » (cœur favori),
  utiliser Ionicons (`heart` / `heart-outline`).

## Notes

- **Storage** (photo de profil) nécessite le forfait Blaze sur `kapo-b451a` ;
  tant qu'il n'est pas activé, l'upload d'avatar échoue avec un message explicite.
- `.env` n'est pas versionné ; `.env.example` liste les variables.
- v1.1 envisagée : deep link `kapo://` accepté par l'API web comme returnUrl de
  paiement (remplacerait l'interception WebView pour PayPal notamment).
