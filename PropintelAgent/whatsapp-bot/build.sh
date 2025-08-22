#!/bin/bash
set -euo pipefail

PY_IMAGE="public.ecr.aws/lambda/python:3.12"
PKG_DIR="package"
ZIP_NAME="deploy.zip"

rm -rf "$PKG_DIR" "$ZIP_NAME"

docker run --rm --platform linux/arm64 \
  -v "$PWD":/var/task \
  --entrypoint /bin/bash "$PY_IMAGE" -c "
    set -e
    # zip sí está en la imagen; si no, instalalo:
    dnf install -y zip >/dev/null 2>&1 || yum install -y zip >/dev/null 2>&1
    cd /var/task

    # 1) deps
    rm -rf $PKG_DIR && mkdir -p $PKG_DIR
    pip install --no-cache-dir --upgrade pip >/dev/null
    pip install --no-cache-dir --root-user-action=ignore -r requirements.txt -t $PKG_DIR

    # 2) copiar código del repo (solo lo necesario)
    for p in app.py config.py routers services models utils; do
      if [ -e \$p ]; then cp -r \$p $PKG_DIR/; fi
    done

    # 3) limpiar __pycache__ y .pyc con Python (no usamos 'find')
    python - <<'PY'
import os, shutil
root = 'package'
for dirpath, dirnames, filenames in os.walk(root):
    # borrar carpetas __pycache__
    if '__pycache__' in dirnames:
        shutil.rmtree(os.path.join(dirpath, '__pycache__'), ignore_errors=True)
    # borrar .pyc
    for f in list(filenames):
        if f.endswith('.pyc'):
            try: os.remove(os.path.join(dirpath, f))
            except: pass
PY

    # 4) zip: contenido de package al root del zip
    cd $PKG_DIR
    zip -qr /var/task/$ZIP_NAME .
  "

echo "✅ Paquete creado: $ZIP_NAME"
echo "Subí a Lambda. Handler = app.handler"
