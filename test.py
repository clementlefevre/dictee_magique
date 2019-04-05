import pygame

pygame.mixer.init()
pygame.mixer.music.load("Example.ogg")
pygame.mixer.music.play(0)


pygame.mixer.music.load("output.wav")
pygame.mixer.music.play()

while pygame.mixer.music.get_busy():
    pygame.time.Clock().tick(10)
