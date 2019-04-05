from alphabet_scrapper import store_text

questions = [
'chat','chien','boubi','papa','berlin','omar'
]

others = {
'ok_1':        'he Juliette, tu est trop forte, ca me fait plaisir',
'ok_2': "bon travail Juliette, il faut continuer comme ca !",
'ok_3': "oh je crois que tu fais tu tres bon travail, on peut etre t'appeler Gina si ca continue !",
'nok_1': "oupla, il me semble que tu t'es trompee. Mais c'est pas grave tu sais, il suffit de recommencer."

}





def store_questions():
    for q in questions:
        store_text(q)

def store_others():
        for k,v in others.items():
                store_text(v,k)