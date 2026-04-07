# Optional reproducible environment for PDF → MusicXML OMR (oemer + onnxruntime).
# Build:  docker build -f backend/docker/oemer-omr.Dockerfile -t hf-oemer .
# Run:    docker run --rm -v "$PWD:/work" -w /work hf-oemer oemer --help
#
# HarmonyForge’s Node engine still calls the host `oemer` binary (see OEMER_BIN).
# Use this image to verify Python 3.11 + deps, or as a reference for server installs.
# First oemer run downloads ONNX checkpoints (HTTPS); allow time and disk.

FROM python:3.11-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir "oemer==0.1.8" --no-deps

ENV PYTHONUNBUFFERED=1

CMD ["oemer", "--help"]
