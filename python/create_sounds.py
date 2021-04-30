#!/usr/bin/env python
# coding: utf-8

import os
from google.cloud import texttospeech
import string
from pathlib import Path
import json
import argparse
import time
from  config import ASSETS_FOLDER,text_content

# required arg
parser = argparse.ArgumentParser()
parser.add_argument("--questions", required=False, action="store_true")
parser.add_argument("--prenoms", required=False, action="store_true")
parser.add_argument('--list', nargs='+', help='<Required> Set flag', required=False)
parser.add_argument("--full", required=False, action="store_true")
parser.add_argument("--action='store', type=str, help='The text to parse.'")
args = parser.parse_args()

# Instantiates a client
client = texttospeech.TextToSpeechClient()

def store_text(text_to_store, filename=None, folder=None):
    
    print("text_to_store :")
    print(text_to_store)

    folderpath = ASSETS_FOLDER+"/sounds/" + folder
    print(folderpath)
    if not os.path.exists(folderpath):
        os.makedirs(folderpath)

    # Set the text input to be synthesized
    synthesis_input = texttospeech.SynthesisInput(text=text_to_store)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.VoiceSelectionParams(
        language_code="fr-fr",
        ssml_gender=texttospeech.SsmlVoiceGender.MALE,
        name="fr-FR-Wavenet-E",
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        speaking_rate=0.9, audio_encoding=texttospeech.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    if filename is None:

        filename = str(text_to_store)

    # The response's audio_content is binary.
    with open(ASSETS_FOLDER+"/sounds/" + folder + "/" + filename + ".mp3", "wb") as out:

        # Write the response to the output file.
        out.write(response.audio_content)
        print(f"Audio content written to file {filename}.mp3")

# create alphabet
def create_alphabet():
    for letter in string.ascii_lowercase:
        store_text(letter, folder="ALPHABET")

# create number :
def create_numbers():
    #number_questions = len(config["QUESTIONS"])
    
    for i in range(100):
        store_text(str(i + 1), folder="NUMBER")

def create_prenoms():
    p = Path(ASSETS_FOLDER+"/sounds/PRENOMS").glob('**/*')
    files = [x.stem for x in p if x.is_file()]
    with open(ASSETS_FOLDER+'/text/prenoms.json') as json_file:
        prenoms = json.load(json_file)
        
    for k, v in prenoms.items():
        if k not in files:
            try:
                store_text(v, k, "PRENOMS")
                time.sleep(2)
            except Exception as e:
                print(f"Could not get prenom for {v}\n{e}")
       
# create all sounds :
def create_all_sounds():
    for s in text_content.sections():
        if s != "SOUNDS":
            for k, v in text_content[s].items():
                store_text(v, k, s)

# update specific sections : example : python python/prepare_sounds.py --list ASK_PLAYER_NAME GREETINGS
def create_specific_sections(section_list, text_content=text_content):
    
    for section in section_list:
        for k, v in text_content[section].items():
            
            store_text(v, k, section)
            time.sleep(1)

if __name__ == "__main__":
    if args.list:
        create_specific_sections(args.list)

    if args.questions:
        all_questions_section = [section for section in text_content.keys() if "QUESTIONS_LEVEL_" in section]
        create_specific_sections(all_questions_section)
   
    if args.prenoms:
        create_prenoms()

    if args.full:
        create_alphabet()
        create_numbers()
        create_all_sounds()