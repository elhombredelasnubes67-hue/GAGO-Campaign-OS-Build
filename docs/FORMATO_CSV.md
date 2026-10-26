# Formato CSV de resultados — GAGO CAMPAIGN OS

## Columnas obligatorias

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `campaign_reference` | texto | Nombre o ID de la campaña (debe existir) |
| `date` | fecha | Formato ISO 8601 (YYYY-MM-DD) |
| `currency` | texto | Código ISO 4217 (EUR, USD, GBP...) |
| `spend` | decimal | Gasto en unidades principales (ej: 12.50 = 12,50 €) |
| `impressions` | entero | Número de impresiones (≥ 0) |
| `clicks` | entero | Número de clics (≥ 0) |
| `conversions` | decimal | Conversiones con hasta 4 decimales (≥ 0) |
| `revenue` | decimal | Ingresos en unidades principales (≥ 0) |
| `source` | texto | Fuente declarada de los datos |

## Ejemplo sintético

```csv
campaign_reference,date,currency,spend,impressions,clicks,conversions,revenue,source
Campaña lanzamiento Q1 2026,2026-01-15,EUR,45.00,1200,38,2,120.00,manual
Campaña lanzamiento Q1 2026,2026-01-16,EUR,52.30,1450,42,3,185.50,manual
Campaña lanzamiento Q1 2026,2026-01-17,EUR,38.90,980,29,1,65.00,manual
```

*Estos datos son DEMOSTRACIÓN. No representan resultados reales.*

## Reglas de validación

1. **Fechas**: deben ser válidas y parseables como ISO 8601
2. **Cantidades**: no negativas (spend, impressions, clicks, conversions, revenue)
3. **Moneda**: debe ser consistente dentro del archivo (o se agrupa por moneda)
4. **Campaña**: `campaign_reference` debe coincidir con una campaña existente
5. **Campos obligatorios**: todos los listados arriba son obligatorios
6. **Tamaño máximo**: 10.000 filas por importación
7. **Filas duplicadas**: se detectan por (campaign_reference + date + source)
8. **Referencias desconocidas**: se rechazan con error específico

## Duplicados

Si se detectan filas duplicadas (misma campaña + fecha + fuente), el sistema:
- Las marca en la previsualización
- Permite elegir entre cancelar o omitir duplicados
- **No sobrescribe** resultados existentes silenciosamente

## Errores comunes

| Error | Causa |
|-------|-------|
| `campaign_reference vacío` | Falta el identificador de campaña |
| `fecha inválida` | Formato incorrecto o fecha inexistente |
| `moneda vacía` | No se ha indicado la moneda |
| `gasto negativo` | Valor de spend < 0 |
| `campaña desconocida: X` | La campaña no existe en el sistema |
| `fila duplicada` | Misma combinación campaña+fecha+fuente |

## Nota sobre conversiones

El campo `conversions` admite decimales con precisión de hasta 4 cifras.
Esto permite representar conversiones parciales o fraccionarias reportadas por algunas plataformas.
