import os
import json

os.environ[
    "GOOGLE_APPLICATION_CREDENTIALS"
] = "/home/ramon/keys/genuine-airfoil-280911-3f800825bda1.json"

os.environ[
    "GOOGLE_APPLICATION_CREDENTIALS"
] = "./keys/genuine-airfoil-280911-3f800825bda1.json"


ASSETS_FOLDER  = "./app/src/assets/"

text_content = None

with open(ASSETS_FOLDER+'text/text_content.json') as json_file:
    text_content = json.load(json_file)



