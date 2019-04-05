questions = [
'chat','chien','boubi','papa','berlin','omar'
]

others = ['he Juliette, tu est trop forte, ca me fait plaisir']


from alphabet_scrapper import store_text

def store_questions():
    for q in questions:
        store_text(q)