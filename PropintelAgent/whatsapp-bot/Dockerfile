# Etapa build: instalamos deps en /opt/python (capas eficientes)
FROM public.ecr.aws/lambda/python:3.12 as build

# Acelera pip y evita caché
ENV PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Instalar compiladores/basics si hiciera falta (no suele ser necesario para fastapi)
# RUN dnf install -y gcc python3-devel

# Copiamos requirements y los instalamos en /opt/python (ruta que Lambda agrega al PYTHONPATH)
COPY requirements.txt ./requirements.txt
RUN pip install -r requirements.txt -t /opt/python

# Etapa runtime: imagen limpia de Lambda
FROM public.ecr.aws/lambda/python:3.12

# Copiar dependencias de la etapa build
COPY --from=build /opt/python /opt/python

# Copiar código
COPY main.py ${LAMBDA_TASK_ROOT}/main.py

# Comando: nombre del handler de Lambda (modulo.funcion)
CMD ["main.handler"]
