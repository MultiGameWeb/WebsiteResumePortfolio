# SiteCraft AI Worker

Cloudflare Worker backend for SiteCraft AI Website Creator.

## Endpoints

- GET /api/health
- POST /api/ai/generate

## Secret

Configure a Cloudflare Worker secret named:

GEMINI_API_KEY

Do not place the API key in GitHub, source code, `vars`, or frontend JavaScript.

## Generate request

```json
{
  "prompt": "Create a modern dental clinic website with doctor appointments, WhatsApp, Google Maps, services and reviews.",
  "catalog": [
    {
      "id": "medical-01",
      "name": "Dental & Medical Center — Clinical",
      "category": "Dental & Medical Centers",
      "features": ["home", "doctors", "appointment", "reviews"]
    }
  ]
}
```

The Worker returns a structured JSON configuration that SiteCraft can use to select a template and render content through the existing shared engine.
