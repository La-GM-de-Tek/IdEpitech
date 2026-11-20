# Sujet : Feu Tricolore

## I. Introduction

Panique à la mairie : le boîtier qui commande les feux du grand carrefour a grillé pendant l'orage. Les voitures klaxonnent, les piétons n'osent plus traverser, et le maire vous a appelé en urgence.

Le nouveau boîtier est livré... **vide**. Il sait allumer et éteindre chaque lumière, mais personne ne lui a appris **quand** le faire. C'est votre mission.

> Le but du projet est de programmer, en Python, des feux tricolores qui font passer tout le monde sans le moindre accident.

Le projet est découpé en **5 niveaux**, du plus simple au plus corsé. Comptez environ deux heures pour tout faire.

## II. Le boîtier de commande

### Choisir un niveau

Votre programme doit toujours commencer par choisir le niveau :

```py
load_level(1)    # de 1 à 5
```

### Allumer et éteindre les lumières

Chaque feu a un **nom** (affiché au-dessus de lui dans la vue 3D). Chaque lumière s'allume et s'éteint séparément :

| fonction               | effet                    |
| ---------------------- | ------------------------ |
| `turn_on_green(feu)`   | allume la lumière verte  |
| `turn_off_green(feu)`  | éteint la lumière verte  |
| `turn_on_yellow(feu)`  | allume la lumière orange |
| `turn_off_yellow(feu)` | éteint la lumière orange |
| `turn_on_red(feu)`     | allume la lumière rouge  |
| `turn_off_red(feu)`    | éteint la lumière rouge  |

Quand le niveau ne contient qu'un seul feu, vous pouvez oublier le nom : `turn_on_green()` suffit.

### Faire passer le temps

Allumer une lumière ne prend aucun temps. Pour laisser les voitures avancer, il faut **attendre** :

```py
wait(3)      # attend 3 secondes
wait(0.5)    # attend une demi-seconde
```

Le temps de la simulation n'avance **que** pendant les `wait(...)`.

### Les capteurs

Des capteurs sont installés sous la route et sur les trottoirs. Ils vous renvoient des nombres :

| fonction                   | ce qu'elle vous rend                                           |
| -------------------------- | -------------------------------------------------------------- |
| `cars_passed(feu)`         | le nombre de voitures qui ont déjà franchi ce feu              |
| `cars_waiting(feu)`        | le nombre de voitures qui arrivent ou attendent devant ce feu  |
| `cars_left()`              | le nombre de voitures qui ne sont pas encore sorties du niveau |
| `pedestrians_waiting(feu)` | le nombre de piétons qui attendent au bord de ce passage       |
| `pedestrians_left()`       | le nombre de piétons qui n'ont pas encore traversé             |
| `get_time()`               | le temps écoulé depuis le début, en secondes                   |

Par exemple, pour attendre que 2 voitures soient passées :

```py
while cars_passed() < 2:
    wait(0.1)
```

## III. Le code de la route

Les conducteurs et les piétons sont disciplinés : ils respectent **toujours** les feux. Mais ils comptent sur vous pour que les feux soient corrects. La simulation s'arrête net si :

- un feu affiche **deux couleurs en même temps** (pensez à éteindre l'ancienne lumière avant d'allumer la nouvelle) ;
- un feu passe du **vert au rouge sans passer par l'orange** ;
- l'orange reste allumé **moins de 2 secondes** avant le rouge ;
- deux voitures se percutent, ou une voiture renverse un piéton : **accident !**

Quelques détails à connaître :

- Une voiture qui voit le feu passer à l'orange s'arrête si elle en a la place. Si elle est trop près, elle passe quand même.
- Un feu éteint, pour un conducteur, c'est comme un feu rouge : il s'arrête par prudence.
- Les feux piétons n'ont que deux lumières : rouge et verte (pas d'orange !).
- Un piéton qui a commencé à traverser va **toujours** jusqu'au bout, même si son feu repasse au rouge. Traverser lui prend environ 6 secondes.

Quand votre programme se termine, la simulation continue encore un peu avec les feux dans leur dernier état, puis le verdict tombe.

## IV. Les niveaux

### Niveau 1 : Un seul feu

Une route, un feu (`"ouest"`), cinq voitures numérotées. Laissez passer les **4 premières**, mais **pas la 5e** : elle doit finir arrêtée devant le feu **rouge**.

```py
load_level(1)

turn_on_green()
wait(5)
```

Commencez par ce code et regardez ce qui se passe, puis complétez-le.

> Essayez d'abord avec des `wait(...)` bien choisis, puis refaites-le avec le capteur `cars_passed()`.

### Niveau 2 : Le carrefour

Deux routes se croisent, chacune avec son feu : `"ouest"` (voitures venant de l'ouest) et `"sud"` (voitures venant du sud). Faites passer **toutes les voitures** sans accident.

Le même enchaînement vert → orange → rouge revient sans arrêt : c'est le moment d'écrire **une fonction** qui fait passer un feu au rouge, et de l'appeler pour chacun des deux feux dans une boucle.

### Niveau 3 : Les piétons

Retour à une seule route, mais avec un passage piéton et son feu, `"pieton_ouest"`. Faites passer **toutes les voitures et tous les piétons** sans accident.

### Niveau 4 : Le grand carrefour

Tout à la fois : deux routes, deux feux voitures (`"ouest"`, `"sud"`) et deux passages piétons (`"pieton_ouest"` et `"pieton_sud"`). Faites passer tout le monde sans accident.

> Indice : un piéton du passage `"pieton_sud"` traverse la route **sud**. Il ne gêne donc pas du tout les voitures qui viennent de l'ouest...

Réussir ce niveau valide le projet.

### Niveau 5 (bonus) : L'heure de pointe

Même carrefour, mais c'est l'heure de pointe : bien plus de monde. Faites passer tout le monde sans accident, **le plus vite possible**. Le chrono s'arrête quand la dernière voiture et le dernier piéton sont sortis.

Passez sous **66 secondes** pour décrocher la **marque dorée**. Un cycle de feux fixe ne suffira pas : servez-vous des capteurs pour ne donner le vert qu'à ceux qui attendent vraiment.

## V. Pour aller plus loin

- Le carrefour n'a plus de secret pour vous ? Essayez de battre votre propre record au niveau 5.
- Comparez vos solutions avec celles de vos voisins : qui a le programme le plus court ? le plus rapide ?

> Si vous êtes curieux, allez demander aux Mantas comment fonctionnent les vrais feux de votre ville. Certains sont bien plus malins qu'on ne le croit !
