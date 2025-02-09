from Ship import Ship
from math import floor
# from game_data import game_data

WATER_PRODUCTION = 2.5
FOOD_PRODUCTION = 2.5
POPULATION_GROWTH = 1.1
SHIP_COST = 100

class Planet:
    instance = 0

    def __init__(self,name, xcor, ycor, atmosphere, oxygen, pollution, population, water, food, mineral, ships = None
                 , water_production = None, food_production = None, industrial_production = 0, fuel = 0, ID = None, industrial = 0):
        if ID is None:
            Planet.instance += 1
            self.ID = Planet.instance
        else:
            self.ID = ID

        # planet front end
        self.xcor = xcor
        self.ycor = ycor
        self.zcor = 0

        # planet info
        self.name = name
        self.atmosphere = atmosphere #bool
        self.oxygen = oxygen # in percentage
        self.pollution = pollution
        self.population = population

        if ships is None: #List of planet id
            self.ships = []
        else:
            self.ships = ships

        # production values
        self.water_production = water_production if water_production is not None else floor(self.population / 2)
        self.food_production = food_production if food_production is not None else floor(self.population / 2)
        self.industrial_production = industrial_production

        # Resources
        self.water = water
        self.food = food
        self.industrial = industrial
        self.fuel = fuel
        # Mineral should probably be a dict
        self.mineral = mineral

        #Other
        self.habitable = self.isHabitable()

    def to_dict(self):
        """Translate the obj into a dictionary format"""
        # ship_dict = []
        # for ship in self.ships:
        #     ship_dict.append(ship.to_dict())

        # ship_dict = []
        # for ship in self.ships:
        #     if isinstance(ship, Ship):  # Check if the ship is an instance of Ship
        #         ship_dict.append(ship.to_dict())
        #     else:
        #         # If it's not a valid ship object, append an error or handle it as needed
        #         ship_dict.append({"error": "Invalid ship object"})

        return {
            "_id": self.ID,
            "Planet Coordinate" : {
                "x": self.xcor,
                "y": self.ycor,
                "z": self.zcor,
            },
            "Planet Info": {
                "Name": self.name,
                "Atmosphere": self.atmosphere,
                "Oxygen": self.oxygen,
                "Pollution": self.pollution,
                "Population": self.population,
            },
            "Production": {
                "Food Production": self.food_production,
                "Water Production": self.water_production,
                "Industrial Production": self.industrial_production,
            },
            "Resources": {
                "Water": self.water,
                "Food": self.food,
                "Industrial": self.industrial,
                "Mineral": self.mineral,
            },
            "Ships" : self.ships
        }

    @classmethod
    def from_dict(cls, planet_dict):
        coord = planet_dict["Planet Coordinate"]
        info = planet_dict["Planet Info"]
        production = planet_dict["Production"]
        resources = planet_dict["Resources"]

        return cls(
            name=info["Name"],
            xcor=coord["x"],
            ycor=coord["y"],
            atmosphere=info["Atmosphere"],
            oxygen=info["Oxygen"],
            pollution=info["Pollution"],
            population=info["Population"],
            water=resources["Water"],
            food=resources["Food"],
            industrial=resources["Industrial"],
            mineral=resources["Mineral"],
            ships=planet_dict["Ships"],
            water_production=production["Water Production"],
            food_production=production["Food Production"],
            industrial_production=production["Industrial Production"],
            fuel=resources.get("Fuel", 0),
            ID=planet_dict["_id"]
        )

    def update(self):
        """This updates the planets resources"""
        self.water += self.water_production * WATER_PRODUCTION - self.population
        self.food += self.food_production * FOOD_PRODUCTION - self.population
        self.industrial += self.industrial_production
        self.fuel += self.industrial_production

        if self.water < 0:
            self.population -= self.water
            self.water = 0

        if self.food < 0:
            self.population -= self.food
            self.food = 0

        self.population *= POPULATION_GROWTH

    def assign_production(self, water, food, industrial):
        """It should be base on the population"""
        self.water_production = water
        self.food_production = food
        self.industrial_production = industrial

    def isHabitable(self):
        if self.atmosphere and 16 < self.oxygen < 23:
            #Sources: Trust me bro
            return True
        else:
            return False

#Functions for ships
    def create_ship(self, ship_name):
        if self.industrial > SHIP_COST:
            self.industrial -= SHIP_COST

            return Ship(ship_name, self.ID)
        else:
            print("Haha poor")

    # def add_resources(self, ship_name, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
    #     for ship in self.ships:
    #         if ship.name == ship_name:
    #             ship.add_resources(population, food, water, fuel, industrial)
    #
    # def unload_ship(self, ship_name, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
    #     for ship in self.ships:
    #         if ship_name == ship.name:
    #             ship.unload_resources(population, food, water, fuel, industrial)
    #             self.population += population
    #             self.food += food
    #             self.water += water
    #             self.fuel += fuel
    #             self.industrial += industrial