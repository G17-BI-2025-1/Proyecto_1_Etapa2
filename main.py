from typing import Optional, List, Union

from fastapi import FastAPI, File, UploadFile, HTTPException
import io
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.ensemble import VotingClassifier

import pandas as pd

import re

import unicodedata

import num2words

from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
import spacy

from DataModel import DataModel
from sklearn.feature_extraction.text import HashingVectorizer
import swifter


from joblib import load




app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LimpiarTexto(BaseEstimator, TransformerMixin):
    def __init__(self, *,modelo_spacy="es_core_news_sm"):
        self.modelo_spacy = modelo_spacy
        self.nlp = spacy.load(modelo_spacy)
        self.palabras_stop = self.nlp.Defaults.stop_words
        self.palabras_s = r'\b(?:' + '|'.join(self.palabras_stop) + r')\b'
        self.numeros_post_ascii = r'[0123456789]'
    
    
    def fit(self, X, y=None):
        return self
    
    def transform(self, train):
        

        train = train.copy()

        

        train["Titulo"] = train["Titulo"].apply(lambda x: unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode("utf-8"))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: unicodedata.normalize("NFKD", x).encode("ascii", "ignore").decode("utf-8"))
        train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
        train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(r'[.:,;-_¿?¡!"\'()\[\]{}\/%\$@+*\^]', '', x))
        train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(r'\b\d+\b', lambda y: num2words.num2words(y.group(), lang='es'), x))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(r'\b\d+\b', lambda y: num2words.num2words(y.group(), lang='es'), x))
        train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(self.palabras_s, '', x))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(self.palabras_s, '', x))
        train["Titulo"] = train["Titulo"].apply(lambda x: x.replace("-", " "))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: x.replace("-", " "))
        train["Titulo"] = train["Titulo"].apply(lambda x: re.sub(self.numeros_post_ascii, '', x))
        train["Descripcion"] = train["Descripcion"].apply(lambda x: re.sub(self.numeros_post_ascii, '', x))

        return train
    
class Tokenizar(BaseEstimator, TransformerMixin):
    def __init__(self, modelo_spacy="es_core_news_sm"):
        self.modelo_spacy = modelo_spacy
        self.nlp = spacy.load(modelo_spacy)

    def fit(self, X, y=None):
        return self
    
    def transform(self, train):
        train = train.copy()

        train["Titulo_T"] = list(self.nlp.pipe(train["Titulo"].astype(str))) 
        train["Descripcion_T"] = list(self.nlp.pipe(train["Titulo"].astype(str))) 

        train["Titulo_T"] = train["Titulo_T"].swifter.allow_dask_on_strings(enable=True).apply(lambda x: [token.text for token in self.nlp(x) if not token.is_space])
        train["Descripcion_T"] = train["Descripcion_T"].swifter.allow_dask_on_strings(enable=True).apply(lambda x: [token.text for token in self.nlp(x) if not token.is_space])

        return train
    
class UnirTexto(BaseEstimator, TransformerMixin):

    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self
    
    def transform(self, train):
        train = train.copy()

        textos = train["Titulo_T"].astype(str) + " " + train["Descripcion_T"].astype(str)
        return textos
    
app.state.pipeline = pipeline_m = Pipeline(
    [   ("LimpiarTexto", LimpiarTexto()),
        ("Tokenizar", Tokenizar()),
        ("UnirTexto", UnirTexto()),
        ("Vectorizar", HashingVectorizer()),
        ("LogisticRegression", LogisticRegression())
    ]
)



app.state.dataframe = pd.read_csv("./data/fake_news_spanish.csv" , sep=";")
app.state.X_train, app.state.X_test, app.state.y_train , app.state.y_test = train_test_split(app.state.dataframe, app.state.dataframe["Label"], test_size=0.3, random_state=1)


app.state.model = load("model.pkl")   
    



@app.get("/")
def read_root():
   return {"Hello": "World"} 


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
   return {"item_id": item_id, "q": q}

@app.post("/predictjson/")
def make_predictions(data_list:List[DataModel]):

    df = pd.DataFrame([data.dict() for data in data_list])
    
    datos = app.state.pipeline[:-1].transform(df)
    
    predictions = app.state.model.predict(datos).tolist()

    return {"predictions": predictions}

@app.post("/predictarchivo/")
def make_prediction_arch():
    if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
    df = app.state.df

    

   
    expected_columns = ["Titulo", "Descripcion"] 
    if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
    model = load("model.pkl")

    datos = app.state.pipeline[:-1].transform(df)

    print(datos)
    
    predictions = model.predict(datos)
    return {"predictions": predictions.tolist()}

@app.post("/reentrenarmodelo/")
def retrain():
   if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
   df = app.state.df

   
   expected_columns = ["Titulo", "Descripcion","Label"]

   if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
   
   df = df.dropna().reset_index(drop=True)
   df = df.drop_duplicates().reset_index(drop=True)
    
   X_train, X_test, y_train , y_test = train_test_split(df, df["Label"], test_size=0.3, random_state=1)

   



   app.state.pipeline.fit(X_train,y_train)

   app.state.pipeline[:-1].transform(X_test)

   predictions =  app.state.pipeline.predict(X_test[["Titulo", "Descripcion"]])

   score = app.state.pipeline.score(X_test[["Titulo", "Descripcion"]],y_test)
   
   return {"predictions": predictions.tolist(),"score":score}

@app.post("/anadirdatos/")
def adddata():
    if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
   
    df = app.state.df
   
    expected_columns = ["Titulo", "Descripcion", "Label"]
    if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
   
    # Cargar modelo existente
    model = load("model.pkl")
    modelo_viejo = model
    
    # Preparar datos
    df = df.dropna().reset_index(drop=True)
    df = df.drop_duplicates().reset_index(drop=True)
   
    # Dividir en train/test
    X_train, X_test, y_train, y_test = train_test_split(df, df["Label"], test_size=0.3, random_state=1)
    
    # Entrenar nuevo modelo
    modelo_nuevo = app.state.pipeline.fit(X_train, y_train)
    modelo_nuevo = modelo_nuevo.steps[-1][1]
    
    # Configurar modelo combinado
    modelo_combinado = VotingClassifier(
        estimators=[('old', modelo_viejo), ('new', modelo_nuevo)],
        voting='soft'
    )
    
    # Transformar datos de entrenamiento con el pipeline (sin el último paso que es el modelado)
    X_train1 = app.state.pipeline[:-1].transform(X_train)
    X_test1 = app.state.pipeline[:-1].transform(X_test)
    
    # Entrenar el modelo combinado con datos transformados (no con datos en bruto)
    modelo_combinado.fit(X_train1, y_train)
    
    # Evaluar con datos transformados
    predictions = modelo_combinado.predict(X_test1)
    score = modelo_combinado.score(X_test1, y_test)
    
    # Guardar el modelo combinado para uso futuro
    
    
    return {"predictions": predictions.tolist(), "score": score}
    
   

@app.post("/subirarchivo/")
async def subir_archivo(file: UploadFile = File(...)):
    
    print(file)
    contents = file.file
    print(contents)
    df = pd.read_csv(contents , sep=";")

    
    app.state.df = df
    
    return {"filename": file.filename, "columns": df.columns.tolist()}

