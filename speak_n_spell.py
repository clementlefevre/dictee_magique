#!/usr/bin/python3

import os

import string
import service.pygame_textinput
import pygame
from pygame.compat import geterror
from model.chimp import Chimp
from model.game import Game
from model.face import Face

from service.google_tts import play_text


main_dir = os.path.split(os.path.abspath(__file__))[0]
data_dir = os.path.join(main_dir, "data")


g = Game()


pygame.init()

pygame.mixer.init()

img = pygame.image.load("data/pictures/robot.png")

display_face = False


# Create TextInput-object


def create_text_input():
    textinput = service.pygame_textinput.TextInput(
        cursor_color=(0, 255, 0),
        # font_family="Action_Man.ttf",
        font_size=200,
        text_color=(0, 255, 0),
    )
    return textinput


screen = pygame.display.set_mode((1000, 1000))

clock = pygame.time.Clock()
GREEN = (0, 255, 0)

chimp = Chimp()
faceSprite = Face()
allsprites = pygame.sprite.Group((faceSprite, chimp))

textinput = create_text_input()

# faceSpriteGroup = pygame.sprite.Group(faceSprite)

state = "ask_question"

# g.play_greeting()
g.play_question()

font = pygame.font.SysFont("comicsansms", 72)


score = 0

text = font.render(f"score :{str(score)}", True, (0, 128, 0))

while True:
    screen.fill((0, 0, 0))
    pygame.draw.rect(screen, (0, 0, 0), pygame.Rect(10, 500, 800, 800))
    allsprites.update()

    events = pygame.event.get()
    for event in events:
        if event.type == pygame.QUIT:
            exit()

    text_entered0 = textinput.get_text()

    # Feed it with events every frame

    if state == "answer_question":
        allsprites.remove(faceSprite)

    if state == "ask_question":
        allsprites.add(faceSprite)

    if textinput.update(events):
        print(textinput.get_text())
        # play_text(textinput.get_text())
        if textinput.get_text().lower() == g.word:
            textinput.set_text_color((169, 0, 0))
            g.score = g.score + 1

            # faceSpriteGroup.draw(screen)
            g.play_ok()

            textinput.clear_text()
            g.play_question()
            state = "answer_question"

        else:
            g.play_nok()
            textinput.clear_text()
            g.play_question()
            display_face = False

        # chimp.punched()
        textinput = create_text_input()

    # Blit its surface onto the screen

    text = font.render(f"score :{str(g.score)}", True, (0, 128, 0))
    screen.blit(text, (320 - text.get_width() // 2, 240 - text.get_height() // 2))
    screen.blit(img, (0, 0))
    screen.blit(textinput.get_surface(), (10, 500))

    allsprites.draw(screen)

    if text_entered0 != textinput.get_text():
        print(textinput.get_text())
        # play_text(textinput.get_text()[-1])
        if len(textinput.get_text()) > 0:
            letter_to_play = str(textinput.get_text()[-1]).lower()
            # g.play_keyboard()
            g.play_letter(letter_to_play)
            chimp.punched()
            # g.s_letters[letter_to_play].play() """

    pygame.display.update()
    clock.tick(15)
