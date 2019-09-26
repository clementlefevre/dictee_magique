"""Synthesizes speech from the input string of text or ssml.

Note: ssml must be well-formed according to:
    https://www.w3.org/TR/speech-synthesis/
"""


from google.cloud import texttospeech
import pygame
import string
import configparser


# Instantiates a client
client = texttospeech.TextToSpeechClient()

pygame.mixer.init(frequency=32000)


def store_text(text_to_store, filename=None):

    # Set the text input to be synthesized
    synthesis_input = texttospeech.types.SynthesisInput(text=text_to_store)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.types.VoiceSelectionParams(
        language_code="fr-fr", ssml_gender=texttospeech.enums.SsmlVoiceGender.FEMALE
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.types.AudioConfig(
        sample_rate_hertz=44100,
        audio_encoding=texttospeech.enums.AudioEncoding.MP3,
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(synthesis_input, voice, audio_config)
    if filename is None:

        filename = str(text_to_store)

    # The response's audio_content is binary.
    with open("data/" + filename + ".wav", "wb") as out:

        # Write the response to the output file.
        out.write(response.audio_content)
        print(f"Audio content written to file {filename}")


def scrap_alphabet():
    for letter in string.ascii_lowercase:
        store_text(letter)

def read_config_file():
    config = configparser.ConfigParser()
    config.read('../model/text_content.ini')
    



