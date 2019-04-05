#!/usr/bin/python3

import os
import random
import pygame_textinput
import pygame
from pygame.compat import geterror

import string


from google_tts import play_text
from alphabet_scrapper import load_letters, load_questions, load_others
from questions import questions

main_dir = os.path.split(os.path.abspath(__file__))[0]
data_dir = os.path.join(main_dir, "data")

letters_dic = load_letters()
others_dic = load_others()

questions_dic = load_questions()

pygame.init()

pygame.mixer.init()


# functions to create our resources
def load_image(name, colorkey=None):
    fullname = os.path.join(data_dir, name)
    try:
        image = pygame.image.load(fullname)
    except pygame.error:
        print("Cannot load image:", fullname)
        raise SystemExit(str(geterror()))
    image = image.convert()
    if colorkey is not None:
        if colorkey is -1:
            colorkey = image.get_at((0, 0))
        image.set_colorkey(colorkey, pygame.RLEACCEL)
    return image, image.get_rect()


class Chimp(pygame.sprite.Sprite):
    """moves a monkey critter across the screen. it can spin the
       monkey when it is punched."""

    def __init__(self):
        pygame.sprite.Sprite.__init__(self)  # call Sprite intializer
        self.image, self.rect = load_image("chimp.bmp", -1)
        screen = pygame.display.get_surface()
        self.area = screen.get_rect()
        self.rect.topleft = 10, 10
        self.move = 2
        self.dizzy = 0

    def update(self):
        "walk or spin, depending on the monkeys state"
        if self.dizzy:
            # if self.dizzy>36:
            #     self.kill()
            self._spin()

        else:
            self._walk()

    def _walk(self):
        "move the monkey across the screen, and turn at the ends"
        newpos = self.rect.move((self.move, 0))
        if self.rect.left < self.area.left or self.rect.right > self.area.right:
            self.move = -self.move
            newpos = self.rect.move((self.move, 0))
            self.image = pygame.transform.flip(self.image, 1, 0)
        self.rect = newpos

    def _spin(self):
        "spin the monkey image"
        center = self.rect.center
        self.dizzy = self.dizzy + 12
        if self.dizzy >= 360:
            self.dizzy = 0
            self.image = self.original

        else:
            rotate = pygame.transform.rotate
            self.image = rotate(self.original, self.dizzy)
        self.rect = self.image.get_rect(center=center)

    def punched(self):
        "this will cause the monkey to start spinning"
        if not self.dizzy:
            self.dizzy = 1
            self.original = self.image


# Create TextInput-object
textinput = pygame_textinput.TextInput(
    cursor_color=(0, 255, 0),
    # font_family="Action_Man.ttf",
    font_size=200,
    text_color=(0, 255, 0),
)

screen = pygame.display.set_mode((1000, 1000))

clock = pygame.time.Clock()
GREEN = (0, 255, 0)

chimp = Chimp()
allsprites = pygame.sprite.RenderPlain((chimp))

current_state = "lose"


word = random.choice(questions)

others_dic["bonjour"].play()

while pygame.mixer.get_busy():
    pygame.time.wait(200)


questions_dic[word].play()
while pygame.mixer.get_busy():
    pygame.time.wait(200)

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
    if textinput.update(events):
        print(textinput.get_text())
        play_text(textinput.get_text())
        if textinput.get_text().lower() == word:
            score = score + 1
            others_dic["ok"].play()
            while pygame.mixer.get_busy():
                pygame.time.wait(200)
            word = random.choice(questions)

            others_dic["maintenant_ecrit"].play()
            while pygame.mixer.get_busy():
                pygame.time.wait(200)
            word = random.choice(questions)

            questions_dic[word].play()
            while pygame.mixer.get_busy():
                pygame.time.wait(200)
        else:

            others_dic["incorrect"].play()
            while pygame.mixer.get_busy():
                pygame.time.wait(200)
            questions_dic[word].play()
            while pygame.mixer.get_busy():
                pygame.time.wait(200)

        chimp.punched()

    # Blit its surface onto the screen
    screen.blit(textinput.get_surface(), (10, 500))
    text = font.render(f"score :{str(score)}", True, (0, 128, 0))
    screen.blit(text, (320 - text.get_width() // 2, 240 - text.get_height() // 2))

    allsprites.draw(screen)

    if text_entered0 != textinput.get_text():
        print(textinput.get_text())
        # play_text(textinput.get_text()[-1])
        if len(textinput.get_text()) > 0:
            letter_to_play = str(textinput.get_text()[-1]).lower()
            chimp.punched()
            letters_dic[letter_to_play].play()

    pygame.display.update()
    clock.tick(30)
    # if len(text_entered) != textinput.get_text():
    #     print(text_entered)
    # if (
    #     len(textinput.get_text()) > 0
    #     and textinput.get_text()[-1].lower() in alphabet
    # ):
    #     play_text(letter_input)
    #     print(letter_input)
