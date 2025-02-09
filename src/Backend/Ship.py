
class Ship:
    instance = 0

    def __init__(self, name, planet_ID, ID = None, population=0, food=0, water=0, fuel=0, industrial=0):
        if ID is None:
            Ship.instance += 1
            self.ID = Ship.instance
        else:
            self.ID = ID

        self.name = name
        self.planet_ID = planet_ID
        # Ship resources
        self.population = population
        self.food = food
        self.water = water
        self.fuel = fuel
        self.industrial = industrial

    def to_dict(self):
        """Translate the obj into a dictionary format"""
        return {
            "Name" : self.name,
            "Resources" : {
                "Population": self.population,
                "Food": self.food,
                "Water": self.water,
                "Fuel": self.fuel,
                "Industrial": self.industrial,
            }
        }

    @classmethod
    def from_dict(cls, ship_dict):
        """Convert a dictionary into a Ship object"""
        resources = ship_dict["Resources"]
        return cls(
            name=ship_dict["Name"],
            planet_ID=ship_dict.get("Planet ID", None),
            ID=ship_dict.get("_id", None),  # Optionally pass the Ship ID if available
            population=resources.get("Population", 0),
            food=resources.get("Food", 0),
            water=resources.get("Water", 0),
            fuel=resources.get("Fuel", 0),
            industrial=resources.get("Industrial", 0)
        )

    def travel(self):
        if self.population < 1:
            #cant fly without anyone lmao
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