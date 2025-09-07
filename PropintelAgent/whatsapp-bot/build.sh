#!/bin/bash
set -euo pipefail

# Configuración
PY_IMAGE="public.ecr.aws/lambda/python:3.12"
PKG_DIR="package"
ZIP_NAME_WEBHOOK="webhook-lambda.zip"
ZIP_NAME_PROCESSOR="processor-lambda.zip"

# Función para limpiar directorios
cleanup() {
    rm -rf "$PKG_DIR" "$ZIP_NAME_WEBHOOK" "$ZIP_NAME_PROCESSOR"
}

# Función para build común
build_common() {
    local zip_name=$1
    local main_file=$2
    local handler_info=$3
    
    echo "🔄 Construyendo $zip_name..."
    
    docker run --rm --platform linux/arm64 \
      -v "$PWD":/var/task \
      --entrypoint /bin/bash "$PY_IMAGE" -c "
        set -e
        # Instalar zip si no está disponible
        dnf install -y zip >/dev/null 2>&1 || yum install -y zip >/dev/null 2>&1
        cd /var/task

        # 1) Instalar dependencias
        rm -rf $PKG_DIR && mkdir -p $PKG_DIR
        pip install --no-cache-dir --upgrade pip >/dev/null
        pip install --no-cache-dir --root-user-action=ignore -r requirements.txt -t $PKG_DIR

        # 2) Copiar código necesario
        for p in $main_file config.py routers services models utils; do
          if [ -e \$p ]; then cp -r \$p $PKG_DIR/; fi
        done

        # 3) Limpiar archivos temporales
        python - <<'PY'
import os, shutil
root = 'package'
for dirpath, dirnames, filenames in os.walk(root):
    if '__pycache__' in dirnames:
        shutil.rmtree(os.path.join(dirpath, '__pycache__'), ignore_errors=True)
    for f in list(filenames):
        if f.endswith('.pyc'):
            try: os.remove(os.path.join(dirpath, f))
            except: pass
PY

        # 4) Crear ZIP
        cd $PKG_DIR
        zip -qr /var/task/$zip_name .
      "
    
    echo "✅ $zip_name creado. $handler_info"
}

# Mostrar opciones
echo "🚀 BUILD SYSTEM - Bot WhatsApp"
echo "================================="
echo "1. Webhook Lambda (original)"
echo "2. Processor Lambda (nuevo)"
echo "3. Ambos Lambdas"
echo "4. Limpiar archivos"

read -p "Elige opción (1-4): " choice

case $choice in
    1)
        cleanup
        build_common "$ZIP_NAME_WEBHOOK" "app.py" "Handler = app.handler"
        ;;
    2)
        cleanup
        build_common "$ZIP_NAME_PROCESSOR" "lambda_processor.py" "Handler = lambda_processor.lambda_handler"
        ;;
    3)
        cleanup
        build_common "$ZIP_NAME_WEBHOOK" "app.py" "Handler = app.handler"
        build_common "$ZIP_NAME_PROCESSOR" "lambda_processor.py" "Handler = lambda_processor.lambda_handler"
        echo ""
        echo "📦 RESUMEN:"
        echo "- $ZIP_NAME_WEBHOOK → Lambda 1 (Webhook Receptor)"
        echo "- $ZIP_NAME_PROCESSOR → Lambda 2 (Procesador SQS)"
        ;;
    4)
        cleanup
        echo "🗑️ Archivos limpiados"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Crear cola SQS: ./setup-aws-queue.sh"
echo "2. Subir Lambdas con los ZIPs generados"
echo "3. Configurar variables de entorno"
