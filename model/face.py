import os
import random
import pygame


import glob
file_list = glob.glob("service/video_processing/extracted_pictures/" + "/*pixelated.png")
print(file_list)


def load_image(name):
    image = pygame.image.load(name)
    size = image.get_size()

    image = pygame.transform.scale(image, (int(size[0]//2), int(size[1]//2)))
    return image


class Face(pygame.sprite.Sprite):
    def __init__(self):
        super(Face, self).__init__()
        self.images = []
        for f in file_list:
            self.images.append(load_image(f))
        
        # assuming both images are 64x64 pixels
        self.frame = 0
        self.index = 0
        self.image = self.images[self.index]
        self.size = self.image.get_size()
        print(self.size)
        
        

        self.rect = self.image.get_rect()

        screen = pygame.display.get_surface()
        self.area = screen.get_rect()
        self.rect.topleft = 10, 10
        #self.rect = pygame.Rect(0, 0, 200, 300)

    def update(self):
        '''This method iterates through the elements inside self.images and 
        displays the next one each tick. For a slower animation, you may want to    
        consider using a timer of some sort so it updates slower.'''
        
        self.frame +=1

        if self.frame % 5 == 0:
            self.index += random.choice(range(0,len(self.images)))

            if self.index >= len(self.images):
                self.index = 0
       
        if self.frame >= 100:
            self.frame = 0
            
        self.image = self.images[self.index]
