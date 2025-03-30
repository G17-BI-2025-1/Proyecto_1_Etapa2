import re

import pandas as pd



import unicodedata

import num2words

from sklearn.base import BaseEstimator, TransformerMixin
import spacy

nlp = spacy.load("es_core_news_sm")


from joblib import load

class Model:

    def __init__(self,columns):
        self.model = load("model.joblib")

    def make_predictions(self, data):
        result = self.model.predict(data)
        return result
    
    def reentrenar(self,data):
        result = self.model.transform(data)
