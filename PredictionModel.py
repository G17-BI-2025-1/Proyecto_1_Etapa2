import re

import pandas as pd

nlp = spacy.load("es_core_news_sm")

import unicodedata

import num2words

import spacy

def limpiar_ascii(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode("utf-8"))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode("utf-8"))

    return


def limpiar_mayusculas(train):

    train["Titulo"] = train["Titulo"].str.lower()
    train["Descripcion"] = train["Descripcion"].str.lower()

    return


def limpiar_puntuacion(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
    
    return


def limpiar_numeros(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(r'\b\d+\b', lambda y: num2words.num2words(y.group(), lang='es'), x))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(r'\b\d+\b', lambda y: num2words.num2words(y.group(), lang='es'), x))

    return


palabras_stop = nlp.Defaults.stop_words

palabras_s = r'\b(?:' + '|'.join(palabras_stop) + r')\b'

def limpiar_stopwords(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(palabras_s, '', x))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(palabras_s, '', x))

    return

def limpiar_guiones(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: x.replace("-", " "))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: x.replace("-", " "))

    return

numeros_post_ascii = r'[0123456789]'

def limpiar_numeros_ascii(train):

    train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(numeros_post_ascii, '', x))
    train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(numeros_post_ascii, '', x))

    return

def limpiar_texto(train):

    limpiar_ascii(train=train)
    limpiar_mayusculas(train=train)
    limpiar_puntuacion(train=train)
    limpiar_numeros(train=train)
    limpiar_stopwords(train=train)
    limpiar_guiones(train=train)
    limpiar_numeros_ascii(train=train)

    return

def tokenizar(train):

    train["Titulo_T"] = train["Titulo"].swifter.allow_dask_on_strings(enable=True).apply(lambda x: [token.text for token in nlp(x) if not token.is_space])
    train["Descripcion_T"] = train["Descripcion"].swifter.allow_dask_on_strings(enable=True).apply(lambda x: [token.text for token in nlp(x) if not token.is_space])

    return train

def unir_texto(train):

    textos = train["Titulo_T"].astype(str) + " " + train["Descripcion_T"].astype(str)

    return textos

from joblib import load

class Model:

    def __init__(self,columns):
        self.model = load("assets/model.joblib")

    def make_predictions(self, data):
        result = self.model.predict(data)
        return result
    
    def reentrenar(self,data):
        result = self.model.transform(data)
