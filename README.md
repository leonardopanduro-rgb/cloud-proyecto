# CloudShop — E-commerce con arquitectura de microservicios

Proyecto de Cloud Computing: e-commerce con microservicios sobre AWS.

Este repositorio unifica los microservicios, datos e ingesta de
[`rvcuba-utec/CloudComputing-Project`](https://github.com/rvcuba-utec/CloudComputing-Project)
con el frontend actualizado de
[`Maxwell-CS/cloudshop-frontend`](https://github.com/Maxwell-CS/cloudshop-frontend).

## Estructura del repositorio

```
backend/                  Microservicios operacionales
├── products/             Catálogo e Inventario (Go + Gin + MySQL)
├── users-address/        Usuarios y Direcciones (Python + FastAPI + PostgreSQL)
├── docker-compose.yml    VM de aplicación (catálogo + usuarios)
├── docker-compose.datos.yml  VM de datos (MySQL + PostgreSQL)
└── DESPLIEGUE.md         Guía de despliegue paso a paso

Data/                     Pipeline de datos
├── csv/                  CSVs generados (usuarios, productos, catálogo)
└── scripts/              Scripts de generación y carga
    ├── scrapping_falabella.py   → scraping de Falabella (50 categorías)
    ├── faker_users.py           → 20,000 usuarios + direcciones sintéticas
    ├── build_catalogo.py        → transforma scraping → CSVs del catálogo
    └── load_csv_bd.py           → carga CSVs en MySQL/PostgreSQL

frontend/                 SPA React (Vite) desplegada en AWS Amplify

Ingesta/                  MV de ingesta (contenedores Python → S3)
├── ingesta-usuarios/     PostgreSQL → usuarios.csv, direcciones_envio.csv
├── ingesta-catalogo/     MySQL → categorias, productos, inventario, movimientos_stock
└── docker-compose.yml    orquesta los contenedores de ingesta

cloudformation/           Infraestructura completa como código
├── 01-foundation.yaml    VPC, subredes, Security Groups y S3
├── 02-compute.yaml       4 EC2 y arranque automatizado de contenedores
├── 03-edge-analytics.yaml  ALB, API Gateway, Glue y Athena
└── README.md             Despliegue paso a paso desde la consola

Proposal/                 Documentos de sustentación
├── 03_Sustentacion_final.md   ← documento principal (backend + datos)
├── 02_Sustentacion_Data_Science_CloudShop.md
└── 01_Sustentacion_Backend_Frontend_CloudShop.md
```

## Estado actual

**Microservicios operacionales:**
- **Catálogo (Go + MySQL)**: 5,699 productos reales (scraping de Falabella), 50 categorías, inventario 1:1, movimientos de stock transaccionales.
- **Usuarios (Python + PostgreSQL)**: 20,000 usuarios con JWT, perfiles y direcciones de envío.

**Datos:**
- 5,699 productos + 50 categorías + 5,699 inventario (MySQL)
- 20,000 usuarios + 20,000 direcciones (PostgreSQL)
- 25,000 movimientos de stock (procedimiento almacenado)
- **Total: ~76,000 registros operacionales**

**Infraestructura completa:**
- Tres stacks de CloudFormation crean VPC, Security Groups, bucket S3, cuatro EC2, ALB interno, API Gateway HTTPS, Glue y Athena.
- Dos EC2 de aplicación ejecutan los cinco microservicios: catálogo, usuarios, ventas/reseñas, órdenes y analítica.
- La EC2 de ingesta extrae PostgreSQL, MySQL y MongoDB hacia S3; Glue cataloga los datos para Athena.
- El frontend actualizado se construye desde `frontend/` y se conecta por la URL HTTPS de API Gateway.

## Quickstart

Despliegue completo reproducible con CloudFormation: ver `cloudformation/README.md`.
Despliegue completo en AWS desde el navegador (sin terminal local): ver `DESPLIEGUE_AWS_CONSOLA.md`.
Despliegue con terminal local: ver `DESPLIEGUE_AWS_MANUAL.md`.
Despliegue manual de las VMs: ver `backend/DESPLIEGUE.md`.

Para regenerar los datos:
```bash
cd Data/scripts
uv sync
uv run python -m scripts.faker_users        # 20k usuarios + direcciones
uv run python -m scripts.build_catalogo     # scraping → catálogo
uv run python -m scripts.load_csv_bd --dry-run  # validar
```

## Documentación

- **CloudFormation completo (recomendado)**: `cloudformation/README.md`
- **Sustentación final**: `Proposal/03_Sustentacion_final.md`
- **Despliegue en AWS (paso a paso, con terminal local)**: `DESPLIEGUE_AWS_MANUAL.md`
- **Despliegue en AWS (100 % desde el navegador, sin terminal local)**: `DESPLIEGUE_AWS_CONSOLA.md`
- **Despliegue manual de VMs**: `backend/DESPLIEGUE.md`
- **Ingesta**: `Ingesta/README.md`
- **Scripts de datos**: `Data/scripts/README.md`
- **Frontend**: `frontend/README.md`
