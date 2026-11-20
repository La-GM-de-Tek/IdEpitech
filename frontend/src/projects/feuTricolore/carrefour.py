import json as _json
import math as _math


class FinDeSimulation(BaseException):
    pass


_DT = 0.1
_VMAX = 10.0
_ACCEL = 3.0
_BRAKE = 4.5
_COMMIT_BRAKE = 4.0
_CAR_LEN = 4.2
_CAR_WID = 1.8
_GAP = 2.0
_LANE = 1.75
_STOP = 7.5
_APPROACH = 70.0
_EXIT = 45.0
_PED_SPEED = 1.4
_PED_R = 0.35
_CURB = 4.1
_PED_WALK = 6.0
_YELLOW_MIN = 2.0
_RUNOUT = 30.0
_IDLE_CALLS = 20000

_CROSSINGS = {
    "pieton_ouest": {"road": "ouest", "center": -5.5, "away": -1},
    "pieton_sud": {"road": "sud", "center": 5.5, "away": 1},
}


def _spread(start, gaps):
    times = [start]
    for gap in gaps:
        times.append(round(times[-1] + gap, 1))
    return times


_LEVELS = {
    1: {
        "title": "Un seul feu",
        "roads": ["ouest"],
        "crossings": [],
        "cars": {"ouest": _spread(1, [3, 3, 3, 3])},
        "peds": [],
        "limit": 60,
    },
    2: {
        "title": "Le carrefour",
        "roads": ["ouest", "sud"],
        "crossings": [],
        "cars": {
            "ouest": _spread(1, [2.5, 2.5, 2.5, 6, 2.5, 2.5]),
            "sud": _spread(1.4, [3, 3, 3, 5, 3]),
        },
        "peds": [],
        "limit": 120,
    },
    3: {
        "title": "Les piétons",
        "roads": ["ouest"],
        "crossings": ["pieton_ouest"],
        "cars": {"ouest": _spread(1, [3, 3, 4, 3, 6, 3, 3])},
        "peds": [
            (4, "pieton_ouest", 1),
            (6, "pieton_ouest", -1),
            (16, "pieton_ouest", 1),
            (27, "pieton_ouest", -1),
            (29, "pieton_ouest", 1),
        ],
        "limit": 120,
    },
    4: {
        "title": "Le grand carrefour",
        "roads": ["ouest", "sud"],
        "crossings": ["pieton_ouest", "pieton_sud"],
        "cars": {
            "ouest": _spread(1, [3, 3, 8, 3, 3]),
            "sud": _spread(1.4, [3, 3, 7, 3, 3]),
        },
        "peds": [
            (5, "pieton_ouest", 1),
            (8, "pieton_sud", -1),
            (14, "pieton_ouest", -1),
            (19, "pieton_sud", 1),
            (26, "pieton_ouest", 1),
            (30, "pieton_sud", -1),
            (34, "pieton_ouest", -1),
            (37, "pieton_sud", 1),
        ],
        "limit": 180,
    },
    5: {
        "title": "L'heure de pointe",
        "roads": ["ouest", "sud"],
        "crossings": ["pieton_ouest", "pieton_sud"],
        "cars": {
            "ouest": _spread(1, [2, 2, 2, 2, 7, 2.5, 2.5, 2, 9, 2, 2, 2, 2]),
            "sud": _spread(1.4, [3, 3, 8, 2.5, 2.5, 2.5, 10, 3, 3]),
        },
        "peds": [
            (3, "pieton_ouest", 1),
            (6, "pieton_sud", -1),
            (10, "pieton_ouest", -1),
            (12, "pieton_sud", 1),
            (18, "pieton_ouest", 1),
            (22, "pieton_sud", -1),
            (27, "pieton_ouest", -1),
            (29, "pieton_ouest", 1),
            (33, "pieton_sud", 1),
            (36, "pieton_sud", -1),
            (38, "pieton_ouest", 1),
            (40, "pieton_sud", 1),
        ],
        "limit": 240,
        "gold": 66,
    },
}


class _Light:
    def __init__(self, name, kind):
        self.name = name
        self.kind = kind
        self.lamps = {"red": False, "yellow": False, "green": False}
        self.display = "off"
        self.seg_start = 0.0
        self.last_lit = None
        self.recorded = ""
        self.events = [[0.0, ""]]

    def code(self):
        return "".join(c[0] for c in ("red", "yellow", "green") if self.lamps[c])


class _Car:
    def __init__(self, ident, road, frame):
        self.id = ident
        self.road = road
        self.frame = frame
        self.s = 0.0
        self.v = _VMAX
        self.passed = False
        self.done = False
        self.going = False
        self.committed = False
        self.still = 0.0
        self.track = []

    def box(self):
        if self.road == "ouest":
            front = self.s - _STOP - _APPROACH
            return (front - _CAR_LEN, front, _LANE - _CAR_WID / 2, _LANE + _CAR_WID / 2)
        front = _STOP + _APPROACH - self.s
        return (_LANE - _CAR_WID / 2, _LANE + _CAR_WID / 2, front, front + _CAR_LEN)


class _Ped:
    def __init__(self, ident, crossing, side, slot, frame):
        info = _CROSSINGS[crossing]
        self.id = ident
        self.crossing = crossing
        self.frame = frame
        self.u = side * _CURB
        self.w_wait = (slot % 3 - 1) * 0.8
        self.w_far = self.w_wait + info["away"] * _PED_WALK
        self.w = self.w_far
        self.state = "approach"
        self.done = False
        self.track = []

    def pos(self):
        info = _CROSSINGS[self.crossing]
        if info["road"] == "ouest":
            return (info["center"] + self.w, self.u)
        return (self.u, info["center"] + self.w)


def _step_towards(value, target, amount):
    if abs(target - value) <= amount:
        return target, True
    return value + amount * (1 if target > value else -1), False


class _Sim:
    def __init__(self, number):
        cfg = _LEVELS[number]
        self.level = number
        self.cfg = cfg
        self.t = 0.0
        self.tick = 0
        self.lights = {}
        for road in cfg["roads"]:
            self.lights[road] = _Light(road, "car")
        for crossing in cfg["crossings"]:
            self.lights[crossing] = _Light(crossing, "ped")
        self.pending_cars = sorted(
            (t, road) for road, times in cfg["cars"].items() for t in times
        )
        self.pending_peds = sorted(cfg["peds"])
        self.total_cars = len(self.pending_cars)
        self.total_peds = len(self.pending_peds)
        self.cars = []
        self.peds = []
        self.slots = {}
        self.passed = {road: 0 for road in cfg["roads"]}
        self.last_done = 0.0
        self.idle = 0.0
        self.incident = None
        self.result = None
        self.ended = False
        self.emitted = False
        self.calls = 0

    def spawned_cars(self, road):
        return [c for c in self.cars if c.road == road]

    def must_stop(self, car):
        if car.passed:
            return False
        light = self.lights[car.road]
        if light.display == "green":
            car.going = True
            car.committed = False
            return False
        if car.going:
            car.going = False
            dist = _APPROACH - car.s
            car.committed = dist < car.v * car.v / (2 * _COMMIT_BRAKE) + 0.5
        return not car.committed

    def update_lights(self):
        for light in self.lights.values():
            code = light.code()
            if code != light.recorded:
                light.events.append([round(self.t, 1), code])
                light.recorded = code
            if len(code) > 1:
                names = {"r": "rouge", "y": "orange", "g": "vert"}
                colors = " et ".join(names[c] for c in code)
                self.fail_incident(
                    "panne",
                    f"Le feu « {light.name} » affiche plusieurs couleurs en même temps ({colors}) : les conducteurs ne savent plus quoi faire !",
                    light=light.name,
                )
                return
            display = {"r": "red", "y": "yellow", "g": "green", "": "off"}[code]
            if display == light.display:
                continue
            ended = (light.display, round(self.t - light.seg_start, 1))
            if light.display != "off":
                light.last_lit = ended
            if light.kind == "car" and display == "red":
                before = light.last_lit
                if before and before[0] == "green":
                    self.fail_incident(
                        "orange",
                        f"Le feu « {light.name} » est passé du vert au rouge sans passer par l'orange : les voitures n'ont pas eu le temps de freiner.",
                        light=light.name,
                    )
                    return
                if before and before[0] == "yellow" and before[1] < _YELLOW_MIN - 1e-6:
                    self.fail_incident(
                        "orange",
                        f"Le feu « {light.name} » n'est resté que {before[1]:g} s à l'orange : il faut au moins {_YELLOW_MIN:g} s pour que les voitures puissent freiner.",
                        light=light.name,
                    )
                    return
            light.display = display
            light.seg_start = self.t

    def spawn(self):
        frame = self.tick + 1
        while self.pending_cars and self.pending_cars[0][0] <= self.t + 1e-6:
            road = self.pending_cars[0][1]
            same = self.spawned_cars(road)
            if same and not same[-1].done and same[-1].s < _CAR_LEN + _GAP:
                break
            self.pending_cars.pop(0)
            car = _Car(len(self.cars), road, frame)
            if same and not same[-1].done:
                car.v = min(_VMAX, same[-1].v)
            self.cars.append(car)
        while self.pending_peds and self.pending_peds[0][0] <= self.t + 1e-6:
            _, crossing, side = self.pending_peds.pop(0)
            slot = self.slots.get(crossing, 0)
            self.slots[crossing] = slot + 1
            self.peds.append(_Ped(len(self.peds), crossing, side, slot, frame))

    def move(self):
        end = _APPROACH + _STOP + _EXIT
        for road in self.cfg["roads"]:
            ahead = None
            for car in self.spawned_cars(road):
                if car.done:
                    continue
                target = _math.inf
                if self.must_stop(car):
                    target = _APPROACH - 0.3
                if ahead is not None:
                    target = min(target, ahead.s - _CAR_LEN - _GAP)
                dist = target - car.s
                if dist <= 0:
                    v = 0.0
                else:
                    v = min(_VMAX, car.v + _ACCEL * _DT, _math.sqrt(2 * _BRAKE * dist))
                car.v = max(0.0, v)
                car.s = min(car.s + car.v * _DT, max(car.s, target))
                car.still = car.still + _DT if car.v < 0.05 else 0.0
                if not car.passed and car.s >= _APPROACH:
                    car.passed = True
                    self.passed[road] += 1
                if car.s >= end:
                    car.done = True
                    self.last_done = self.t + _DT
                ahead = car
        step = _PED_SPEED * _DT
        for ped in self.peds:
            if ped.done:
                continue
            if ped.state == "approach":
                ped.w, arrived = _step_towards(ped.w, ped.w_wait, step)
                if arrived:
                    ped.state = "waiting"
            elif ped.state == "waiting":
                if self.lights[ped.crossing].display == "green":
                    ped.state = "crossing"
                    ped.u_target = -ped.u
            elif ped.state == "crossing":
                ped.u, arrived = _step_towards(ped.u, ped.u_target, step)
                if arrived:
                    ped.state = "leaving"
            elif ped.state == "leaving":
                ped.w, arrived = _step_towards(ped.w, ped.w_far, step)
                if arrived:
                    ped.done = True
                    self.last_done = self.t + _DT

    def collisions(self):
        active = [c for c in self.cars if not c.done]
        boxes = [(c, c.box()) for c in active]
        for i, (a, ba) in enumerate(boxes):
            for b, bb in boxes[i + 1 :]:
                if a.road == b.road:
                    continue
                if ba[0] < bb[1] and bb[0] < ba[1] and ba[2] < bb[3] and bb[2] < ba[3]:
                    x = (max(ba[0], bb[0]) + min(ba[1], bb[1])) / 2
                    z = (max(ba[2], bb[2]) + min(ba[3], bb[3])) / 2
                    self.fail_incident(
                        "accident",
                        "Accident ! Deux voitures, une venant de l'ouest et l'autre du sud, se sont percutées au milieu du carrefour.",
                        cars=[a.id, b.id],
                        at=(x, z),
                    )
                    return
        for ped in self.peds:
            if ped.done or ped.state != "crossing":
                continue
            x, z = ped.pos()
            for car, box in boxes:
                if (
                    box[0] - _PED_R < x < box[1] + _PED_R
                    and box[2] - _PED_R < z < box[3] + _PED_R
                ):
                    self.fail_incident(
                        "accident",
                        f"Accident ! Une voiture a renversé un piéton sur le passage « {ped.crossing} ».",
                        cars=[car.id],
                        peds=[ped.id],
                        at=(x, z),
                    )
                    return

    def record(self):
        for car in self.cars:
            if not car.done:
                car.track.append(round(car.s, 2))
        for ped in self.peds:
            if not ped.done:
                x, z = ped.pos()
                ped.track.extend((round(x, 2), round(z, 2)))

    def step(self):
        self.update_lights()
        if self.ended:
            return
        self.spawn()
        self.move()
        self.t = round(self.t + _DT, 1)
        self.tick += 1
        self.collisions()
        self.record()
        moving = any(not c.done and c.still < 1 for c in self.cars) or any(
            not p.done and p.state not in ("waiting",) for p in self.peds
        )
        self.idle = (
            0.0 if moving or self.pending_cars or self.pending_peds else self.idle + _DT
        )

    def fail_incident(self, kind, message, light=None, cars=(), peds=(), at=None):
        if self.ended:
            return
        self.incident = {
            "t": round(self.t, 1),
            "kind": kind,
            "msg": message,
            "light": light,
            "cars": list(cars),
            "peds": list(peds),
            "at": [round(at[0], 2), round(at[1], 2)] if at else None,
        }
        self.finish()

    def left_cars(self):
        return len(self.pending_cars) + sum(1 for c in self.cars if not c.done)

    def left_peds(self):
        return len(self.pending_peds) + sum(1 for p in self.peds if not p.done)

    def evaluate(self):
        if self.incident:
            return {"ok": False, "msg": self.incident["msg"]}
        if self.level == 1:
            passed = self.passed["ouest"]
            light = self.lights["ouest"]
            if passed >= 5:
                return {
                    "ok": False,
                    "msg": "La 5e voiture est passée : elle aurait dû s'arrêter au feu rouge.",
                }
            if passed < 4:
                return {
                    "ok": False,
                    "msg": f"Seulement {passed} voiture{'s' if passed > 1 else ''} sur 4 {'sont passées' if passed > 1 else 'est passée'} : laisse passer les 4 premières.",
                }
            if light.display != "red":
                return {
                    "ok": False,
                    "msg": "La 5e voiture s'est bien arrêtée, mais le feu n'est pas au rouge à la fin.",
                }
            return {
                "ok": True,
                "msg": "Bravo ! Les 4 premières voitures sont passées et la 5e attend sagement au rouge.",
            }
        cars, peds = self.left_cars(), self.left_peds()
        if cars or peds:
            parts = []
            if cars:
                parts.append(f"{cars} voiture{'s' if cars > 1 else ''}")
            if peds:
                parts.append(f"{peds} piéton{'s' if peds > 1 else ''}")
            reason = (
                "Temps écoulé"
                if self.t >= self.cfg["limit"] - 1e-6
                else "Ton programme s'est arrêté trop tôt"
            )
            return {
                "ok": False,
                "msg": f"{reason} : il reste encore {' et '.join(parts)} à faire passer.",
            }
        score = round(self.last_done, 1)
        result = {"ok": True, "score": score}
        target = self.cfg.get("gold")
        if target is not None:
            result["gold"] = score <= target
            result["target"] = target
            result["msg"] = (
                f"Heure de pointe maîtrisée en {score:g} s, sous l'objectif de {target} s : marque dorée !"
                if result["gold"]
                else f"Tout le monde est passé en {score:g} s sans accident. Objectif doré : {target} s, tu peux encore optimiser !"
            )
        else:
            result["msg"] = (
                f"Tout le monde est passé en {score:g} s sans le moindre accident."
            )
        return result

    def finish(self):
        if self.ended:
            return
        self.ended = True
        self.result = self.evaluate()

    def run_until(self, target):
        while not self.ended and self.t < target - 1e-6:
            if self.t >= self.cfg["limit"] - 1e-6:
                self.finish()
                break
            self.step()
        if not self.ended and self.t >= self.cfg["limit"] - 1e-6:
            self.finish()

    def runout(self):
        stop = min(self.cfg["limit"], self.t + _RUNOUT)
        while not self.ended and self.t < stop - 1e-6:
            if not self.left_cars() and not self.left_peds():
                break
            if self.idle >= 2:
                break
            self.step()
        self.finish()

    def emit(self):
        if self.emitted:
            return
        self.emitted = True
        data = {
            "level": self.level,
            "title": self.cfg["title"],
            "dt": _DT,
            "frames": self.tick + 1,
            "end": round(self.t, 1),
            "limit": self.cfg["limit"],
            "lights": [
                {"name": l.name, "kind": l.kind, "events": l.events}
                for l in self.lights.values()
            ],
            "cars": [
                {"road": c.road, "frame": c.frame, "s": c.track} for c in self.cars
            ],
            "peds": [
                {"crossing": p.crossing, "frame": p.frame, "p": p.track}
                for p in self.peds
            ],
            "total": {"cars": self.total_cars, "peds": self.total_peds},
            "incident": self.incident,
            "result": self.result,
        }
        print("__FEU__" + _json.dumps(data, separators=(",", ":"), ensure_ascii=False))


_feu = {"sim": None}


def _sim():
    sim = _feu["sim"]
    if sim is None:
        raise RuntimeError("Choisis d'abord un niveau avec load_level(1) (de 1 à 5).")
    sim.calls += 1
    if sim.calls > _IDLE_CALLS:
        raise RuntimeError(
            "Ta boucle tourne sans jamais appeler wait() : le temps n'avance pas ! Ajoute un wait(...) dans ta boucle."
        )
    return sim


def _name(value):
    return (
        str(value).strip().lower().replace("é", "e").replace("è", "e").replace(" ", "_")
    )


def _pick(name, kind, func):
    sim = _sim()
    pool = [l for l in sim.lights.values() if kind is None or l.kind == kind]
    if name is None:
        if len(pool) == 1:
            return pool[0]
        names = ", ".join(f'"{l.name}"' for l in pool)
        raise ValueError(
            f'Il y a plusieurs feux dans ce niveau : précise lequel, par exemple {func}("{pool[0].name}"). Feux disponibles : {names}.'
        )
    key = _name(name)
    if key in sim.lights:
        light = sim.lights[key]
        if kind is not None and light.kind != kind:
            label = (
                "un feu piéton" if light.kind == "ped" else "un feu pour les voitures"
            )
            raise ValueError(
                f'"{light.name}" est {label} : {func}() ne marche pas avec lui.'
            )
        return light
    names = ", ".join(f'"{l.name}"' for l in sim.lights.values())
    raise ValueError(
        f'Le feu "{name}" n\'existe pas dans ce niveau. Feux disponibles : {names}.'
    )


def _lamp(name, color, on, func):
    light = _pick(name, None, func)
    if color == "yellow" and light.kind == "ped":
        raise ValueError(
            f'"{light.name}" est un feu piéton : il n\'a pas de lumière orange, seulement rouge et verte.'
        )
    light.lamps[color] = on


def load_level(number):
    if _feu["sim"] is not None:
        raise RuntimeError(
            "load_level() ne peut être appelé qu'une seule fois, au début du programme."
        )
    if number not in _LEVELS:
        raise ValueError(
            "Le niveau doit être un nombre entre 1 et 5, par exemple load_level(1)."
        )
    _feu["sim"] = _Sim(number)
    _feu["sim"].record()


def turn_on_green(light=None):
    _lamp(light, "green", True, "turn_on_green")


def turn_off_green(light=None):
    _lamp(light, "green", False, "turn_off_green")


def turn_on_yellow(light=None):
    _lamp(light, "yellow", True, "turn_on_yellow")


def turn_off_yellow(light=None):
    _lamp(light, "yellow", False, "turn_off_yellow")


def turn_on_red(light=None):
    _lamp(light, "red", True, "turn_on_red")


def turn_off_red(light=None):
    _lamp(light, "red", False, "turn_off_red")


def wait(seconds):
    sim = _sim()
    if not isinstance(seconds, (int, float)) or isinstance(seconds, bool):
        raise TypeError(
            "wait() attend un nombre de secondes, par exemple wait(2) ou wait(0.5)."
        )
    if seconds < 0:
        raise ValueError("wait() ne peut pas attendre un temps négatif.")
    if sim.ended:
        sim.emit()
        raise FinDeSimulation("La simulation est terminée.")
    sim.calls = 0
    sim.run_until(round(sim.t + seconds, 1) if seconds >= _DT / 2 else sim.t + _DT)
    if sim.ended:
        sim.emit()
        raise FinDeSimulation("La simulation est terminée.")


def get_time():
    return _sim().t


def cars_waiting(light=None):
    sim = _sim()
    road = _pick(light, "car", "cars_waiting").name
    return sum(1 for c in sim.cars if c.road == road and not c.passed)


def cars_passed(light=None):
    sim = _sim()
    return sim.passed[_pick(light, "car", "cars_passed").name]


def cars_left():
    return _sim().left_cars()


def pedestrians_waiting(light=None):
    sim = _sim()
    crossing = _pick(light, "ped", "pedestrians_waiting").name
    return sum(1 for p in sim.peds if p.crossing == crossing and p.state == "waiting")


def pedestrians_left():
    return _sim().left_peds()


def _feu_end():
    sim = _feu["sim"]
    if sim is None:
        return
    if not sim.ended:
        sim.runout()
    sim.emit()
