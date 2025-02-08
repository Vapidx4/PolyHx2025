
class Planet:
    instance = 0

    def __init__(self, atmosphere, oxygen, pollution, population, living_beings, water, food, mineral):
        Planet.instance += 1
        self._ID = Planet.instance
        # planet stuff
        self._atmosphere = atmosphere
        self._oxygen = oxygen
        self._pollution = pollution
        self._population = population
        self._living_beings = living_beings
        # Resources
        self._water = water
        self._food = food
        # Mineral should probably be a dict
        self._mineral = mineral

    def to_dict(self):
        """Translate the obj into a dictionary format"""
        return {
            "ID": self._ID,

            "Planet Info": {
                "Atmosphere": self._atmosphere,
                "Oxygen": self._oxygen,
                "Pollution": self._pollution,
                "Population": self._population,
                "Living Beings": self._living_beings,
            },
            "Resources": {
                "Water": self._water,
                "Food": self._food,
                "Mineral": self._mineral,
            }
        }