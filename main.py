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
# Configuración CORS simplificada pero efectiva
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambia esto a tu dominio en producción
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
async def make_predictions(data_list:List[DataModel]):
    # Log para depuración
    print(f"Recibiendo datos para predictjson: {data_list}")

    df = pd.DataFrame([data.dict() for data in data_list])
    
    datos = app.state.pipeline[:-1].transform(df)
    
    predictions = app.state.model.predict(datos).tolist()
    
    # Log para depuración
    print(f"Predicciones: {predictions}")

    return {"predictions": predictions}

@app.post("/predictarchivo/")
async def make_prediction_arch():
    if not hasattr(app.state, "df"):
        raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
    
    # Log para depuración
    print("Procesando archivo subido para análisis")
    
    df = app.state.df

    # Verificar que las columnas necesarias estén presentes
    expected_columns = ["Titulo", "Descripcion"] 
    if not all(col in df.columns for col in expected_columns):
        raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
    
    # Asegurarse de que las columnas son del tipo correcto
    df["Titulo"] = df["Titulo"].astype(str)
    df["Descripcion"] = df["Descripcion"].astype(str)
    
    # Eliminar filas con valores vacíos en campos importantes
    df = df.dropna(subset=["Titulo", "Descripcion"]).reset_index(drop=True)
    
    # Si no quedan filas después de limpiar, devolver error
    if len(df) == 0:
        raise HTTPException(status_code=400, detail="No hay datos válidos para analizar después de limpiar el archivo")
    
    try:
        model = load("model.pkl")
        
        # Preprocesar datos
        try:
            datos = app.state.pipeline[:-1].transform(df)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al preprocesar los datos: {str(e)}")
        
        # Realizar predicciones
        predictions = model.predict(datos)
        
        # Guardar textos originales para incluirlos en la respuesta
        original_texts = []
        for index, row in df.iterrows():
            # Usar columnas adicionales si están disponibles
            fecha = row.get('Fecha', '')
            id_texto = row.get('ID', str(index + 1))
            
            texto = f"{row['Titulo']} - {row['Descripcion'][:100]}..."
            if fecha:
                texto = f"[{fecha}] {texto}"
            if id_texto:
                texto = f"#{id_texto}: {texto}"
                
            original_texts.append(texto)
        
        # Log para depuración
        print(f"Total de predicciones: {len(predictions)}")
        
        # Devolver no solo las predicciones sino también los textos originales
        return {
            "predictions": predictions.tolist(),
            "texts": original_texts,
            "summary": {
                "total": len(predictions),
                "fake_count": int(sum(predictions)),
                "real_count": int(len(predictions) - sum(predictions))
            }
        }
    except Exception as e:
        print(f"Error al analizar el archivo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error durante el análisis: {str(e)}")

@app.post("/reentrenarmodelo/")
async def retrain():
   try:
       if not hasattr(app.state, "df"):
            raise HTTPException(status_code=400, detail="No se ha subido ningún archivo CSV")
        
       print("Iniciando proceso de reentrenamiento del modelo")
       df = app.state.df
       
       # Comprobar que el DataFrame tiene las columnas necesarias
       expected_columns = ["Titulo", "Descripcion", "Label"]
       if not all(col in df.columns for col in expected_columns):
            raise HTTPException(status_code=400, detail=f"Las columnas deben ser {expected_columns}")
       
       # Validar los valores en la columna Label
       valid_labels = [0, 1]
       invalid_labels = set(df["Label"].unique()) - set(valid_labels)
       if invalid_labels:
           raise HTTPException(status_code=400, detail=f"La columna 'Label' contiene valores no válidos: {invalid_labels}. Use 0 para noticias reales y 1 para noticias falsas.")
       
       # Limpiar datos
       print("Limpiando y procesando los datos...")
       df = df.dropna().reset_index(drop=True)
       df = df.drop_duplicates().reset_index(drop=True)
        
       # Verificar que hay suficientes datos
       if len(df) < 10:
           raise HTTPException(status_code=400, detail=f"Se necesitan al menos 10 ejemplos para reentrenar el modelo. Proporcionados: {len(df)}")
       
       # Dividir en train/test
       print(f"Dividiendo {len(df)} ejemplos en conjuntos de entrenamiento y prueba...")
       X_train, X_test, y_train, y_test = train_test_split(df, df["Label"], test_size=0.3, random_state=1)
       
       print(f"Entrenando modelo con {len(X_train)} ejemplos...")
       # Entrenar el modelo
       try:
           app.state.pipeline.fit(X_train, y_train)
       except Exception as e:
           print(f"Error durante el entrenamiento: {str(e)}")
           raise HTTPException(status_code=500, detail=f"Error durante el entrenamiento del modelo: {str(e)}")
       
       print("Evaluando modelo en conjunto de prueba...")
       # Transformar datos de prueba
       app.state.pipeline[:-1].transform(X_test)
       
       # Obtener predicciones
       predictions = app.state.pipeline.predict(X_test[["Titulo", "Descripcion"]])
       
       # Calcular precisión
       score = app.state.pipeline.score(X_test[["Titulo", "Descripcion"]], y_test)
       print(f"Precisión del modelo: {score:.4f}")
       
       # Guardar el modelo entrenado
       try:
           import joblib
           print("Guardando modelo entrenado...")
           joblib.dump(app.state.pipeline, "model_retrained.pkl")
           print("Modelo guardado correctamente")
       except Exception as e:
           print(f"Advertencia: No se pudo guardar el modelo: {str(e)}")
           # No fallamos aquí, solo registramos la advertencia
       
       # Preparar estadísticas adicionales
       class_distribution = {
           "total": len(df),
           "fake_news": int(df["Label"].sum()),
           "real_news": int(len(df) - df["Label"].sum())
       }
       
       model_evaluation = {
           "training_examples": len(X_train),
           "test_examples": len(X_test),
           "accuracy": float(score),
           "correct_predictions": int(sum(predictions == y_test.values)),
           "incorrect_predictions": int(sum(predictions != y_test.values))
       }
       
       return {
           "predictions": predictions.tolist(),
           "score": float(score),
           "class_distribution": class_distribution,
           "model_evaluation": model_evaluation
       }
   
   except Exception as e:
       print(f"Error en reentrenamiento: {str(e)}")
       raise HTTPException(status_code=500, detail=f"Error en el proceso de reentrenamiento: {str(e)}")

@app.post("/anadirdatos/")
async def adddata():
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
    
    return {"predictions": predictions.tolist(), "score": score}

@app.post("/subirarchivo/")
async def subir_archivo(file: UploadFile = File(...)):
    print(f"Recibiendo archivo: {file.filename}")
    
    contents = await file.read()
    
    # Crear un objeto BytesIO para que pandas pueda leerlo
    file_bytes = io.BytesIO(contents)
    
    try:
        # Intentar cargar con punto y coma primero (formato original)
        try:
            df = pd.read_csv(file_bytes, sep=";")
        except Exception:
            # Si falla, reiniciar el puntero del BytesIO e intentar con coma
            file_bytes.seek(0)
            df = pd.read_csv(file_bytes, sep=",")
        
        # Verificar y transformar las columnas según el formato mostrado
        # Primero identificamos y estandarizamos las columnas
        expected_standard_columns = ["ID", "Label", "Titulo", "Descripcion", "Fecha"]
        
        # Normalizar los nombres de columnas (caso insensible)
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'id' == col_lower:
                column_mapping[col] = 'ID'
            elif 'label' in col_lower or 'etiqueta' in col_lower:
                column_mapping[col] = 'Label'
            elif 'titulo' in col_lower or 'title' in col_lower:
                column_mapping[col] = 'Titulo'
            elif 'desc' in col_lower or 'contenido' in col_lower or 'content' in col_lower or 'text' in col_lower:
                column_mapping[col] = 'Descripcion'
            elif 'fecha' in col_lower or 'date' in col_lower:
                column_mapping[col] = 'Fecha'
        
        # Renombrar columnas según el mapeo
        if column_mapping:
            df = df.rename(columns=column_mapping)
        
        # Verificar columnas esenciales
        essential_columns = ["Titulo", "Descripcion"]
        if "Label" in df.columns and "reentrenarmodelo" in file.filename.lower():
            essential_columns.append("Label")
            
        missing_columns = [col for col in essential_columns if col not in df.columns]
        if missing_columns:
            raise Exception(f"Faltan columnas esenciales: {', '.join(missing_columns)}")
        
        # Verificar si hay datos suficientes
        if len(df) == 0:
            raise Exception("El archivo no contiene datos")
        
        # Si todo está correcto, guardamos el DataFrame
        print(f"Archivo cargado con éxito. Columnas: {df.columns.tolist()}")
        
        # Asegurar que tenemos las columnas en el formato correcto
        for col in essential_columns:
            df[col] = df[col].astype(str)
            
        # Si hay columna Label, convertirla a numérica
        if "Label" in df.columns:
            df["Label"] = pd.to_numeric(df["Label"], errors="coerce").fillna(0).astype(int)
        
        # Guardar en el estado de la aplicación
        app.state.df = df
        
        return {"filename": file.filename, "columns": df.columns.tolist()}
    except Exception as e:
        print(f"Error al procesar el archivo: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error al procesar el archivo: {str(e)}")