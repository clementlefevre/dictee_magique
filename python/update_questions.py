#!/usr/bin/env python
# coding: utf-8

from pathlib import Path
import pandas as pd
import json
from config import ASSETS_FOLDER, text_content
from create_sounds import create_specific_sections

def read_input_folder():
    p = Path("./input").glob('**/*')
    files = [f for f in p if f.is_file() and f.suffix==".txt" and f.stem in [str(l) for l in range(0,100)]]
    return files

def read_new_questions_file(file):
    df = pd.read_csv(file, header=None)
    df.columns=["question"]
    df['key']=df.index.astype(int)
    df['key']= "q_"+df['key'].map(str)
    dico = df.to_dict('records')
    dico={d['key']:d['question'] for d in dico}
    return dico


def update_text_content(files):
    if len(files)>0:
        sections_to_update = []
        for f in files:
            new_questions_dic = read_new_questions_file(f)
            section_to_update = f"QUESTIONS_LEVEL_{str(f.stem)}"
            sections_to_update.append(section_to_update)
            text_content[section_to_update]=new_questions_dic            
            
        with open(ASSETS_FOLDER+'text/text_content.json', 'w') as fp:
            json.dump(text_content, fp)

        create_specific_sections(sections_to_update, text_content=text_content)

    else:
        print("No new files found in input folder")

if __name__=="__main__":
    files = read_input_folder()
    update_text_content(files)
    
