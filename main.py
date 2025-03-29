from typing import Optional, List, Union

from fastapi import FastAPI, File, UploadFile, HTTPException
import io
from sklearn.ensemble import VotingClassifier

from joblib import load

import pandas as pd

from DataModel import DataModel

app = FastAPI()


@app.get("/")
def read_root():
   return {"Hello": "World"} 


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
   return {"item_id": item_id, "q": q}

@app.post("/predictjson/")
def make_predictions(data_list:List[DataModel]):
   
    df = pd.DataFrame([data.dict() for data in data_list])
    model = load("assets/modelo.joblib")
    
    
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
    
    model = load("assets/modelo.joblib")
    
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
    
   model = load("assets/modelo.joblib")

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
    
   model = load("assets/modelo.joblib")
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

