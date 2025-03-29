from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException
import io

from joblib import load

import pandas as pd

import DataModel

app = FastAPI()


@app.get("/")
def read_root():
   return {"Hello": "World"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: Optional[str] = None):
   return {"item_id": item_id, "q": q}

@app.post("/predictjson")
def make_predictions(data_list: List[DataModel]):
   
    df = pd.DataFrame([data.dict() for data in data_list])
    model = load("assets/modelo.joblib")
    
    
    predictions = model.predict(df).tolist()

    return {"predictions": predictions}

@app.post("/predictarchivo")
def retrain(dataModel: DataModel):
    if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
    df = app.state.df

   
    expected_columns = ["Titulo", "Descripcion"] 
    if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
    model = load("assets/modelo.joblib")
    
    predictions = model.predict(df[expected_columns])
    return {"predictions": predictions.tolist()}
   

@app.post("/subirarchivo/")
async def subir_archivo(file: UploadFile = File(...)):
    
    contents = await file.read()
    df = pd.read_csv(contents, sep=";", encoding="ISO-8859-1")

    
    app.state.df = df
    
    return {"filename": file.filename, "columns": df.columns.tolist()}

