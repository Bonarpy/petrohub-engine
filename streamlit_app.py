import streamlit as st
from app.main import app
import uvicorn
from threading import Thread

# Judul sederhana agar web tidak kosong
st.title("PetroHub API Engine")
st.write("Status: Backend is Running 🚀")

def run_api():
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Jalankan FastAPI di background thread
if 'api_thread' not in st.session_state:
    thread = Thread(target=run_api)
    thread.start()
    st.session_state.api_thread = True

st.info("API link: https://your-app-name.streamlit.app")