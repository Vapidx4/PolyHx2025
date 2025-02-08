
class Ship:
    def __init__(self, name):
        self.name = name
        # Ship resources
        self.population = 0
        self.food = 0
        self.water = 0
        self.fuel = 0
        self.industrial = 0

    def to_dict(self):
        """Translate the obj into a dictionary format"""
        return {
            "Resources" : {
                "Population": self.population,
                "Food": self.food,
                "Water": self.water,
                "Fuel": self.fuel,
                "Industrial": self.industrial,
            }
        }

    def travel(self):
        if self.population < 1:
            #cant fly without anyone
            return
        # also do for fuel

    def add_resources(self, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
        """Specify which resource to add"""
        self.population += population
        self.food += food
        self.water += water
        self.fuel += fuel
        self.industrial += industrial

    def unload_resources(self, population = 0, food = 0, water = 0, fuel = 0, industrial = 0):
        """Specify which resource to add"""
        self.population -= population
        self.food -= food
        self.water -= water
        self.fuel -= fuel
        self.industrial -= industrial