from Ship import Ship

WATER_PRODUCTION = 2.5
FOOD_PRODUCTION = 2.5
POPULATION_GROWTH = 1.1
SHIP_COST = 100

class Planet:
    instance = 0

    def __init__(self, name, xcor, ycor, atmosphere, oxygen, pollution, population, living_beings, water, food, mineral):
        Planet.instance += 1
        self.ID = Planet.instance

        # planet front end
        self.xcor = xcor
        self.ycor = ycor
        self.zcor = 0

        # planet stuff
        self.name = name
        self.atmosphere = atmosphere
        self.oxygen = oxygen
        self.pollution = pollution
        self.population = population
        self.ships = []
        #probably dont need it
        self.living_beings = living_beings

        # production values
        self.water_production = self.population / 2
        self.food_production = self.population / 2
        self.industrial_production = 0

        # Resources
        self.water = water
        self.food = food
        self.industrial = 0
        # Mineral should probably be a dict
        self.mineral = mineral

    def to_dict(self):
        """Translate the obj into a dictionary format"""
        return {
            "ID": self.ID,
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
                "Living Beings": self.living_beings,
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
            }
        }

    def update(self):
        """This updates the planets resources"""
        self.water += self.water_production * WATER_PRODUCTION - self.population
        self.food += self.food_production * FOOD_PRODUCTION - self.population
        self.industrial += self.industrial_production

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

#Functions for ships

    def create_ship(self, ship_name):
        if self.industrial > SHIP_COST:
            self.ships.append(Ship(ship_name))

    def add_resources(self, ship_name, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
        for ship in self.ships:
            if ship.name == ship_name:
                ship.add_resources(population, food, water, fuel, industrial)

    def unload_ship(self, ship_name, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
        for ship in self.ships:
            if ship_name == ship.name:
                ship.unload_resources(population, food, water, fuel, industrial)