"""Synthesizes speech from the input string of text or ssml.

Note: ssml must be well-formed according to:
    https://www.w3.org/TR/speech-synthesis/
"""
from google.cloud import texttospeech
import pygame

# Instantiates a client
client = texttospeech.TextToSpeechClient()


def play_text(text_str):

    # Set the text input to be synthesized
    synthesis_input = texttospeech.types.SynthesisInput(text=text_str)

    # Build the voice request, select the language code ("en-US") and the ssml
    # voice gender ("neutral")
    voice = texttospeech.types.VoiceSelectionParams(
        language_code="fr-fr", ssml_gender=texttospeech.enums.SsmlVoiceGender.NEUTRAL
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.types.AudioConfig(
        sample_rate_hertz=44800,
        audio_encoding=texttospeech.enums.AudioEncoding.LINEAR16,
    )

    # Perform the text-to-speech request on the text input with the selected
    # voice parameters and audio file type
    response = client.synthesize_speech(synthesis_input, voice, audio_config)

    pygame.mixer.init()

    sound = pygame.mixer.Sound(response.audio_content)
    sound.play()

    while pygame.mixer.get_busy():
        pygame.time.Clock().tick(10)


# The response's audio_content is binary.
""" with open('output.wav', 'wb') as out:
    # Write the response to the output file.
    out.write(response.audio_content)
    print('Audio content written to file "output.mp3"') """

# play_text("j'ai fait un gros prout et je suis super content")
