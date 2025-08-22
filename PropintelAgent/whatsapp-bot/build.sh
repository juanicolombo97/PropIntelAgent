#!/bin/bash
set -euo pipefail

# --- Config ---
PY_IMAGE="public.ecr.aws/lambda/python:3.12"
PKG_DIR="package"
ZIP_NAME="deploy.zip"
MAIN_FILE="main.py"
REQ_FILE="requirements.txt"

# --- Clean ---
rm -rf "$PKG_DIR" "$ZIP_NAME"

# --- Build inside Lambda's python image (linux/arm64) ---
docker run --rm \
  --platform linux/arm64 \
  -v "$PWD":/var/task \
  --entrypoint /bin/bash \
  "$PY_IMAGE" -c "
    set -e;
    dnf install -y zip || yum install -y zip;
    cd /var/task;
    mkdir -p $PKG_DIR;
    # Instala deps en /var/task/package
    pip install --upgrade pip >/dev/null;
    pip install -r $REQ_FILE -t $PKG_DIR;
    # Copia el código
    cp $MAIN_FILE $PKG_DIR/;
    # Zipea desde dentro de package para que queden en el root del ZIP
    cd $PKG_DIR;
    zip -r /var/task/$ZIP_NAME . >/dev/null
  "

echo "✅ Paquete creado: $ZIP_NAME"
