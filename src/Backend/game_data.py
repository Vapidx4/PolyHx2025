from Database import insert, retrieve_dict, nuke

SHIP_DATABASE = "Ship_Data"
PLANET_DATABASE = "Planet_Test"


def dict_to_planet(a_list):
    """Reruns a planet list"""
    from Planet import Planet
    planets = []
    for item in a_list:
        planets.append(Planet.from_dict(item))
    return planets


def dict_to_ship(a_list):
    from Ship import Ship
    ships = []
    for item in a_list:
        ships.append(Ship.from_dict(item))
    return ships


class GameData:
    def __init__(self):
        self.planets = dict_to_planet(retrieve_dict(PLANET_DATABASE))
        self.ships = dict_to_ship(retrieve_dict(SHIP_DATABASE))

    def save(self):
        for planet in self.planets:
            insert(planet.to_dict(), PLANET_DATABASE)

        for ship in self.ships:
            insert(ship.to_dict(), SHIP_DATABASE)

    def create_ship(self, planet_json, ship_name):
        from Planet import Planet
        planet = Planet.from_dict(planet_json)
        ship = planet.create_ship(ship_name)
        print(type(ship))
        self.ships.append(ship)


game_data = GameData()

nuke(SHIP_DATABASE)
nuke(PLANET_DATABASE)

for planet in game_data.planets:
    print(planet.to_dict())

dicti = {'_id': 1,
        'Planet Coordinate': {'x': 0, 'y': 0, 'z': 0},
        'Planet Info': {'Name': 'Bomablaclat', 'Atmosphere': 1, 'Oxygen': 20, 'Pollution': 2, 'Population': 3},
        'Production': {'Food Production': 1, 'Water Production': 1, 'Industrial Production': 0},
        'Resources': {'Water': 4, 'Food': 5, 'Industrial': 9990, 'Mineral': ['Gab']},
        'Ships': [
        {'Name': 'BombaExpress', 'Resources': {'Population': 0, 'Food': 0, 'Water': 0, 'Fuel': 0, 'Industrial': 0}}
        ]
        }
game_data.create_ship(dicti, "Mwhahaha")

for ship in game_data.ships:
    print(ship.to_dict())
from Planet import Planet
game_data.save()