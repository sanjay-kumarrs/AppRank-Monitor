import os
import json
import duckdb
import uvicorn
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS ക്രമീകരണങ്ങൾ (ഫ്രണ്ട്-എൻഡിൽ നിന്ന് ഡാറ്റ വരാൻ ഇത് അത്യാവശ്യമാണ്)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ഫയൽ പാത്ത് ശരിയാക്കുന്നു (ഏത് ലൊക്കേഷനിൽ ആയാലും ഇത് ഫയൽ കണ്ടെത്തും)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE_PATH = os.path.join(BASE_DIR, 'mock_rankings.csv')

@app.get("/api/rankings")
async def get_rankings():
    if not os.path.exists(CSV_FILE_PATH):
        return {"error": f"CSV file not found at {CSV_FILE_PATH}"}
        
    try:
        # Pandas ഉപയോഗിച്ച് CSV വായിക്കുന്നു, ശേഷം DuckDB ഉപയോഗിച്ച് ക്വറി ചെയ്യുന്നു
        df_csv = pd.read_csv(CSV_FILE_PATH)
        conn = duckdb.connect()
        df = conn.execute("SELECT * FROM df_csv").df()
        
        # ഡാറ്റ ഡിക്ഷണറിയാക്കി മാറ്റുന്നു
        data = df.to_dict(orient='records')
        
        # history, recent_reviews എന്നിവ ലിസ്റ്റുകൾ ആക്കി മാറ്റുന്നു
        for row in data:
            if isinstance(row.get('history'), str):
                row['history'] = json.loads(row['history'].replace("'", '"'))
            if isinstance(row.get('recent_reviews'), str):
                row['recent_reviews'] = json.loads(row['recent_reviews'].replace("'", '"'))
        
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/categories")
async def get_categories():
    if not os.path.exists(CSV_FILE_PATH):
        return {"error": f"CSV file not found at {CSV_FILE_PATH}"}
        
    try:
        df_csv = pd.read_csv(CSV_FILE_PATH)
        conn = duckdb.connect()
        df = conn.execute("SELECT DISTINCT category FROM df_csv").df()
        categories = df['category'].dropna().unique().tolist()
        return categories
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

