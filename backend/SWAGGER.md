# API IDEpitech

## 1. Conventions

| Élément          | Valeur                                                                      |
| ---------------- | --------------------------------------------------------------------------- |
| Base URL         | `/api/v1`                                                                   |
| Format           | JSON (`Content-Type: application/json`), UTF-8                              |
| Dates            | ISO 8601 (`2026-11-05T14:30:00Z`), `YYYY-MM-DD` pour les champs `DATE` purs |
| Authentification | JWT dans l'en-tête `Authorization: Bearer <jwt>`                            |
| Rôles            | `user` (par défaut, quand `User.role` est `NULL`) et `admin`                |
| Pagination       | `?page=1&limit=20` - `limit` max 100                                        |
| Tri              | `?sort=<champ>&order=ascoudesc`                                             |

Niveaux d'accès utilisés dans ce document :

| Accès  | Signification                      |
| ------ | ---------------------------------- |
| Public | Pas de JWT requis                  |
| User   | JWT valide requis                  |
| Admin  | JWT valide **et** `role = "admin"` |

---

## 2. Modèles de réponse

### 2.1 Enveloppes

**Ressource unique** : l'objet est renvoyé directement.

```json
{ "id": 1, "name": "Fil d'Ariane" }
```

**Liste paginée** :

```json
{
  "data": [{ "id": 1 }, { "id": 2 }],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

**Erreur** (tous les codes 4xx / 5xx) :

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Le champ mail est invalide.",
    "details": { "mail": "format invalide" }
  }
}
```

`details` est optionnel.

### 2.2 Codes HTTP

| Code | `error.code`        | Quand                                           |
| ---- | ------------------- | ----------------------------------------------- |
| 200  | -                   | Lecture ou mise à jour réussie                  |
| 201  | -                   | Création réussie                                |
| 204  | -                   | Suppression réussie (pas de corps)              |
| 400  | `VALIDATION_ERROR`  | Paramètre manquant ou mal formé                 |
| 401  | `UNAUTHORIZED`      | JWT absent, expiré ou invalide                  |
| 403  | `FORBIDDEN`         | Rôle insuffisant                                |
| 403  | `STEP_LOCKED`       | Étape précédente pas encore validée             |
| 404  | `NOT_FOUND`         | Ressource inexistante                           |
| 409  | `CONFLICT`          | Doublon (mail, username, token déjà utilisé...) |
| 413  | `PAYLOAD_TOO_LARGE` | Fichier trop gros (PDF > 10 Mo)                 |
| 415  | `UNSUPPORTED_MEDIA` | Type de fichier refusé (PDF attendu)            |
| 429  | `TOO_MANY_REQUESTS` | Rate limit (login, redeem de token)             |
| 500  | `INTERNAL_ERROR`    | Erreur serveur                                  |
| 502  | `SHEET_UNREACHABLE` | Service externe (Google Sheet) injoignable      |

### 2.3 Objets

Le mot de passe n'est **jamais** renvoyé.

**User**

```json
{
  "id": 1,
  "username": "theseus",
  "mail": "theseus@epitech.eu",
  "role": "user",
  "image": "https://cdn.example.com/avatars/1.png",
  "session": 12
}
```

**PublicUser** (profil vu par un autre utilisateur, sans `mail` ni `session`)

```json
{ "id": 1, "username": "theseus", "image": "https://.../1.png" }
```

**Subject** (`steps` présent seulement sur `GET /subjects/{id}`)

```json
{
  "id": 3,
  "slug": "fil-ariane",
  "name": "Fil d'Ariane",
  "langage": "python",
  "description": "Guidez Thésée hors du labyrinthe en déroulant le fil.",
  "difficulty": 2,
  "pdf_url": "/api/v1/subjects/3/pdf",
  "component": "fil-ariane",
  "published": true,
  "steps_count": 3,
  "steps": [{ "...": "Step" }],
  "created_at": "2026-10-01",
  "updated_at": "2026-10-12"
}
```

**Step** (`is_bonus` est calculé : vrai pour la dernière étape d'un sujet qui en a au moins deux)

```json
{
  "id": 12,
  "subject_id": 3,
  "position": 2,
  "is_bonus": false,
  "title": "Sortir du labyrinthe",
  "description": "Écrivez `solve(maze)` qui renvoie le chemin...",
  "starter_code": "def solve(maze):\n    return []\n",
  "before_code": "...",
  "after_code": "...",
  "expected": "Thésée est sorti !",
  "hints": ["Pensez au parcours en profondeur.", "..."],
  "created_at": "2026-10-01",
  "updated_at": "2026-10-12"
}
```

Pour un non-admin, `expected` est remplacé par `"has_expected": true` ou `false`.

**Success**

```json
{
  "id": 1,
  "name": "first-learning",
  "created_at": "2026-10-01",
  "updated_at": "2026-10-01"
}
```

**Theme**

```json
{
  "id": 2,
  "name": "aquarium",
  "created_at": "2026-10-01",
  "updated_at": "2026-10-01"
}
```

**Token**

```json
{ "id": 7, "token": 482913, "subject": 3, "theme": null }
```

**Planning**

```json
{
  "id": 5,
  "nom": "Coding Club - Découverte Python",
  "date": "2026-07-29",
  "campus": "Lyon"
}
```

**UserSubject** (ligne de `SubjectToUser`, sujet inclus)

```json
{
  "id": 10,
  "completed": true,
  "bonus": false,
  "steps_passed": 2,
  "steps_total": 3,
  "subject": {
    "id": 3,
    "slug": "fil-ariane",
    "name": "Fil d'Ariane",
    "langage": "python"
  }
}
```

**UserSubjectDetail** (`UserSubject` avec l'état de chaque étape)

```json
{
  "id": 10,
  "completed": true,
  "bonus": false,
  "steps_passed": 2,
  "steps_total": 3,
  "subject": {
    "id": 3,
    "slug": "fil-ariane",
    "name": "Fil d'Ariane",
    "langage": "python"
  },
  "steps": [
    { "id": 11, "position": 1, "is_bonus": false, "passed_at": "2026-10-20" },
    { "id": 12, "position": 2, "is_bonus": false, "passed_at": "2026-10-21" },
    { "id": 13, "position": 3, "is_bonus": true, "passed_at": null }
  ]
}
```

**UserSuccess** (ligne de `SuccessToUser`, succès inclus)

```json
{
  "id": 4,
  "obtained_at": "2026-10-20",
  "success": { "id": 1, "name": "first-learning" }
}
```

**UserTheme** (ligne de `ThemeToUser`, thème inclus)

```json
{ "id": 2, "theme": { "id": 2, "name": "aquarium" } }
```

---

## 3. Auth

### `POST /auth/register` - Public

Crée un compte et renvoie un JWT.

| Paramètre  | Où   | Type   | Requis | Description                        |
| ---------- | ---- | ------ | :----: | ---------------------------------- |
| `username` | body | string |   ✅   | 3–32 caractères, unique            |
| `mail`     | body | string |   ✅   | Adresse valide, unique             |
| `password` | body | string |   ✅   | 8 caractères min, stocké en bcrypt |

**201**

```json
{
  "access_token": "eyJhbGciOi...",
  "expires_in": 86400,
  "user": { "...": "User" }
}
```

Erreurs : `400`, `409` (mail ou username déjà pris).

### `POST /auth/login` - Public

| Paramètre  | Où   | Type   | Requis | Description              |
| ---------- | ---- | ------ | :----: | ------------------------ |
| `login`    | body | string |   ✅   | `mail` **ou** `username` |
| `password` | body | string |   ✅   |                          |

**200** : même format que `/auth/register`.

Erreurs : `400`, `401` (identifiants invalides), `429` (rate limit : 5 essais / minute / IP).

### `POST /auth/logout` - 🔒 User

Le JWT étant stateless, la route sert surtout au client (suppression du token local).

Aucun paramètre. **204**.

---

## 4. Users

### `GET /users/me` - 🔒 User

Renvoie l'utilisateur connecté. **200** : `User`.

### `PATCH /users/me` - 🔒 User

Tous les champs sont optionnels, au moins un est requis.

| Paramètre  | Où   | Type           | Requis | Description                      |
| ---------- | ---- | -------------- | :----: | -------------------------------- |
| `username` | body | string         |   ❌   | Unique                           |
| `mail`     | body | string         |   ❌   | Unique                           |
| `image`    | body | string ou null |   ❌   | Unique, `null` supprime l'avatar |

**200** : `User`. Erreurs : `400`, `409`.

### `PATCH /users/me/password` - 🔒 User

| Paramètre          | Où   | Type   | Requis | Description |
| ------------------ | ---- | ------ | :----: | ----------- |
| `current_password` | body | string |   ✅   |             |
| `new_password`     | body | string |   ✅   | 8 char min  |

**204**. Erreurs : `400`, `401` (mot de passe actuel faux).

### `DELETE /users/me` - 🔒 User

Supprime le compte et ses lignes dans `SubjectToUser`, `SuccessToUser` et `ThemeToUser` (cascade).

| Paramètre  | Où   | Type   | Requis | Description              |
| ---------- | ---- | ------ | :----: | ------------------------ |
| `password` | body | string |   ✅   | Confirmation de sécurité |

**204**. Erreurs : `401`.

### `GET /users/{id}` - 🔒 User

Profil public d'un utilisateur.

| Paramètre | Où   | Type    | Requis |
| --------- | ---- | ------- | :----: |
| `id`      | path | integer |   ✅   |

**200** : `PublicUser` (un admin reçoit `User`). Erreurs : `404`.

### `GET /users` - 🛡️ Admin

| Paramètre | Où    | Type    | Requis | Description                      |
| --------- | ----- | ------- | :----: | -------------------------------- |
| `page`    | query | integer |   ❌   | Défaut `1`                       |
| `limit`   | query | integer |   ❌   | Défaut `20`, max `100`           |
| `search`  | query | string  |   ❌   | Filtre sur `username` ou `mail`  |
| `role`    | query | string  |   ❌   | `user` ou `admin`                |
| `sort`    | query | string  |   ❌   | `id` ou `username` (défaut `id`) |
| `order`   | query | string  |   ❌   | `asc` ou `desc` (défaut `asc`)   |

**200** : liste paginée de `User`.

### `PATCH /users/{id}` - 🛡️ Admin

| Paramètre  | Où   | Type           | Requis | Description       |
| ---------- | ---- | -------------- | :----: | ----------------- |
| `id`       | path | integer        |   ✅   |                   |
| `role`     | body | string         |   ❌   | `user` ou `admin` |
| `username` | body | string         |   ❌   |                   |
| `image`    | body | string ou null |   ❌   |                   |

**200** : `User`. Erreurs : `400`, `404`, `409`.

### `DELETE /users/{id}` - 🛡️ Admin

**204**. Erreurs : `404`.

---

## 5. Subjects, étapes et progression

### 5.1 Sujets

#### `GET /subjects` - Public

Un visiteur ne voit que les sujets publiés. Un admin voit tout et peut filtrer avec `published`.

| Paramètre    | Où    | Type    | Requis | Description                                                  |
| ------------ | ----- | ------- | :----: | ------------------------------------------------------------ |
| `langage`    | query | string  |   ❌   | `python` ou `c` ou `html`                                    |
| `difficulty` | query | integer |   ❌   | `0` à `3`                                                    |
| `search`     | query | string  |   ❌   | Filtre sur `name` et `description`                           |
| `published`  | query | boolean |   ❌   | Admin uniquement                                             |
| `page`       | query | integer |   ❌   | Défaut `1`                                                   |
| `limit`      | query | integer |   ❌   | Défaut `20`, max `100`                                       |
| `sort`       | query | string  |   ❌   | `id` ou `name` ou `difficulty` ou `created_at` (défaut `id`) |
| `order`      | query | string  |   ❌   | `asc` ou `desc`                                              |

**200** : liste paginée de `Subject` (sans `steps`, avec `steps_count`).

#### `GET /subjects/{id}` - Public

| Paramètre | Où   | Type              | Requis | Description              |
| --------- | ---- | ----------------- | :----: | ------------------------ |
| `id`      | path | integer ou string |   ✅   | `id` numérique ou `slug` |

**200** : `Subject` avec ses `steps` triées par `position`. Pour un non-admin, `expected` est remplacé par `has_expected` (la sortie attendue reste secrète, la comparaison se fait côté serveur). Erreurs : `404` (inexistant, ou brouillon pour un non-admin).

#### `POST /subjects` - 🛡️ Admin

Crée le sujet, éventuellement avec ses étapes en une seule requête.

| Paramètre     | Où   | Type    | Requis | Description                                                           |
| ------------- | ---- | ------- | :----: | --------------------------------------------------------------------- |
| `name`        | body | string  |   ✅   | Nom affiché (`Fil d'Ariane`)                                          |
| `slug`        | body | string  |   ❌   | Unique, généré depuis `name` si absent                                |
| `langage`     | body | string  |   ✅   | `python` ou `c` ou `html`                                             |
| `description` | body | string  |   ❌   |                                                                       |
| `difficulty`  | body | integer |   ✅   | `0` à `3`                                                             |
| `component`   | body | string  |   ❌   | Clé d'un visualiseur existant du front                                |
| `published`   | body | boolean |   ❌   | Défaut `false`                                                        |
| `steps`       | body | array   |   ❌   | Liste de `Step` sans `id` ni `position` (l'ordre du tableau fait foi) |

Le PDF s'envoie ensuite avec `PUT /subjects/{id}/pdf`.

**201** : `Subject`. Erreurs : `400` (langage, difficulté ou `component` inconnus), `409` (`slug` déjà pris).

#### `PATCH /subjects/{id}` - 🛡️ Admin

Mêmes champs que `POST` sauf `steps`, tous optionnels.

**200** : `Subject`. Erreurs : `400`, `404`, `409` (`slug` déjà pris, ou `published: true` sur un sujet sans étape).

#### `DELETE /subjects/{id}` - 🛡️ Admin

Supprime le sujet, son PDF, ses étapes, les lignes `SubjectToUser` / `StepToUser` liées, et met à `NULL` les `Token.subject` qui pointent dessus. **204**. Erreurs : `404`.

### 5.2 PDF du sujet

#### `GET /subjects/{id}/pdf` - Public

Renvoie le fichier, utilisable directement dans `<object data="...">` de `Subject.jsx`.

**200** : `Content-Type: application/pdf`. Erreurs : `404` (sujet inexistant ou sans PDF).

#### `PUT /subjects/{id}/pdf` - 🛡️ Admin

Envoie ou remplace le PDF. Corps en `multipart/form-data`.

| Paramètre | Où        | Type | Requis | Description                      |
| --------- | --------- | ---- | :----: | -------------------------------- |
| `file`    | form-data | file |   ✅   | `application/pdf`, 10 Mo maximum |

**200**

```json
{
  "pdf_url": "/api/v1/subjects/3/pdf",
  "size": 284512,
  "updated_at": "2026-11-05"
}
```

Erreurs : `400`, `404`, `413` (fichier trop gros), `415` (pas un PDF).

#### `DELETE /subjects/{id}/pdf` - 🛡️ Admin

**204**. Erreurs : `404`.

### 5.3 Étapes

#### `GET /subjects/{id}/steps` - Public

**200** : liste de `Step` (non paginée) triée par `position`, avec les mêmes règles de masquage de `expected` que `GET /subjects/{id}`.

#### `POST /subjects/{id}/steps` - 🛡️ Admin

| Paramètre      | Où   | Type     | Requis | Description                                                     |
| -------------- | ---- | -------- | :----: | --------------------------------------------------------------- |
| `title`        | body | string   |   ✅   |                                                                 |
| `position`     | body | integer  |   ❌   | Insère à cette place et décale les suivantes. Défaut : à la fin |
| `description`  | body | string   |   ❌   | Markdown                                                        |
| `starter_code` | body | string   |   ❌   |                                                                 |
| `before_code`  | body | string   |   ❌   |                                                                 |
| `after_code`   | body | string   |   ❌   |                                                                 |
| `expected`     | body | string   |   ❌   | `NULL` = validation par le visualiseur du front                 |
| `hints`        | body | string[] |   ❌   |                                                                 |

Ajouter une étape à la fin change le bonus : la nouvelle étape devient le bonus et l'ancien bonus devient obligatoire. Le serveur recalcule `completed` / `bonus` de tous les utilisateurs du sujet dans la même transaction.

**201** : `Step`. Erreurs : `400`, `404`.

#### `PATCH /subjects/{id}/steps/{step_id}` - 🛡️ Admin

Mêmes champs que `POST` sauf `position`, tous optionnels. **200** : `Step`. Erreurs : `400`, `404`.

#### `PUT /subjects/{id}/steps/order` - 🛡️ Admin

Réordonne toutes les étapes du sujet.

| Paramètre | Où   | Type      | Requis | Description                                       |
| --------- | ---- | --------- | :----: | ------------------------------------------------- |
| `order`   | body | integer[] |   ✅   | Tous les `step_id` du sujet, dans le nouvel ordre |

**200** : liste de `Step` réordonnée. Recalcule `completed` / `bonus`. Erreurs : `400` (id manquant, en double ou d'un autre sujet), `404`.

#### `DELETE /subjects/{id}/steps/{step_id}` - 🛡️ Admin

Supprime l'étape et ses `StepToUser`, renumérote les suivantes et recalcule `completed` / `bonus`. Un sujet publié garde au moins une étape. **204**. Erreurs : `404`, `409` (dernière étape d'un sujet publié).

### 5.4 Progression

#### `GET /users/me/subjects` - 🔒 User

Sujets commencés par l'utilisateur connecté.

| Paramètre   | Où    | Type    | Requis | Description                    |
| ----------- | ----- | ------- | :----: | ------------------------------ |
| `completed` | query | boolean |   ❌   | Terminés ou en cours           |
| `bonus`     | query | boolean |   ❌   | Bonus obtenu ou non            |
| `langage`   | query | string  |   ❌   | Filtre sur le langage du sujet |
| `page`      | query | integer |   ❌   |                                |
| `limit`     | query | integer |   ❌   |                                |

**200** : liste paginée de `UserSubject`.

#### `GET /users/me/subjects/{subject_id}` - 🔒 User

Progression détaillée, étape par étape. **200** : `UserSubjectDetail`. Un sujet jamais commencé renvoie quand même l'objet, avec `steps_passed = 0`. Erreurs : `404` (sujet inexistant).

#### `POST /users/me/subjects/{subject_id}/steps/{step_id}/validate` - 🔒 User

Appelée par le front quand l'élève exécute son code sur une étape.

| Paramètre    | Où   | Type    | Requis | Description                                                 |
| ------------ | ---- | ------- | :----: | ----------------------------------------------------------- |
| `subject_id` | path | integer |   ✅   |                                                             |
| `step_id`    | path | integer |   ✅   |                                                             |
| `output`     | body | string  |   ❌   | Sortie de la console. **Requis** si l'étape a un `expected` |

Règles :

- les étapes se valident dans l'ordre : l'étape `n` exige que l'étape `n - 1` soit validée ;
- si l'étape a un `expected`, le serveur compare `output` après normalisation (`\r\n` → `\n`, espaces de fin de ligne retirés) ;
- si l'étape n'a pas d'`expected`, la réussite est déclarée par le visualiseur du front et acceptée telle quelle ;
- la première requête crée la ligne `SubjectToUser` ;
- revalider une étape déjà validée ne change rien et renvoie `passed: true`.

**200** (réussie ou non : un échec n'est pas une erreur HTTP)

```json
{
  "passed": true,
  "step": { "id": 12, "position": 2, "is_bonus": false },
  "progress": {
    "steps_passed": 2,
    "steps_total": 4,
    "completed": false,
    "bonus": false
  }
}
```

En cas d'échec, `passed` vaut `false` et `progress` est inchangé. La sortie attendue n'est jamais renvoyée.

Erreurs : `400` (`output` manquant), `403` (`STEP_LOCKED`, étape précédente non validée), `404` (sujet ou étape inexistants, ou étape d'un autre sujet).

#### `DELETE /users/me/subjects/{subject_id}` - 🔒 User

Remet le sujet à zéro : supprime la ligne `SubjectToUser` et les `StepToUser` du sujet. **204**. Erreurs : `404`.

#### `POST /users/me/subjects/import` - 🔒 User

Optionnel. Migre la progression stockée en `localStorage` vers le compte, à la première connexion. Les sujets inconnus sont ignorés et listés dans la réponse.

| Paramètre  | Où   | Type  | Requis | Description                                                                     |
| ---------- | ---- | ----- | :----: | ------------------------------------------------------------------------------- |
| `subjects` | body | array |   ✅   | `[{ "slug": "fil-ariane", "mark": "done" }, ...]`, `mark` vaut `done` ou `gold` |

`done` valide toutes les étapes sauf le bonus, `gold` les valide toutes.

**200**

```json
{ "imported": 3, "ignored": ["ancien-projet"] }
```

#### `GET /users/{id}/subjects` - 🛡️ Admin

Mêmes paramètres et réponse que `GET /users/me/subjects`, pour n'importe quel utilisateur.

#### `GET /users/{id}/subjects/{subject_id}` - 🛡️ Admin

Même réponse que `GET /users/me/subjects/{subject_id}`, pour n'importe quel utilisateur.

---

## 6. Successes (succès)

### `GET /successes` - Public

| Paramètre | Où    | Type    | Requis |
| --------- | ----- | ------- | :----: |
| `page`    | query | integer |   ❌   |
| `limit`   | query | integer |   ❌   |

**200** : liste paginée de `Success`.

### `GET /successes/{id}` - Public

**200** : `Success`. Erreurs : `404`.

### `POST /successes` - 🛡️ Admin

| Paramètre | Où   | Type   | Requis | Description |
| --------- | ---- | ------ | :----: | ----------- |
| `name`    | body | string |   ✅   | Unique      |

**201** : `Success`. Erreurs : `400`, `409`.

### `PATCH /successes/{id}` - 🛡️ Admin

| Paramètre | Où   | Type   | Requis | Description |
| --------- | ---- | ------ | :----: | ----------- |
| `name`    | body | string |   ✅   | Unique      |

**200** : `Success`. Erreurs : `400`, `404`, `409`.

### `DELETE /successes/{id}` - 🛡️ Admin

**204**. Erreurs : `404`.

### `GET /users/me/successes` - 🔒 User

**200** : liste paginée de `UserSuccess`, triée par `obtained_at` décroissant.

### `POST /users/me/successes` - 🔒 User

Débloque un succès pour l'utilisateur connecté. Idempotent : si le succès est déjà obtenu, renvoie la ligne existante en **200**.

| Paramètre    | Où   | Type    | Requis | Description                |
| ------------ | ---- | ------- | :----: | -------------------------- |
| `success_id` | body | integer |   ✅   | Ou `name` à la place       |
| `name`       | body | string  |   ❌   | Alternative à `success_id` |

**201** : `UserSuccess` (`obtained_at` = date du jour). Erreurs : `400`, `404`.

Les succès vérifiables côté serveur (nombre de sujets terminés) sont aussi attribués par le cron `recompute-successes`. Pour ceux-là, le serveur peut refuser un déblocage injustifié avec `403`.

### `GET /users/{id}/successes` - 🔒 User

Succès publics d'un autre utilisateur. **200** : liste paginée de `UserSuccess`.

---

## 7. Themes

### `GET /themes` - Public

| Paramètre | Où    | Type    | Requis | Description |
| --------- | ----- | ------- | :----: | ----------- |
| `page`    | query | integer |   ❌   |             |
| `limit`   | query | integer |   ❌   |             |

**200** : liste paginée de `Theme`.

### `GET /themes/{id}` - Public

**200** : `Theme`. Erreurs : `404`.

### `POST /themes` - 🛡️ Admin

| Paramètre | Où   | Type   | Requis | Description |
| --------- | ---- | ------ | :----: | ----------- |
| `name`    | body | string |   ✅   | Unique      |

**201** : `Theme`. Erreurs : `400`, `409`.

### `PATCH /themes/{id}` - 🛡️ Admin

| Paramètre | Où   | Type   | Requis | Description |
| --------- | ---- | ------ | :----: | ----------- |
| `name`    | body | string |   ✅   | Unique      |

**200** : `Theme`. Erreurs : `400`, `404`, `409`.

### `DELETE /themes/{id}` - 🛡️ Admin

Supprime aussi les lignes `ThemeToUser` et met à `NULL` les `Token.theme` qui pointent dessus. **204**. Erreurs : `404`.

### `GET /users/me/themes` - 🔒 User

Thèmes débloqués par l'utilisateur. **200** : liste de `UserTheme` (non paginée, la liste est courte).

### `POST /users/{id}/themes` - 🛡️ Admin

Donne un thème à un utilisateur sans passer par un token.

| Paramètre  | Où   | Type    | Requis | Description |
| ---------- | ---- | ------- | :----: | ----------- |
| `id`       | path | integer |   ✅   | Utilisateur |
| `theme_id` | body | integer |   ✅   |             |

**201** : `UserTheme`. Erreurs : `404`, `409` (déjà débloqué).

### `DELETE /users/{id}/themes/{theme_id}` - 🛡️ Admin

**204**. Erreurs : `404`.

---

## 8. Tokens (codes de déblocage)

### `POST /tokens/redeem` - 🔒 User

| Paramètre | Où   | Type    | Requis | Description       |
| --------- | ---- | ------- | :----: | ----------------- |
| `token`   | body | integer |   ✅   | Code à 6 chiffres |

Effets :

- si `Token.subject` est défini : crée la ligne `SubjectToUser` (`completed = false`, `bonus = false`) si elle n'existe pas ;
- si `Token.theme` est défini : insertion dans `ThemeToUser` (ignorée si déjà présent) ;
- `User.session` ← `Token.id`.

**200**

```json
{
  "token": { "id": 7, "token": 482913 },
  "unlocked": {
    "subject": {
      "id": 3,
      "slug": "fil-ariane",
      "name": "Fil d'Ariane",
      "langage": "python"
    },
    "theme": null
  }
}
```

Erreurs : `400`, `404` (code inconnu), `429` (rate limit : 10 essais / minute / utilisateur, pour empêcher le brute-force des codes).

### `GET /tokens` - 🛡️ Admin

| Paramètre | Où    | Type    | Requis | Description            |
| --------- | ----- | ------- | :----: | ---------------------- |
| `subject` | query | integer |   ❌   | Tokens liés à ce sujet |
| `theme`   | query | integer |   ❌   | Tokens liés à ce thème |
| `page`    | query | integer |   ❌   |                        |
| `limit`   | query | integer |   ❌   |                        |

**200** : liste paginée de `Token`.

### `GET /tokens/{id}` - 🛡️ Admin

**200** : `Token`, avec en plus `"users_count"` (nombre d'utilisateurs dont `session` pointe dessus). Erreurs : `404`.

### `POST /tokens` - 🛡️ Admin

Au moins un des deux champs `subject` / `theme` est requis.

| Paramètre | Où   | Type    | Requis | Description                                  |
| --------- | ---- | ------- | :----: | -------------------------------------------- |
| `token`   | body | integer |   ❌   | Code imposé ; généré aléatoirement si absent |
| `subject` | body | integer |   ❌   | Sujet à débloquer                            |
| `theme`   | body | integer |   ❌   | Thème à débloquer                            |

**201** : `Token`. Erreurs : `400`, `404` (sujet ou thème inconnu), `409` (code déjà existant).

### `PATCH /tokens/{id}` - 🛡️ Admin

Mêmes champs que `POST`, tous optionnels. **200** : `Token`. Erreurs : `400`, `404`, `409`.

### `DELETE /tokens/{id}` - 🛡️ Admin

Met à `NULL` le `session` des utilisateurs qui pointent dessus. **204**. Erreurs : `404`.

---

## 9. Planning (agenda)

### `GET /plannings` - Public

| Paramètre | Où    | Type    | Requis | Description                                    |
| --------- | ----- | ------- | :----: | ---------------------------------------------- |
| `campus`  | query | string  |   ❌   | Ex. `Lyon` (voir la liste `CAMPUSES` du front) |
| `from`    | query | date    |   ❌   | `YYYY-MM-DD`, inclus. Défaut : aujourd'hui     |
| `to`      | query | date    |   ❌   | `YYYY-MM-DD`, inclus                           |
| `page`    | query | integer |   ❌   |                                                |
| `limit`   | query | integer |   ❌   | Défaut `50`, max `200`                         |

**200** : liste paginée de `Planning`, triée par `date` croissante.

### `GET /plannings/campuses` - Public

Liste des campus qui ont au moins un événement à venir.

**200**

```json
{ "data": ["Bordeaux", "Lyon", "Paris"] }
```

### `GET /plannings/{id}` - Public

**200** : `Planning`. Erreurs : `404`.

### `POST /plannings` - 🛡️ Admin

| Paramètre | Où   | Type   | Requis | Description  |
| --------- | ---- | ------ | :----: | ------------ |
| `nom`     | body | string |   ✅   |              |
| `date`    | body | date   |   ✅   | `YYYY-MM-DD` |
| `campus`  | body | string |   ✅   |              |

**201** : `Planning`. Erreurs : `400`.

### `PATCH /plannings/{id}` - 🛡️ Admin

Mêmes champs que `POST`, tous optionnels. **200** : `Planning`. Erreurs : `400`, `404`.

### `DELETE /plannings/{id}` - 🛡️ Admin

**204**. Erreurs : `404`.

### `POST /plannings/sync` - 🛡️ Admin

Lance tout de suite le cron `sync-planning` sans attendre sa prochaine exécution.

Aucun paramètre. **200**

```json
{ "created": 3, "updated": 1, "deleted": 0, "duration_ms": 412 }
```

Erreurs : `502` (`SHEET_UNREACHABLE`, Google Sheet injoignable).

---

## 12. Récapitulatif des routes

| Méthode | Route                                                      | Accès    |
| ------- | ---------------------------------------------------------- | -------- |
| POST    | `/auth/register`                                           | Public   |
| POST    | `/auth/login`                                              | Public   |
| POST    | `/auth/logout`                                             | 🔒 User  |
| GET     | `/users/me`                                                | 🔒 User  |
| PATCH   | `/users/me`                                                | 🔒 User  |
| PATCH   | `/users/me/password`                                       | 🔒 User  |
| DELETE  | `/users/me`                                                | 🔒 User  |
| GET     | `/users`                                                   | 🛡️ Admin |
| GET     | `/users/{id}`                                              | 🔒 User  |
| PATCH   | `/users/{id}`                                              | 🛡️ Admin |
| DELETE  | `/users/{id}`                                              | 🛡️ Admin |
| GET     | `/subjects`                                                | Public   |
| GET     | `/subjects/{id}`                                           | Public   |
| POST    | `/subjects`                                                | 🛡️ Admin |
| PATCH   | `/subjects/{id}`                                           | 🛡️ Admin |
| DELETE  | `/subjects/{id}`                                           | 🛡️ Admin |
| GET     | `/subjects/{id}/pdf`                                       | Public   |
| PUT     | `/subjects/{id}/pdf`                                       | 🛡️ Admin |
| DELETE  | `/subjects/{id}/pdf`                                       | 🛡️ Admin |
| GET     | `/subjects/{id}/steps`                                     | Public   |
| POST    | `/subjects/{id}/steps`                                     | 🛡️ Admin |
| PATCH   | `/subjects/{id}/steps/{step_id}`                           | 🛡️ Admin |
| PUT     | `/subjects/{id}/steps/order`                               | 🛡️ Admin |
| DELETE  | `/subjects/{id}/steps/{step_id}`                           | 🛡️ Admin |
| GET     | `/users/me/subjects`                                       | 🔒 User  |
| GET     | `/users/me/subjects/{subject_id}`                          | 🔒 User  |
| POST    | `/users/me/subjects/{subject_id}/steps/{step_id}/validate` | 🔒 User  |
| DELETE  | `/users/me/subjects/{subject_id}`                          | 🔒 User  |
| POST    | `/users/me/subjects/import`                                | 🔒 User  |
| GET     | `/users/{id}/subjects`                                     | 🛡️ Admin |
| GET     | `/users/{id}/subjects/{subject_id}`                        | 🛡️ Admin |
| GET     | `/successes`                                               | Public   |
| GET     | `/successes/{id}`                                          | Public   |
| POST    | `/successes`                                               | 🛡️ Admin |
| PATCH   | `/successes/{id}`                                          | 🛡️ Admin |
| DELETE  | `/successes/{id}`                                          | 🛡️ Admin |
| GET     | `/users/me/successes`                                      | 🔒 User  |
| POST    | `/users/me/successes`                                      | 🔒 User  |
| GET     | `/users/{id}/successes`                                    | 🔒 User  |
| GET     | `/themes`                                                  | Public   |
| GET     | `/themes/{id}`                                             | Public   |
| POST    | `/themes`                                                  | 🛡️ Admin |
| PATCH   | `/themes/{id}`                                             | 🛡️ Admin |
| DELETE  | `/themes/{id}`                                             | 🛡️ Admin |
| GET     | `/users/me/themes`                                         | 🔒 User  |
| POST    | `/users/{id}/themes`                                       | 🛡️ Admin |
| DELETE  | `/users/{id}/themes/{theme_id}`                            | 🛡️ Admin |
| POST    | `/tokens/redeem`                                           | 🔒 User  |
| GET     | `/tokens`                                                  | 🛡️ Admin |
| GET     | `/tokens/{id}`                                             | 🛡️ Admin |
| POST    | `/tokens`                                                  | 🛡️ Admin |
| PATCH   | `/tokens/{id}`                                             | 🛡️ Admin |
| DELETE  | `/tokens/{id}`                                             | 🛡️ Admin |
| GET     | `/plannings`                                               | Public   |
| GET     | `/plannings/campuses`                                      | Public   |
| GET     | `/plannings/{id}`                                          | Public   |
| POST    | `/plannings`                                               | 🛡️ Admin |
| PATCH   | `/plannings/{id}`                                          | 🛡️ Admin |
| DELETE  | `/plannings/{id}`                                          | 🛡️ Admin |
| POST    | `/plannings/sync`                                          | 🛡️ Admin |
