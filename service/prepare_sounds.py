#!/usr/bin/env python
# coding: utf-8


"""Synthesizes speech from the input string of text or ssml.

Note: ssml must be well-formed according to:
    https://www.w3.org/TR/speech-synthesis/
"""

import os
from google.cloud import texttospeech
import string
import configparser
import json
import argparse

# required arg

parser = argparse.ArgumentParser()

parser.add_argument("--speech", required=False, action="store_true")
parser.add_argument("--config", required=False, action="store_true")
parser.add_argument("--alphabet", required=False, action="store_true")
parser.add_argument("--numbers", required=False, action="store_true")

args = parser.parse_args()


# Instantiates a client
client = texttospeech.TextToSpeechClient()


def store_text(text_to_store, filename=None, folder=None):

    folderpath = "data/sounds/" + folder
    print(folderpath)
    if not os.path.exists(folderpath):
        os.makedirs(folderpath)

    # Set the text input to be synthesized
    synthesis_input = texttospeech.types.SynthesisInput(text=text_to_store)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.types.VoiceSelectionParams(
        language_code="fr-fr",
        ssml_gender=texttospeech.enums.SsmlVoiceGender.MALE,
        name="fr-FR-Wavenet-B",
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.types.AudioConfig(
        speaking_rate=0.80, audio_encoding=texttospeech.enums.AudioEncoding.MP3
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(synthesis_input, voice, audio_config)
    if filename is None:

        filename = str(text_to_store)

    # The response's audio_content is binary.
    with open("data/sounds/" + folder + "/" + filename + ".mp3", "wb") as out:

        # Write the response to the output file.
        out.write(response.audio_content)
        print(f"Audio content written to file {filename}")


def read_config_file():
    config = configparser.ConfigParser()
    config.read("text_content.ini")


config = configparser.ConfigParser()
config.read("text_content.ini")


def create_config_json():
    with open("config.json", "w") as fp:
        json.dump({"data": config._sections}, fp)


# create alphabet
def create_alphabet():
    for letter in string.ascii_lowercase:
        store_text(letter, folder="ALPHABET")


# create number :
def create_numbers():
    number_questions = len(config["QUESTIONS"])
    print(range(1, number_questions)[-1])
    for i in range(number_questions):
        store_text(str(i + 1), folder="NUMBER")


# create all sounds :
def create_all_sounds():
    for s in config.sections():
        if s != "SOUNDS":
            for k, v in config[s].items():
                store_text(v, k, s)


if __name__ == "__main__":
    if args.alphabet:
        create_alphabet()
    if args.numbers:
        create_numbers()
    if args.config:
        create_config_json()
    if args.speech:
        create_all_sounds()

    else:
        create_alphabet()
        create_numbers()
        create_all_sounds()
        create_config_json()

