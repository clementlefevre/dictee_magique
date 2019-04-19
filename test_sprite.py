import pygame
from pygame.locals import *
import sys

import glob
file_list = glob.glob("service/video_processing/extracted_pictures/" + "/*pixelated.png")
print(file_list)

clock = pygame.time.Clock()

def load_image(name):
    image = pygame.image.load(name)
    return image

class TestSprite(pygame.sprite.Sprite):
    def __init__(self):
        super(TestSprite, self).__init__()
        self.images = []
        for f in file_list:
            self.images.append(load_image(f))
        
        # assuming both images are 64x64 pixels

        self.index = 0
        self.image = self.images[self.index]
        self.rect = pygame.Rect(0, 0, 1000, 1300)

    def update(self):
        '''This method iterates through the elements inside self.images and 
        displays the next one each tick. For a slower animation, you may want to    
        consider using a timer of some sort so it updates slower.'''
        self.index += 1
        if self.index >= len(self.images):
            self.index = 0
        self.image = self.images[self.index]

def main():
    pygame.init()
    screen = pygame.display.set_mode((1000, 1300))

    my_sprite = TestSprite()
    my_group = pygame.sprite.Group(my_sprite)

    show=False

    while True:
        event = pygame.event.poll()
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit(0)

        # Calling the 'my_group.update' function calls the 'update' function of all 
        # its member sprites. Calling the 'my_group.draw' function uses the 'image'
        # and 'rect' attributes of its member sprites to draw the sprite.

        if event.type == KEYDOWN :
            print(show)
            show= not show
            if show:
                my_group.update()
                my_group.draw(screen)
                pygame.display.flip()
                clock.tick(4)
        
        pygame.display.update()
                
            

if __name__ == '__main__':
    main()