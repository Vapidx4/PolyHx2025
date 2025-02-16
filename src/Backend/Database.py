import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Connection to the database
def get_database():
    CONNECTION = os.getenv("MONGO_URI")

    if not CONNECTION:
        raise ValueError("The url is not in the .env")

    client = MongoClient(CONNECTION)
    return client["All-Purpose"]

dbname = get_database()

# Ping the database
# def ping_mongodb():
#     try:
#         CONNECTION = os.getenv("MONGO_URI")
#         client = MongoClient(CONNECTION)
#         result = client.admin.command("ping")
#         print("Ping successful:", result)
#     except Exception as e:
#         print("Ping failed:", e)
#     finally:
#         client.close()
# ping_mongodb()

# Sending to Database
def insert(obj, database_name):
    """Obj: a dictionary
    database_name: the name of the database to saving into"""
    database = dbname[database_name]
    if isinstance(obj, list):
        print("Sending...")
        database.insert_many(obj)
    else:
        print("Sending...")
        database.insert_one(obj)

#not tested for now

# Retrieving from Database
def retrieve_dict(database_name):
    database = dbname[database_name]
    # return [convert for convert in database.find({"ID" : ID}, {"_id": 0})]

    return list(database.find({}))

def nuke(database_name):
    print("NUKKINGGGG")
    testPlanet = dbname[database_name]
    testPlanet.drop()

# KEEP THIS COMMENTED (it flushes the database)
# testPlanet = dbname["Planet_Test"]
# testPlanet.drop()
