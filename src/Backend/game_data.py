from Database import insert, retrieve_dict

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

game_data = GameData()
# for planet in game_data.planets:
#     print(planet.to_dict())