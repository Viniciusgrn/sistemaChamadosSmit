# Imagem do Django + Gunicorn.
#
# mysqlclient é compilado: precisa de toolchain e headers do MySQL na hora do
# build, mas em runtime basta a lib compartilhada. Por isso o build sai em um
# estágio separado — a imagem final não carrega gcc nem headers.
FROM python:3.12-slim AS build

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        default-libmysqlclient-dev \
        pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --prefix=/instalado -r requirements.txt


FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=backendChamados.settings

# libmariadb3 = driver do mysqlclient em runtime; netcat serve pro entrypoint
# esperar o banco subir antes de migrar
RUN apt-get update && apt-get install -y --no-install-recommends \
        libmariadb3 \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /instalado /usr/local

WORKDIR /app
COPY . .

# Gunicorn não roda como root: se o container for comprometido, o processo não
# manda no sistema de arquivos da imagem.
RUN useradd --create-home --shell /bin/bash django \
    && mkdir -p /app/staticfiles /app/media \
    && chown -R django:django /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER django
EXPOSE 8000

# Réplica travada para de responder mas continua "no ar" pro orquestrador. O
# healthcheck é o que permite ao Swarm perceber e substituir — sem ele,
# "escalar" só multiplica containers zumbis.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["python", "healthcheck.py"]

ENTRYPOINT ["/entrypoint.sh"]
# sem flags: os parâmetros de capacidade estão em gunicorn.conf.py, que o
# gunicorn carrega sozinho a partir do diretório de trabalho
CMD ["gunicorn", "backendChamados.wsgi:application"]
