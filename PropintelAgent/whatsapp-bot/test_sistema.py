from routers.webhook import test_bot_message, get_conversation_summary, get_lead_summary

# Enviar un mensaje
response = test_bot_message("123456347890", "nada eso quiero comprar")
print(response)

