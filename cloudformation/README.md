# Despliegue completo de CloudShop con CloudFormation

Esta carpeta crea el backend de CloudShop desde el repositorio
`leonardopanduro-rgb/cloud-proyecto`. El frontend se mantiene en AWS Amplify y
consume el backend por HTTPS mediante API Gateway.

## Arquitectura desplegada

```text
Amplify (React)
      |
      | HTTPS
      v
API Gateway HTTP API
      |
      | VPC Link
      v
ALB interno
      |
      +-- EC2 app-1: catálogo, usuarios, ventas, órdenes y analítica
      +-- EC2 app-2: catálogo, usuarios, ventas, órdenes y analítica

EC2 data: MySQL + PostgreSQL + MongoDB
EC2 ingestion: bases operacionales -> S3
Glue Crawler -> Glue Data Catalog -> Athena
```

Los puertos de bases de datos no se publican en Internet. El navegador nunca
accede al ALB HTTP directamente: API Gateway entrega una URL HTTPS y evita el
bloqueo de contenido mixto de Amplify.

## Archivos y orden obligatorio

1. `01-foundation.yaml`: red, reglas de seguridad y bucket S3.
2. `02-compute.yaml`: cuatro EC2 y arranque automatizado con Docker.
3. `03-edge-analytics.yaml`: ALB, API Gateway, Glue y Athena.

Usa estos nombres de stack para conservar las referencias entre plantillas:

| Orden | Plantilla | Nombre del stack |
|---:|---|---|
| 1 | `01-foundation.yaml` | `cloudshop-foundation` |
| 2 | `02-compute.yaml` | `cloudshop-compute` |
| 3 | `03-edge-analytics.yaml` | `cloudshop-edge-analytics` |

## Antes de empezar

- Región: `us-east-1`.
- Laboratorio de AWS Academy iniciado y con presupuesto disponible.
- Key pair existente: `vockey` (o cambiar el parámetro `KeyName`).
- Instance profile existente: `LabInstanceProfile`.
- Rol existente para Glue: `LabRole`.
- El repositorio debe continuar siendo público para que las EC2 puedan clonarlo.
- Amplify debe tener publicada la rama del frontend que se quiere probar.

## Despliegue desde la consola de AWS

En **CloudFormation > Create stack > With new resources**, selecciona **Upload
a template file** y carga cada plantilla en el orden de la tabla.

### 1. Foundation

En `cloudshop-foundation` se pueden conservar los valores predeterminados. Para
usar SSH desde tu equipo cambia `AdminCidr` por tu IP pública con `/32`. El valor
predeterminado permite EC2 Instance Connect en `us-east-1`.

Espera a que el estado sea `CREATE_COMPLETE`.

### 2. Compute

En `cloudshop-compute` completa:

- `FrontendOrigin`: URL de Amplify sin `/` final.
- `AdminEmails`: correos con rol administrador, separados por comas si son varios.
- `MySqlPassword`, `MySqlRootPassword` y `PostgresPassword`: mínimo 8 caracteres.
- `IngestionMySqlPassword` e `IngestionPostgresPassword`: contraseñas distintas
  para las cuentas de solo lectura de la ingesta.
- `JwtSecret`: mínimo 32 caracteres; debe ser el mismo para todos los servicios.
- `RepositoryUrl`: ya apunta a
  `https://github.com/leonardopanduro-rgb/cloud-proyecto.git`.

No guardes esos secretos en archivos ni en GitHub. CloudFormation los solicita
como parámetros `NoEcho`.

`CREATE_COMPLETE` indica que las EC2 fueron creadas, pero los contenedores pueden
seguir instalándose. Espera aproximadamente 15–30 minutos. En cada instancia,
**Actions > Monitor and troubleshoot > Get system log** debe terminar sin error.
Para diagnóstico por SSH o EC2 Instance Connect:

```bash
sudo tail -f /var/log/cloudshop-bootstrap.log
sudo docker ps
```

En `cloudshop-ingestion`, los tres contenedores deben finalizar con código `0`:

```bash
sudo docker ps -a
aws s3 ls s3://NOMBRE_DEL_BUCKET/ --recursive
```

El nombre del bucket aparece en **Outputs** de `cloudshop-foundation`.

### 3. Edge y analítica

Crea `cloudshop-edge-analytics`. Conserva `GlueRoleName=LabRole` y usa la misma
`FrontendOrigin` del stack de compute.

Cuando termine:

1. Abre **EC2 > Target groups** y comprueba que los diez targets queden `Healthy`.
2. Abre **AWS Glue > Crawlers > cloudshop-data-lake-crawler** y pulsa **Run**.
3. Espera a que el crawler quede `Completed` y confirme tablas en
   `cloudshop_analytics`.
4. Copia el output `ApiEndpoint` de este stack.

El crawler se ejecuta manualmente porque primero deben terminar la carga de datos
y la ingesta. Si se lanza antes, no encontrará los archivos de S3.

## Conectar Amplify

En **Amplify > tu aplicación > Hosting > Environment variables**, configura:

| Variable | Valor |
|---|---|
| `VITE_USE_MOCKS` | `false` |
| `VITE_API_BASE_URL` | output `ApiEndpoint` de `cloudshop-edge-analytics` |

Guarda los cambios y ejecuta **Redeploy this version**. No uses la URL HTTP del
ALB: el frontend HTTPS la bloquearía por contenido mixto.

## Prueba mínima

Reemplaza `API_ENDPOINT` por el output del tercer stack:

```bash
curl API_ENDPOINT/api/catalogo/productos
```

La validación de salud de cada microservicio se realiza en los target groups.
Para la prueba funcional completa usa las rutas del frontend, por ejemplo
catálogo, inicio de sesión y analítica.

## Actualizar o eliminar

- Para cambios de infraestructura, actualiza el stack que corresponde usando la
  misma plantilla y los mismos nombres de stack.
- El orden de eliminación es el inverso: edge, compute y foundation.
- El bucket S3 tiene política `Retain`; al eliminar stacks conserva los datos y
  debe vaciarse/eliminarse manualmente solo si ya no se necesita.
- Detén o elimina los stacks al terminar el laboratorio para no seguir consumiendo
  presupuesto de AWS Academy.

## Limitaciones de AWS Academy

La solución reutiliza `LabInstanceProfile` y `LabRole` para no crear roles IAM.
Si el laboratorio deniega `apigateway:CreateVpcLink`, `glue:CreateCrawler` o algún
recurso de ELB, la plantilla hará rollback. Revisa **CloudFormation > Events**:
esa restricción depende de la política del laboratorio, no del código del proyecto.
