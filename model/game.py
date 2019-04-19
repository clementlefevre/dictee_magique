
import os
import pygame
import string
import random
import configparser

SOUND_FOLDER = "data/sounds/"

CONFIG_FILE = "../"

config = configparser.ConfigParser()
        
config.read('model/text_content.ini')



class Game():

    def __init__(self):
        self.score = 0
        self.sounds  = self.load_sounds()
        self.load_questions()
        
        print(self.questions)
        self.word = ""
        

    
    def load_questions(self):
        self.questions = []
        for k in config['QUESTIONS']:
            self.questions.append(config['QUESTIONS'][k])
        

    def load_sounds(self):
        
        
        all_sections_sounds = {}
       

        pygame.mixer.init()
        for s in config.sections():
            section_sounds = {}
            for item in config[s].keys():
               
                sound = pygame.mixer.Sound(f"{SOUND_FOLDER+s+'/'+item}_slow.wav")
                section_sounds[item] = sound 
            all_sections_sounds[s]= section_sounds
        
        return all_sections_sounds
        
   

    def play_ok(self):
        self.play_item('ANSWERS_OK',True)
    
    def play_nok(self):
        self.play_item('ANSWERS_NOK',True)



    def play_greeting(self):
        self.play_item("GREETINGS",True)
    
    def play_question(self):
        self.word = self.questions[self.score]
        print(self.word)
        self.play_intro()
        self.play_item('QUESTIONS',False)

    def play_intro(self):
        self.play_item('INTRO',True)

   
    def play_item(self, category=None,randomize = False,wait=True):
        if randomize:
            key_to_play = random.choice(list(self.sounds[category].keys()))
        
        else :
            key_to_play = list(self.sounds[category].keys())[self.score]
       

        self.sounds[category][key_to_play].play()

        if wait:
            while pygame.mixer.get_busy():
                pygame.time.wait(200)

    
    def play_keyboard(self):
        pygame.mixer.music.load("data/sounds/keyboard.wav")
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(1)



    def play_letter(self,letter):

        pygame.mixer.init()
        pygame.mixer.music.load(f"{SOUND_FOLDER+'/ALPHABET/'+str(letter)}.wav")
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            pygame.time.wait(200)



        