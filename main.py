from typing import Optional, List, Union

from fastapi import FastAPI, File, UploadFile, HTTPException
import io
from sklearn.ensemble import VotingClassifier

import pandas as pd

import re

import unicodedata

import num2words

import spacy

from DataModel import DataModel

from PredictionModel import limpiar_texto

app = FastAPI()

nlp = spacy.load("es_core_news_sm")

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


@app.get("/")
def read_root():
   return {"Hello": "World"} 


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
   return {"item_id": item_id, "q": q}

@app.post("/predictjson/")
def make_predictions(data_list:List[DataModel]):
   
    df = pd.DataFrame([data.dict() for data in data_list])
    model = load("model.joblib", mmap_mode="r")
    
    
    predictions = model.predict(df).tolist()

    return {"predictions": predictions}

@app.post("/predictarchivo/")
def make_prediction_arch(dataModel: DataModel):
    if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
    df = app.state.df

   
    expected_columns = ["Titulo", "Descripcion"] 
    if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
    model = load("assets/model.joblib")
    
    predictions = model.predict(df[expected_columns])
    return {"predictions": predictions.tolist()}

@app.post("/reentrenarmodelo/")
def retrain(datamodel:DataModel):
   if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
   df = app.state.df

   
   expected_columns = ["Titulo", "Descripcion","Label"]

   if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
   model = load("assets/model.joblib")

   predictions = model.fit_predict(df[["Titulo", "Descripcion"]],df["Label"])
   score = model.score(df[["Titulo", "Descripcion"]],df["Label"])
   return {"predictions": predictions.tolist(),"score":score}

@app.post("/anadirdatos/")
def adddata(datamodel:DataModel):
   if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")

    
   df = app.state.df

   
   expected_columns = ["Titulo", "Descripcion","Label"] 
   if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
   model = load("assets/model.joblib")
   modelo_viejo = model
   modelo_nuevo = model.fit(df[["Titulo", "Descripcion"]],df["Label"])
   modelo_combinado = VotingClassifier(estimators=[('old', modelo_viejo), ('new', modelo_nuevo)],voting='soft')
   datos = model.transform(df)
   predictions = modelo_combinado.predict(datos)
   score = modelo_combinado.score(df[["Titulo", "Descripcion"]],df["Label"])

   return {"predictions": predictions.tolist(),"predictions": predictions.tolist(),"score":score}
    
   

@app.post("/subirarchivo/")
async def subir_archivo(file: UploadFile = File(...)):
    
    contents = await file.read()
    df = pd.read_csv(contents, sep=";", encoding="ISO-8859-1")

    
    app.state.df = df
    
    return {"filename": file.filename, "columns": df.columns.tolist()}

