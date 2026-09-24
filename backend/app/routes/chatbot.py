from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import Conversation, ChatMessage, User
from ..schemas import ChatMessageCreate, ChatMessageResponse
from ..services.ai_service import AIService
from ..dependencies import get_optional_current_user

router = APIRouter(prefix="/api/chatbot", tags=["Chatbot Inteligente con IA"])

@router.post("/message", summary="Enviar mensaje al asistente virtual inteligente")
def chat_with_bot(
    chat_input: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    user_msg = (chat_input.message or "").strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    session_id = chat_input.session_id or "default_session"

    # Buscar o crear la conversación
    conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
    if not conv:
        conv = Conversation(
            session_id=session_id,
            usuario_id=current_user.id if current_user else None
        )
        db.add(conv)
        db.flush()

    # Guardar mensaje del usuario
    user_chat_msg = ChatMessage(
        conversacion_id=conv.id,
        remitente="user",
        contenido=user_msg
    )
    db.add(user_chat_msg)

    # Recuperar últimos mensajes para contexto
    history_records = db.query(ChatMessage).filter(
        ChatMessage.conversacion_id == conv.id
    ).order_by(ChatMessage.id.desc()).limit(6).all()

    history = [
        {"role": "user" if m.remitente == "user" else "assistant", "content": m.contenido}
        for m in reversed(history_records)
    ]

    # Generar respuesta mediante el servicio de IA
    ai_result = AIService.generate_response(user_msg, history=history)
    bot_reply_text = ai_result["text"]

    # Guardar mensaje del bot
    bot_chat_msg = ChatMessage(
        conversacion_id=conv.id,
        remitente="bot",
        contenido=bot_reply_text
    )
    db.add(bot_chat_msg)
    db.commit()

    return {
        "success": True,
        "reply": bot_reply_text,
        "source": ai_result.get("source", "NexusBot_Core"),
        "suggestions": ai_result.get("suggestions", []),
        "session_id": session_id,
        "timestamp": bot_chat_msg.fecha_hora
    }

@router.get("/history/{session_id}", summary="Obtener historial de mensajes de una conversación")
def get_chat_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    conv = db.query(Conversation).filter(Conversation.session_id == session_id).first()
    if not conv:
        return {"success": True, "messages": []}

    messages = db.query(ChatMessage).filter(
        ChatMessage.conversacion_id == conv.id
    ).order_by(ChatMessage.id.asc()).all()

    formatted = [
        {
            "id": m.id,
            "remitente": m.remitente,
            "contenido": m.contenido,
            "fecha_hora": m.fecha_hora
        }
        for m in messages
    ]

    return {
        "success": True,
        "session_id": session_id,
        "messages": formatted
    }
