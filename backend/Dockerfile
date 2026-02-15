FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    musescore3 \
    libasound2 \
    libportmidi0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p uploads converted

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
