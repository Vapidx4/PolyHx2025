from Planet import Planet
from Ship import Ship
from Database import insert, retrieve_dict

SHIP_DATABASE = "Ship_Data"
PLANET_DATABASE = "Planet_Data"

p1 = Planet("Bomablaclat", xcor=0, ycor=0, atmosphere=1, oxygen=20, pollution=2, population=3, water=4,
    food=5, mineral=["Gab"])
p1.industrial = 10000



insert(p1.to_dict(), PLANET_DATABASE)
for doc in retrieve_dict("Planet_Test"):
    print(doc)