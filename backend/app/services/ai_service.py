import os
import json
import re
import urllib.request
import urllib.error
from typing import Dict, Any, List

SYSTEM_PROMPT = """Eres NexusBot, el Asistente Virtual Inteligente oficial de Nexus Games.
Tu objetivo es orientar y brindar soporte integral a los clientes sobre:
1. Catálogo de productos: Videojuegos para PC, PS5, Xbox Series, monitores 240Hz, tarjetas gráficas RTX, procesadores AMD Ryzen y periféricos mecánicos RGB.
2. Servicios técnicos: Mantenimiento preventivo ($120.000 COP), Ensamblaje gamer personalizado ($180.000 COP) y Diagnóstico de hardware ($80.000 COP).
3. Proceso de compra y facturación: Los pedidos generan factura electrónica oficial con IVA desglosado. Las licencias digitales se entregan de inmediato por correo electrónico.
4. Módulo de PQR: Si el usuario desea presentar una Petición, Queja o Reclamo, guíalo amablemente a la sección 'Mis PQR' de su panel o ofrécele tomar los datos de su inquietud.
5. Políticas y garantías: Garantía de 12 meses en hardware y soporte técnico garantizado.
Responde siempre en español con tono profesional, tecnológico, cordial y entusiasta. Respuestas concisas y directas."""

class AIService:
    @classmethod
    def generate_response(cls, user_message: str, history: List[Dict[str, str]] = None) -> Dict[str, Any]:
        api_key = os.getenv("AI_API_KEY") or os.getenv("OPENAI_API_KEY")
        provider = os.getenv("AI_PROVIDER", "openai").lower()
        api_url = os.getenv("AI_API_URL", "https://api.openai.com/v1/chat/completions")

        # Si existe API Key configurada, intentar comunicación segura con el proveedor de IA
        if api_key and api_key.strip() and not api_key.startswith("tu_clave"):
            try:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key.strip()}"
                }
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if history:
                    for h in history[-5:]:
                        messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
                messages.append({"role": "user", "content": user_message})

                payload = {
                    "model": os.getenv("AI_MODEL", "gpt-3.5-turbo"),
                    "messages": messages,
                    "max_tokens": 300,
                    "temperature": 0.7
                }

                req = urllib.request.Request(api_url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
                with urllib.request.urlopen(req, timeout=8) as response:
                    resp_data = json.loads(response.read().decode("utf-8"))
                    reply = resp_data["choices"][0]["message"]["content"].strip()
                    return {
                        "text": reply,
                        "source": "AI_API",
                        "suggestions": cls._get_suggestions(user_message)
                    }
            except Exception as e:
                print(f"[AIService] Excepción en llamada a API de IA externa ({e}). Usando motor de conocimiento local.")

        # Motor de conocimiento experto contextualizado (Fallback seguro y rápido)
        return cls._local_expert_response(user_message)

    @classmethod
    def _local_expert_response(cls, text: str) -> Dict[str, Any]:
        t = text.lower()
        suggestions = ["Ver Catálogo", "Servicios Técnicos", "Consultar PQR", "Facturación"]

        if any(w in t for w in ["hola", "buen", "buenas", "saludos", "hey"]):
            return {
                "text": "¡Hola! Bienvenido a **Nexus Games**, tu tienda y taller gamer especializado. ¿En qué te puedo asesorar hoy? Puedes preguntarme sobre videojuegos disponibles, componentes de hardware, servicios técnicos de mantenimiento o radicar una PQR.",
                "source": "NexusBot_Core",
                "suggestions": ["Ver Catálogo", "Mantenimiento PC", "¿Cómo comprar?", "Radicar PQR"]
            }

        if any(w in t for w in ["pqr", "queja", "reclamo", "peticion", "sugerencia", "problema con"]):
            return {
                "text": "En **Nexus Games** contamos con un módulo oficial de **PQR (Peticiones, Quejas y Reclamos)**. Si eres cliente registrado, puedes ingresar a tu panel y en la pestaña **'Mis PQR'** radicar tu solicitud. Nuestro equipo administrativo te responderá en menos de 24 horas hábiles y podrás seguir el estado en tiempo real.",
                "source": "NexusBot_Core",
                "suggestions": ["Radicar PQR", "Estado de mi PQR", "Garantías", "Contacto"]
            }

        if any(w in t for w in ["servicio", "mantenimiento", "limpieza", "pasta termica", "ensamblaje", "armado"]):
            return {
                "text": "Ofrecemos servicios técnicos de alta gama: \n• **Mantenimiento y Limpieza Profunda:** Desarme total, cambio de pasta térmica de alto rendimiento ($120.000 COP).\n• **Ensamblaje Personalizado:** Montaje estético, curvas de ventilación y BIOS ($180.000 COP).\n• **Diagnóstico de Hardware:** Detección de fallas con cámaras térmicas ($80.000 COP).",
                "source": "NexusBot_Core",
                "suggestions": ["Agendar Mantenimiento", "Ver Catálogo", "Garantías"]
            }

        if any(w in t for w in ["factura", "facturacion", "impuesto", "iva", "recibo", "descargar"]):
            return {
                "text": "Todas tus compras en **Nexus Games** generan una **Factura de Venta oficial** con IVA desglosado (19%) y número correlativo único (ej. FACT-2026-XXXX). Puedes consultar y descargar tus facturas en formato PDF directamente desde tu **Panel de Cliente** en la pestaña 'Mis Facturas'.",
                "source": "NexusBot_Core",
                "suggestions": ["Mis Facturas", "¿Cómo comprar?", "Métodos de Pago"]
            }

        if any(w in t for w in ["juego", "juegos", "cyberpunk", "elden ring", "god of war", "catalogo", "comprar", "producto"]):
            return {
                "text": "Disponemos de un catálogo de títulos AAA como *Cyberpunk 2077: Phantom Liberty*, *Elden Ring: Shadow of the Erdtree* y *God of War Ragnarök*, además de hardware como la *RTX 4080 Super*, *Ryzen 7 7800X3D* y monitores OLED 240Hz. ¡Agrega tus favoritos al carrito y finaliza tu pedido de inmediato!",
                "source": "NexusBot_Core",
                "suggestions": ["Ver Catálogo", "Hardware PC", "Métodos de Pago", "Promociones"]
            }

        if any(w in t for w in ["pago", "pagar", "pse", "tarjeta", "credito", "debito"]):
            return {
                "text": "Aceptamos múltiples métodos de pago: Tarjeta de Crédito (Visa, Mastercard, American Express), PSE, transferencia bancaria y pagos en línea seguros con cifrado de extremo a extremo.",
                "source": "NexusBot_Core",
                "suggestions": ["Ver Catálogo", "Facturación", "Mis Pedidos"]
            }

        if any(w in t for w in ["horario", "ubicacion", "contacto", "telefono", "direccion", "donde"]):
            return {
                "text": "Nuestra sede principal está ubicada en **Calle 100 # 15-20, Bogotá**. Atendemos de Lunes a Sábado de 9:00 AM a 8:00 PM. También puedes escribirnos a `contacto@nexusgames.com` o a nuestra línea de soporte.",
                "source": "NexusBot_Core",
                "suggestions": ["Ver Catálogo", "Servicios Técnicos", "Radicar PQR"]
            }

        # Respuesta general inteligente
        return {
            "text": f"Gracias por tu consulta sobre: \"{text}\". En **Nexus Games** estamos listos para ayudarte con tus videojuegos, hardware gamer, mantenimiento especializado, facturación o gestión de PQR. ¿Te gustaría ver el catálogo de productos o conocer nuestros servicios técnicos?",
            "source": "NexusBot_Core",
            "suggestions": suggestions
        }

    @classmethod
    def _get_suggestions(cls, text: str) -> List[str]:
        return ["Ver Catálogo", "Servicios Técnicos", "Consultar PQR", "Facturación"]
